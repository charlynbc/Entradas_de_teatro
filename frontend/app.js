let entradaCompradaId = null;

// Obtener la URL base de la API
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    // En Codespaces, el puerto 3000 se mapea a una URL específica
    if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
        // Si estamos en el puerto 3000, usamos la misma URL
        return window.location.origin;
    }
    // En local, usamos el puerto 3000
    return 'http://localhost:3000';
}

const API_BASE_URL = getApiBaseUrl();

// Cargar obras al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarObras();
});

async function cargarObras() {
    try {
        // Usamos /api/shows que es el endpoint público del nuevo backend
        const response = await fetch(`${API_BASE_URL}/api/shows`);
        const obras = await response.json();
        renderObras(obras);
    } catch (error) {
        console.error('Error al cargar obras:', error);
        mostrarMensajeVacio();
    }
}

function renderObras(obras) {
    const container = document.getElementById('eventos-grid');
    if (!container) return;

    if (obras.length === 0) {
        mostrarMensajeVacio();
        return;
    }
    
    container.innerHTML = obras.map(obra => {
        const fecha = new Date(obra.fecha_hora);
        const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        return `
        <div class="evento-card">
            <h3><i class="fas fa-theater-masks"></i> ${obra.obra_nombre || 'Obra sin título'}</h3>
            <p><strong><i class="far fa-calendar"></i> Función:</strong> ${fecha.toLocaleDateString('es-AR')}</p>
            <p><strong><i class="far fa-clock"></i> Horario:</strong> ${hora} hs</p>
            <p><strong><i class="fas fa-couch"></i> Lugar:</strong> ${obra.lugar}</p>
            <p><strong><i class="fas fa-dollar-sign"></i> Precio:</strong> $${obra.base_price}</p>
            <p><strong><i class="fas fa-ticket-alt"></i> Capacidad:</strong> ${obra.capacidad}</p>
            <button onclick="comprarEntrada('${obra.id}')" class="btn-teatro">
                <i class="fas fa-shopping-cart"></i> Reservar Butaca
            </button>
        </div>
    `}).join('');
}

function mostrarMensajeVacio() {
    const container = document.getElementById('eventos-grid');
    if (!container) return;
    
    container.innerHTML = `
        <div class="mensaje-vacio">
            <i class="fas fa-calendar-times"></i>
            <h2>No hay funciones programadas</h2>
            <p>Por el momento no tenemos obras en cartelera.</p>
            <p>Pronto anunciaremos nuestras próximas producciones.</p>
            <a href="#contacto" class="btn-teatro">
                <i class="fas fa-envelope"></i> Contáctenos para más información
            </a>
        </div>
    `;
}

async function comprarEntrada(obraId) {
    alert('La venta online está momentáneamente deshabilitada. Por favor, contacte a un vendedor o adquiera su entrada en boletería.');
    return;
    /*
    const nombre = prompt('Ingrese su nombre:');
    if (!nombre) return;
    ...
    */
}

// Funciones del modal
function mostrarModalDescarga(entradaId) {
    entradaCompradaId = entradaId;
    const modal = document.getElementById('modal-descarga');
    if (modal) {
        modal.classList.add('active');
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal-descarga');
    if (modal) {
        modal.classList.remove('active');
    }
    entradaCompradaId = null;
    cargarObras(); // Recargar obras para actualizar disponibilidad
}

async function opcionSeleccionada(tipo) {
    if (!entradaCompradaId) return;

    switch(tipo) {
        case 'descargar':
            descargarEntrada(entradaCompradaId);
            break;
        case 'email':
            await enviarEntradaPorEmail(entradaCompradaId);
            break;
        case 'whatsapp':
            await enviarEntradaPorWhatsApp(entradaCompradaId);
            break;
    }
    
    cerrarModal();
}

function descargarEntrada(entradaId) {
    window.location.href = `${API_BASE_URL}/api/descargar-entrada/${entradaId}`;
}

async function enviarEntradaPorEmail(entradaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/enviar-entrada`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ entradaId })
        });

        const data = await response.json();

        if (data.success) {
            alert('📧 Entrada enviada por email exitosamente. Revise su bandeja de entrada.');
        } else {
            alert('Error al enviar la entrada por email');
        }
    } catch (error) {
        console.error('Error al enviar entrada:', error);
        alert('Error al enviar la entrada por email');
    }
}

async function enviarEntradaPorWhatsApp(entradaId) {
    try {
        const telefono = prompt('Ingrese su número de WhatsApp (con código de país, ej: 5491112345678):');
        if (!telefono) return;

        const response = await fetch(`${API_BASE_URL}/api/enviar-whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ entradaId, telefono })
        });

        const data = await response.json();

        if (data.success) {
            alert('📱 Entrada enviada por WhatsApp exitosamente!');
        } else {
            alert(data.error || 'Error al enviar por WhatsApp');
        }
    } catch (error) {
        console.error('Error al enviar por WhatsApp:', error);
        alert('Error al enviar la entrada por WhatsApp');
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-descarga');
    if (modal && e.target === modal) {
        cerrarModal();
    }
});
