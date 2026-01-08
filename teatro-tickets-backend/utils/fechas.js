/**
 * Utilidades para formato de fechas DD/MM/YYYY
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
 * Formatea fecha y hora juntas
 * @param {Date|string} fecha - Fecha
 * @param {string} hora - Hora
 * @returns {string} "DD/MM/YYYY HH:MM"
 */
export function formatearFechaHora(fecha, hora) {
  const fechaStr = formatearFecha(fecha);
  const horaStr = formatearHora(hora);
  
  if (!fechaStr && !horaStr) return '';
  if (!horaStr) return fechaStr;
  if (!fechaStr) return horaStr;
  
  return `${fechaStr} ${horaStr}`;
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
 * Verifica si hoy es cumpleaños de alguien
 * @param {Date|string} fechaNacimiento - Fecha de nacimiento
 * @returns {boolean} true si hoy es su cumpleaños
 */
export function esCumpleanosHoy(fechaNacimiento) {
  if (!fechaNacimiento) return false;
  
  const nacimiento = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento);
  const hoy = new Date();
  
  return nacimiento.getDate() === hoy.getDate() && 
         nacimiento.getMonth() === hoy.getMonth();
}

/**
 * Formatea solo día y mes (para cumpleaños)
 * @param {Date|string} fecha - Fecha
 * @returns {string} "DD/MM"
 */
export function formatearDiaMes(fecha) {
  if (!fecha) return '';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  
  return `${dia}/${mes}`;
}

/**
 * Convierte fecha ISO a objeto Date (para trabajar en frontend)
 * @param {string} isoDate - Fecha en formato ISO YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
export function parseISO(isoDate) {
  if (!isoDate) return null;
  return new Date(isoDate + 'T00:00:00');
}

/**
 * Valida formato DD/MM/YYYY
 * @param {string} fechaStr - Fecha a validar
 * @returns {boolean} true si es válida
 */
export function validarFormatoFecha(fechaStr) {
  if (!fechaStr) return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = fechaStr.match(regex);
  
  if (!match) return false;
  
  const [, dia, mes, anio] = match;
  const fecha = new Date(anio, mes - 1, dia);
  
  return fecha.getDate() === parseInt(dia) &&
         fecha.getMonth() === parseInt(mes) - 1 &&
         fecha.getFullYear() === parseInt(anio);
}

/**
 * Obtiene fecha actual en formato DD/MM/YYYY
 * @returns {string} Fecha actual
 */
export function fechaActual() {
  return formatearFecha(new Date());
}

/**
 * Obtiene hora actual en formato HH:MM
 * @returns {string} Hora actual
 */
export function horaActual() {
  return formatearHora(new Date());
}

/**
 * Formatea fecha para SQL (YYYY-MM-DD)
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato SQL
 */
export function formatearParaSQL(fecha) {
  if (!fecha) return null;
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return null;
  
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  
  return `${anio}-${mes}-${dia}`;
}
