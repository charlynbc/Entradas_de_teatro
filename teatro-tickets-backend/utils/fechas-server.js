/**
 * Utilidades para formato de fechas DD/MM/YYYY - SERVIDOR
 * Sistema BACO - Formato latinoamericano
 */

/**
 * Formatea una fecha a DD/MM/YYYY
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
export function formatearFecha(fecha) {
  if (!fecha) return '';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea una hora a HH:MM
 * @param {string|Date} hora - Hora a formatear
 * @returns {string} Hora en formato HH:MM
 */
export function formatearHora(hora) {
  if (!hora) return '';
  
  // Si viene como string HH:MM:SS, extraer solo HH:MM
  if (typeof hora === 'string' && hora.includes(':')) {
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  
  const date = hora instanceof Date ? hora : new Date(hora);
  
  if (isNaN(date.getTime())) return '';
  
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  
  return `${horas}:${minutos}`;
}

/**
 * Calcula edad desde fecha de nacimiento
 * @param {Date|string} fechaNacimiento - Fecha de nacimiento
 * @returns {number} Edad en años
 */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0;
  
  const nacimiento = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento);
  const hoy = new Date();
  
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

/**
 * Convierte DD/MM/YYYY a formato ISO (YYYY-MM-DD) para base de datos
 * @param {string} fechaStr - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato ISO YYYY-MM-DD
 */
export function convertirAISO(fechaStr) {
  if (!fechaStr) return null;
  
  const parts = fechaStr.split('/');
  if (parts.length !== 3) return null;
  
  const [dia, mes, anio] = parts;
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}
