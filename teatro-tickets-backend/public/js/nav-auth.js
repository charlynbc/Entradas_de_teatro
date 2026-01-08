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
        .then(user => {
            // Determinar dashboard según rol
            let dashboard = 'actor';
            if (user.rol === 'super' || user.rol === 'SUPER') {
                dashboard = 'super';
            } else if (user.rol === 'director' || user.rol === 'ADMIN') {
                dashboard = 'director';
            }

            // Crear menú de usuario autenticado
            authButtons.innerHTML = `
                <div class="user-menu" id="userMenu">
                    <button class="btn-login" onclick="toggleUserMenu(event)">
                        <i class="fas fa-user-circle"></i> ${user.nombre || 'Usuario'}
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
