/**
 * TICKET STATES
 * 
 * Estados posibles de un ticket en el sistema.
 * Definiciones centralizadas (Single Source of Truth)
 * 
 * Flujo típico: DISPONIBLE → RESERVADO → REPORTADA_VENDIDA → PAGADO → USADO
 */

export const TICKET_STATES = {
  DISPONIBLE: 'DISPONIBLE',
  RESERVADO: 'RESERVADO',
  REPORTADA_VENDIDA: 'REPORTADA_VENDIDA',
  PAGADO: 'PAGADO',
  USADO: 'USADO',
  ANULADO: 'ANULADO'
};

/**
 * TICKET ORIGINS
 * 
 * Origen de la venta del ticket
 * - ACTOR: vendedor independiente registró la venta
 * - ONLINE: comprador directo en plataforma pública
 * - CORTESIA: administrador asignó como cortesía
 */
export const TICKET_ORIGINS = {
  ACTOR: 'ACTOR',
  ONLINE: 'ONLINE',
  CORTESIA: 'CORTESIA'
};

/**
 * ROLES
 * 
 * Roles de usuario en el sistema
 */
export const ROLES = {
  SUPER: 'SUPER',
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  ACTOR: 'ACTOR',
  VENDEDOR: 'VENDEDOR',
  INVITADO: 'INVITADO'
};

/**
 * ROLES QUE PUEDEN APROBAR PAGOS
 */
export const PAYMENT_APPROVAL_ROLES = [
  ROLES.SUPER,
  ROLES.ADMIN,
  ROLES.DIRECTOR
];

/**
 * ROLES QUE PUEDEN VALIDAR ENTRADA
 */
export const VALIDATION_ROLES = [
  ROLES.SUPER,
  ROLES.ADMIN
];

/**
 * ROLES QUE PUEDEN ANULAR TICKETS
 */
export const ANNULATE_ROLES = [
  ROLES.SUPER,
  ROLES.ADMIN
];
