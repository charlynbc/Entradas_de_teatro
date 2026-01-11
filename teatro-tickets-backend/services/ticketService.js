/**
 * Servicio de Tickets - Lógica de Negocio
 * Extrae toda la lógica de negocio del controller
 * Usa máquina de estados para validar transiciones
 */

import { query } from '../db/postgres.js';
import { logger } from '../utils/logger.js';
import { 
  TICKET_STATES, 
  canTransition, 
  validateTransition,
  getMovementType 
} from './ticketStateMachine.js';

/**
 * Inserta un movimiento en la auditoría
 * @private
 */
async function insertMovement({ tipo, ticketCode, desdePhone, haciaPhone, motivo }) {
  try {
    await query(
      `INSERT INTO ticket_movimientos (tipo, ticket_code, desde_phone, hacia_phone, motivo, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [tipo, ticketCode, desdePhone || null, haciaPhone || null, motivo || null]
    );
  } catch (error) {
    logger.warn(`No se pudo registrar movimiento: ${error.message}`);
  }
}

/**
 * Verifica si una obra está cerrada
 * @private
 */
async function isShowClosed(funcionId) {
  try {
    const result = await query(
      `SELECT COALESCE(o.cerrada, FALSE) AS cerrada
       FROM funciones f
       JOIN obras o ON o.id = f.obra_id
       WHERE f.id = $1`,
      [String(funcionId)]
    );
    return Boolean(result.rows[0]?.cerrada);
  } catch (error) {
    logger.error(`Error verificando cierre de obra: ${error.message}`);
    return false;
  }
}

/**
 * Verifica si una obra es profesional
 * @private
 */
async function isShowProfessional(funcionId) {
  try {
    const result = await query(
      `SELECT COALESCE(o.es_profesional, FALSE) AS es_profesional
       FROM funciones f
       JOIN obras o ON o.id = f.obra_id
       WHERE f.id = $1`,
      [String(funcionId)]
    );
    return Boolean(result.rows[0]?.es_profesional);
  } catch (error) {
    logger.warn(`Error verificando si obra es profesional: ${error.message}`);
    return false;
  }
}

/**
 * Obtiene un ticket con validaciones de permisos
 * @private
 */
async function getTicketWithPermissions(code, userPhone = null, allowedRoles = []) {
  const result = await query(
    `SELECT
       t.*,
       f.fecha AS fecha_funcion,
       f.lugar AS lugar_funcion,
       o.nombre AS obra_nombre,
       o.cerrada AS obra_cerrada,
       o.es_profesional AS obra_profesional,
       g.id AS grupo_id,
       g.director_cedula AS grupo_director_cedula,
       u.name AS vendedor_nombre
     FROM tickets t
     JOIN funciones f ON f.id = t.funcion_id
     JOIN obras o ON o.id = f.obra_id
     JOIN grupos g ON g.id = o.grupo_id
     LEFT JOIN users u ON u.phone = t.vendedor_phone
     WHERE t.code = $1`,
    [String(code)]
  );

  if (result.rows.length === 0) {
    return { error: 'Ticket no encontrado', status: 404 };
  }

  const ticket = result.rows[0];

  // Validar si es del vendedor (si se requiere)
  if (userPhone && ticket.vendedor_phone !== userPhone && !allowedRoles.includes('SUPER') && !allowedRoles.includes('ADMIN')) {
    return { error: 'Ticket no pertenece a tu stock', status: 403 };
  }

  return { ticket };
}

/**
 * Asigna tickets a un vendedor (SUPER/ADMIN)
 */
export async function assignTickets({ funcionId, vendedorPhone, cantidad, precioVenta, assignedBy }) {
  try {
    // Validar función
    const funcionResult = await query('SELECT id FROM funciones WHERE id = $1', [String(funcionId)]);
    if (funcionResult.rows.length === 0) {
      return { error: 'Función no encontrada', status: 404 };
    }

    // Validar obra no cerrada
    const closed = await isShowClosed(funcionId);
    if (closed) {
      return { error: 'Obra cerrada: no se pueden asignar tickets', status: 403 };
    }

    // Validar vendedor existe
    const vendedorResult = await query('SELECT phone FROM users WHERE phone = $1 OR cedula = $1', [String(vendedorPhone)]);
    if (vendedorResult.rows.length === 0) {
      return { error: 'Vendedor no encontrado', status: 404 };
    }
    const realVendedorPhone = vendedorResult.rows[0].phone;

    // Asignar tickets
    const updated = await query(
      `UPDATE tickets
       SET estado = 'STOCK_ACTOR',
           vendedor_phone = $1,
           precio = $2
       WHERE funcion_id = $3
         AND estado = 'DISPONIBLE'
         AND id IN (
           SELECT id FROM tickets
           WHERE funcion_id = $3 AND estado = 'DISPONIBLE'
           LIMIT $4
         )
       RETURNING *`,
      [realVendedorPhone, precioVenta || null, String(funcionId), parseInt(cantidad, 10)]
    );

    // Registrar movimientos
    for (const ticket of updated.rows) {
      await insertMovement({
        tipo: 'ASIGNACION',
        ticketCode: ticket.code,
        desdePhone: assignedBy,
        haciaPhone: realVendedorPhone,
        motivo: 'Asignación manual por admin/super'
      });
    }

    logger.info(`✅ Asignados ${updated.rowCount} tickets a ${realVendedorPhone}`);
    return { tickets: updated.rows };

  } catch (error) {
    logger.error(`Error asignando tickets: ${error.message}`);
    return { error: 'No se pudieron asignar tickets', status: 500 };
  }
}

/**
 * Obtiene tickets del vendedor (ACTOR)
 */
export async function getVendorStock(vendedorPhone) {
  try {
    const result = await query(
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
      [String(vendedorPhone)]
    );

    // Agrupar por función
    const grouped = new Map();
    for (const ticket of result.rows) {
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

    // Calcular estadísticas por función
    const response = Array.from(grouped.values()).map(group => ({
      ...group,
      vendidas: group.tickets.filter(t => t.estado === 'REPORTADA_VENDIDA').length,
      pagadas: group.tickets.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO').length,
    }));

    return { stock: response };

  } catch (error) {
    logger.error(`Error obteniendo stock: ${error.message}`);
    return { error: 'Error obteniendo stock', status: 500 };
  }
}

/**
 * Actualiza estado de un ticket (ACTOR)
 * Solo permite: RESERVADO o REPORTADA_VENDIDA
 */
export async function updateTicketStatus({ code, newState, vendedorPhone, compradorNombre, compradorTelefono }) {
  try {
    // Validar estado permitido para actor
    if (!['RESERVADO', 'REPORTADA_VENDIDA'].includes(newState)) {
      return { error: 'No tienes permisos para ese cambio de estado', status: 403 };
    }

    // Obtener ticket
    const { ticket, error, status } = await getTicketWithPermissions(code, vendedorPhone);
    if (error) {
      return { error, status };
    }

    // Validar obra no cerrada
    if (ticket.obra_cerrada) {
      return { error: 'Obra cerrada: no se pueden modificar tickets', status: 403 };
    }

    // Validar obra no profesional (actores no pueden operar en obras profesionales)
    if (ticket.obra_profesional) {
      return { error: 'Operación no permitida: obra profesional (gestión sólo por boletería)', status: 403 };
    }

    // Validar estado actual
    if (ticket.estado === 'USADO') {
      return { error: 'Ticket ya fue usado', status: 400 };
    }

    if (ticket.estado === 'PAGADO') {
      return { error: 'Ticket ya está PAGADO (no se puede modificar desde vendedor)', status: 400 };
    }

    // Validar transición usando máquina de estados
    const validation = validateTransition(ticket.estado, newState);
    if (!validation.valid) {
      return { error: validation.error, status: 400 };
    }

    // Construir UPDATE dinámico
    const updates = ['estado = $1'];
    const values = [newState];
    let i = 2;

    if (compradorNombre !== undefined) {
      updates.push(`comprador_nombre = $${i++}`);
      values.push(compradorNombre || null);
    }
    if (compradorTelefono !== undefined) {
      updates.push(`comprador_phone = $${i++}`);
      values.push(compradorTelefono || null);
    }

    if (newState === 'RESERVADO') {
      updates.push(`reservado_at = NOW()`);
      updates.push(`reportada_por_vendedor = FALSE`);
      updates.push(`aprobada_por_admin = FALSE`);
    }

    if (newState === 'REPORTADA_VENDIDA') {
      updates.push(`reportada_por_vendedor = TRUE`);
      updates.push(`reportada_at = NOW()`);
    }

    values.push(code);
    const updated = await query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE code = $${i} RETURNING *`,
      values
    );

    const updatedTicket = updated.rows[0];

    // Registrar movimiento
    if (validation.movementType) {
      await insertMovement({
        tipo: validation.movementType,
        ticketCode: updatedTicket.code,
        desdePhone: vendedorPhone,
        haciaPhone: vendedorPhone,
        motivo: validation.movementType === 'RESERVA' ? 'Reserva por vendedor' : 'Venta reportada por vendedor'
      });
    }

    logger.info(`✅ Ticket ${code} actualizado: ${ticket.estado} → ${newState}`);
    return { ticket: updatedTicket };

  } catch (error) {
    logger.error(`Error actualizando ticket: ${error.message}`);
    return { error: 'No se pudo actualizar el ticket', status: 500 };
  }
}

/**
 * Transfiere un ticket a otro vendedor (ACTOR)
 */
export async function transferTicket({ code, fromVendorPhone, toVendorCedula, motivo }) {
  try {
    // Obtener ticket
    const { ticket, error, status } = await getTicketWithPermissions(code, fromVendorPhone);
    if (error) {
      return { error, status };
    }

    // Validar obra no cerrada
    if (ticket.obra_cerrada) {
      return { error: 'Obra cerrada: no se pueden transferir tickets', status: 403 };
    }

    // Validar obra no profesional
    if (ticket.obra_profesional) {
      return { error: 'Transferencia no permitida: obra profesional (solo boletería)', status: 403 };
    }

    // Solo se pueden transferir tickets en STOCK_ACTOR
    if (ticket.estado !== 'STOCK_ACTOR') {
      return { error: `Solo se pueden transferir tickets en stock. Estado actual: ${ticket.estado}`, status: 400 };
    }

    // Validar vendedor destino
    const destResult = await query('SELECT cedula, phone, name FROM users WHERE cedula = $1', [String(toVendorCedula)]);
    if (destResult.rows.length === 0) {
      return { error: 'Actor destino no encontrado', status: 404 };
    }
    const destinoPhone = destResult.rows[0].phone || toVendorCedula;
    const destinoName = destResult.rows[0].name;

    // Transferir
    const updated = await query(
      `UPDATE tickets
       SET vendedor_phone = $1
       WHERE code = $2
       RETURNING *`,
      [String(destinoPhone), code]
    );

    // Registrar movimiento
    await insertMovement({
      tipo: 'TRANSFERENCIA',
      ticketCode: code,
      desdePhone: fromVendorPhone,
      haciaPhone: destinoPhone,
      motivo: motivo || 'Transferencia entre vendedores'
    });

    logger.info(`✅ Ticket ${code} transferido: ${fromVendorPhone} → ${destinoPhone}`);
    return { ticket: updated.rows[0], destinoName };

  } catch (error) {
    logger.error(`Error transfiriendo ticket: ${error.message}`);
    return { error: 'No se pudo transferir el ticket', status: 500 };
  }
}

/**
 * Aprueba pagos de tickets reportados (SUPER/ADMIN)
 */
export async function approvePayments({ funcionId, vendedorCedula, approvedBy }) {
  try {
    // Validar obra no cerrada
    const closed = await isShowClosed(funcionId);
    if (closed) {
      return { error: 'Obra cerrada: no se pueden cobrar tickets', status: 403 };
    }

    // Obtener phone del vendedor
    const vendorResult = await query('SELECT phone FROM users WHERE cedula = $1', [String(vendedorCedula)]);
    if (vendorResult.rows.length === 0) {
      return { error: 'Vendedor no encontrado', status: 404 };
    }
    const vendorPhone = vendorResult.rows[0].phone || vendedorCedula;

    // Actualizar tickets de REPORTADA_VENDIDA a PAGADO
    const updated = await query(
      `UPDATE tickets
       SET estado = 'PAGADO',
           aprobada_por_admin = TRUE,
           pagado_at = NOW()
       WHERE funcion_id = $1
         AND vendedor_phone = $2
         AND estado = 'REPORTADA_VENDIDA'
       RETURNING code`,
      [String(funcionId), vendorPhone]
    );

    // Registrar movimientos
    for (const row of updated.rows) {
      await insertMovement({
        tipo: 'PAGO_APROBADO',
        ticketCode: row.code,
        desdePhone: vendorPhone,
        haciaPhone: vendorPhone,
        motivo: 'Pago aprobado por admin/super'
      });
    }

    logger.info(`✅ Aprobados ${updated.rowCount} pagos para función ${funcionId}`);
    return { count: updated.rowCount };

  } catch (error) {
    logger.error(`Error aprobando pagos: ${error.message}`);
    return { error: 'No se pudieron cobrar tickets', status: 500 };
  }
}

/**
 * Valida un ticket en puerta (SUPER/ADMIN)
 */
export async function validateTicket({ code, validatorRole, validatorCedula, validatorPhone }) {
  try {
    // Obtener ticket con información completa
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
      [String(code)]
    );

    if (result.rows.length === 0) {
      return { ok: false, mensaje: 'Ticket no encontrado o inválido' };
    }

    const ticket = result.rows[0];

    // Validar permisos: ADMIN solo puede validar tickets de sus grupos
    if (validatorRole === 'ADMIN' && ticket.grupo_director_cedula !== validatorCedula) {
      return { ok: false, mensaje: 'No autorizado para validar tickets de este grupo', status: 403 };
    }

    // Validar fecha de función
    const fechaFuncion = ticket.fecha_funcion ? new Date(ticket.fecha_funcion) : null;
    if (!fechaFuncion || Number.isNaN(fechaFuncion.getTime())) {
      return { ok: false, mensaje: 'Función inválida (fecha no válida)' };
    }

    // Validar estado
    if (ticket.estado === 'USADO') {
      return { ok: false, mensaje: 'Ticket ya fue usado' };
    }

    if (ticket.estado !== 'PAGADO') {
      return { ok: false, mensaje: `Ticket no habilitado. Estado actual: ${ticket.estado}` };
    }

    // Actualización atómica: evita doble escaneo concurrente
    const updated = await query(
      "UPDATE tickets SET estado = 'USADO', usado_at = NOW() WHERE code = $1 AND estado = 'PAGADO' RETURNING code",
      [String(code)]
    );

    if (updated.rowCount === 0) {
      // Releer para mensaje preciso
      const reread = await query('SELECT estado FROM tickets WHERE code = $1', [String(code)]);
      const estadoActual = reread.rows[0]?.estado;
      if (estadoActual === 'USADO') {
        return { ok: false, mensaje: 'Ticket ya fue usado' };
      }
      return { ok: false, mensaje: 'No se pudo validar el ticket (estado cambió)' };
    }

    // Registrar movimiento
    await insertMovement({
      tipo: 'VALIDACION',
      ticketCode: code,
      desdePhone: validatorPhone || validatorCedula,
      haciaPhone: null,
      motivo: `Validación por ${validatorRole || 'desconocido'}`
    });

    logger.info(`✅ Ticket ${code} validado por ${validatorRole}`);
    return {
      ok: true,
      mensaje: 'Ticket validado con éxito',
      ticket: {
        ...ticket,
        estado: 'USADO',
        obra: ticket.obra_nombre,
        fecha: ticket.fecha_funcion,
        vendedor_nombre: ticket.vendedor_nombre
      }
    };

  } catch (error) {
    logger.error(`Error validando ticket: ${error.message}`);
    return { ok: false, error: 'Error validando ticket', status: 500 };
  }
}

/**
 * Anula un ticket (SUPER/ADMIN)
 */
export async function annulateTicket({ code, motivo, annulatedByRole, annulatedByCedula, annulatedByPhone }) {
  try {
    if (!motivo || !String(motivo).trim()) {
      return { error: 'Motivo obligatorio', status: 400 };
    }

    // Obtener ticket con información de grupo
    const result = await query(
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

    if (result.rows.length === 0) {
      return { error: 'Ticket no encontrado', status: 404 };
    }

    const ticket = result.rows[0];

    // Validar permisos: ADMIN solo puede anular tickets de sus grupos
    if (annulatedByRole === 'ADMIN' && String(ticket.grupo_director_cedula) !== String(annulatedByCedula)) {
      return { error: 'No autorizado para anular tickets de este grupo', status: 403 };
    }

    // No se puede anular un ticket USADO
    if (ticket.estado === 'USADO') {
      return { error: 'No se puede anular un ticket USADO', status: 409 };
    }

    // Anular
    const updated = await query(
      `UPDATE tickets
       SET estado = 'ANULADO',
           anulado_motivo = $2,
           anulado_at = NOW()
       WHERE code = $1
         AND estado <> 'USADO'
       RETURNING *`,
      [String(code), String(motivo)]
    );

    // Registrar movimiento
    await insertMovement({
      tipo: 'ANULACION',
      ticketCode: String(code),
      desdePhone: annulatedByPhone || annulatedByCedula,
      haciaPhone: null,
      motivo: String(motivo)
    });

    logger.info(`✅ Ticket ${code} anulado. Motivo: ${motivo}`);
    return { ok: true, ticket: updated.rows[0] };

  } catch (error) {
    logger.error(`Error anulando ticket: ${error.message}`);
    return { error: 'No se pudo anular el ticket', status: 500 };
  }
}
