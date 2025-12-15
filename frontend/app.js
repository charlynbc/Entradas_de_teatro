// Detectar automáticamente la URL base de la API
const getApiBaseUrl = () => {
    // Si estamos en Codespaces, usar la URL del backend
    if (window.location.hostname.includes('github.dev')) {
        // Reemplazar el puerto 3000 por 5000 en la URL actual
        return window.location.origin.replace('-3000.', '-5000.');
    }
    // En desarrollo local
    return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('API URL:', API_BASE_URL);

// Usuario actual (en una app real, esto vendría de un sistema de login)
let usuarioActual = 'usuario-' + Math.random().toString(36).substr(2, 9);

async function cargarEventos() {
    try {
        console.log('Cargando eventos desde:', `${API_BASE_URL}/api/eventos`);
        const response = await fetch(`${API_BASE_URL}/api/eventos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const eventos = await response.json();
        console.log('Eventos cargados:', eventos);
        mostrarEventos(eventos);
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        const container = document.getElementById('eventos-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #d32f2f;">
                <h3>Error al cargar eventos</h3>
                <p>${error.message}</p>
                <p>Verifica que el backend esté corriendo en el puerto 5000</p>
            </div>
        `;
    }
}

async function comprarEntrada(eventoId) {
    const cantidad = parseInt(prompt('¿Cuántas entradas deseas comprar?', '1'));
    
    if (!cantidad || cantidad < 1) {
        alert('Cantidad inválida');
        return;
    }
    
    try {
        console.log('Comprando entrada para evento:', eventoId);
        const response = await fetch(`${API_BASE_URL}/api/entradas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventoId,
                cantidad,
                usuario: usuarioActual
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }
        
        const entrada = await response.json();
        console.log('Entrada comprada:', entrada);
        alert(`¡Compra exitosa! Has adquirido ${cantidad} entrada(s)`);
        cargarEventos();
        cargarMisEntradas();
    } catch (error) {
        console.error('Error al comprar entrada:', error);
        alert('Error al comprar entrada: ' + error.message);
    }
}

async function cargarMisEntradas() {
    try {
        console.log('Cargando entradas desde:', `${API_BASE_URL}/api/entradas`);
        const response = await fetch(`${API_BASE_URL}/api/entradas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const entradas = await response.json();
        console.log('Entradas cargadas:', entradas);
        mostrarMisEntradas(entradas);
    } catch (error) {
        console.error('Error al cargar entradas:', error);
        const container = document.getElementById('mis-entradas-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #d32f2f;">
                <p>Error al cargar las entradas: ${error.message}</p>
            </div>
        `;
    }
}