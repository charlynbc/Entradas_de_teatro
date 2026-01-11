/**
 * CAJA SERVICE
 * 
 * Gestiona registro de ingresos y egresos en la caja del sistema.
 * Responsable de la contabilidad de tickets.
 * 
 * Cada venta aprobada registra el ingreso acá:
 * - Qué se vendió
 * - Cuánto se recibió
 * - Cuándo se recibió
 * - De qué función
 * - Quién la procesó
 */

import { query } from '../db.js';

/**
 * Registra un ingreso de caja por venta de ticket
 * 
 * @param {Object} params
 * @param {number} params.funcionId - ID de la función
 * @param {number} params.monto - Monto recibido (en dinero local)
 * @param {string} params.concepto - Descripción: 'VENTA_ACTOR', 'VENTA_ONLINE', 'CORTESIA', etc.
 * @param {string} params.ticketCode - Código del ticket (referencia)
 * @param {string} params.motivo - Razón adicional (opcional)
 * 
 * @returns {Promise<void>}
 * 
 * Ejemplo:
 *   await registrarIngresoCaja({
 *     funcionId: 1,
 *     monto: 50.00,
 *     concepto: 'VENTA_ACTOR',
 *     ticketCode: 'ABC123',
 *     motivo: 'Pago recibido en efectivo'
 *   });
 */
export async function registrarIngresoCaja({
  funcionId,
  monto,
  concepto,
  ticketCode,
  motivo = null
}) {
  if (!funcionId || !monto || !concepto || !ticketCode) {
    throw new Error('Parámetros requeridos: funcionId, monto, concepto, ticketCode');
  }

  if (monto <= 0) {
    throw new Error('El monto debe ser positivo');
  }

  await query(
    `INSERT INTO caja 
     (funcion_id, tipo_movimiento, monto, concepto, ticket_code, motivo, fecha)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [funcionId, 'INGRESO', monto, concepto, ticketCode, motivo]
  );
}

/**
 * Registra un egreso de caja (devoluciones, anulaciones)
 * 
 * @param {Object} params
 * @param {number} params.funcionId
 * @param {number} params.monto
 * @param {string} params.razon - Razón del egreso
 * @param {string} params.ticketCode - Ticket asociado
 * 
 * @returns {Promise<void>}
 */
export async function registrarEgresoCaja({
  funcionId,
  monto,
  razon,
  ticketCode
}) {
  if (!funcionId || !monto || !razon || !ticketCode) {
    throw new Error('Parámetros requeridos: funcionId, monto, razon, ticketCode');
  }

  if (monto <= 0) {
    throw new Error('El monto debe ser positivo');
  }

  await query(
    `INSERT INTO caja 
     (funcion_id, tipo_movimiento, monto, concepto, ticket_code, motivo, fecha)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [funcionId, 'EGRESO', monto, 'DEVOLUCION', ticketCode, razon]
  );
}

/**
 * Obtiene movimientos de caja de una función
 * 
 * @param {number} funcionId
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.tipo - 'INGRESO' o 'EGRESO'
 * @param {Date} filters.desde
 * @param {Date} filters.hasta
 * 
 * @returns {Promise<Array>}
 * 
 * Ejemplo:
 *   const movimientos = await obtenerMovimientosCaja(1);
 *   const ingresos = await obtenerMovimientosCaja(1, { tipo: 'INGRESO' });
 */
export async function obtenerMovimientosCaja(funcionId, filters = {}) {
  if (!funcionId) {
    throw new Error('funcionId es requerido');
  }

  let query_str = `
    SELECT 
      id,
      funcion_id,
      tipo_movimiento,
      monto,
      concepto,
      ticket_code,
      motivo,
      fecha
    FROM caja
    WHERE funcion_id = $1
  `;

  const params = [funcionId];
  let paramIndex = 2;

  if (filters.tipo) {
    query_str += ` AND tipo_movimiento = $${paramIndex}`;
    params.push(filters.tipo);
    paramIndex++;
  }

  if (filters.desde) {
    query_str += ` AND fecha >= $${paramIndex}`;
    params.push(filters.desde);
    paramIndex++;
  }

  if (filters.hasta) {
    query_str += ` AND fecha <= $${paramIndex}`;
    params.push(filters.hasta);
    paramIndex++;
  }

  query_str += ` ORDER BY fecha DESC`;

  const result = await query(query_str, params);
  return result.rows;
}

/**
 * Calcula el saldo de caja de una función
 * (total ingresos - total egresos)
 * 
 * @param {number} funcionId
 * @param {Object} filters - Filtros de fecha (opcional)
 * @returns {Promise<Object>} { ingresos, egresos, saldo }
 * 
 * Ejemplo:
 *   const saldo = await calcularSaldoCaja(1);
 *   console.log(saldo);
 *   // { ingresos: 500.00, egresos: 50.00, saldo: 450.00 }
 */
export async function calcularSaldoCaja(funcionId, filters = {}) {
  if (!funcionId) {
    throw new Error('funcionId es requerido');
  }

  let query_str = `
    SELECT 
      tipo_movimiento,
      SUM(monto) as total
    FROM caja
    WHERE funcion_id = $1
  `;

  const params = [funcionId];
  let paramIndex = 2;

  if (filters.desde) {
    query_str += ` AND fecha >= $${paramIndex}`;
    params.push(filters.desde);
    paramIndex++;
  }

  if (filters.hasta) {
    query_str += ` AND fecha <= $${paramIndex}`;
    params.push(filters.hasta);
    paramIndex++;
  }

  query_str += ` GROUP BY tipo_movimiento`;

  const result = await query(query_str, params);

  let ingresos = 0;
  let egresos = 0;

  for (const row of result.rows) {
    if (row.tipo_movimiento === 'INGRESO') {
      ingresos = parseFloat(row.total || 0);
    } else if (row.tipo_movimiento === 'EGRESO') {
      egresos = parseFloat(row.total || 0);
    }
  }

  return {
    ingresos,
    egresos,
    saldo: ingresos - egresos
  };
}

/**
 * Reporte de ingresos por concepto (para análisis)
 * 
 * @param {number} funcionId
 * @returns {Promise<Array>} Desglose por tipo de ingreso
 */
export async function reporteIngresosPorConcepto(funcionId) {
  if (!funcionId) {
    throw new Error('funcionId es requerido');
  }

  const result = await query(
    `SELECT 
      concepto,
      COUNT(*) as cantidad,
      SUM(monto) as total
    FROM caja
    WHERE funcion_id = $1 AND tipo_movimiento = 'INGRESO'
    GROUP BY concepto
    ORDER BY total DESC`,
    [funcionId]
  );

  return result.rows;
}

/**
 * Verifica si el saldo de una función es consistente
 * (Auditación de integridad)
 * 
 * @param {number} funcionId
 * @returns {Promise<Object>} { consistente, diferencia, detalles }
 */
export async function verificarIntegridad(funcionId) {
  if (!funcionId) {
    throw new Error('funcionId es requerido');
  }

  // Saldo desde caja
  const saldoCaja = await calcularSaldoCaja(funcionId);

  // Saldo esperado (contar tickets PAGADO o USADO de esa función)
  const result = await query(
    `SELECT 
      COUNT(CASE WHEN estado IN ('PAGADO', 'USADO') THEN 1 END) as tickets_vendidos,
      SUM(CASE WHEN estado IN ('PAGADO', 'USADO') THEN precio ELSE 0 END) as total_esperado
    FROM tickets
    WHERE funcion_id = $1`,
    [funcionId]
  );

  const saldoEsperado = parseFloat(result.rows[0]?.total_esperado || 0);
  const diferencia = Math.abs(saldoCaja.saldo - saldoEsperado);
  const consistente = diferencia < 0.01; // Tolerancia: 0.01 por redondeo

  return {
    consistente,
    diferencia,
    saldoActual: saldoCaja.saldo,
    saldoEsperado,
    detalles: {
      ticketsVendidos: result.rows[0]?.tickets_vendidos,
      caja: saldoCaja
    }
  };
}
