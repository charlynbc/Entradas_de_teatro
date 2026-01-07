// obra-detalle.js - Carga datos públicos de obra

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const obraId = urlParams.get('id');

    if (!obraId) {
        document.getElementById('sinDatos').style.display = 'block';
        document.getElementById('obraHeader').style.display = 'none';
        return;
    }

    try {
        // Cargar obra pública
        const obraRes = await fetch(`${API_BASE}/auditoria/public/obras/${obraId}`);
        if (!obraRes.ok) {
            throw new Error('Obra no encontrada');
        }

        const obraData = await obraRes.json();
        renderObraInfo(obraData);

        // Cargar funciones de obra
        const funcionesRes = await fetch(`${API_BASE}/auditoria/public/obras/${obraId}/funciones`);
        if (funcionesRes.ok) {
            const funcionesData = await funcionesRes.json();
            renderFunciones(funcionesData);
        }
    } catch (error) {
        console.error('Error cargando obra:', error);
        document.getElementById('sinDatos').style.display = 'block';
        document.getElementById('obraHeader').style.display = 'none';
    }
});

function renderObraInfo(obra) {
    document.getElementById('obraHeader').style.display = 'grid';
    document.getElementById('sinDatos').style.display = 'none';

    document.getElementById('obraNombre').textContent = obra.nombre;
    document.getElementById('obraGrupo').textContent = obra.grupo_nombre || 'Baco Teatro';
    document.getElementById('obraDescripcion').textContent = obra.descripcion || 'Sin descripción disponible';
    document.getElementById('obraEstado').textContent = formatearEstado(obra.estado);
    document.getElementById('obraEstado').className = `badge ${getEstadoBadgeClass(obra.estado)}`;

    if (obra.foto_url) {
        document.getElementById('obraFoto').src = obra.foto_url;
    }

    if (obra.elenco && obra.elenco.trim()) {
        document.getElementById('obraElenco').textContent = obra.elenco;
        document.getElementById('elencoItem').style.display = 'block';
    }

    if (obra.duracion && obra.duracion.trim()) {
        document.getElementById('obraDuracion').textContent = obra.duracion;
        document.getElementById('duracionItem').style.display = 'block';
    }

    document.title = `${obra.nombre} - Baco Teatro`;
}

function renderFunciones(funciones) {
    const grid = document.getElementById('funcionesGrid');

    if (!funciones || funciones.length === 0) {
        document.getElementById('funcionesSection').style.display = 'none';
        return;
    }

    document.getElementById('funcionesSection').style.display = 'block';
    grid.innerHTML = funciones.map(func => `
        <div class="funcion-card">
            <div class="funcion-fecha">
                <i class="fas fa-calendar"></i>
                ${formatearFecha(func.fecha)}
            </div>
            <div class="funcion-horario">
                <i class="fas fa-clock"></i>
                ${func.horario}
            </div>
            ${func.lugar ? `<div class="funcion-lugar"><i class="fas fa-map-marker-alt"></i> ${func.lugar}</div>` : ''}
            <div class="funcion-descripcion">${func.descripcion || 'Función especial'}</div>
        </div>
    `).join('');
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-UY', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatearEstado(estado) {
    const estados = {
        'creada': 'En Preparación',
        'abierta': 'Próxima Función',
        'en_curso': 'En Curso',
        'finalizada': 'Finalizada',
        'suspendida': 'Suspendida'
    };
    return estados[estado] || estado;
}

function getEstadoBadgeClass(estado) {
    const classes = {
        'abierta': 'badge-success',
        'en_curso': 'badge-success',
        'creada': 'badge-primary'
    };
    return classes[estado] || 'badge-primary';
}

// Estilos CSS para funciones
const style = document.createElement('style');
style.textContent = `
    .funciones-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 2rem;
        margin-top: 1.5rem;
    }

    .funcion-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s, box-shadow 0.3s;
    }

    .funcion-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    }

    .funcion-fecha,
    .funcion-horario,
    .funcion-lugar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.75rem 0;
        font-weight: 500;
        color: #333;
    }

    .funcion-fecha i,
    .funcion-horario i,
    .funcion-lugar i {
        color: var(--primary-color);
        min-width: 20px;
    }

    .funcion-descripcion {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f0f0f0;
        font-size: 0.95rem;
        color: #666;
        line-height: 1.5;
    }

    .no-funciones {
        text-align: center;
        padding: 4rem 2rem;
        color: #999;
    }

    .no-funciones i {
        font-size: 4rem;
        margin-bottom: 1rem;
        color: #ddd;
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: #999;
    }
`;
document.head.appendChild(style);
