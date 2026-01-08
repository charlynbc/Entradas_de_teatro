// ========================================
// BACO TEATRO - FUNCIONES PÚBLICAS (INVITADOS)
// Sin autenticación, sin acciones de compra/reserva
// ========================================

const PUBLIC_API_URL = '/public';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupNavigation();
    
    // Detectar página actual y cargar datos correspondientes
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('funciones-hoy')) {
        // Página de funciones de hoy - cargar solo hoy
        loadFuncionesHoy();
    } else if (currentPage.includes('proximas-funciones')) {
        // Página de próximas funciones - cargar solo futuras
        loadProximasFunciones();
    } else {
        // Página original funciones.html - cargar ambas
        loadFuncionesHoy();
        loadProximasFunciones();
    }
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

    // Navbar background on scroll (mantiene comportamiento actual)
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;
        nav.style.background = 'linear-gradient(135deg, #370617, #6A040F)';
    });
}

function initializeApp() {
    const fechaElement = document.getElementById('fecha-hoy');
    if (!fechaElement) return;

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    fechaElement.textContent = today.toLocaleDateString('es-UY', options);
}

async function fetchFuncionesPublicas() {
    const response = await fetch(`${PUBLIC_API_URL}/funciones`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.funciones || []);
}

async function loadFuncionesHoy() {
    const grid = document.getElementById('funciones-hoy-grid');
    if (!grid) return;

    try {
        const funciones = await fetchFuncionesPublicas();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const funcionesHoy = funciones.filter(f => {
            const fecha = new Date(f.fecha);
            return fecha >= today && fecha < tomorrow;
        });

        if (funcionesHoy.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-theater-masks"></i>
                    <h3>🎭 El telón permanece cerrado hoy</h3>
                    <p>No hay funciones programadas para hoy</p>
                    <a href="proximas-funciones.html" class="btn btn-outline">✨ Ver próximas funciones</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        funcionesHoy.forEach(f => grid.appendChild(createFuncionCard(f)));
    } catch (error) {
        console.error('Error loading funciones hoy:', error);
        grid.innerHTML = `
            <div class="no-funciones">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>⚠️ No pudimos cargar la cartelera</h3>
                <p>Por favor, intenta recargar la página</p>
            </div>
        `;
    }
}

async function loadProximasFunciones() {
    const grid = document.getElementById('proximas-grid');
    if (!grid) return;

    try {
        const funciones = await fetchFuncionesPublicas();

        const now = new Date();
        const proximas = funciones
            .filter(f => new Date(f.fecha) >= now)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (proximas.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-calendar-times"></i>
                    <h3>🌙 No hay funciones publicadas</h3>
                    <p>Volvé pronto para ver nuevas fechas</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        proximas.forEach(f => grid.appendChild(createFuncionCard(f)));
    } catch (error) {
        console.error('Error loading próximas funciones:', error);
        grid.innerHTML = `
            <div class="no-funciones">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>⚠️ No pudimos cargar la cartelera</h3>
                <p>Por favor, intenta recargar la página</p>
            </div>
        `;
    }
}

function createFuncionCard(funcion) {
    const card = document.createElement('div');
    card.className = 'funcion-card';
    card.onclick = () => showFuncionDetail(funcion);

    const fecha = new Date(funcion.fecha);
    const fechaStr = fecha.toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    // Usar la hora directamente del objeto función
    const horaStr = funcion.hora || '20:00';

    const precio = Number(funcion.precio);
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
                    <span>${escapeHtml(funcion.sala || 'Sala a confirmar')}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-ticket-alt"></i>
                    <span>${escapeHtml(funcion.estado || 'Disponible')}</span>
                </div>
            </div>
            ${showPrecio ? `
            <div class="funcion-price">
                <i class="fas fa-ticket-alt"></i> $${escapeHtml(formatPrice(precio))}
            </div>
            ` : ''}
        </div>
        <div class="funcion-footer">
            <button class="btn-reservar" onclick="event.stopPropagation(); showFuncionDetail(${safeJson(funcion)})">
                <i class="fas fa-hand-pointer"></i> Ver Detalles
            </button>
        </div>
    `;

    return card;
}

function showFuncionDetail(funcion) {
    const modal = document.getElementById('funcionModal');
    const content = document.getElementById('funcionModalContent');
    if (!modal || !content) return;

    const fecha = new Date(funcion.fecha);
    const fechaStr = fecha.toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const horaStr = fecha.toLocaleTimeString('es-UY', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const precio = Number(funcion.precio);
    const showPrecio = Number.isFinite(precio) && precio > 0;

    content.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">${escapeHtml(funcion.obra_nombre || 'Obra sin título')}</h2>
            <p class="modal-subtitle">${escapeHtml(funcion.grupo_nombre || '')}</p>
        </div>

        <div class="modal-body">
            <div class="detail-grid">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <h4>Fecha</h4>
                        <p>${escapeHtml(fechaStr)}</p>
                    </div>
                </div>

                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h4>Hora</h4>
                        <p>${escapeHtml(horaStr)}</p>
                    </div>
                </div>

                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <h4>Sala</h4>
                        <p>${escapeHtml(funcion.sala || 'A confirmar')}</p>
                    </div>
                </div>

                <div class="detail-item">
                    <i class="fas fa-ticket-alt"></i>
                    <div>
                        <h4>Estado</h4>
                        <p>${escapeHtml(funcion.estado || 'Disponible')}</p>
                    </div>
                </div>

                ${showPrecio ? `
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <h4>Precio</h4>
                        <p>$${escapeHtml(formatPrice(precio))}</p>
                    </div>
                </div>
                ` : ''}
            </div>

            <div id="vendedores-section"></div>
        </div>
    `;

    modal.classList.add('active');

    // Cargar vendedores públicos (sin login) y mostrar sección solo si hay
    loadVendedoresPublicos(funcion).catch(err => {
        console.error('Error cargando vendedores públicos:', err);
    });
}

function closeFuncionModal() {
    const modal = document.getElementById('funcionModal');
    modal?.classList.remove('active');
}

function closeReservaModal() {
    const modal = document.getElementById('reservaModal');
    modal?.classList.remove('active');
}

async function loadVendedoresPublicos(funcion) {
    const container = document.getElementById('vendedores-section');
    if (!container) return;

    const funcionId = funcion?.id;
    if (!funcionId) return;

    const response = await fetch(`${PUBLIC_API_URL}/funciones/${encodeURIComponent(funcionId)}/vendedores`);
    if (!response.ok) {
        // No mostramos sección si falla
        return;
    }
    const data = await response.json();
    const vendedores = Array.isArray(data) ? data : (data.vendedores || []);
    if (!Array.isArray(vendedores) || vendedores.length === 0) {
        // Requisito: solo mostrar si hay vendedores
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="elenco-section">
            <h3><i class="fas fa-users"></i> Contactar vendedores</h3>
            <p class="elenco-help">Contactá directamente a un vendedor para consultar por entradas</p>
            <div class="elenco-grid">
                ${vendedores.map(v => renderVendedorCard(v, funcion)).join('')}
            </div>
        </div>
    `;
}

function renderVendedorCard(vendedor, funcion) {
    const nombre = vendedor?.nombre || 'Vendedor';
    const contacto = vendedor?.contacto_publico || '';
    const waLink = buildWhatsAppLink(contacto, funcion, nombre);
    if (!waLink) return '';

    return `
        <div class="actor-card" onclick="window.open('${escapeHtml(waLink)}','_blank')">
            <div class="actor-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="actor-info">
                <h4>${escapeHtml(nombre)}</h4>
                <p class="actor-role">Vendedor</p>
            </div>
            <button class="btn-contactar" onclick="event.stopPropagation(); window.open('${escapeHtml(waLink)}','_blank')">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
        </div>
    `;
}

function buildWhatsAppLink(rawPhone, funcion, vendedorNombre) {
    const phone = String(rawPhone || '').replace(/\D/g, '');
    if (!phone) return null;

    const fecha = new Date(funcion?.fecha);
    const fechaStr = Number.isFinite(fecha.getTime())
        ? fecha.toLocaleDateString('es-UY', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : '';
    const horaStr = Number.isFinite(fecha.getTime())
        ? fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
        : '';

    const obra = funcion?.obra_nombre || '';

    const msg = `Hola ${vendedorNombre}!\n\nVi la función "${obra}" (${fechaStr} ${horaStr}).\n¿Me podés pasar info de cómo conseguir entradas?\n\nGracias.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Helpers
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

function safeJson(obj) {
    // JSON en atributo onclick: evita romper el HTML por comillas
    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
