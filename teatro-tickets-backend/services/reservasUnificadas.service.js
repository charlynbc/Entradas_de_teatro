/**
 * Servicio unificado de reservas
 * Maneja tanto tickets (legacy) como entradas_v2 (nuevo sistema)
 * Proporciona una interfaz consistente independientemente del sistema usado
 */

import { query } from '../db/postgres.js';
import { logger } from '../utils/logger.js';

/**
 * Detecta qué sistema usa una función
 * @param {number} funcionId 
 * @returns {Promise<'tickets'|'entradas_v2'>}
 */
export async function detectarSistemaFuncion(funcionId) {
  try {
    // Verificar si tiene entradas_v2
    const checkV2 = await query(
      'SELECT COUNT(*) as total FROM entradas_v2 WHERE funcion_id = $1',
      [String(funcionId)]
    );
    
    const totalV2 = parseInt(checkV2.rows[0]?.total || '0');
    if (totalV2 > 0) {
      return 'entradas_v2';
    }

    // Verificar si tiene tickets
    const checkTickets = await query(
      'SELECT COUNT(*) as total FROM tickets WHERE funcion_id = $1',
      [String(funcionId)]
    );
    
    const totalTickets = parseInt(checkTickets.rows[0]?.total || '0');
    if (totalTickets > 0) {
      return 'tickets';
    }

    // Por defecto, usar el nuevo sistema
    return 'entradas_v2';
  } catch (error) {
    logger.error(`Error detectando sistema: ${error.message}`);
    return 'entradas_v2'; // Default al nuevo
  }
}

/**
 * Reserva una entrada (unificado)
 * @param {Object} params
 * @param {number} params.funcionId
 * @param {string} params.vendedorCedula
 * @param {string} params.compradorNombre
 * @param {string} params.compradorTelefono
 * @returns {Promise<Object>}
 */
export async function reservarEntrada({
  funcionId,
  vendedorCedula,
  compradorNombre,
  compradorTelefono
}) {
  const sistema = await detectarSistemaFuncion(funcionId);

  if (sistema === 'entradas_v2') {
    return reservarEntradaV2({
      funcionId,
      vendedorCedula,
      compradorNombre,
      compradorTelefono
    });
  } else {
    return reservarTicketLegacy({
      funcionId,
      vendedorCedula,
      compradorNombre,
      compradorTelefono
    });
  }
}

/**
 * Reserva en sistema entradas_v2
 */
async function reservarEntradaV2({
  funcionId,
  vendedorCedula,
  compradorNombre,
  compradorTelefono
}) {
  try {
    // Buscar entrada disponible asignada al vendedor
    const entrada = await query(`
      UPDATE entradas_v2
      SET estado = 'reservada',
          reservante_nombre = $1,
          reservante_telefono = $2,
          reservada_at = NOW(),
          updated_at = NOW()
      WHERE id = (
        SELECT id FROM entradas_v2
        WHERE funcion_id = $3
          AND actor_cedula = $4
          AND estado = 'asignada'
        ORDER BY code
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `, [compradorNombre, compradorTelefono, funcionId, vendedorCedula]);

    if (entrada.rows.length === 0) {
      return {
        success: false,
        error: 'No hay entradas disponibles para este vendedor'
      };
    }

    // Registrar log
    await query(`
      INSERT INTO entradas_v2_logs (
        entrada_id, estado_anterior, estado_nuevo, accion, detalle, ejecutado_por
      ) VALUES ($1, 'asignada', 'reservada', 'reservar', $2, $3)
    `, [
      entrada.rows[0].id,
      `Reserva: ${compradorNombre}`,
      vendedorCedula
    ]);

    return {
      success: true,
      entrada: entrada.rows[0],
      sistema: 'entradas_v2'
    };
  } catch (error) {
    logger.error(`Error reservando entrada v2: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reserva en sistema tickets legacy
 */
async function reservarTicketLegacy({
  funcionId,
  vendedorCedula,
  compradorNombre,
  compradorTelefono
}) {
  try {
    // Obtener phone del vendedor
    const vendedor = await query(
      'SELECT phone FROM users WHERE cedula = $1',
      [vendedorCedula]
    );

    if (vendedor.rows.length === 0) {
      return {
        success: false,
        error: 'Vendedor no encontrado'
      };
    }

    const vendedorPhone = vendedor.rows[0].phone || vendedorCedula;

    // Buscar ticket disponible
    const ticket = await query(`
      UPDATE tickets
      SET estado = 'RESERVADO',
          comprador_nombre = $1,
          comprador_contacto = $2,
          reservado_at = NOW()
      WHERE code = (
        SELECT code FROM tickets
        WHERE funcion_id = $3
          AND vendedor_phone = $4
          AND estado = 'STOCK_ACTOR'
        ORDER BY code
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `, [compradorNombre, compradorTelefono, funcionId, vendedorPhone]);

    if (ticket.rows.length === 0) {
      return {
        success: false,
        error: 'No hay tickets disponibles para este vendedor'
      };
    }

    return {
      success: true,
      entrada: ticket.rows[0],
      sistema: 'tickets'
    };
  } catch (error) {
    logger.error(`Error reservando ticket legacy: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtiene estadísticas de una función (unificado)
 */
export async function obtenerEstadisticasFuncion(funcionId) {
  const sistema = await detectarSistemaFuncion(funcionId);

  if (sistema === 'entradas_v2') {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'sin_asignar') as disponibles,
        COUNT(*) FILTER (WHERE estado = 'asignada') as asignadas,
        COUNT(*) FILTER (WHERE estado = 'reservada') as reservadas,
        COUNT(*) FILTER (WHERE estado = 'pronta') as prontas,
        COUNT(*) FILTER (WHERE estado = 'pagada') as pagadas,
        COUNT(*) FILTER (WHERE estado = 'utilizada') as utilizadas,
        COUNT(*) as total
      FROM entradas_v2
      WHERE funcion_id = $1
    `, [funcionId]);

    return {
      sistema: 'entradas_v2',
      ...result.rows[0]
    };
  } else {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE estado = 'DISPONIBLE') as disponibles,
        COUNT(*) FILTER (WHERE estado = 'STOCK_ACTOR') as asignadas,
        COUNT(*) FILTER (WHERE estado = 'RESERVADO') as reservadas,
        COUNT(*) FILTER (WHERE estado = 'REPORTADA_VENDIDA') as prontas,
        COUNT(*) FILTER (WHERE estado = 'PAGADO') as pagadas,
        COUNT(*) FILTER (WHERE estado = 'USADO') as utilizadas,
        COUNT(*) as total
      FROM tickets
      WHERE funcion_id = $1
    `, [funcionId]);

    return {
      sistema: 'tickets',
      ...result.rows[0]
    };
  }
}

/**
 * Lista entradas por vendedor (unificado)
 */
export async function listarEntradasVendedor(vendedorCedula, funcionId = null) {
  // Obtener phone del vendedor
  const vendedor = await query(
    'SELECT phone FROM users WHERE cedula = $1',
    [vendedorCedula]
  );

  const vendedorPhone = vendedor.rows[0]?.phone || vendedorCedula;

  // Buscar en ambas tablas
  const entradasV2Query = funcionId
    ? 'SELECT *, \'entradas_v2\' as sistema FROM entradas_v2 WHERE actor_cedula = $1 AND funcion_id = $2 ORDER BY code'
    : 'SELECT *, \'entradas_v2\' as sistema FROM entradas_v2 WHERE actor_cedula = $1 ORDER BY funcion_id, code';
  
  const ticketsQuery = funcionId
    ? 'SELECT *, \'tickets\' as sistema FROM tickets WHERE vendedor_phone = $1 AND funcion_id = $2 ORDER BY code'
    : 'SELECT *, \'tickets\' as sistema FROM tickets WHERE vendedor_phone = $1 ORDER BY funcion_id, code';

  const params = funcionId ? [vendedorCedula, funcionId] : [vendedorCedula];
  const paramsPhone = funcionId ? [vendedorPhone, funcionId] : [vendedorPhone];

  const [resultV2, resultTickets] = await Promise.all([
    query(entradasV2Query, params),
    query(ticketsQuery, paramsPhone)
  ]);

  return {
    entradas_v2: resultV2.rows,
    tickets: resultTickets.rows,
    total: resultV2.rows.length + resultTickets.rows.length
  };
}

export default {
  detectarSistemaFuncion,
  reservarEntrada,
  obtenerEstadisticasFuncion,
  listarEntradasVendedor
};
