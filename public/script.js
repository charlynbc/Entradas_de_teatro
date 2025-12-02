// ...existing code...

let entradaCompradaId = null;

// Función para mostrar modal
function mostrarModalDescarga(entradaId) {
    entradaCompradaId = entradaId;
    document.getElementById('modal-descarga').classList.add('active');
}

// Función para cerrar modal
function cerrarModal() {
    document.getElementById('modal-descarga').classList.remove('active');
    entradaCompradaId = null;
}

// Función cuando se selecciona una opción
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
    cargarObras();
}

// Función para enviar entrada por WhatsApp
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

function renderObras(obras) {
    const container = document.getElementById('obras-container');
    if (!container) return;
    
    container.innerHTML = obras.map(obra => `
        <div class="obra-card">
            <h3>🎭 ${obra.nombre}</h3>
            <p><strong>📅 Función:</strong> ${new Date(obra.fecha).toLocaleDateString('es-AR')}</p>
            <p><strong>🕐 Horario:</strong> ${obra.hora}</p>
            <p><strong>💺 Localidad:</strong> ${obra.localidad}</p>
            <p><strong>💰 Precio:</strong> $${obra.precio}</p>
            <p><strong>🎟️ Disponibles:</strong> ${obra.entradasDisponibles}</p>
            <button onclick="comprarEntrada('${obra._id}')" class="btn-teatro">
                Reservar Butaca 🎟️
            </button>
        </div>
    `).join('');
}

// Función para descargar entrada como PDF
async function descargarEntrada(entradaId) {
    try {
        window.location.href = `/api/descargar-entrada/${entradaId}`;
    } catch (error) {
        console.error('Error al descargar entrada:', error);
        alert('Error al descargar la entrada');
    }
}

// Función para enviar entrada por email
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

// Modificar la función de compra para incluir opciones de descarga/envío
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
            // Mostrar modal con opciones
            mostrarModalDescarga(data.entrada._id);
        } else {
            alert(data.error || 'Error al realizar la compra');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la compra');
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-descarga');
    if (e.target === modal) {
        cerrarModal();
    }
});

// ...existing code...