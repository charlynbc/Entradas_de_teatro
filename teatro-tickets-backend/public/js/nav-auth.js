/**
 * Sistema de Navegación con Autenticación
 * Maneja el menú de usuario autenticado en páginas públicas
 */

// Verificar si el usuario está autenticado
function checkAuth() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('authButtons');
    
    if (token && authButtons) {
        // Obtener información del usuario
        fetch('/api/auth/perfil', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Token inválido');
            return res.json();
        })
        .then(perfil => {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const rol = (perfil.rol || perfil.role || stored.role || '').toUpperCase();
            const nombre = perfil.nombre || perfil.name || stored.name || 'Usuario';

            // Determinar dashboard según rol
            let dashboard = 'actor';
            if (rol === 'SUPER') {
                dashboard = 'super';
            } else if (rol === 'ADMIN' || rol === 'DIRECTOR') {
                dashboard = 'director';
            }

            // Crear menú de usuario autenticado
            authButtons.innerHTML = `
                <div class="user-menu" id="userMenu">
                    <button class="btn-login" onclick="toggleUserMenu(event)">
                        <i class="fas fa-user-circle"></i> ${nombre}
                    </button>
                    <div class="user-dropdown">
                        <a href="/pages/roles/${dashboard}.html">
                            <i class="fas fa-tachometer-alt"></i> Mi Dashboard
                        </a>
                        <a href="#" onclick="cerrarSesion(event)" class="btn-logout">
                            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            `;
        })
        .catch(() => {
            // Token inválido, limpiar
            localStorage.removeItem('token');
        });
    }
}

function toggleUserMenu(e) {
    if (e) e.stopPropagation();
    document.getElementById('userMenu')?.classList.toggle('active');
}

function cerrarSesion(e) {
    e.preventDefault();
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Cerrar menú al hacer click fuera
document.addEventListener('click', function(e) {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !userMenu.contains(e.target)) {
        userMenu.classList.remove('active');
    }
});

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', checkAuth);
