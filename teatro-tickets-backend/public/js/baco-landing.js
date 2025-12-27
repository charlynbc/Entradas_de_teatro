// ========================================
// BACO TEATRO - LANDING PAGE JAVASCRIPT
// ========================================

const API_URL = '/api';

// ========================================
// NAVIGATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupNavigation();
    loadFuncionesHoy();
    loadProximasFunciones();
    setupScrollAnimations();
});

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menu en móvil
    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Cerrar menu al hacer click en un link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            
            // Actualizar link activo
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.main-nav');
        if (window.scrollY > 100) {
            nav.style.background = 'linear-gradient(135deg, #370617, #6A040F)';
        } else {
            nav.style.background = 'linear-gradient(135deg, #370617, #6A040F)';
        }
    });
}

function initializeApp() {
    // Set current date
    const fechaElement = document.getElementById('fecha-hoy');
    if (fechaElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        fechaElement.textContent = today.toLocaleDateString('es-UY', options);
    }
}

// ========================================
// LOAD FUNCIONES
// ========================================

async function loadFuncionesHoy() {
    const grid = document.getElementById('funciones-hoy-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/shows`);
        const shows = await response.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const funcionesHoy = shows.filter(show => {
            const showDate = new Date(show.fecha_hora);
            return showDate >= today && showDate < tomorrow;
        });

        if (funcionesHoy.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-theater-masks"></i>
                    <h3>🎭 El telón permanece cerrado hoy</h3>
                    <p>Las musas descansan... No hay funciones programadas para hoy</p>
                    <p class="subtitle-teatral">Pero la magia te espera en el futuro cercano</p>
                    <a href="#proximas" class="btn btn-outline">✨ Descubrir próximas funciones</a>
                </div>
            `;
        } else {
            grid.innerHTML = '';
            funcionesHoy.forEach(show => {
                grid.appendChild(createFuncionCard(show));
            });
        }
    } catch (error) {
        console.error('Error loading funciones hoy:', error);
        grid.innerHTML = `
            <div class="no-funciones">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>⚠️ ¡Oh no! Un contratiempo en escena</h3>
                <p>No pudimos cargar las funciones de hoy</p>
                <p class="subtitle-teatral">Por favor, intenta recargar la página</p>
            </div>
        `;
    }
}

async function loadProximasFunciones() {
    const grid = document.getElementById('proximas-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/shows`);
        const shows = await response.json();

        const now = new Date();
        const proximasFunciones = shows
            .filter(show => new Date(show.fecha_hora) >= now)
            .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

        if (proximasFunciones.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-calendar-times"></i>
                    <h3>🌙 El escenario aguarda en silencio</h3>
                    <p>Aún no hay funciones programadas en el horizonte</p>
                    <p class="subtitle-teatral">Muy pronto volveremos a iluminar las tablas</p>
                    <a href="/contacto.html" class="btn btn-outline">📞 Mantente informado</a>
                </div>
            `;
        } else {
            grid.innerHTML = '';
            proximasFunciones.forEach(show => {
                grid.appendChild(createFuncionCard(show));
            });
        }
    } catch (error) {
        console.error('Error loading próximas funciones:', error);
        grid.innerHTML = `
            <div class="no-funciones">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>⚠️ El programa se ha extraviado</h3>
                <p>No pudimos cargar las próximas funciones</p>
                <p class="subtitle-teatral">Por favor, intenta recargar la página</p>
            </div>
        `;
    }
}

function createFuncionCard(show) {
    const card = document.createElement('div');
    card.className = 'funcion-card';
    card.onclick = () => showFuncionDetail(show);

    const fecha = new Date(show.fecha_hora);
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

    card.innerHTML = `
        <div class="funcion-header">
            <h3 class="funcion-title">${show.obra || 'Obra sin título'}</h3>
            <div class="funcion-date">
                <i class="fas fa-calendar-alt"></i>
                <span>${fechaStr}</span>
            </div>
            <div class="funcion-date">
                <i class="fas fa-clock"></i>
                <span>${horaStr}</span>
            </div>
        </div>
        <div class="funcion-body">
            <div class="funcion-info">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${show.lugar || 'Lugar a confirmar'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>Capacidad: ${show.capacidad} personas</span>
                </div>
            </div>
            <div class="funcion-price">
                <i class="fas fa-ticket-alt"></i> $${show.base_price || 0}
            </div>
        </div>
        <div class="funcion-footer">
            <button class="btn-reservar" onclick="event.stopPropagation(); showFuncionDetail(${JSON.stringify(show).replace(/"/g, '&quot;')})">
                <i class="fas fa-hand-pointer"></i> Ver Detalles y Reservar
            </button>
        </div>
    `;

    return card;
}

// ========================================
// MODALS
// ========================================

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
}

function loginAs(role) {
    // Redirigir al sistema de gestión según el rol
    let redirectUrl = '';
    switch(role) {
        case 'super':
            redirectUrl = '/login?role=super';
            break;
        case 'director':
            redirectUrl = '/login?role=director';
            break;
        case 'actor':
            redirectUrl = '/login?role=actor';
            break;
    }
    
    // Por ahora, mostrar mensaje (luego conectar con el sistema real)
    alert(`Redirigiendo al login de ${role}...\nPróximamente se conectará con el sistema de gestión.`);
    closeLoginModal();
}

async function showFuncionDetail(show) {
    const modal = document.getElementById('funcionModal');
    const content = document.getElementById('funcionModalContent');
    
    // Cargar elenco (actores con entradas)
    let elenco = [];
    try {
        const response = await fetch(`${API_URL}/usuarios/actores`);
        const actores = await response.json();
        // Filtrar actores que tengan entradas de este show
        // Por ahora mostrar todos los actores disponibles
        elenco = actores.filter(v => v.active);
    } catch (error) {
        console.error('Error loading elenco:', error);
    }

    const fecha = new Date(show.fecha_hora);
    const fechaStr = fecha.toLocaleDateString('es-UY', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    content.innerHTML = `
        <div class="funcion-detail">
            <h2>${show.obra || 'Obra sin título'}</h2>
            <div class="detail-info">
                <div class="info-row">
                    <i class="fas fa-calendar-alt"></i>
                    <strong>Fecha y Hora:</strong>
                    <span>${fechaStr}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Lugar:</strong>
                    <span>${show.lugar || 'A confirmar'}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-users"></i>
                    <strong>Capacidad:</strong>
                    <span>${show.capacidad} personas</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-ticket-alt"></i>
                    <strong>Precio:</strong>
                    <span class="price-highlight">$${show.base_price || 0}</span>
                </div>
            </div>

            ${elenco.length > 0 ? `
                <div class="elenco-section">
                    <h3><i class="fas fa-users"></i> Elenco Disponible para Reservas</h3>
                    <p class="elenco-help">Selecciona un actor/actriz para coordinar tu reserva por WhatsApp</p>
                    <div class="elenco-grid">
                        ${elenco.map(actor => `
                            <div class="actor-card" onclick="iniciarReserva(${show.id}, '${actor.name}', '${actor.phone}')">
                                <div class="actor-avatar">
                                    <i class="fas fa-user-circle"></i>
                                </div>
                                <div class="actor-info">
                                    <h4>${actor.name}</h4>
                                    <p class="actor-role">
                                        ${actor.genero === 'femenino' ? 'Actriz' : actor.genero === 'masculino' ? 'Actor' : 'Actante'}
                                    </p>
                                </div>
                                <button class="btn-contactar">
                                    <i class="fab fa-whatsapp"></i> Contactar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="no-elenco">
                    <i class="fas fa-info-circle"></i>
                    <p>El elenco se anunciará próximamente</p>
                </div>
            `}
        </div>
    `;

    modal.classList.add('active');
}

function closeFuncionModal() {
    const modal = document.getElementById('funcionModal');
    modal.classList.remove('active');
}

function iniciarReserva(showId, actorName, actorPhone) {
    const modal = document.getElementById('reservaModal');
    const content = document.getElementById('reservaModalContent');

    content.innerHTML = `
        <h2><i class="fas fa-ticket-alt"></i> Reservar Entrada</h2>
        <p class="modal-subtitle">Contacta con ${actorName} para coordinar tu reserva</p>

        <div class="reserva-form">
            <div class="form-group">
                <label><i class="fas fa-user"></i> Tu Nombre</label>
                <input type="text" id="reservaNombre" placeholder="Ingresa tu nombre completo" required>
            </div>

            <div class="form-group">
                <label><i class="fab fa-whatsapp"></i> Tu WhatsApp</label>
                <input type="tel" id="reservaWhatsapp" placeholder="+598 XX XXX XXX" required>
            </div>

            <div class="form-group">
                <label><i class="fas fa-comment"></i> Mensaje (opcional)</label>
                <textarea id="reservaMensaje" rows="3" placeholder="Ej: Quisiera reservar 2 entradas"></textarea>
            </div>

            <div class="reserva-info">
                <i class="fas fa-info-circle"></i>
                <p><strong>¿Cómo funciona?</strong></p>
                <ol>
                    <li>Completa tus datos y envía la solicitud</li>
                    <li>Se abrirá WhatsApp con ${actorName}</li>
                    <li>El/la actor/actriz te confirmará disponibilidad</li>
                    <li>Coordinarán el pago y entrega de la entrada</li>
                </ol>
            </div>

            <button class="btn btn-primary" onclick="enviarReservaWhatsApp('${actorPhone}', '${actorName}')">
                <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
            </button>
        </div>
    `;

    closeFuncionModal();
    modal.classList.add('active');
}

function closeReservaModal() {
    const modal = document.getElementById('reservaModal');
    modal.classList.remove('active');
}

function enviarReservaWhatsApp(actorPhone, actorName) {
    const nombre = document.getElementById('reservaNombre')?.value;
    const whatsapp = document.getElementById('reservaWhatsapp')?.value;
    const mensaje = document.getElementById('reservaMensaje')?.value || '';

    if (!nombre || !whatsapp) {
        alert('Por favor completa tu nombre y WhatsApp');
        return;
    }

    // Limpiar número de teléfono
    const phoneClean = actorPhone.replace(/\D/g, '');
    
    // Crear mensaje de WhatsApp
    const mensajeWhatsApp = `Hola ${actorName}! 👋

Soy *${nombre}* y me gustaría reservar entrada(s) para la función.

📱 Mi WhatsApp: ${whatsapp}
${mensaje ? `\n💬 Mensaje: ${mensaje}` : ''}

¿Podrías confirmarme disponibilidad?

¡Gracias! 🎭`;

    // Abrir WhatsApp
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(url, '_blank');
    
    closeReservaModal();
}

// Cerrar modals al hacer click fuera
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
};

// ========================================
// SCROLL ANIMATIONS
// ========================================

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos animables
    document.querySelectorAll('.funcion-card, .step, .feature').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-UY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
