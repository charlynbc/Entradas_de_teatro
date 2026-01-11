// ========================================
// BACO TEATRO - FUNCIONES PÚBLICAS (INVITADOS)
// Sin autenticación, sin acciones de compra/reserva
// ========================================

const PUBLIC_API_URL = '/public';
const MP_FALLBACK_LINK = '/pages/boleteria/index.html';
const reservasCache = new Map();
let reservaContext = { funcion: null, vendedor: null };

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupNavigation();

    // Cargar según elementos presentes (robusto a rutas alternativas)
    if (document.getElementById('funciones-hoy-grid')) {
        loadFuncionesHoy();
    }
    if (document.getElementById('proximas-grid')) {
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

    const esProfesional = Boolean(funcion.es_profesional);
    const cupo = Number(funcion.entradas_disponibles || 0);
    const descripcion = truncate(funcion.descripcion || '', 160);

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
                ${esProfesional ? `
                <div class="info-item">
                    <i class="fas fa-chair"></i>
                    <span>${cupo > 0 ? `${cupo} entradas disponibles` : 'Cupo limitado'}</span>
                </div>` : ''}
            </div>
            ${descripcion ? `
            <div class="funcion-desc">${escapeHtml(descripcion)}</div>
            ` : ''}
            ${showPrecio ? `
            <div class="funcion-price">
                <i class="fas fa-ticket-alt"></i> $${escapeHtml(formatPrice(precio))}
            </div>
            ` : ''}
        </div>
        <div class="funcion-footer">
            <button class="btn-reservar" onclick="event.stopPropagation(); showFuncionDetail(${safeJson(funcion)})">
                <i class="fas fa-eye"></i> Ver Detalle
            </button>
            ${esProfesional
                ? `<button class="btn-reservar" onclick="event.stopPropagation(); comprarEnBoleteria(${safeJson(funcion)})">
                        <i class=\"fas fa-ticket\"></i> 🎟️ Comprar en Boletería BACO
                   </button>`
                : `<button class="btn-reservar" onclick="event.stopPropagation(); startReserva(${safeJson(funcion)})">
                        <i class=\"fas fa-ticket\"></i> Reservar Entrada
                   </button>`
            }
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

    const esProfesional = Boolean(funcion.es_profesional);
    const cupo = Number(funcion.entradas_disponibles || 0);
    const descripcion = funcion.descripcion || '';

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

                ${esProfesional ? `
                <div class="detail-item">
                    <i class="fas fa-chair"></i>
                    <div>
                        <h4>Entradas disponibles</h4>
                        <p>${cupo > 0 ? `${cupo} en boletería` : 'Consultar boletería'}</p>
                    </div>
                </div>
                ` : ''}

                ${showPrecio ? `
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <h4>Precio</h4>
                        <p>$${escapeHtml(formatPrice(precio))}</p>
                    </div>
                </div>
                ` : ''}
            ${descripcion ? `
            <div class="detail-item" style="align-items:flex-start;">
                <i class="fas fa-align-left" style="margin-top:4px;"></i>
                <div>
                    <h4>Descripción</h4>
                    <p style="margin:6px 0; color:#4b5563; line-height:1.5;">${escapeHtml(descripcion)}</p>
                </div>
            </div>
            ` : ''}
            </div>
            ${esProfesional ? `
            <div class="elenco-section" style="background:#fff3cd;border-left:4px solid #ffcc00;padding:16px;border-radius:6px;margin-top:12px;">
                <h3 style="margin:0 0 8px 0;"><i class="fas fa-cash-register"></i> Venta exclusiva en Boletería</h3>
                <p style="margin:0 0 8px 0;">Para esta obra profesional, la venta se realiza únicamente a través de boletería.</p>
            </div>
            ` : ''}

            <div id="vendedores-section"></div>
        </div>
    `;

    modal.classList.add('active');

    // Profesional: mostrar contacto directo de boletería y no cargar vendedores
    const vendedoresContainer = document.getElementById('vendedores-section');
    if (esProfesional) {
        const contacto = funcion.boleteria_contacto || '';
        const nombreBoleteria = funcion.boleteria_nombre || 'Boletería BACO';
        const waLink = contacto ? buildWhatsAppLink(contacto, funcion, nombreBoleteria) : '';
        vendedoresContainer.innerHTML = `
            <div class="elenco-section" style="background:#fff3cd;border-left:4px solid #ffcc00;padding:16px;border-radius:6px;">
                <h3 style="margin:0 0 8px 0;"><i class="fas fa-cash-register"></i> Venta exclusiva en boletería</h3>
                <p style="margin:0 0 6px 0;">Contactá directamente a ${escapeHtml(nombreBoleteria)} para comprar tu entrada.</p>
                ${waLink ? `<a class="btn-contactar" style="display:inline-flex;align-items:center;gap:8px;" href="${escapeHtml(waLink)}" target="_blank"><i class="fab fa-whatsapp"></i> Hablar por WhatsApp</a>` : ''}
                <p style="margin:8px 0 0 0;color:#6b7280;">Mostrá tu comprobante en sala para validar el pago.</p>
            </div>
        `;
        return;
    }

    // Cargar vendedores públicos (sin login) y mostrar sección solo si hay
    loadVendedoresPublicos(funcion).catch(err => {
        console.error('Error cargando vendedores públicos:', err);
    });
}

function startReserva(funcion) {
    showFuncionDetail(funcion);
    setTimeout(() => {
        document.getElementById('vendedores-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);

    const modal = document.getElementById('reservaModal');
    const content = document.getElementById('reservaModalContent');
    if (!modal || !content) return;

    const fecha = new Date(funcion.fecha);
    const fechaStr = fecha.toLocaleDateString('es-UY', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const horaStr = (funcion.hora || fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }));

    content.innerHTML = `
        <h3 style="margin-top:0;">¿Cómo reservar tu entrada?</h3>
        <p>Función de muestra: <strong>${escapeHtml(funcion.obra_nombre || '')}</strong> (${escapeHtml(fechaStr)} ${escapeHtml(horaStr)}).</p>
        <ol style="margin:12px 0 0 18px; color:#4b5563; line-height:1.6;">
            <li>Elige un vendedor con stock (actor o director).</li>
            <li>Abre WhatsApp y confirma disponibilidad.</li>
            <li>Completa tus datos para bloquear la entrada (el vendedor la marca como reservada).</li>
            <li>El director valida el pago. Solo pagada = válida para escaneo.</li>
        </ol>
        <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-reservar" onclick="closeReservaModal(); document.getElementById('vendedores-section')?.scrollIntoView({behavior:'smooth'});">
                <i class="fas fa-user-check"></i> Ver vendedores disponibles
            </button>
            <a class="btn-reservar" href="/pages/auth/login.html">
                <i class="fas fa-sign-in-alt"></i> Si eres actor/director, inicia sesión
            </a>
        </div>
    `;
    modal.classList.add('active');
}

function comprarEnBoleteria(funcion) {
        // Redirigir a página informativa/QR de boletería
        window.open(MP_FALLBACK_LINK, '_blank');
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
        // Mostrar mensaje si no hay vendedores
        container.innerHTML = `
            <div class="elenco-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <i class="fas fa-info-circle" style="font-size: 24px; color: #6A040F; margin-bottom: 10px;"></i>
                <p style="color: #666;"><strong>Aún no hay vendedores registrados para esta función.</strong></p>
                <p style="color: #999; font-size: 14px;">Por favor, vuelve pronto para ver las opciones de compra.</p>
            </div>
        `;
        return;
    }
    const data = await response.json();
    const vendedores = Array.isArray(data) ? data : (data.vendedores || []);
    if (!Array.isArray(vendedores) || vendedores.length === 0) {
        // Mostrar mensaje si no hay vendedores
        container.innerHTML = `
            <div class="elenco-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <i class="fas fa-info-circle" style="font-size: 24px; color: #6A040F; margin-bottom: 10px;"></i>
                <p style="color: #666;"><strong>Aún no hay vendedores registrados para esta función.</strong></p>
                <p style="color: #999; font-size: 14px;">Por favor, vuelve pronto para ver las opciones de compra.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="elenco-section">
            <h3><i class="fas fa-user-tie"></i> Vendedores de Entradas</h3>
            <p class="elenco-help"><strong>Contacta directamente con un vendedor a través de WhatsApp para coordinar tu compra y reserva.</strong></p>
            <div class="elenco-grid">
                ${vendedores.map(v => renderVendedorCard(v, funcion)).join('')}
            </div>
        </div>
    `;
}

function registrarContextoReserva(funcion, vendedor) {
    const key = `${funcion.id}-${vendedor.cedula || vendedor.contacto_publico}-${Math.random().toString(36).slice(2, 7)}`;
    reservasCache.set(key, { funcion, vendedor });
    return key;
}

function abrirReservaConKey(key) {
    const ctx = reservasCache.get(key);
    if (!ctx) return;
    abrirReservaConVendedor(ctx.funcion, ctx.vendedor);
}

function renderVendedorCard(vendedor, funcion) {
    const nombre = vendedor?.nombre || 'Vendedor';
    const contacto = vendedor?.contacto_publico || '';
    const waLink = buildWhatsAppLink(contacto, funcion, nombre);
    if (!waLink) return '';

    const disponibles = Number.isFinite(Number(vendedor.disponibles)) ? Number(vendedor.disponibles) : null;
    const contextKey = registrarContextoReserva(funcion, vendedor);

    return `
        <div class="actor-card" onclick="window.open('${escapeHtml(waLink)}','_blank')">
            <div class="actor-avatar">
                <i class="fas fa-user-circle"></i>
            </div>
            <div class="actor-info">
                <h4>${escapeHtml(nombre)}</h4>
                <p class="actor-role">${escapeHtml(vendedor.rol || 'Vendedor')}</p>
                ${disponibles !== null ? `<span class="badge badge-info">${disponibles} disp.</span>` : ''}
            </div>
            <button class="btn-contactar" onclick="event.stopPropagation(); window.open('${escapeHtml(waLink)}','_blank')">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn-reservar" onclick="event.stopPropagation(); abrirReservaConKey('${contextKey}')">
                <i class="fas fa-ticket-alt"></i> Reservar con datos
            </button>
        </div>
    `;
}

function abrirReservaConVendedor(funcion, vendedor) {
    reservaContext = { funcion, vendedor };
    const modal = document.getElementById('reservaModal');
    const content = document.getElementById('reservaModalContent');
    if (!modal || !content) return;

    const nombreGuardado = localStorage.getItem('reservaNombre') || '';
    const telefonoGuardado = localStorage.getItem('reservaTelefono') || '';

    content.innerHTML = `
        <h3 style="margin-top:0;">Reserva para invitados</h3>
        <p style="color:#4b5563;">Vendedor: <strong>${escapeHtml(vendedor.nombre || 'Vendedor')}</strong> (${escapeHtml(vendedor.rol || 'Actor')}). La entrada queda bloqueada a su nombre.</p>
        <div class="form-group">
            <label>Nombre del invitado</label>
            <input id="reserva-nombre" class="form-input" placeholder="Nombre y apellido" value="${escapeHtml(nombreGuardado)}" />
        </div>
        <div class="form-group">
            <label>Teléfono del invitado</label>
            <input id="reserva-telefono" class="form-input" placeholder="09xx xxx xxx" value="${escapeHtml(telefonoGuardado)}" />
        </div>
        <p style="font-size:13px;color:#6b7280;margin-top:6px;">El pago lo valida solo el director. Hasta que no esté en estado pagada, la entrada <strong>NO es válida</strong> para escanear.</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
            <button class="btn-reservar" onclick="enviarReservaInvitado()">
                <i class="fas fa-lock"></i> Bloquear entrada con este vendedor
            </button>
            <button class="btn-contactar" onclick="closeReservaModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
        <div id="reserva-resultado" style="margin-top:12px;"></div>
    `;

    modal.classList.add('active');
}

async function enviarReservaInvitado() {
    const { funcion, vendedor } = reservaContext;
    if (!funcion || !vendedor) {
        alert('Selecciona una función y un vendedor');
        return;
    }

    const nombre = document.getElementById('reserva-nombre')?.value?.trim();
    const telefono = document.getElementById('reserva-telefono')?.value?.trim();
    const resultado = document.getElementById('reserva-resultado');

    if (!nombre || !telefono) {
        alert('Completa nombre y teléfono');
        return;
    }

    localStorage.setItem('reservaNombre', nombre);
    localStorage.setItem('reservaTelefono', telefono);
    reservaContext = { funcion, vendedor, nombre, telefono };

    try {
        resultado.innerHTML = '<div class="estado-vacio"><i class="fas fa-spinner fa-spin"></i> Registrando reserva...</div>';
        const resp = await fetch(`/public/funciones/${encodeURIComponent(funcion.id)}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                telefono,
                vendedor_cedula: vendedor.cedula,
                vendedor_phone: vendedor.contacto_publico
            })
        });

        const data = await resp.json();
        if (!resp.ok) {
            resultado.innerHTML = `<div class="estado-vacio" style="color:#b00020;"><i class="fas fa-times-circle"></i> ${escapeHtml(data.error || 'No se pudo reservar')}</div>`;
            return;
        }

        mostrarResultadoReserva(data, vendedor, funcion);
    } catch (error) {
        console.error('Error reservando entrada:', error);
        if (resultado) resultado.innerHTML = `<div class="estado-vacio" style="color:#b00020;"><i class="fas fa-times-circle"></i> Error de red al reservar</div>`;
    }
}

function mostrarResultadoReserva(data, vendedor, funcion) {
    const resultado = document.getElementById('reserva-resultado');
    if (!resultado) return;

    const contacto = vendedor?.contacto_publico || '';
    const mensaje = data.whatsapp_mensaje || `Hola ${vendedor?.nombre || 'equipo'}, confirmo mi reserva para ${funcion?.obra_nombre || 'la función'} con ${reservaContext.nombre || 'invitado'}.`;
    const waLink = contacto ? `https://wa.me/${String(contacto).replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}` : null;

    resultado.innerHTML = `
        <div class="estado-vacio" style="align-items:flex-start;gap:10px;">
            <div>
                <p style="margin:0;color:#0f5132;"><strong>${escapeHtml(data.message || 'Reserva creada')}</strong></p>
                <p style="margin:4px 0; color:#1f2937;">Código: <strong>${escapeHtml(data.code || '')}</strong> • Estado: ${escapeHtml(data.estado || '')}</p>
                <p style="margin:4px 0; color:#6b7280;">Envío sugerido por WhatsApp al vendedor para confirmar.</p>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${waLink ? `<a class="btn-contactar" href="${escapeHtml(waLink)}" target="_blank"><i class="fab fa-whatsapp"></i> Abrir WhatsApp</a>` : ''}
                    <button class="btn-reservar" data-mensaje="${escapeHtml(mensaje)}" onclick="copiarTexto(this.dataset.mensaje)"><i class="fas fa-copy"></i> Copiar mensaje</button>
                </div>
                <p style="margin:6px 0 0 0; color:#b00020; font-size:13px;">Solo el director confirma el pago. Hasta entonces la entrada no es válida para escanear.</p>
            </div>
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

    const msg = `Hola ${vendedorNombre}!\n\nVi la función "${obra}" (${fechaStr} ${horaStr}).\nQuiero reservar una entrada de muestra contigo. El director validará el pago.\n\nGracias!`;
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

function truncate(text, maxLength) {
    const t = String(text || '');
    if (t.length <= maxLength) return t;
    return `${t.slice(0, maxLength - 1)}…`;
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

async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        alert('Mensaje copiado. Pégalo en WhatsApp.');
    } catch (error) {
        console.error('No se pudo copiar el texto:', error);
    }
}
