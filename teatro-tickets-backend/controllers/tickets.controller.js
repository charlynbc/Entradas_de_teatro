import QRCode from 'qrcode';
import { query } from '../db/postgres.js';
import { logAction } from '../services/action-logs.service.js';
import * as ticketService from '../services/ticketService.js';
import { logger } from '../utils/logger.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function isObraCerradaByFuncion(funcionId) {
  const cerrado = await query(
    `SELECT 1
     FROM funciones f
     JOIN cierre_obras_profesionales cop ON cop.obra_id = f.obra_id
     WHERE f.id = $1
     LIMIT 1`,
    [String(funcionId)]
  );
  return cerrado.rows.length > 0;
}

async function safeInsertMovimiento({ tipo, ticketCode, desdePhone, haciaPhone, motivo }) {
  try {
    await query(
      `INSERT INTO ticket_movimientos (tipo, ticket_code, desde_phone, hacia_phone, motivo, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        String(tipo),
        String(ticketCode),
        desdePhone !== undefined && desdePhone !== null ? String(desdePhone) : null,
        haciaPhone !== undefined && haciaPhone !== null ? String(haciaPhone) : null,
        motivo !== undefined && motivo !== null ? String(motivo) : null
      ]
    );
  } catch {
    // Auditoría best-effort: si no existe la tabla o falla, no romper el flujo.
  }
}

export async function misTickets(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula; // phone del actor
    const { funcion_id } = req.query;
    const params = [actorPhone];
    let sql = `
      SELECT 
        t.*,
        f.fecha as funcion_fecha,
        f.lugar as funcion_lugar,
        o.nombre as obra_nombre
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN obras o ON o.id = f.obra_id
      WHERE t.vendedor_phone = $1
    `;
    if (funcion_id) {
      sql += ' AND t.funcion_id = $2';
      params.push(String(funcion_id));
    }
    sql += ' ORDER BY f.fecha ASC, t.code ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en misTickets:', error);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
}

export async function asignarTickets(req, res) {
  try {
    const body = req.body || {};

    // Payload LEGACY (tests): { ticketIds: [code], vendedorId: cedula }
    if (Array.isArray(body.ticketIds) && body.ticketIds.length > 0 && body.vendedorId) {
      // Bloquear asignación si alguno de los tickets pertenece a una obra profesional
      try {
        const profesionalCheck = await query(
          `SELECT COUNT(*) AS cnt
           FROM tickets t
           JOIN funciones f ON f.id = t.funcion_id
           JOIN obras o ON o.id = f.obra_id
           WHERE t.code = ANY($1::varchar[])
             AND COALESCE(o.es_profesional, FALSE) = TRUE`,
          [body.ticketIds.map(String)]
        );
        const cnt = Number(profesionalCheck.rows[0]?.cnt || 0);
        if (cnt > 0) {
          return res.status(403).json({ error: 'Asignación no permitida: obra profesional (solo boletería)' });
        }

        const cierreCheck = await query(
          `SELECT DISTINCT f.id AS funcion_id
           FROM tickets t
           JOIN funciones f ON f.id = t.funcion_id
           JOIN cierre_obras_profesionales cop ON cop.obra_id = f.obra_id
           WHERE t.code = ANY($1::varchar[])`,
          [body.ticketIds.map(String)]
        );
        if (cierreCheck.rows.length > 0) {
          return res.status(403).json({ error: 'Obra cerrada: no se pueden asignar tickets' });
        }
      } catch (e) {
        // si falla el check, continuar y que el update condicional actúe
      }

      const vendedorCedula = String(body.vendedorId);
      const u = await query('SELECT phone FROM users WHERE cedula = $1 LIMIT 1', [vendedorCedula]);
      const destinoPhone = u.rows[0]?.phone || vendedorCedula;

      const codes = body.ticketIds.map(String);
      const updated = await query(
        `UPDATE tickets t
         SET estado = 'STOCK_ACTOR', vendedor_phone = $1, reservado_at = NOW()
         FROM funciones f, obras o
         WHERE t.code = ANY($2::varchar[])
           AND t.estado = 'DISPONIBLE'
           AND f.id = t.funcion_id
           AND o.id = f.obra_id
           AND COALESCE(o.es_profesional, FALSE) = FALSE
         RETURNING t.code AS id, t.code, t.funcion_id, t.estado, t.vendedor_phone`,
        [String(destinoPhone), codes]
      );

      for (const t of updated.rows) {
        await safeInsertMovimiento({
          tipo: 'ASIGNACION',
          ticketCode: t.code,
          desdePhone: null,
          haciaPhone: destinoPhone,
          motivo: 'Asignación de tickets'
        });
      }

      return res.json({ ok: true, tickets: updated.rows });
    }

    // Payload NUEVO: { cantidad, funcion_id, actor_cedula|actor_phone }
    const { cantidad, funcion_id, actor_cedula, actor_phone } = body;
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || !funcion_id || !(actor_cedula || actor_phone)) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Bloquear asignación para funciones de obras profesionales
    const isProfesionalRes = await query(
      `SELECT COALESCE(o.es_profesional, FALSE) AS es_profesional
       FROM funciones f
       JOIN obras o ON o.id = f.obra_id
       WHERE f.id = $1`,
      [String(funcion_id)]
    );
    const esProfesional = Boolean(isProfesionalRes.rows[0]?.es_profesional);
    if (esProfesional) {
      return res.status(403).json({ error: 'Asignación no permitida: obra profesional (solo boletería)' });
    }

    const obraCerrada = await isObraCerradaByFuncion(funcion_id);
    if (obraCerrada) {
      return res.status(403).json({ error: 'Obra cerrada: no se pueden asignar tickets' });
    }

    // Resolver phone destino (vendedor_phone usa users.phone)
    let destinoPhone = actor_phone;
    if (!destinoPhone && actor_cedula) {
      const u = await query('SELECT phone FROM users WHERE cedula = $1 LIMIT 1', [String(actor_cedula)]);
      destinoPhone = u.rows[0]?.phone || String(actor_cedula);
    }

    const disponibles = await query(
      `SELECT code FROM tickets
       WHERE funcion_id = $1 AND estado = 'DISPONIBLE'
       ORDER BY code ASC
       LIMIT $2`,
      [String(funcion_id), cantidadNum]
    );

    if (disponibles.rows.length < cantidadNum) {
      return res.status(400).json({
        error: 'No hay suficientes tickets disponibles para asignar',
        disponibles: disponibles.rows.length,
        solicitados: cantidadNum
      });
    }

    const codes = disponibles.rows.map(r => r.code);
    const updated = await query(
      `UPDATE tickets
       SET estado = 'STOCK_ACTOR', vendedor_phone = $1, reservado_at = NOW()
       WHERE code = ANY($2::varchar[])
       RETURNING code AS id, code, funcion_id, estado, vendedor_phone`,
      [String(destinoPhone), codes]
    );

    for (const t of updated.rows) {
      await safeInsertMovimiento({
        tipo: 'ASIGNACION',
        ticketCode: t.code,
        desdePhone: null,
        haciaPhone: destinoPhone,
        motivo: 'Asignación de tickets'
      });
    }

    res.json({ message: 'Tickets asignados', tickets: updated.rows });
  } catch (error) {
    console.error('Error asignarTickets:', error);
    res.status(500).json({ error: 'No se pudieron asignar tickets' });
  }
}

export async function stockActor(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula;
    const rows = await query(
      `SELECT
        t.code,
        t.code AS id,
        t.funcion_id,
        t.estado,
        t.precio,
        t.comprador_nombre,
        t.comprador_phone,
        f.fecha,
        f.lugar,
        o.nombre AS obra
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN obras o ON o.id = f.obra_id
      WHERE t.vendedor_phone = $1
        AND t.estado <> 'USADO'
      ORDER BY f.fecha ASC, t.code ASC`,
      [String(actorPhone)]
    );

    const grouped = new Map();
    for (const ticket of rows.rows) {
      const key = String(ticket.funcion_id);
      if (!grouped.has(key)) {
        grouped.set(key, {
          showId: ticket.funcion_id,
          obra: ticket.obra,
          fecha: ticket.fecha,
          lugar: ticket.lugar,
          tickets: []
        });
      }
      grouped.get(key).tickets.push({
        id: ticket.id,
        code: ticket.code,
        showId: ticket.funcion_id,
        estado: ticket.estado,
        precio: ticket.precio,
        comprador_nombre: ticket.comprador_nombre,
        comprador_telefono: ticket.comprador_phone
      });
    }

    const response = Array.from(grouped.values()).map(group => ({
      ...group,
      vendidas: group.tickets.filter(t => t.estado === 'REPORTADA_VENDIDA').length,
      pagadas: group.tickets.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO').length,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error stockActor:', error);
    res.status(500).json({ error: 'Error obteniendo stock' });
  }
}

export async function actualizarTicketLegacy(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula;
    const code = String(req.params.code || '').trim();
    const { estado, comprador_nombre, comprador_telefono } = req.body || {};

    if (!code || !estado) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Compatibilidad de estados legacy
    // - VENDIDA_PAGADA (tests) => REPORTADA_VENDIDA (admin luego aprueba a PAGADO)
    // - VENDIDA => REPORTADA_VENDIDA
    const normalized = String(estado).toUpperCase();
    let target = normalized;
    if (normalized === 'VENDIDA_PAGADA' || normalized === 'VENDIDA') {
      target = 'REPORTADA_VENDIDA';
    }
    if (target === 'RESERVADA') {
      target = 'RESERVADO';
    }

    // Reusar lógica de actualizarEstadoTicket (acepta RESERVADO / REPORTADA_VENDIDA)
    req.body = {
      ticketId: code,
      estado: target,
      comprador_nombre,
      comprador_telefono
    };

    // Validar pertenencia antes (evita actor actualizando ajenos)
    const cur = await query('SELECT code, vendedor_phone FROM tickets WHERE code = $1', [code]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (cur.rows[0].vendedor_phone !== actorPhone) return res.status(403).json({ error: 'Ticket no pertenece a tu stock' });

    return actualizarEstadoTicket(req, res);
  } catch (error) {
    console.error('Error actualizarTicketLegacy:', error);
    res.status(500).json({ error: 'No se pudo actualizar el ticket' });
  }
}

export async function actualizarEstadoTicket(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula;
    const { ticketId, ticketCode, estado, comprador_nombre, comprador_telefono } = req.body || {};
    const code = String(ticketId || ticketCode || '').trim();
    const target = String(estado || '').trim();

    if (!code || !target) {
      return res.status(400).json({ error: 'Faltan datos: ticketId, estado' });
    }

    // El actor SOLO puede: RESERVADO o REPORTADA_VENDIDA
    if (!['RESERVADO', 'REPORTADA_VENDIDA'].includes(target)) {
      return res.status(403).json({ error: 'No tienes permisos para ese cambio de estado' });
    }

    const currentRes = await query('SELECT * FROM tickets WHERE code = $1', [code]);
    const current = currentRes.rows[0];
    if (!current) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const cierre = await isObraCerradaByFuncion(current.funcion_id);
    if (cierre) {
      return res.status(403).json({ error: 'Obra cerrada: no se pueden modificar tickets' });
    }
    // Bloqueo por obra profesional: actores no pueden reservar ni reportar ventas
    try {
      const obraRes = await query(
        `SELECT COALESCE(o.es_profesional, FALSE) AS es_profesional
         FROM funciones f
         JOIN obras o ON o.id = f.obra_id
         WHERE f.id = $1`,
        [String(current.funcion_id)]
      );
      const esProfesional = Boolean(obraRes.rows[0]?.es_profesional);
      if (esProfesional) {
        return res.status(403).json({ error: 'Operación no permitida: obra profesional (gestión sólo por boletería)' });
      }
    } catch (e) {
      // si falla el check, continuar con validaciones estándar
    }
    if (current.vendedor_phone !== actorPhone) {
      return res.status(403).json({ error: 'Ticket no pertenece a tu stock' });
    }
    if (current.estado === 'USADO') {
      return res.status(400).json({ error: 'Ticket ya fue usado' });
    }
    if (current.estado === 'PAGADO') {
      return res.status(400).json({ error: 'Ticket ya está PAGADO (no se puede modificar desde vendedor)' });
    }

    // Transiciones válidas
    const allowedFrom = target === 'RESERVADO'
      ? new Set(['STOCK_ACTOR', 'RESERVADO'])
      : new Set(['STOCK_ACTOR', 'RESERVADO', 'REPORTADA_VENDIDA']);

    if (!allowedFrom.has(current.estado)) {
      return res.status(400).json({ error: `No se puede pasar de ${current.estado} a ${target}` });
    }

    const updates = [];
    const values = [];
    let i = 1;

    updates.push(`estado = $${i++}`);
    values.push(target);

    if (comprador_nombre !== undefined) {
      updates.push(`comprador_nombre = $${i++}`);
      values.push(comprador_nombre || null);
    }
    if (comprador_telefono !== undefined) {
      updates.push(`comprador_phone = $${i++}`);
      values.push(comprador_telefono || null);
    }

    if (target === 'RESERVADO') {
      updates.push(`reservado_at = NOW()`);
      updates.push(`reportada_por_vendedor = FALSE`);
      updates.push(`aprobada_por_admin = FALSE`);
    }

    if (target === 'REPORTADA_VENDIDA') {
      updates.push(`reportada_por_vendedor = TRUE`);
      updates.push(`reportada_at = NOW()`);
    }

    values.push(code);
    const updated = await query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE code = $${i} RETURNING *`,
      values
    );

    const ticket = updated.rows[0];
    if (ticket) {
      const tipo = target === 'RESERVADO' ? 'RESERVA' : target === 'REPORTADA_VENDIDA' ? 'VENTA_REPORTADA' : null;
      if (tipo) {
        await safeInsertMovimiento({
          tipo,
          ticketCode: ticket.code,
          desdePhone: actorPhone,
          haciaPhone: actorPhone,
          motivo: tipo === 'RESERVA' ? 'Reserva por vendedor' : 'Venta reportada por vendedor'
        });

        // Log action for sales
        if (tipo === 'VENTA_REPORTADA') {
          await logAction(req, {
            accion: 'venta',
            entidad: 'ticket',
            entidad_id: ticket.code,
            descripcion: `Venta reportada - Comprador: ${comprador_nombre || 'N/A'}`
          });
        }
      }
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error actualizarEstadoTicket:', error);
    res.status(500).json({ error: 'No se pudo actualizar el ticket' });
  }
}

export async function transferirTicket(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula;
    const body = req.body || {};

    // Payload LEGACY (tests): { ticketIds: [code], targetVendedorId: cedula }
    if (Array.isArray(body.ticketIds) && body.ticketIds.length > 0 && body.targetVendedorId) {
      const targetCedula = String(body.targetVendedorId);
      const u = await query('SELECT phone FROM users WHERE cedula = $1 LIMIT 1', [targetCedula]);
      if (u.rows.length === 0) {
        return res.status(404).json({ error: 'Destino no encontrado' });
      }
      const destinoPhone = u.rows[0].phone || targetCedula;
      const codes = body.ticketIds.map(String);

      // Solo transferir tickets que aún están en stock del actor
      const updated = await query(
        `UPDATE tickets
         SET vendedor_phone = $1
         WHERE code = ANY($2::varchar[])
           AND vendedor_phone = $3
           AND estado = 'STOCK_ACTOR'
         RETURNING code AS id, code, funcion_id, estado, vendedor_phone`,
        [String(destinoPhone), codes, String(actorPhone)]
      );

      if (updated.rowCount === 0) {
        return res.status(400).json({ error: 'No se pudieron transferir tickets (quizás ya vendidos o no pertenecen a tu stock)' });
      }

      return res.json({ ok: true, tickets: updated.rows });
    }

    // Payload NUEVO (frontend mock): { ticketCode, destino, motivo }
    const { ticketCode, destino, motivo } = body;
    const code = String(ticketCode || '').trim();
    const destinoCedula = String(destino || '').trim();

    if (!code || !destinoCedula) {
      return res.status(400).json({ error: 'Faltan datos: ticketCode, destino' });
    }

    const currentRes = await query('SELECT * FROM tickets WHERE code = $1', [code]);
    const current = currentRes.rows[0];
    if (!current) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const cierre = await isObraCerradaByFuncion(current.funcion_id);
    if (cierre) {
      return res.status(403).json({ error: 'Obra cerrada: no se pueden transferir tickets' });
    }
    // No permitir transferir tickets de obras profesionales
    try {
      const obraRes = await query(
        `SELECT COALESCE(o.es_profesional, FALSE) AS es_profesional
         FROM funciones f
         JOIN obras o ON o.id = f.obra_id
         WHERE f.id = $1`,
        [String(current.funcion_id)]
      );
      const esProfesional = Boolean(obraRes.rows[0]?.es_profesional);
      if (esProfesional) {
        return res.status(403).json({ error: 'Transferencia no permitida: obra profesional (solo boletería)' });
      }
    } catch (e) {
      // continuar si falla check
    }
    if (current.vendedor_phone !== actorPhone) {
      return res.status(403).json({ error: 'Ticket no pertenece a tu stock' });
    }
    if (current.estado !== 'STOCK_ACTOR') {
      return res.status(400).json({ error: `Solo se pueden transferir tickets en stock. Estado actual: ${current.estado}` });
    }

    const u = await query('SELECT cedula, phone, name FROM users WHERE cedula = $1 LIMIT 1', [destinoCedula]);
    if (u.rows.length === 0) {
      return res.status(404).json({ error: 'Actor destino no encontrado' });
    }
    const destinoPhone = u.rows[0].phone || destinoCedula;

    const upd = await query(
      `UPDATE tickets
       SET vendedor_phone = $1
       WHERE code = $2
       RETURNING *`,
      [String(destinoPhone), code]
    );

    try {
      await query(
        `INSERT INTO ticket_movimientos (tipo, ticket_code, desde_phone, hacia_phone, motivo, created_at)
         VALUES ('TRANSFERENCIA', $1, $2, $3, $4, NOW())`,
        [code, String(actorPhone), String(destinoPhone), motivo || null]
      );
    } catch (e) {
      // silencioso
    }

    // Log action
    await logAction(req, {
      accion: 'transferencia',
      entidad: 'ticket',
      entidad_id: code,
      descripcion: `Ticket transferido a ${u.rows[0].name || destinoCedula}`
    });

    res.json({ ok: true, ticket: upd.rows[0] });
  } catch (error) {
    console.error('Error transferirTicket:', error);
    res.status(500).json({ error: 'No se pudo transferir el ticket' });
  }
}

export async function cobrarTickets(req, res) {
  try {
    const { showId, actorId } = req.body || {};
    const funcionId = String(showId || '').trim();
    const actorCedula = String(actorId || '').trim();

    if (!funcionId || !actorCedula) {
      return res.status(400).json({ error: 'Faltan datos: showId, actorId' });
    }

    const obraCerrada = await isObraCerradaByFuncion(funcionId);
    if (obraCerrada) {
      return res.status(403).json({ error: 'Obra cerrada: no se pueden cobrar tickets' });
    }

    const u = await query('SELECT phone FROM users WHERE cedula = $1 LIMIT 1', [actorCedula]);
    const actorPhone = u.rows[0]?.phone || actorCedula;

    const updated = await query(
      `UPDATE tickets
       SET estado = 'PAGADO', aprobada_por_admin = TRUE, pagado_at = NOW()
       WHERE funcion_id = $1
         AND vendedor_phone = $2
         AND estado = 'REPORTADA_VENDIDA'
       RETURNING code`,
      [funcionId, actorPhone]
    );

    for (const row of updated.rows) {
      await safeInsertMovimiento({
        tipo: 'PAGO_APROBADO',
        ticketCode: row.code,
        desdePhone: actorPhone,
        haciaPhone: actorPhone,
        motivo: 'Pago aprobado por admin/super'
      });

      // Log de acción
      await logAction(req, {
        accion: 'cobro',
        entidad: 'ticket',
        entidad_id: row.code,
        descripcion: `Pago aprobado para ticket ${row.code}`
      });
    }

    res.json({ ok: true, count: updated.rowCount });
  } catch (error) {
    console.error('Error cobrarTickets:', error);
    res.status(500).json({ error: 'No se pudieron cobrar tickets' });
  }
}

export async function generarQR(req, res) {
  try {
    const { code } = req.params;
    const result = await query('SELECT * FROM tickets WHERE code = $1', [code]);
    const ticket = result.rows[0];
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const url = `${BASE_URL}/tickets/validar/${ticket.code}`;
    const qr = await QRCode.toDataURL(url);
    res.json({ qr, ticket });
  } catch (error) {
    console.error('Error generarQR:', error);
    res.status(500).json({ error: 'Error generando QR' });
  }
}

export async function validarTicket(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado' });
    }

    if (!['SUPER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ ok: false, mensaje: 'No autorizado' });
    }

    const { code } = req.params;
    const result = await query(
      `SELECT
        t.*,
        f.fecha AS fecha_funcion,
        o.nombre AS obra_nombre,
        u.name AS vendedor_nombre,
        g.id AS grupo_id,
        g.director_cedula AS grupo_director_cedula
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN users u ON u.phone = t.vendedor_phone
      WHERE t.code = $1`,
      [code]
    );
    const ticket = result.rows[0];
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado o inválido' });
    }

    // Permisos: ADMIN solo puede validar tickets de sus grupos.
    if (req.user.role === 'ADMIN' && ticket.grupo_director_cedula !== req.user.cedula) {
      return res.status(403).json({ ok: false, mensaje: 'No autorizado para validar tickets de este grupo' });
    }

    // Fecha válida: al menos debe existir y ser parseable.
    const fechaFuncion = ticket.fecha_funcion ? new Date(ticket.fecha_funcion) : null;
    if (!fechaFuncion || Number.isNaN(fechaFuncion.getTime())) {
      return res.status(400).json({ ok: false, mensaje: 'Función inválida (fecha no válida)' });
    }

    if (ticket.estado === 'USADO') {
      return res.json({ ok: false, mensaje: 'Ticket ya fue usado' });
    }
    // Regla crítica: nadie entra si el ticket no está PAGADO.
    if (ticket.estado !== 'PAGADO') {
      return res.json({ ok: false, mensaje: `Ticket no habilitado. Estado actual: ${ticket.estado}` });
    }
    try {
      // Actualización atómica: evita doble escaneo concurrente.
      const upd = await query(
        "UPDATE tickets SET estado = 'USADO', usado_at = NOW() WHERE code = $1 AND estado = 'PAGADO' RETURNING code",
        [code]
      );

      if (upd.rowCount === 0) {
        // Releer para dar mensaje más preciso si cambió entre lectura y update.
        const reread = await query('SELECT estado FROM tickets WHERE code = $1', [code]);
        const estadoActual = reread.rows[0]?.estado;
        if (estadoActual === 'USADO') {
          return res.json({ ok: false, mensaje: 'Ticket ya fue usado' });
        }
        return res.json({ ok: false, mensaje: 'No se pudo validar el ticket (estado cambió)' });
      }

      await safeInsertMovimiento({
        tipo: 'VALIDACION',
        ticketCode: code,
        desdePhone: req.user?.phone || req.user?.cedula || null,
        haciaPhone: null,
        motivo: `Validación por ${req.user?.role || 'desconocido'}`
      });

      res.json({
        ok: true,
        mensaje: 'Ticket validado con éxito',
        ticket: {
          ...ticket,
          estado: 'USADO',
          obra: ticket.obra_nombre,
          fecha: ticket.fecha_funcion,
          vendedor_nombre: ticket.vendedor_nombre
        }
      });
    } catch (e) {
      console.error('Update ticket failed:', e);
      return res.status(500).json({ ok: false, error: 'Error actualizando ticket' });
    }
  } catch (error) {
    console.error('Error validarTicket:', error);
    res.status(500).json({ ok: false, error: 'Error validando ticket' });
  }
}

export async function anularTicket(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (!['SUPER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { code } = req.params;
    const { motivo } = req.body || {};
    const finalMotivo = String(motivo || '').trim();
    if (!finalMotivo) {
      return res.status(400).json({ error: 'Motivo obligatorio' });
    }

    const curRes = await query(
      `SELECT
         t.code, t.estado,
         g.director_cedula AS grupo_director_cedula
       FROM tickets t
       JOIN funciones f ON f.id = t.funcion_id
       JOIN obras o ON o.id = f.obra_id
       JOIN grupos g ON g.id = o.grupo_id
       WHERE t.code = $1`,
      [String(code)]
    );

    const cur = curRes.rows[0];
    if (!cur) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (req.user.role === 'ADMIN' && String(cur.grupo_director_cedula) !== String(req.user.cedula)) {
      return res.status(403).json({ error: 'No autorizado para anular tickets de este grupo' });
    }

    if (cur.estado === 'USADO') {
      return res.status(409).json({ error: 'No se puede anular un ticket USADO' });
    }

    const upd = await query(
      `UPDATE tickets
       SET estado = 'ANULADO', anulado_motivo = $2, anulado_at = NOW()
       WHERE code = $1
         AND estado <> 'USADO'
       RETURNING *`,
      [String(code), finalMotivo]
    );

    const ticket = upd.rows[0];
    await safeInsertMovimiento({
      tipo: 'ANULACION',
      ticketCode: String(code),
      desdePhone: req.user?.phone || req.user?.cedula || null,
      haciaPhone: null,
      motivo: finalMotivo
    });

    // Log action
    await logAction(req, {
      accion: 'anulacion',
      entidad: 'ticket',
      entidad_id: code,
      descripcion: `Ticket anulado. Motivo: ${finalMotivo}`
    });

    return res.json({ ok: true, ticket });
  } catch (error) {
    console.error('Error anularTicket:', error);
    res.status(500).json({ error: 'No se pudo anular el ticket' });
  }
}
