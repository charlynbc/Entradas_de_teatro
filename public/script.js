let entradaCompradaId = null;

// Cargar obras al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarObras();
});

async function cargarObras() {
    try {
        const response = await fetch('/api/obras');
        const obras = await response.json();
        renderObras(obras);
    } catch (error) {
        console.error('Error al cargar obras:', error);
        mostrarMensajeVacio();
    }
}

function renderObras(obras) {
    const container = document.getElementById('obras-container');
    if (!container) return;

    if (obras.length === 0) {
        mostrarMensajeVacio();
        return;
    }
    
    container.innerHTML = obras.map(obra => `
        <div class="obra-card">
            <h3><i class="fas fa-theater-masks"></i> ${obra.nombre}</h3>
            <p><strong><i class="far fa-calendar"></i> Función:</strong> ${new Date(obra.fecha).toLocaleDateString('es-AR')}</p>
            <p><strong><i class="far fa-clock"></i> Horario:</strong> ${obra.hora}</p>
            <p><strong><i class="fas fa-couch"></i> Localidad:</strong> ${obra.localidad}</p>
            <p><strong><i class="fas fa-dollar-sign"></i> Precio:</strong> $${obra.precio}</p>
            <p><strong><i class="fas fa-ticket-alt"></i> Disponibles:</strong> ${obra.entradasDisponibles}</p>
            <button onclick="comprarEntrada('${obra._id}')" class="btn-teatro">
                <i class="fas fa-shopping-cart"></i> Reservar Butaca
            </button>
        </div>
    `).join('');
}

function mostrarMensajeVacio() {
    const container = document.getElementById('obras-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="mensaje-vacio">
            <i class="fas fa-calendar-times"></i>
            <h2>No hay funciones programadas</h2>
            <p>Por el momento no tenemos obras en cartelera.</p>
            <p>Pronto anunciaremos nuestras próximas producciones.</p>
            <a href="/contacto.html" class="btn-teatro">
                <i class="fas fa-envelope"></i> Contáctenos para más información
            </a>
        </div>
    `;
}

async function comprarEntrada(obraId) {
    const nombre = prompt('Ingrese su nombre:');
    if (!nombre) return;

    const email = prompt('Ingrese su email:');
    if (!email) return;

    const cantidad = prompt('¿Cuántas entradas desea comprar?', '1');
    if (!cantidad || cantidad < 1) return;

    try {
        const response = await fetch('/api/comprar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                obraId,
                nombre,
                email,
                cantidad: parseInt(cantidad)
            })
        });

        const data = await response.json();

        if (data.entrada) {
            mostrarModalDescarga(data.entrada._id);
        } else {
            alert(data.error || 'Error al realizar la compra');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la compra');
    }
}

// Funciones del modal
function mostrarModalDescarga(entradaId) {
    entradaCompradaId = entradaId;
    document.getElementById('modal-descarga').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal-descarga').classList.remove('active');
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
    window.location.href = `/api/descargar-entrada/${entradaId}`;
}

async function enviarEntradaPorEmail(entradaId) {
    try {
        const response = await fetch('/api/enviar-entrada', {
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

        const response = await fetch('/api/enviar-whatsapp', {
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
    if (e.target === modal) {
        cerrarModal();
    }
});