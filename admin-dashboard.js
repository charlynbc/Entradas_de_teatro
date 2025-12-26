const API_URL = window.location.origin;

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
        return false;
    }
    return true;
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadDashboardData();
    loadEvents();
    loadTickets();
    loadUsers();
    loadReports();
});

// Mostrar alertas
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Cambiar tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
            document.getElementById('totalTickets').textContent = stats.totalTickets || 0;
            document.getElementById('totalRevenue').textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        } else {
            // Datos de ejemplo si no hay API
            document.getElementById('totalEvents').textContent = '12';
            document.getElementById('totalTickets').textContent = '347';
            document.getElementById('totalRevenue').textContent = '$15,430';
            document.getElementById('totalUsers').textContent = '156';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Usar datos de ejemplo
        document.getElementById('totalEvents').textContent = '12';
        document.getElementById('totalTickets').textContent = '347';
        document.getElementById('totalRevenue').textContent = '$15,430';
        document.getElementById('totalUsers').textContent = '156';
    }
}

// Cargar eventos
async function loadEvents() {
    const container = document.getElementById('eventsTableContainer');
    
    try {
        const response = await fetch(`${API_URL}/api/events`);
        let events = [];
        
        if (response.ok) {
            events = await response.json();
        } else {
            // Datos de ejemplo
            events = [
                {
                    id: 1,
                    name: 'Romeo y Julieta',
                    date: '2024-02-15T20:00:00',
                    location: 'Teatro Principal',
                    price: 45.00,
                    capacity: 200,
                    soldTickets: 150
                },
                {
                    id: 2,
                    name: 'La Casa de Bernarda Alba',
                    date: '2024-02-20T19:30:00',
                    location: 'Teatro Cervantes',
                    price: 38.50,
                    capacity: 150,
                    soldTickets: 89
                },
                {
                    id: 3,
                    name: 'Don Juan Tenorio',
                    date: '2024-03-01T21:00:00',
                    location: 'Teatro Municipal',
                    price: 50.00,
                    capacity: 300,
                    soldTickets: 245
                }
            ];
        }
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3>No hay eventos todavía</h3>
                    <p>Crea tu primer evento para comenzar</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Evento</th>
                        <th>Fecha</th>
                        <th>Ubicación</th>
                        <th>Precio</th>
                        <th>Ocupación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(event => `
                        <tr>
                            <td><strong>${event.name}</strong></td>
                            <td>${formatDate(event.date)}</td>
                            <td>${event.location}</td>
                            <td>$${event.price.toFixed(2)}</td>
                            <td>
                                <span class="badge ${getOccupancyClass(event.soldTickets, event.capacity)}">
                                    ${event.soldTickets}/${event.capacity}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-secondary btn-small" onclick="editEvent(${event.id})">Editar</button>
                                <button class="btn btn-danger btn-small" onclick="deleteEvent(${event.id})">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar eventos</p>';
    }
}

// Cargar entradas
async function loadTickets() {
    const container = document.getElementById('ticketsTableContainer');
    
    try {
        const response = await fetch(`${API_URL}/api/admin/tickets`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        let tickets = [];
        
        if (response.ok) {
            tickets = await response.json();
        } else {
            // Datos de ejemplo
            tickets = [
                {
                    id: 'TKT-001',
                    eventName: 'Romeo y Julieta',
                    userName: 'Juan Pérez',
                    email: 'juan@example.com',
                    quantity: 2,
                    total: 90.00,
                    purchaseDate: '2024-01-15T10:30:00',
                    status: 'confirmed'
                },
                {
                    id: 'TKT-002',
                    eventName: 'La Casa de Bernarda Alba',
                    userName: 'María García',
                    email: 'maria@example.com',
                    quantity: 3,
                    total: 115.50,
                    purchaseDate: '2024-01-16T14:20:00',
                    status: 'confirmed'
                },
                {
                    id: 'TKT-003',
                    eventName: 'Don Juan Tenorio',
                    userName: 'Carlos López',
                    email: 'carlos@example.com',
                    quantity: 1,
                    total: 50.00,
                    purchaseDate: '2024-01-17T09:15:00',
                    status: 'pending'
                }
            ];
        }
        
        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay entradas vendidas</h3>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Evento</th>
                        <th>Cliente</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Fecha Compra</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${tickets.map(ticket => `
                        <tr>
                            <td><strong>${ticket.id}</strong></td>
                            <td>${ticket.eventName}</td>
                            <td>${ticket.userName}<br><small>${ticket.email}</small></td>
                            <td>${ticket.quantity}</td>
                            <td>$${ticket.total.toFixed(2)}</td>
                            <td>${formatDate(ticket.purchaseDate)}</td>
                            <td><span class="badge badge-${getStatusClass(ticket.status)}">${getStatusText(ticket.status)}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading tickets:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar entradas</p>';
    }
}

// Cargar usuarios
async function loadUsers() {
    const container = document.getElementById('usersTableContainer');
    
    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        let users = [];
        
        if (response.ok) {
            users = await response.json();
        } else {
            // Datos de ejemplo
            users = [
                {
                    id: 1,
                    name: 'Juan Pérez',
                    email: 'juan@example.com',
                    registerDate: '2024-01-10',
                    totalPurchases: 5,
                    totalSpent: 225.00
                },
                {
                    id: 2,
                    name: 'María García',
                    email: 'maria@example.com',
                    registerDate: '2024-01-12',
                    totalPurchases: 3,
                    totalSpent: 115.50
                },
                {
                    id: 3,
                    name: 'Carlos López',
                    email: 'carlos@example.com',
                    registerDate: '2024-01-15',
                    totalPurchases: 1,
                    totalSpent: 50.00
                }
            ];
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Fecha Registro</th>
                        <th>Compras</th>
                        <th>Total Gastado</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td>${user.email}</td>
                            <td>${formatDate(user.registerDate)}</td>
                            <td>${user.totalPurchases}</td>
                            <td>$${user.totalSpent.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<p style="color: red;">Error al cargar usuarios</p>';
    }
}

// Cargar reportes
async function loadReports() {
    try {
        const response = await fetch(`${API_URL}/api/admin/reports`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            const reports = await response.json();
            document.getElementById('popularEvent').textContent = reports.popularEvent || '-';
            document.getElementById('avgSale').textContent = `$${(reports.avgSale || 0).toFixed(2)}`;
            document.getElementById('occupancy').textContent = `${(reports.occupancy || 0).toFixed(1)}%`;
            document.getElementById('salesToday').textContent = reports.salesToday || 0;
        } else {
            // Datos de ejemplo
            document.getElementById('popularEvent').textContent = 'Don Juan Tenorio';
            document.getElementById('avgSale').textContent = '$44.50';
            document.getElementById('occupancy').textContent = '72.5%';
            document.getElementById('salesToday').textContent = '23';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Modal de evento
function openEventModal(eventId = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    
    form.reset();
    
    if (eventId) {
        document.getElementById('eventModalTitle').textContent = 'Editar Evento';
        // Cargar datos del evento
        loadEventData(eventId);
    } else {
        document.getElementById('eventModalTitle').textContent = 'Nuevo Evento';
    }
    
    modal.classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

async function loadEventData(eventId) {
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`);
        if (response.ok) {
            const event = await response.json();
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventName').value = event.name;
            document.getElementById('eventDescription').value = event.description;
            document.getElementById('eventDate').value = event.date.slice(0, 16);
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventPrice').value = event.price;
            document.getElementById('eventCapacity').value = event.capacity;
            document.getElementById('eventImage').value = event.image || '';
        }
    } catch (error) {
        console.error('Error loading event:', error);
    }
}

async function saveEvent(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('eventId').value;
    const eventData = {
        name: document.getElementById('eventName').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        price: parseFloat(document.getElementById('eventPrice').value),
        capacity: parseInt(document.getElementById('eventCapacity').value),
        image: document.getElementById('eventImage').value
    };
    
    try {
        const url = eventId ? `${API_URL}/api/events/${eventId}` : `${API_URL}/api/events`;
        const method = eventId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            showAlert(eventId ? 'Evento actualizado correctamente' : 'Evento creado correctamente');
            closeEventModal();
            loadEvents();
            loadDashboardData();
        } else {
            showAlert('Error al guardar el evento', 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showAlert('Error al guardar el evento', 'error');
    }
}

function editEvent(eventId) {
    openEventModal(eventId);
}

async function deleteEvent(eventId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            showAlert('Evento eliminado correctamente');
            loadEvents();
            loadDashboardData();
        } else {
            showAlert('Error al eliminar el evento', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showAlert('Error al eliminar el evento', 'error');
    }
}

// Búsqueda
function searchEvents() {
    const searchTerm = document.getElementById('searchEvents').value.toLowerCase();
    const rows = document.querySelectorAll('#eventsTableContainer tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function searchTickets() {
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const rows = document.querySelectorAll('#ticketsTableContainer tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableContainer tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Exportar entradas
function exportTickets() {
    showAlert('Exportando entradas a CSV...');
    // Implementar lógica de exportación
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}

// Utilidades
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getOccupancyClass(sold, total) {
    const percentage = (sold / total) * 100;
    if (percentage >= 90) return 'badge-danger';
    if (percentage >= 70) return 'badge-warning';
    return 'badge-success';
}

function getStatusClass(status) {
    const classes = {
        'confirmed': 'success',
        'pending': 'warning',
        'cancelled': 'danger'
    };
    return classes[status] || 'success';
}

function getStatusText(status) {
    const texts = {
        'confirmed': 'Confirmado',
        'pending': 'Pendiente',
        'cancelled': 'Cancelado'
    };
    return texts[status] || status;
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeEventModal();
    }
}
