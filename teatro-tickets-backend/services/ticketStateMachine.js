/**
 * Máquina de Estados de Tickets
 * Define las transiciones válidas entre estados de tickets
 * Centraliza la lógica de validación de cambios de estado
 */

import { logger } from '../utils/logger.js';

/**
 * Estados posibles de un ticket
 */
export const TICKET_STATES = {
  DISPONIBLE: 'DISPONIBLE',
  STOCK_ACTOR: 'STOCK_ACTOR',
  STOCK_VENDEDOR: 'STOCK_VENDEDOR', // Alias de STOCK_ACTOR (compatibilidad)
  RESERVADO: 'RESERVADO',
  REPORTADA_VENDIDA: 'REPORTADA_VENDIDA',
  PAGADO: 'PAGADO',
  USADO: 'USADO',
  ANULADO: 'ANULADO'
};

/**
 * Transiciones válidas entre estados
 * Estructura: { estadoActual: [estadosPermitidos] }
 */
export const TICKET_TRANSITIONS = {
  DISPONIBLE: [
    TICKET_STATES.STOCK_ACTOR,
    TICKET_STATES.STOCK_VENDEDOR,
    TICKET_STATES.ANULADO
  ],
  STOCK_ACTOR: [
    TICKET_STATES.RESERVADO,
    TICKET_STATES.REPORTADA_VENDIDA,
    TICKET_STATES.DISPONIBLE, // Devolver al pool
    TICKET_STATES.ANULADO
  ],
  STOCK_VENDEDOR: [
    TICKET_STATES.RESERVADO,
    TICKET_STATES.REPORTADA_VENDIDA,
    TICKET_STATES.DISPONIBLE,
    TICKET_STATES.ANULADO
  ],
  RESERVADO: [
    TICKET_STATES.REPORTADA_VENDIDA,
    TICKET_STATES.STOCK_ACTOR, // Cancelar reserva
    TICKET_STATES.ANULADO
  ],
  REPORTADA_VENDIDA: [
    TICKET_STATES.PAGADO, // Director cobra
    TICKET_STATES.ANULADO
  ],
  PAGADO: [
    TICKET_STATES.USADO, // Validar en puerta
    TICKET_STATES.ANULADO
  ],
  USADO: [
    // Estado final - no puede cambiar (excepto anulación administrativa)
    TICKET_STATES.ANULADO
  ],
  ANULADO: [
    // Estado final - no puede cambiar
  ]
};

/**
 * Tipos de movimientos para auditoría
 */
export const MOVEMENT_TYPES = {
  ASIGNACION: 'ASIGNACION',
  RESERVA: 'RESERVA',
  VENTA_REPORTADA: 'VENTA_REPORTADA',
  PAGO_APROBADO: 'PAGO_APROBADO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  ANULACION: 'ANULACION',
  VALIDACION: 'VALIDACION',
  DEVOLUCION: 'DEVOLUCION' // Devolver al pool
};

/**
 * Valida si una transición de estado es permitida
 * @param {string} currentState - Estado actual del ticket
 * @param {string} newState - Estado al que se quiere transicionar
 * @returns {boolean} - true si la transición es válida
 */
export function canTransition(currentState, newState) {
  // Validar que los estados existan
  if (!TICKET_STATES[currentState]) {
    logger.warn(`Estado actual inválido: ${currentState}`);
    return false;
  }
  
  if (!TICKET_STATES[newState]) {
    logger.warn(`Estado destino inválido: ${newState}`);
    return false;
  }

  // Mismo estado - no es error, simplemente no hacer nada
  if (currentState === newState) {
    return true;
  }

  // Validar transición
  const allowedStates = TICKET_TRANSITIONS[currentState] || [];
  return allowedStates.includes(newState);
}

/**
 * Obtiene las transiciones válidas para un estado dado
 * @param {string} currentState - Estado actual
 * @returns {string[]} - Array de estados permitidos
 */
export function getValidTransitions(currentState) {
  return TICKET_TRANSITIONS[currentState] || [];
}

/**
 * Valida si un estado es final (no puede cambiar más)
 * @param {string} state - Estado a validar
 * @returns {boolean} - true si es estado final
 */
export function isFinalState(state) {
  const transitions = TICKET_TRANSITIONS[state] || [];
  return transitions.length === 0 || 
         (transitions.length === 1 && transitions[0] === TICKET_STATES.ANULADO);
}

/**
 * Obtiene el tipo de movimiento según la transición
 * @param {string} fromState - Estado origen
 * @param {string} toState - Estado destino
 * @returns {string} - Tipo de movimiento para auditoría
 */
export function getMovementType(fromState, toState) {
  // Mapeo de transiciones a tipos de movimiento
  if (toState === TICKET_STATES.STOCK_ACTOR || toState === TICKET_STATES.STOCK_VENDEDOR) {
    if (fromState === TICKET_STATES.DISPONIBLE) {
      return MOVEMENT_TYPES.ASIGNACION;
    }
    if (fromState === TICKET_STATES.RESERVADO) {
      return MOVEMENT_TYPES.DEVOLUCION;
    }
  }
  
  if (toState === TICKET_STATES.RESERVADO) {
    return MOVEMENT_TYPES.RESERVA;
  }
  
  if (toState === TICKET_STATES.REPORTADA_VENDIDA) {
    return MOVEMENT_TYPES.VENTA_REPORTADA;
  }
  
  if (toState === TICKET_STATES.PAGADO) {
    return MOVEMENT_TYPES.PAGO_APROBADO;
  }
  
  if (toState === TICKET_STATES.USADO) {
    return MOVEMENT_TYPES.VALIDACION;
  }
  
  if (toState === TICKET_STATES.ANULADO) {
    return MOVEMENT_TYPES.ANULACION;
  }
  
  if (toState === TICKET_STATES.DISPONIBLE) {
    return MOVEMENT_TYPES.DEVOLUCION;
  }
  
  return 'CAMBIO_ESTADO';
}

/**
 * Valida la transición y devuelve un objeto con el resultado
 * @param {string} currentState - Estado actual
 * @param {string} newState - Estado destino
 * @returns {Object} - { valid: boolean, error?: string, movementType?: string }
 */
export function validateTransition(currentState, newState) {
  // Mismo estado
  if (currentState === newState) {
    return {
      valid: true,
      movementType: null,
      message: 'El ticket ya está en ese estado'
    };
  }

  // Validar que los estados existan
  if (!TICKET_STATES[currentState]) {
    return {
      valid: false,
      error: `Estado actual inválido: ${currentState}`
    };
  }

  if (!TICKET_STATES[newState]) {
    return {
      valid: false,
      error: `Estado destino inválido: ${newState}`
    };
  }

  // Validar transición
  if (!canTransition(currentState, newState)) {
    const allowed = getValidTransitions(currentState);
    return {
      valid: false,
      error: `Transición no permitida de ${currentState} a ${newState}. Estados permitidos: ${allowed.join(', ')}`,
      allowedStates: allowed
    };
  }

  return {
    valid: true,
    movementType: getMovementType(currentState, newState)
  };
}

/**
 * Obtiene un resumen de la máquina de estados (útil para debugging/docs)
 */
export function getStateMachineSummary() {
  return {
    states: Object.values(TICKET_STATES),
    transitions: TICKET_TRANSITIONS,
    finalStates: Object.values(TICKET_STATES).filter(isFinalState),
    movementTypes: Object.values(MOVEMENT_TYPES)
  };
}
