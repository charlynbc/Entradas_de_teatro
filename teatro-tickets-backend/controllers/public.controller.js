import pool from '../db/postgres.js';
import { logger } from '../utils/logger.js';

const BOLETERIA_PHONE = process.env.BOLETERIA_PHONE || process.env.BOLETERIA_CONTACTO || '099999999';
const BOLETERIA_NOMBRE = process.env.BOLETERIA_NOMBRE || 'Boletería BACO';
const ESTADOS = {
  ASIGNADA: 'asignada',
  RESERVADA: 'reservada',
  PRONTA: 'pronta',
  PAGADA: 'pagada'
};

/**
 * Cartelera pública para invitados (sin autenticación)
 * GET /public/funciones
 */
export async function listarFuncionesInvitado(req, res) {
  try {
    // Soportar esquemas diferentes: tomar campos compatibles y derivados
    const result = await pool.query(
      `SELECT 
          f.id,
          f.fecha AS fecha,
          to_char(f.fecha, 'HH24:MI') AS hora,
          COALESCE(f.lugar, '') AS sala,
          COALESCE(f.precio_base, 0) AS precio,
          COALESCE(o.nombre, 'Baco Teatro') AS obra_nombre,
          COALESCE(f.descripcion_obra, o.descripcion, '') AS descripcion,
          g.nombre AS grupo_nombre,
          COALESCE(o.es_profesional, FALSE) AS es_profesional,
          COALESCE(f.tipo_funcion, 'INDEPENDIENTE') AS tipo_funcion,
          COALESCE(f.permite_compra_online, FALSE) AS permite_compra_online,
          COALESCE(f.estado, 'PROGRAMADA') AS estado,
          (SELECT COUNT(*) FROM tickets t WHERE t.funcion_id = f.id AND t.estado = 'DISPONIBLE') AS entradas_disponibles,
          $1 AS boleteria_contacto,
          $2 AS boleteria_nombre
       FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       LEFT JOIN grupos g ON g.id = o.grupo_id
       WHERE f.fecha >= NOW()
       ORDER BY f.fecha ASC`,
      [BOLETERIA_PHONE, BOLETERIA_NOMBRE]
     );

    // La UI espera { funciones: [] }
    res.json({ total: result.rows.length, funciones: result.rows });
  } catch (error) {
    console.error('Error al listar funciones invitado:', error);
    res.status(500).json({ error: 'Error al listar funciones públicas' });
  }
}

/**
 * Vendedores públicos por función (sin autenticación)
 * Reglas:
 * - Solo vendedores del grupo de la función
 * - Rol vendedor (en DB es ACTOR)
 * - Deben tener tickets asignados a esa función
 * - No expone estados internos ni cantidades
 * GET /public/funciones/:funcionId/vendedores
 */
export async function listarVendedoresPublicosPorFuncion(req, res) {
  try {
    const funcionId = Number(req.params.funcionId);
    if (!Number.isFinite(funcionId)) {
      return res.status(400).json({ error: 'funcionId inválido' });
    }

    // Determinar si es una función pública vigente y si la obra es profesional
    const meta = await pool.query(
      `SELECT f.id, f.fecha, f.estado,
              COALESCE(o.es_profesional, FALSE) AS es_profesional,
              g.id AS grupo_id
         FROM funciones f
         LEFT JOIN obras o ON o.id = f.obra_id
         LEFT JOIN grupos g ON g.id = o.grupo_id
        WHERE f.id = $1
        LIMIT 1`,
      [funcionId]
    );

    if (meta.rows.length === 0) {
      return res.json({ total: 0, vendedores: [] });
    }

    const row = meta.rows[0];
    const esPublica = row.fecha >= new Date();
    if (!esPublica) {
      return res.json({ total: 0, vendedores: [] });
    }

    // Si es profesional: retornar solo boletería
    if (row.es_profesional) {
      const v = [{ nombre: BOLETERIA_NOMBRE, contacto_publico: BOLETERIA_PHONE }]
        .filter(x => x.contacto_publico);
      return res.json({ total: v.length, vendedores: v });
    }

    // Caso común: actores/directores con entradas asignadas en entradas_v2
    const result = await pool.query(
      `SELECT 
          u.cedula,
          u.name,
          u.apellido,
          u.role,
          COALESCE(u.phone, u.celular, u.cedula) AS contacto_publico,
          COUNT(*) FILTER (WHERE e.estado = 'asignada') AS disponibles,
          COUNT(*) AS total_asignadas
       FROM entradas_v2 e
       JOIN users u ON u.cedula = e.actor_cedula
      WHERE e.funcion_id = $1
      GROUP BY u.cedula, u.name, u.apellido, u.role, u.phone, u.celular
     HAVING COUNT(*) FILTER (WHERE e.estado = 'asignada') > 0
     ORDER BY u.name ASC`,
      [funcionId]
    );

    const vendedores = result.rows
      .map(v => ({
        cedula: v.cedula,
        nombre: `${v.name || ''} ${v.apellido || ''}`.trim() || v.name || 'Vendedor',
        contacto_publico: v.contacto_publico || null,
        rol: v.role,
        disponibles: Number(v.disponibles || 0)
      }))
      .filter(v => v.contacto_publico);

    res.json({ total: vendedores.length, vendedores });
  } catch (error) {
    console.error('Error al listar vendedores públicos por función:', error);
    res.status(500).json({ error: 'Error al listar vendedores públicos' });
  }
}

export async function reservarEntradaInvitado(req, res) {
  const client = await pool.connect();
  try {
    const funcionId = Number(req.params.funcionId);
    const { vendedor_cedula, vendedor_phone, nombre, telefono } = req.body || {};
    const vendedorPhoneClean = vendedor_phone ? String(vendedor_phone).replace(/\D/g, '') : null;

    if (!Number.isFinite(funcionId)) {
      return res.status(400).json({ error: 'funcionId inválido' });
    }
    if (!nombre || !telefono) {
      return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });
    }

    const funcionMeta = await client.query(
      `SELECT f.id, f.fecha, f.lugar, COALESCE(o.nombre, '') AS obra_nombre, COALESCE(o.es_profesional, FALSE) AS es_profesional
         FROM funciones f
         LEFT JOIN obras o ON o.id = f.obra_id
        WHERE f.id = $1`,
      [funcionId]
    );
    if (funcionMeta.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    const funcionInfo = funcionMeta.rows[0];
    if (funcionInfo.es_profesional) {
      return res.status(400).json({ error: 'Las reservas públicas son solo para funciones de muestra' });
    }
    const fechaFuncion = funcionInfo.fecha ? new Date(funcionInfo.fecha) : null;
    if (fechaFuncion && !Number.isNaN(fechaFuncion.getTime()) && fechaFuncion < new Date()) {
      return res.status(400).json({ error: 'La función ya ocurrió, no se pueden tomar reservas' });
    }

    // Buscar vendedor por cédula o phone
    const vendedorRes = await client.query(
      `SELECT cedula, name, apellido, role, COALESCE(phone, celular, cedula) AS contacto_publico
         FROM users
        WHERE cedula = $1 OR phone = $2 OR celular = $2
        LIMIT 1`,
      [vendedor_cedula || null, vendedorPhoneClean || null]
    );

    if (vendedorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    const vendedor = vendedorRes.rows[0];
    if (!['ACTOR', 'DIRECTOR'].includes(vendedor.role)) {
      return res.status(400).json({ error: 'El vendedor debe ser actor o director' });
    }
    if (!vendedor.contacto_publico) {
      return res.status(400).json({ error: 'El vendedor no tiene contacto público cargado' });
    }

    // Si ya existe una reserva con ese teléfono y vendedor, devolverla
    const reservaExistente = await client.query(
      `SELECT * FROM entradas_v2
        WHERE funcion_id = $1 AND actor_cedula = $2 AND reservante_telefono = $3
          AND estado IN ('reservada','pronta','pagada','utilizada')
        ORDER BY reservada_at DESC
        LIMIT 1`,
      [funcionId, vendedor.cedula, telefono]
    );
    if (reservaExistente.rows.length > 0) {
      const e = reservaExistente.rows[0];
      return res.json({
        message: 'Reserva ya registrada con este vendedor',
        code: e.code,
        estado: e.estado,
        vendedor: vendedor.name,
        whatsapp_mensaje: buildWhatsappMensaje(vendedor, funcionMeta.rows[0], nombre, telefono)
      });
    }

    await client.query('BEGIN');

    const candidata = await client.query(
      `WITH disponible AS (
          SELECT id FROM entradas_v2
           WHERE funcion_id = $1
             AND actor_cedula = $2
             AND estado = $3
           ORDER BY id ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED
      )
      UPDATE entradas_v2 e
         SET estado = $4,
             reservante_nombre = $5,
             reservante_telefono = $6,
             reservada_at = NOW(),
             updated_at = NOW()
        FROM disponible d
       WHERE e.id = d.id
       RETURNING e.*`,
      [funcionId, vendedor.cedula, ESTADOS.ASIGNADA, ESTADOS.RESERVADA, nombre, telefono]
    );

    if (candidata.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'El vendedor no tiene entradas disponibles para reservar' });
    }

    const entrada = candidata.rows[0];
    await client.query(
      `INSERT INTO entradas_v2_logs (entrada_id, estado_anterior, estado_nuevo, accion, detalle, ejecutado_por, actor_cedula)
       VALUES ($1,$2,$3,$4,$5,$6,$7)` ,
      [entrada.id, ESTADOS.ASIGNADA, ESTADOS.RESERVADA, 'reservar_publico', `Reserva invitado ${nombre}`, vendedor.cedula, vendedor.cedula]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Reserva creada. El vendedor coordinará contigo y el director validará el pago.',
      code: entrada.code,
      estado: entrada.estado,
      vendedor: vendedor.name,
      whatsapp_mensaje: buildWhatsappMensaje(vendedor, funcionMeta.rows[0], nombre, telefono)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error en reserva pública: ${error.message}`);
    res.status(500).json({ error: 'No se pudo registrar la reserva' });
  } finally {
    client.release();
  }
}

function buildWhatsappMensaje(vendedor, funcion, nombreInvitado, telefonoInvitado) {
  const fecha = funcion.fecha ? new Date(funcion.fecha) : null;
  const fechaStr = fecha && !Number.isNaN(fecha.getTime())
    ? fecha.toLocaleDateString('es-UY', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '';
  const horaStr = fecha && !Number.isNaN(fecha.getTime())
    ? fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
    : '';
  const obra = funcion.obra_nombre || 'Obra';
  return `Hola ${vendedor.name || 'equipo'}!\n\nSe registró una reserva para la función "${obra}" (${fechaStr} ${horaStr}).\nInvitado: ${nombreInvitado} (${telefonoInvitado}).\nRecuerda marcarla como pronta y el director debe confirmar el pago.\nGracias!`;
}
