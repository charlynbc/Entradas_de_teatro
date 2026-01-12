/**
 * Utilidades para manejo de fechas y horas
 * Uso: incluir en HTML antes de scripts que lo necesiten
 */

/**
 * Formatea una fecha en formato legible
 * @param {string|Date} fecha - Fecha a formatear
 * @param {boolean} incluirAnio - Si debe incluir el año
 * @returns {string} Fecha formateada (ej: "Lun 12 Ene" o "Lun 12 Ene 2026")
 */
function formatearFecha(fecha, incluirAnio = false) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }

        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const diaSemana = dias[date.getDay()];
        const dia = date.getDate();
        const mes = meses[date.getMonth()];
        const anio = date.getFullYear();
        
        if (incluirAnio) {
            return `${diaSemana} ${dia} ${mes} ${anio}`;
        }
        
        return `${diaSemana} ${dia} ${mes}`;
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Error en fecha';
    }
}

/**
 * Formatea una hora desde fecha/timestamp
 * @param {string|Date} fecha - Fecha con hora
 * @returns {string} Hora formateada (ej: "20:00")
 */
function formatearHora(fecha) {
    if (!fecha) return '--:--';
    
    try {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(date.getTime())) {
            return '--:--';
        }
        
        const horas = date.getHours().toString().padStart(2, '0');
        const minutos = date.getMinutes().toString().padStart(2, '0');
        
        return `${horas}:${minutos}`;
    } catch (error) {
        console.error('Error al formatear hora:', error);
        return '--:--';
    }
}

/**
 * Verifica si una fecha está en el futuro
 * @param {string|Date} fecha - Fecha a verificar
 * @returns {boolean} true si es futura
 */
function esFuturo(fecha) {
    if (!fecha) return false;
    
    try {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(date.getTime())) {
            return false;
        }
        
        return date.getTime() > Date.now();
    } catch (error) {
        console.error('Error al verificar si es futuro:', error);
        return false;
    }
}

/**
 * Formatea fecha completa con hora
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha y hora formateadas (ej: "Lun 12 Ene 2026 - 20:00")
 */
function formatearFechaHora(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    const fechaStr = formatearFecha(fecha, true);
    const horaStr = formatearHora(fecha);
    
    return `${fechaStr} - ${horaStr}`;
}

/**
 * Obtiene el tiempo relativo (ej: "en 2 días", "hace 3 horas")
 * @param {string|Date} fecha - Fecha a comparar
 * @returns {string} Tiempo relativo
 */
function tiempoRelativo(fecha) {
    if (!fecha) return '';
    
    try {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const ahora = Date.now();
        const diff = date.getTime() - ahora;
        const diffAbs = Math.abs(diff);
        
        const segundos = Math.floor(diffAbs / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        
        const esFuturo = diff > 0;
        const prefijo = esFuturo ? 'en' : 'hace';
        
        if (dias > 0) {
            return `${prefijo} ${dias} día${dias !== 1 ? 's' : ''}`;
        } else if (horas > 0) {
            return `${prefijo} ${horas} hora${horas !== 1 ? 's' : ''}`;
        } else if (minutos > 0) {
            return `${prefijo} ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        } else {
            return esFuturo ? 'ahora mismo' : 'recién';
        }
    } catch (error) {
        console.error('Error al calcular tiempo relativo:', error);
        return '';
    }
}

/**
 * Verifica si una fecha es hoy
 * @param {string|Date} fecha - Fecha a verificar
 * @returns {boolean} true si es hoy
 */
function esHoy(fecha) {
    if (!fecha) return false;
    
    try {
        const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
        
        if (isNaN(date.getTime())) {
            return false;
        }
        
        const hoy = new Date();
        
        return date.getDate() === hoy.getDate() &&
               date.getMonth() === hoy.getMonth() &&
               date.getFullYear() === hoy.getFullYear();
    } catch (error) {
        console.error('Error al verificar si es hoy:', error);
        return false;
    }
}

// Exportar funciones (para módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatearFecha,
        formatearHora,
        formatearFechaHora,
        esFuturo,
        esHoy,
        tiempoRelativo
    };
}
