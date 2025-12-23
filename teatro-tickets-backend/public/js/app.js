// 🎭 Baco Teatro - JavaScript Principal
const API_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('bacoToken');
let currentUser = null;

// 🔐 Autenticación
async function login(cedula, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('bacoToken', data.token);
            localStorage.setItem('bacoUser', JSON.stringify(data.user));
            currentUser = data.user;
            showAlert('Inicio de sesión exitoso', 'success');
            return data;
        } else {
            showAlert(data.error || 'Error al iniciar sesión', 'error');
            return null;
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
        return null;
    }
}

async function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('bacoToken');
    localStorage.removeItem('bacoUser');
    window.location.href = '/login.html';
}

function checkAuth() {
    const token = localStorage.getItem('bacoToken');
    const user = localStorage.getItem('bacoUser');
    
    if (!token || !user) {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('index.html') &&
            window.location.pathname !== '/') {
            window.location.href = '/login.html';
        }
        return false;
    }
    
    currentUser = JSON.parse(user);
    authToken = token;
    return true;
}

// 🌐 API Calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (response.status === 401) {
            showAlert('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
            logout();
            return null;
        }

        if (!response.ok) {
            showAlert(data.error || 'Error en la solicitud', 'error');
            return null;
        }

        return data;
    } catch (error) {
        showAlert('Error de conexión con el servidor', 'error');
        return null;
    }
}

// 🎭 Funciones de UI
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in-up`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '400px';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    document.body.appendChild(spinner);
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// 🎫 Funciones de Shows
async function getShows() {
    return await apiCall('/shows');
}

async function getShowById(id) {
    return await apiCall(`/shows/${id}`);
}

async function createShow(showData) {
    return await apiCall('/shows', 'POST', showData);
}

// 🎟️ Funciones de Tickets
async function getMisTickets() {
    return await apiCall('/tickets/mis-tickets');
}

async function reservarTicket(code, compradorNombre) {
    return await apiCall(`/tickets/${code}/reservar`, 'PATCH', { compradorNombre });
}

async function reportarVenta(code, precioVendido, metodoPago) {
    return await apiCall(`/tickets/${code}/reportar-venta`, 'PATCH', { 
        precioVendido, 
        metodoPago 
    });
}

async function validarTicket(code) {
    return await apiCall(`/tickets/validar/${code}`);
}

// 👥 Funciones de Admin
async function aprobarVenta(tickets) {
    return await apiCall('/admin/aprobar-venta', 'POST', { tickets });
}

async function rechazarVenta(code, motivo) {
    return await apiCall('/admin/rechazar-venta', 'POST', { 
        ticketCode: code, 
        motivo 
    });
}

async function getVentasPendientes() {
    return await apiCall('/admin/ventas-pendientes');
}

// 🎭 Funciones de Grupos y Obras
async function getGrupos() {
    return await apiCall('/grupos');
}

async function createGrupo(grupoData) {
    return await apiCall('/grupos', 'POST', grupoData);
}

async function getObras() {
    return await apiCall('/obras');
}

async function createObra(obraData) {
    return await apiCall('/obras', 'POST', obraData);
}

// 🎵 Funciones de Ensayos
async function getEnsayos() {
    return await apiCall('/ensayos');
}

async function createEnsayo(ensayoData) {
    return await apiCall('/ensayos', 'POST', ensayoData);
}

async function registrarAsistencia(ensayoId, asistenciaData) {
    return await apiCall(`/ensayos/${ensayoId}/asistencia`, 'POST', asistenciaData);
}

// 📊 Funciones de Reportes
async function getReporteShow(showId) {
    return await apiCall(`/reportes/show/${showId}`);
}

async function getReporteGeneral() {
    return await apiCall('/reportes/general');
}

// 🎨 Inicialización
function updateNavbar() {
    const userInfo = document.getElementById('user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <span style="color: var(--baco-dorado); margin-right: 1rem;">
                👤 ${currentUser.nombre} (${currentUser.rol})
            </span>
            <a href="#" onclick="logout()" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
                Cerrar Sesión
            </a>
        `;
    }
}

function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.navbar-menu a');
    
    links.forEach(link => {
        if (link.getAttribute('href') === currentPage || 
            (currentPage === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// 🚀 Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setActivePage();
    updateNavbar();
});
