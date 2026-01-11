/**
 * TICKET AUDIT SERVICE
 * 
 * Gestiona el registro de auditoría de movimientos de tickets.
 * Responsable de mantener la trazabilidad completa de cambios.
 * 
 * Cada movimiento de ticket se registra aquí:
 * - Quién lo hizo
 * - Cuándo lo hizo
 * - Qué cambió
 * - Por qué cambió
 */

import { query } from '../db.js';

/**
 * Registra un movimiento de ticket en la auditoría
 * 
 * @param {Object} params
 * @param {string} params.ticketCode - Código del ticket
 * @param {string} params.estadoAnterior - Estado previo
 * @param {string} params.estadoNuevo - Estado actual
 * @param {string} params.realizadoPor - Cédula de quién lo hizo
 * @param {string} params.motivo - Razón del cambio (opcional)
 * 
 * @returns {Promise<void>}
 * 
 * Ejemplo:
 *   await registrarMovimiento({
 *     ticketCode: 'ABC123',
 *     estadoAnterior: 'RESERVADO',
 *     estadoNuevo: 'REPORTADA_VENDIDA',
 *     realizadoPor: '12345678',
 *     motivo: 'Venta reportada por vendedor'
 *   });
 */
export async function registrarMovimiento({
  ticketCode,
  estadoAnterior,
  estadoNuevo,
  realizadoPor,
  motivo = null
}) {
  if (!ticketCode || !estadoAnterior || !estadoNuevo || !realizadoPor) {
    throw new Error('Parámetros requeridos: ticketCode, estadoAnterior, estadoNuevo, realizadoPor');
  }

  await query(
    `INSERT INTO movimientos 
     (ticket_code, estado_anterior, estado_nuevo, realizado_por, motivo, creado_en)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [ticketCode, estadoAnterior, estadoNuevo, realizadoPor, motivo]
  );
}

/**
 * Obtiene todos los movimientos de un ticket
 * 
 * @param {string} ticketCode - Código del ticket
 * @returns {Promise<Array>} Historial de movimientos ordenado por fecha
 * 
 * Ejemplo:
 *   const movimientos = await obtenerMovimientos('ABC123');
 *   console.log(movimientos);
 *   // [
 *   //   { ticket_code: 'ABC123', estado_anterior: 'DISPONIBLE', estado_nuevo: 'RESERVADO', ... },
 *   //   { ticket_code: 'ABC123', estado_anterior: 'RESERVADO', estado_nuevo: 'REPORTADA_VENDIDA', ... },
 *   //   ...
 *   // ]
 */
export async function obtenerMovimientos(ticketCode) {
  if (!ticketCode) {
    throw new Error('ticketCode es requerido');
  }

  const result = await query(
    `SELECT 
       ticket_code,
       estado_anterior,
       estado_nuevo,
       realizado_por,
       motivo,
       creado_en
     FROM movimientos
     WHERE ticket_code = $1
     ORDER BY creado_en DESC`,
    [ticketCode]
  );

  return result.rows;
}

/**
 * Obtiene movimientos de múltiples tickets (para reportes)
 * 
 * @param {Array<string>} ticketCodes - Códigos de tickets
 * @returns {Promise<Array>} Todos los movimientos
 */
export async function obtenerMovimientosMultiples(ticketCodes) {
  if (!Array.isArray(ticketCodes) || ticketCodes.length === 0) {
    throw new Error('ticketCodes debe ser un array no vacío');
  }

  const placeholders = ticketCodes.map((_, i) => `$${i + 1}`).join(',');
  
  const result = await query(
    `SELECT 
       ticket_code,
       estado_anterior,
       estado_nuevo,
       realizado_por,
       motivo,
       creado_en
     FROM movimientos
     WHERE ticket_code IN (${placeholders})
     ORDER BY creado_en DESC`,
    ticketCodes
  );

  return result.rows;
}

/**
 * Obtiene movimientos de todos los tickets de una función
 * (para reportes de director/admin)
 * 
 * @param {number} funcionId - ID de la función
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.estado - Filtrar por estado nuevo
 * @param {string} filters.realizadoPor - Filtrar por realizador
 * @param {Date} filters.desde - Desde fecha (inclusive)
 * @param {Date} filters.hasta - Hasta fecha (inclusive)
 * 
 * @returns {Promise<Array>}
 */
export async function obtenerMovimientosFuncion(funcionId, filters = {}) {
  if (!funcionId) {
    throw new Error('funcionId es requerido');
  }

  let query_str = `
    SELECT 
      m.ticket_code,
      m.estado_anterior,
      m.estado_nuevo,
      m.realizado_por,
      m.motivo,
      m.creado_en,
      t.funcion_id
    FROM movimientos m
    JOIN tickets t ON m.ticket_code = t.code
    WHERE t.funcion_id = $1
  `;

  const params = [funcionId];
  let paramIndex = 2;

  if (filters.estado) {
    query_str += ` AND m.estado_nuevo = $${paramIndex}`;
    params.push(filters.estado);
    paramIndex++;
  }

  if (filters.realizadoPor) {
    query_str += ` AND m.realizado_por = $${paramIndex}`;
    params.push(filters.realizadoPor);
    paramIndex++;
  }

  if (filters.desde) {
    query_str += ` AND m.creado_en >= $${paramIndex}`;
    params.push(filters.desde);
    paramIndex++;
  }

  if (filters.hasta) {
    query_str += ` AND m.creado_en <= $${paramIndex}`;
    params.push(filters.hasta);
    paramIndex++;
  }

  query_str += ` ORDER BY m.creado_en DESC`;

  const result = await query(query_str, params);
  return result.rows;
}

/**
 * Cuenta cambios de estado entre dos estados (para estadísticas)
 * 
 * @param {number} funcionId - ID de la función
 * @param {string} desde - Estado anterior
 * @param {string} hacia - Estado nuevo
 * @returns {Promise<number>}
 */
export async function contarTransiciones(funcionId, desde, hacia) {
  const result = await query(
    `SELECT COUNT(*) as total
     FROM movimientos m
     JOIN tickets t ON m.ticket_code = t.code
     WHERE t.funcion_id = $1 
       AND m.estado_anterior = $2 
       AND m.estado_nuevo = $3`,
    [funcionId, desde, hacia]
  );

  return parseInt(result.rows[0]?.total || 0);
}
