document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling para los links de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Cargar eventos
    cargarEventos();
});

async function cargarEventos() {
    const eventosGrid = document.getElementById('eventos-grid');
    
    try {
        const response = await fetch('/api/eventos');
        const eventos = await response.json();
        
        if (eventos && eventos.length > 0) {
            eventosGrid.innerHTML = eventos.map(evento => crearEventoCard(evento)).join('');
        } else {
            mostrarEventosEjemplo();
        }
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        mostrarEventosEjemplo();
    }
}

function mostrarEventosEjemplo() {
    const eventosGrid = document.getElementById('eventos-grid');
    const eventosEjemplo = [
        {
            id: 1,
            titulo: 'Hamlet',
            fecha: '2024-02-15',
            hora: '20:00',
            precio: '$5000',
            descripcion: 'La clásica obra de William Shakespeare'
        },
        {
            id: 2,
            titulo: 'La Casa de Bernarda Alba',
            fecha: '2024-02-20',
            hora: '21:00',
            precio: '$4500',
            descripcion: 'Drama de Federico García Lorca'
        },
        {
            id: 3,
            titulo: 'Esperando a Godot',
            fecha: '2024-02-25',
            hora: '19:30',
            precio: '$4000',
            descripcion: 'Obra maestra de Samuel Beckett'
        }
    ];
    
    eventosGrid.innerHTML = eventosEjemplo.map(evento => crearEventoCard(evento)).join('');
}

function crearEventoCard(evento) {
    return `
        <div class="evento-card">
            <div class="evento-image"></div>
            <div class="evento-content">
                <h3>${evento.titulo}</h3>
                <p>${evento.descripcion || 'Una obra imperdible'}</p>
                <div class="evento-info">
                    <span><i class="fas fa-calendar"></i> ${formatearFecha(evento.fecha)}</span>
                    <span><i class="fas fa-clock"></i> ${evento.hora}</span>
                    <span><i class="fas fa-ticket-alt"></i> ${evento.precio}</span>
                </div>
                <a href="#" class="btn-comprar" onclick="comprarEntrada(${evento.id}); return false;">
                    <i class="fas fa-shopping-cart"></i> Comprar Entrada
                </a>
            </div>
        </div>
    `;
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', opciones);
}

function comprarEntrada(eventoId) {
    alert(`Redirigiendo a la compra de entradas para el evento ${eventoId}...`);
    // Aquí implementarías la lógica real de compra
    window.location.href = `/comprar?evento=${eventoId}`;
}
