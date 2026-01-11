// 🎬 FUNCIONES HOY - Lógica específica
// Vista urgente con cards destacadas, sin modal "Ver detalles"

const PUBLIC_API_URL = '/api/public';

document.addEventListener('DOMContentLoaded', () => {
    initFecha();
    loadFuncionesHoy();
});

function initFecha() {
    const fechaElement = document.getElementById('fecha-hoy');
    if (!fechaElement) return;
    
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    fechaElement.textContent = today.toLocaleDateString('es-UY', options);
}

async function loadFuncionesHoy() {
    const container = document.getElementById('hoyGrid');
    const badge = document.getElementById('totalHoy');
    
    try {
        const response = await fetch(`${PUBLIC_API_URL}/funciones`);
        if (!response.ok) throw new Error('Error al cargar funciones');
        
        const data = await response.json();
        const funciones = Array.isArray(data) ? data : (data.funciones || []);
        
        // Filtrar solo de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const funcionesHoy = funciones.filter(f => {
            const fecha = new Date(f.fecha);
            return fecha >= today && fecha < tomorrow;
        });
        
        if (funcionesHoy.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-in">
                    <div class="empty-state__icon">🎭</div>
                    <h3 class="empty-state__title">El telón permanece cerrado hoy</h3>
                    <p class="empty-state__text">
                        No hay funciones programadas para hoy.
                    </p>
                </div>
            `;
            badge.textContent = '0 funciones hoy';
            return;
        }
        
        badge.textContent = `${funcionesHoy.length} ${funcionesHoy.length === 1 ? 'función' : 'funciones'} hoy`;
        
        // Renderizar grid de cards
        container.innerHTML = funcionesHoy.map((f, index) => renderHoyCard(f, index)).join('');
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="empty-state fade-in">
                <div class="empty-state__icon">⚠️</div>
                <h3 class="empty-state__title">Error al cargar las funciones</h3>
                <p class="empty-state__text">Por favor, intentá recargar la página</p>
                <button class="btn-primary" onclick="location.reload()">
                    <i class="fas fa-rotate"></i> Recargar
                </button>
            </div>
        `;
        badge.textContent = 'Error';
    }
}

function renderHoyCard(f, index) {
    const hora = f.hora || '20:00';
    const grupo = f.grupo_nombre || 'Grupo a confirmar';
    const sala = f.sala || 'Sala a confirmar';
    const obra = f.obra_nombre || 'Obra sin título';
    const precio = f.precio ? `$${Number(f.precio).toFixed(0)}` : '';
    const esProfesional = Boolean(f.es_profesional);
    const cupo = Number(f.entradas_disponibles || 0);
    
    const ctaText = esProfesional ? '🎟️ Comprar en Boletería' : '✨ Reservar Entrada';
    
    return `
        <div class="funcion-hoy-card fade-in" style="animation-delay: ${index * 0.15}s">
            <div class="funcion-hoy-badge">HOY</div>
            
            <div class="funcion-hoy-hora">${hora}</div>
            
            <h3 class="funcion-hoy-title">${escapeHtml(obra)}</h3>
            
            <div class="funcion-hoy-info">
                <div class="funcion-hoy-info-item">
                    <i class="fas fa-theater-masks"></i>
                    <span>${escapeHtml(grupo)}</span>
                </div>
                <div class="funcion-hoy-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(sala)}</span>
                </div>
                ${precio ? `
                <div class="funcion-hoy-info-item">
                    <i class="fas fa-ticket-alt"></i>
                    <span>${precio}</span>
                </div>
                ` : ''}
                ${cupo > 0 ? `
                <div class="funcion-hoy-info-item">
                    <i class="fas fa-chair"></i>
                    <span>${cupo} disponibles</span>
                </div>
                ` : ''}
            </div>
            
            <button class="funcion-hoy-cta" onclick="handleReservaHoy(${JSON.stringify(f.id || f.funcion_id || '')}, ${esProfesional})">
                ${ctaText}
            </button>
        </div>
    `;
}

async function handleReservaHoy(funcionId, esProfesional) {
    // Usar nuevo flujo unificado
    await iniciarFlujoReserva(funcionId, esProfesional);
}

function fFechaTxtFromId(_) {
    // Placeholder simple; el endpoint público no asegura detalle por id sin fetch adicional.
    // Mantener mensaje genérico hasta agregar detalle.
    return 'de hoy';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
