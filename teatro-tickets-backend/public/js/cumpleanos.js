/**
 * COMPONENTE DE CUMPLEAÑOS TEATRALES - BACO
 * Muestra cumpleaños del día con estilo teatral y festivo
 */

/**
 * Renderiza el componente de cumpleaños en un contenedor
 * @param {string} containerId - ID del elemento donde renderizar
 * @param {Array} cumpleaneros - Array de objetos con datos de cumpleañeros
 */
async function renderizarCumpleanos(containerId = 'cumpleanos-container') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`No se encontró el contenedor con id: ${containerId}`);
        return;
    }

    try {
        const cumpleaneros = await cargarCumpleanerosHoy();
        
        if (!cumpleaneros || cumpleaneros.length === 0) {
            container.innerHTML = `
                <div class="sin-cumpleanos">
                    <i class="fas fa-calendar-check"></i>
                    <p>No hay cumpleaños hoy</p>
                    <p class="mensaje-suave">¡Pero siempre hay motivos para celebrar en BACO! 🎭</p>
                </div>
            `;
            return;
        }

        // Determinar si son uno o varios cumpleaños
        const esSolo = cumpleaneros.length === 1;
        const html = esSolo 
            ? renderizarCumpleanosSolo(cumpleaneros[0])
            : renderizarCumpleanosMultiples(cumpleaneros);
        
        container.innerHTML = html;
        
        // Agregar animaciones
        setTimeout(() => {
            container.querySelectorAll('.cumpleanos-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 150);
            });
        }, 100);
    } catch (error) {
        console.error('Error al renderizar cumpleaños:', error);
        container.innerHTML = `
            <div class="error-cumpleanos">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar cumpleaños</p>
            </div>
        `;
    }
}

/**
 * Carga los cumpleañeros de hoy desde la API
 */
async function cargarCumpleanerosHoy() {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
        const response = await fetch('/api/usuarios/cumpleanos/hoy', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar cumpleaños');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function mostrarBannerCumpleanosAuto() {
    try {
        const cumpleaneros = await cargarCumpleanerosHoy();
        if (!cumpleaneros || cumpleaneros.length === 0) return;

        const hoy = new Date().toISOString().slice(0, 10);
        const key = `cumple-banner-${hoy}`;
        if (localStorage.getItem(key)) return; // Mostrar solo una vez por día/sesión

        const anterior = document.getElementById('banner-cumpleanos-auto');
        if (anterior) anterior.remove();

        const banner = document.createElement('div');
        banner.id = 'banner-cumpleanos-auto';
        banner.className = 'banner-cumpleanos-auto';
        banner.innerHTML = `
            <div class="banner-cumpleanos-contenido">
                <div class="banner-cumpleanos-icono">🎂</div>
                <div>
                    <p class="banner-cumpleanos-titulo">Cumpleaños BACO</p>
                    <p class="banner-cumpleanos-nombres">
                        ${cumpleaneros.map(c => `<span class="nombre-dorado">${c.nombre} ${c.apellido || ''}</span>`).join(', ')}
                    </p>
                </div>
                <button class="banner-cumpleanos-cerrar" aria-label="Cerrar" onclick="cerrarBannerCumpleanosAuto()">×</button>
            </div>`;

        document.body.appendChild(banner);
        localStorage.setItem(key, 'shown');
        requestAnimationFrame(() => banner.classList.add('visible'));
    } catch (error) {
        console.error('Error mostrando banner de cumpleaños:', error);
    }
}

function cerrarBannerCumpleanosAuto() {
    const banner = document.getElementById('banner-cumpleanos-auto');
    if (banner) banner.remove();
}

/**
 * Renderiza un solo cumpleaños con estilo destacado
 */
function renderizarCumpleanosSolo(persona) {
    const edad = calcularEdad(persona.fecha_nacimiento);
    
    return `
        <div class="cumpleanos-card solo">
            <div class="cumpleanos-header">
                <div class="confeti-animado">🎉 🎊 🎈 🎂 🎁</div>
                <h2 class="cumpleanos-titulo">¡Feliz Cumpleaños!</h2>
            </div>
            
            <div class="cumpleanos-cuerpo">
                <div class="cumpleanos-foto-grande">
                    <img src="${persona.foto || '/assets/baco.png'}" 
                         alt="${persona.nombre}" 
                         class="foto-perfil-grande cumpleanos-foto-destacada">
                    <div class="edad-badge">${edad} años</div>
                </div>
                
                <div class="cumpleanos-info">
                    <h3 class="cumpleanos-nombre">${persona.nombre} ${persona.apellido || ''}</h3>
                    <p class="cumpleanos-rol">${formatearRol(persona.rol)}</p>
                    
                    <div class="mensaje-cumpleanos">
                        <p class="mensaje-principal">${generarMensajePersonalizado(persona.rol)}</p>
                        <p class="mensaje-teatral">"El teatro es la vida, y la vida merece ser celebrada" 🎭</p>
                    </div>
                    
                    <button class="btn-felicitar" onclick="enviarFelicitacion('${persona.cedula}')">
                        <i class="fas fa-heart"></i> Enviar Felicitación
                    </button>
                </div>
            </div>
            
            <div class="cumpleanos-footer">
                <div class="decoracion-teatral">🎭 ⭐ 🎪 ⭐ 🎭</div>
            </div>
        </div>
    `;
}

/**
 * Renderiza múltiples cumpleaños en formato compacto
 */
function renderizarCumpleanosMultiples(personas) {
    return `
        <div class="cumpleanos-card multiple">
            <div class="cumpleanos-header">
                <div class="confeti-animado">🎉 🎊 🎈 🎂 🎁 🎉 🎊</div>
                <h2 class="cumpleanos-titulo">¡Celebramos ${personas.length} Cumpleaños!</h2>
                <p class="cumpleanos-subtitulo">Hoy es un día especial en BACO Teatro</p>
            </div>
            
            <div class="cumpleanos-lista">
                ${personas.map(persona => `
                    <div class="cumpleanero-item">
                        <div class="usuario-con-foto">
                            <img src="${persona.foto || '/assets/baco.png'}" 
                                 alt="${persona.nombre}" 
                                 class="foto-perfil-mediana">
                            <div class="cumpleanero-datos">
                                <div class="cumpleanero-nombre">${persona.nombre} ${persona.apellido || ''}</div>
                                <div class="cumpleanero-detalles">
                                    <span class="cumpleanero-rol">${formatearRol(persona.rol)}</span>
                                    <span class="cumpleanero-edad">${calcularEdad(persona.fecha_nacimiento)} años</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-felicitar-small" onclick="enviarFelicitacion('${persona.cedula}')" title="Felicitar">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <div class="cumpleanos-footer">
                <div class="mensaje-colectivo">
                    <p>"Que cada año sea un acto más de esta obra maravillosa que es la vida" 🎭</p>
                </div>
                <div class="decoracion-teatral">🎭 ⭐ 🎪 ⭐ 🎭</div>
            </div>
        </div>
    `;
}

/**
 * Genera un mensaje personalizado según el rol
 */
function generarMensajePersonalizado(rol) {
    const mensajes = {
        'super': '¡Feliz cumpleaños al alma de BACO! Que sigas iluminando nuestro escenario.',
        'director': '¡Feliz cumpleaños, Director! Gracias por guiarnos en cada función.',
        'actor': '¡Feliz cumpleaños, Actor! Que tu luz nunca deje de brillar en el escenario.'
    };
    
    return mensajes[rol] || '¡Feliz cumpleaños! Que este nuevo año esté lleno de aplausos.';
}

/**
 * Formatea el rol para mostrar
 */
function formatearRol(rol) {
    const roles = {
        'super': 'Super Usuario',
        'director': 'Director',
        'actor': 'Actor'
    };
    return roles[rol] || rol;
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '?';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

/**
 * Envía una felicitación (placeholder - implementar según necesidad)
 */
function enviarFelicitacion(cedula) {
    // TODO: Implementar sistema de notificaciones/felicitaciones
    console.log('Enviando felicitación a:', cedula);
    
    // Por ahora, solo mostrar mensaje
    const mensaje = document.createElement('div');
    mensaje.className = 'notificacion-exito';
    mensaje.innerHTML = '<i class="fas fa-check-circle"></i> ¡Felicitación enviada!';
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

/**
 * Abre el modal de cumpleaños (para usar desde los dashboards)
 */
async function abrirModalCumpleanos() {
    const modal = document.createElement('div');
    modal.className = 'modal activo';
    modal.id = 'modal-cumpleanos';
    modal.innerHTML = `
        <div class="modal-contenido modal-cumpleanos">
            <button class="modal-cerrar" onclick="cerrarModalCumpleanos()">
                <i class="fas fa-times"></i>
            </button>
            <div id="cumpleanos-modal-container">
                <div class="estado-cargando">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando cumpleaños...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Renderizar cumpleaños dentro del modal
    await renderizarCumpleanos('cumpleanos-modal-container');
}

/**
 * Cierra el modal de cumpleaños
 */
function cerrarModalCumpleanos() {
    const modal = document.getElementById('modal-cumpleanos');
    if (modal) {
        modal.classList.remove('activo');
        setTimeout(() => modal.remove(), 300);
    }
}

// Exportar funciones para uso global
window.renderizarCumpleanos = renderizarCumpleanos;
window.abrirModalCumpleanos = abrirModalCumpleanos;
window.cerrarModalCumpleanos = cerrarModalCumpleanos;
window.enviarFelicitacion = enviarFelicitacion;
