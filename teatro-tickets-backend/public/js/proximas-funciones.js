// Página pública independiente: Próximas Funciones
// Reglas: sin login, sin acciones, solo GET /api/funciones/publicas

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadProximasFunciones();
});

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;
        nav.style.background = 'linear-gradient(135deg, #370617, #6A040F)';
    });
}

async function loadProximasFunciones() {
    const grid = document.getElementById('proximas-funciones-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/funciones/publicas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const funciones = Array.isArray(data) ? data : (data.funciones || []);

        if (!Array.isArray(funciones) || funciones.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-calendar-times"></i>
                    <h3>🌙 No hay funciones publicadas</h3>
                    <p>Volvé pronto para ver nuevas fechas</p>
                </div>
            `;
            return;
        }

        const ordenadas = funciones
            .slice()
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        grid.innerHTML = '';
        ordenadas.forEach(f => grid.appendChild(createCard(f)));
    } catch (error) {
        console.error('Error cargando próximas funciones:', error);
        grid.innerHTML = `
            <div class="no-funciones">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>⚠️ No pudimos cargar la cartelera</h3>
                <p>Por favor, intenta recargar la página</p>
            </div>
        `;
    }
}

function createCard(funcion) {
    const card = document.createElement('div');
    card.className = 'funcion-card';

    const fecha = new Date(funcion.fecha);
    const fechaStr = fecha.toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const horaStr = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

    const precio = Number(funcion.precio_base);
    const showPrecio = Number.isFinite(precio) && precio > 0;

    card.innerHTML = `
        <div class="funcion-header">
            <h3 class="funcion-title">${escapeHtml(funcion.obra_nombre || 'Obra sin título')}</h3>
            <div class="funcion-date">
                <i class="fas fa-calendar-alt"></i>
                <span>${escapeHtml(fechaStr)}</span>
            </div>
            <div class="funcion-date">
                <i class="fas fa-clock"></i>
                <span>${escapeHtml(horaStr)}</span>
            </div>
        </div>
        <div class="funcion-body">
            <div class="funcion-info">
                <div class="info-item">
                    <i class="fas fa-masks-theater"></i>
                    <span>${escapeHtml(funcion.grupo_nombre || 'Grupo a confirmar')}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(funcion.lugar || 'Lugar a confirmar')}</span>
                </div>
            </div>
            ${showPrecio ? `
            <div class="funcion-price">
                <i class="fas fa-ticket-alt"></i> $${escapeHtml(formatPrice(precio))}
            </div>
            ` : ''}
        </div>
        <div class="funcion-footer">
            <a class="btn-reservar" href="/guia.html">
                <i class="fas fa-info-circle"></i> Cómo comprar entradas
            </a>
        </div>
    `;

    return card;
}

function formatPrice(value) {
    try {
        return new Intl.NumberFormat('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    } catch {
        return String(value);
    }
}

function escapeHtml(text) {
    return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
