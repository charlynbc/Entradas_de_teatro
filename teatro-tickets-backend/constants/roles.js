/**
 * Constantes de roles del sistema
 * Centraliza los roles para evitar magic strings y facilitar mantenimiento
 */

export const ROLES = {
  SUPER: 'SUPER',
  ADMIN: 'ADMIN',
  ACTOR: 'ACTOR',
  VENDEDOR: 'VENDEDOR', // Alias de ACTOR
  INVITADO: 'INVITADO'
};

/**
 * Helper para validar si un rol existe
 */
export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

/**
 * Helper para obtener todos los roles
 */
export function getAllRoles() {
  return Object.values(ROLES);
}

/**
 * Roles con permisos administrativos
 */
export const ADMIN_ROLES = [ROLES.SUPER, ROLES.ADMIN];

/**
 * Roles que pueden vender tickets
 */
export const SELLER_ROLES = [ROLES.SUPER, ROLES.ADMIN, ROLES.ACTOR, ROLES.VENDEDOR];

/**
 * Todos los roles autenticados (excepto invitado)
 */
export const AUTHENTICATED_ROLES = [ROLES.SUPER, ROLES.ADMIN, ROLES.ACTOR, ROLES.VENDEDOR];
