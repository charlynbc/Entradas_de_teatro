// Cargar funciones disponibles
async function cargarFunciones() {
    const grid = document.getElementById('funciones-grid');
    
    try {
        const response = await fetch('/api/shows/publicos');
        const funciones = await response.json();
        
        if (funciones.length === 0) {
            grid.innerHTML = `
                <div class="no-funciones">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay funciones disponibles en este momento</p>
                    <p class="subtitle">Volvé pronto para ver nuevas obras</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = funciones.map(funcion => `
            <div class="funcion-card">
                <div class="funcion-header">
                    <h3>${funcion.obra_titulo || 'Sin título'}</h3>
                    ${funcion.grupo_nombre ? `<p class="grupo-badge"><i class="fas fa-users"></i> ${funcion.grupo_nombre}</p>` : ''}
                </div>
                <div class="funcion-body">
                    <div class="funcion-info">
                        <p><i class="fas fa-calendar"></i> <strong>${formatearFecha(funcion.fecha)}</strong></p>
                        <p><i class="fas fa-clock"></i> ${funcion.hora || 'Hora a confirmar'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${funcion.lugar || 'Lugar a confirmar'}</p>
                        <p class="precio"><i class="fas fa-ticket-alt"></i> $${funcion.precio_entrada || 0}</p>
                    </div>
                    <div class="funcion-disponibilidad">
                        ${funcion.entradas_disponibles > 0 
                            ? `<span class="badge-disponible"><i class="fas fa-check-circle"></i> ${funcion.entradas_disponibles} disponibles</span>`
                            : `<span class="badge-agotado"><i class="fas fa-times-circle"></i> Agotado</span>`
                        }
                    </div>
                </div>
                <div class="funcion-footer">
                    ${funcion.entradas_disponibles > 0 
                        ? `<button onclick="reservarEntrada(${funcion.id})" class="btn-reservar">
                               <i class="fas fa-ticket-alt"></i> Reservar Entrada
                           </button>`
                        : `<button class="btn-reservar btn-disabled" disabled>
                               <i class="fas fa-ban"></i> Sin Disponibilidad
                           </button>`
                    }
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error al cargar funciones:', error);
        grid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las funciones</p>
                <button onclick="cargarFunciones()" class="btn-retry">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Formatear fecha
function formatearFecha(fecha) {
    const date = new Date(fecha);
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es-AR', opciones);
}

// Reservar entrada
function reservarEntrada(funcionId) {
    // Guardar el ID de la función en sessionStorage
    sessionStorage.setItem('funcionSeleccionada', funcionId);
    // Redirigir a página de reserva (o abrir modal)
    window.location.href = `cartelera.html?funcion=${funcionId}`;
}

// Cargar funciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarFunciones();
});
