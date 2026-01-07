/**
 * Servicio de logging de acciones (auditoría)
 * Log automático de acciones críticas
 */

import { query } from '../db/postgres.js';

export async function logAction(req, {
  accion,      // venta, cobro, transferencia, anulacion, cierre_grupo, creacion_funcion
  entidad,     // ticket, grupo, funcion, etc
  entidad_id,  // id del ticket, grupo, etc
  grupo_id,    // opcional, para filtrar por grupo
  descripcion  // descripción legible de la acción
}) {
  try {
    const user_cedula = req.user?.cedula || null;
    const rol = req.user?.role || null;
    const ip_address = req.ip || req.connection?.remoteAddress || null;

    await query(
      `INSERT INTO action_logs (user_cedula, rol, accion, entidad, entidad_id, grupo_id, descripcion, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user_cedula, rol, accion, entidad, String(entidad_id), grupo_id, descripcion, ip_address]
    );
  } catch (error) {
    // Log best-effort: no romper el flujo si falla auditoría
    console.error('Error logging action:', error.message);
  }
}

// Obtener logs (protegido: SUPER, ADMIN)
export async function obtenerLogs(req, filters = {}) {
  try {
    const { grupo_id, accion, user_cedula, desde, hasta } = filters;
    
    let sql = 'SELECT * FROM action_logs WHERE 1=1';
    const params = [];

    if (grupo_id) {
      sql += ' AND grupo_id = $' + (params.length + 1);
      params.push(grupo_id);
    }

    if (accion) {
      sql += ' AND accion = $' + (params.length + 1);
      params.push(accion);
    }

    if (user_cedula) {
      sql += ' AND user_cedula = $' + (params.length + 1);
      params.push(user_cedula);
    }

    if (desde) {
      sql += ' AND created_at >= $' + (params.length + 1);
      params.push(desde);
    }

    if (hasta) {
      sql += ' AND created_at <= $' + (params.length + 1);
      params.push(hasta);
    }

    sql += ' ORDER BY created_at DESC LIMIT 1000';

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
}
