// 📅 PRÓXIMAS FUNCIONES - Lógica específica
// Vista Timeline elegante sin modal "Ver detalles"

const PUBLIC_API_URL = '/api/public';

// Debug en consola solamente (sin UI)
function debugLog(msg) {
    console.log(`[Próximas Funciones] ${msg}`);
}

document.addEventListener('DOMContentLoaded', () => {
    debugLog('[Próximas Funciones] DOM Cargado, iniciando carga...');
    debugLog('[Próximas Funciones] iniciarFlujoReserva disponible: ' + (typeof window.iniciarFlujoReserva === 'function' ? 'SI' : 'NO'));
    debugLog('[Próximas Funciones] reservaFlujoLoaded: ' + (window.reservaFlujoLoaded ? 'SI' : 'NO'));
    loadProximasFunciones();
});

async function loadProximasFunciones() {
    debugLog('[Próximas Funciones] loadProximasFunciones() iniciada');
    const container = document.getElementById('proximasTimeline');
    const badge = document.getElementById('totalProximas');
    
    debugLog('[Próximas Funciones] Container: ' + (container ? 'OK' : 'NULL'));
    debugLog('[Próximas Funciones] Badge: ' + (badge ? 'OK' : 'NULL'));
    
    try {
        debugLog('[Próximas Funciones] Haciendo fetch a: ' + `${PUBLIC_API_URL}/funciones`);
        const response = await fetch(`${PUBLIC_API_URL}/funciones`);
        debugLog('[Próximas Funciones] Response status: ' + response.status);
        
        if (!response.ok) throw new Error('Error al cargar funciones');
        
        const data = await response.json();
        debugLog('[Próximas Funciones] Data recibida: ' + data.length + ' funciones');
        
        const funciones = Array.isArray(data) ? data : (data.funciones || []);
        debugLog('[Próximas Funciones] Funciones parseadas: ' + funciones.length);
        
        // Filtrar futuras y ordenar
        const now = new Date();
        debugLog('[Próximas Funciones] Fecha actual: ' + now.toISOString());
        
        const proximas = funciones
            .filter(f => {
                const fechaFuncion = new Date(f.fecha);
                const esFutura = fechaFuncion >= now;
                debugLog(`[Próximas Funciones] Función ${f.id}: ${f.fecha} -> ${esFutura ? 'FUTURA' : 'PASADA'}`);
                return esFutura;
            })
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        debugLog('[Próximas Funciones] Funciones futuras: ' + proximas.length);
        
        if (proximas.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-in">
                    <div class="empty-state__icon">🌙</div>
                    <h3 class="empty-state__title">No hay funciones publicadas</h3>
                    <p class="empty-state__text">
                        El telón está cerrado por ahora. Volvé pronto para ver nuevas fechas.
                    </p>
                    <a href="/funciones-hoy.html" class="btn-primary">
                        <i class="fas fa-calendar-day"></i> Ver funciones de hoy
                    </a>
                </div>
            `;
            badge.textContent = '0 funciones';
            return;
        }
        
        badge.textContent = `${proximas.length} ${proximas.length === 1 ? 'función' : 'funciones'}`;
        
        // Renderizar timeline
        container.innerHTML = proximas.map((f, index) => renderTimelineItem(f, index)).join('');
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="empty-state fade-in">
                <div class="empty-state__icon">⚠️</div>
                <h3 class="empty-state__title">Error al cargar la cartelera</h3>
                <p class="empty-state__text">Por favor, intentá recargar la página</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-rotate"></i> Recargar
                </button>
            </div>
        `;
        badge.textContent = 'Error';
    }
}

function renderTimelineItem(f, index) {
    const fecha = new Date(f.fecha);
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-UY', { month: 'short' }).toUpperCase();
    const hora = f.hora || '20:00';
    
    const grupo = f.grupo_nombre || 'Grupo a confirmar';
    const sala = f.sala || 'Sala a confirmar';
    const obra = f.obra_nombre || 'Obra sin título';
    const descripcion = f.descripcion || '';
    const precio = f.precio ? `$${Number(f.precio).toFixed(0)}` : '';
    const esProfesional = Boolean(f.es_profesional);
    const cupo = Number(f.entradas_disponibles || 0);
    
    const ctaText = esProfesional ? 'Comprar en Boletería' : 'Reservar Entrada';
    const ctaIcon = esProfesional ? 'fa-ticket' : 'fa-calendar-check';
    
    return `
        <div class="funcion-timeline-item fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="funcion-timeline-header">
                <h3 class="funcion-timeline-title">${escapeHtml(obra)}</h3>
                <div class="funcion-timeline-date">
                    <div class="funcion-date-day">${dia}</div>
                    <div class="funcion-date-month">${mes}</div>
                </div>
            </div>
            
            <div class="funcion-timeline-meta">
                <div class="funcion-meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${hora} hs</span>
                </div>
                <div class="funcion-meta-item">
                    <i class="fas fa-theater-masks"></i>
                    <span>${escapeHtml(grupo)}</span>
                </div>
                <div class="funcion-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(sala)}</span>
                </div>
                ${cupo > 0 ? `
                <div class="funcion-meta-item">
                    <i class="fas fa-chair"></i>
                    <span>${cupo} disponibles</span>
                </div>
                ` : ''}
            </div>
            
            ${descripcion ? `
            <p class="funcion-timeline-desc">${escapeHtml(descripcion)}</p>
            ` : ''}
            
            <div class="funcion-timeline-footer">
                ${precio ? `<div class="funcion-precio">${precio}</div>` : '<div></div>'}
                <button class="btn-reservar" onclick="handleReserva('${String(f.id || f.funcion_id || '')}', ${esProfesional}, '${String(f.fecha || '')}')">
                    <i class="fas ${ctaIcon}"></i>
                    ${ctaText}
                </button>
            </div>
        </div>
    `;
}

async function handleReserva(funcionId, esProfesional, fechaIso) {
    // Validar funcionId
    if (!funcionId || funcionId === '' || funcionId === 'undefined') {
        debugLog('[Próximas Funciones] ERROR: funcionId inválido: ' + funcionId);
        alert('⚠️ Error: Función no válida. Por favor, recarga la página.');
        return;
    }
    
    // Verificar que la función esté disponible
    if (typeof window.iniciarFlujoReserva !== 'function') {
        debugLog('[Próximas Funciones] ERROR: iniciarFlujoReserva no está definida');
        alert('Error al iniciar reserva. Por favor, recarga la página.');
        return;
    }
    
    debugLog('[Próximas Funciones] Iniciando reserva para función: ' + funcionId);
    // Usar nuevo flujo unificado
    await window.iniciarFlujoReserva(funcionId, esProfesional, fechaIso);
}

function fFecha(f) {
    try { return new Date(f.fecha); } catch { return new Date(); }
}
function fechaTextoCorta(d) {
    try { return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }); } catch { return ''; }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
