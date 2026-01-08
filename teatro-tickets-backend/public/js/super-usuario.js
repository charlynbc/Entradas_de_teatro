/**
 * DASHBOARD SUPER USUARIO
 * Sistema BACO - Control total del sistema
 */

// Estado global
let usuarioActual = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    cargarDatos();
    configurarFormularios();
});

// Verificar autenticación
async function verificarAutenticacion() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('No autenticado');
        }

        usuarioActual = await response.json();

        if (usuarioActual.rol !== 'super') {
            alert('Acceso denegado. Solo para Super Usuario.');
            window.location.href = '/';
            return;
        }

        mostrarDatosUsuario();
    } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        window.location.href = '/pages/auth/login.html';
    }
}

// Mostrar datos del usuario
function mostrarDatosUsuario() {
    if (!usuarioActual) return;

    document.getElementById('nombreUsuario').textContent = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    
    if (usuarioActual.foto_url) {
        document.getElementById('fotoUsuario').src = usuarioActual.foto_url;
    }
}

// Cargar datos
async function cargarDatos() {
    await Promise.all([
        cargarUsuarios(),
        cargarGrupos(),
        cargarFunciones(),
        cargarEntradas(),
        cargarCuotas(),
        cargarBalance()
    ]);
}

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/usuarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const usuarios = await response.json();
        const container = document.getElementById('lista-usuarios');

        if (usuarios.length === 0) {
            container.innerHTML = `
                <div class="estado-vacio">
                    <i class="fas fa-users"></i>
                    <p>No hay usuarios registrados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = usuarios.map(u => `
            <div class="elemento usuario-con-foto">
                <img src="${u.foto_url || '/assets/baco.png'}" alt="${u.nombre}" class="foto-perfil-mediana">
                <div class="usuario-info" style="flex: 1;">
                    <p class="usuario-nombre">${u.nombre} ${u.apellido}</p>
                    <p class="usuario-descripcion">
                        <span class="badge-rol badge-${u.rol}">${traducirRol(u.rol)}</span>
                        ${u.celular ? ' • ' + u.celular : ''}
                    </p>
                </div>
                <button class="btn-accion" onclick="editarUsuario('${u.cedula}')">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Cargar grupos
async function cargarGrupos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/grupos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const grupos = await response.json();
        const container = document.getElementById('lista-grupos');

        if (grupos.length === 0) {
            container.innerHTML = `
                <div class="estado-vacio">
                    <i class="fas fa-theater-masks"></i>
                    <p>No hay grupos creados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = grupos.map(g => `
            <div class="elemento">
                <div style="display: flex; gap: 16px; align-items: center;">
                    <img src="${g.foto_url || '/assets/baco.png'}" alt="${g.nombre}" class="foto-perfil-mediana">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px 0; color: var(--secondary);">${g.nombre}</h3>
                        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                            ${g.horario_fijo || 'Sin horario definido'} • Obra: ${g.obra_nombre}
                        </p>
                    </div>
                    <button class="btn-accion" onclick="verGrupo(${g.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando grupos:', error);
    }
}

// Cargar funciones
async function cargarFunciones() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/funciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const funciones = await response.json();
        const container = document.getElementById('lista-funciones');

        if (funciones.length === 0) {
            container.innerHTML = `
                <div class="estado-vacio">
                    <i class="fas fa-calendar"></i>
                    <p>No hay funciones programadas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = funciones.map(f => `
            <div class="elemento">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; color: var(--secondary);">${f.obra_nombre || 'Sin título'}</h3>
                        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                            <i class="fas fa-calendar"></i> ${f.fecha} a las ${f.hora}
                            <i class="fas fa-map-marker-alt" style="margin-left: 12px;"></i> ${f.lugar}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-accion" onclick="verFuncion(${f.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-accion" onclick="gestionarEntradas(${f.id})">
                            <i class="fas fa-ticket-alt"></i> Entradas
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando funciones:', error);
    }
}

// Cargar entradas
async function cargarEntradas() {
    const container = document.getElementById('lista-entradas');
    container.innerHTML = `
        <div class="estado-vacio">
            <i class="fas fa-ticket-alt"></i>
            <p>Selecciona una función para ver sus entradas</p>
        </div>
    `;
}

// Cargar cuotas
async function cargarCuotas() {
    const container = document.getElementById('lista-cuotas');
    container.innerHTML = `
        <div class="estado-vacio">
            <i class="fas fa-money-bill-wave"></i>
            <p>Sistema de cuotas en desarrollo</p>
        </div>
    `;
}

// Cargar balance
async function cargarBalance() {
    const container = document.getElementById('lista-balance');
    container.innerHTML = `
        <div class="estado-vacio">
            <i class="fas fa-chart-line"></i>
            <p>Balance económico en desarrollo</p>
        </div>
    `;
}

// Mostrar tab
function mostrarTab(tab) {
    // Ocultar todos
    document.querySelectorAll('.tab-contenido').forEach(t => {
        t.classList.remove('activo');
    });
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('activo');
    });

    // Mostrar seleccionado
    document.getElementById(`tab-${tab}`).classList.add('activo');
    event.target.classList.add('activo');
}

// Modal
function abrirModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.add('activo');
}

function cerrarModal(modalId) {
    document.getElementById(`modal-${modalId}`).classList.remove('activo');
}

// Configurar formularios
function configurarFormularios() {
    // Formulario crear usuario
    document.getElementById('form-crear-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Usuario creado exitosamente');
                cerrarModal('crearUsuario');
                e.target.reset();
                cargarUsuarios();
            } else {
                const error = await response.json();
                alert('Error: ' + error.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error creando usuario');
        }
    });
}

// Utilidades
function traducirRol(rol) {
    const roles = {
        'super': 'Super Usuario',
        'director': 'Director',
        'actor': 'Actor/Actriz'
    };
    return roles[rol] || rol;
}

function verCumpleanos() {
    abrirModalCumpleanos();
}

function verPerfil() {
    window.location.href = '/pages/perfil.html';
}

function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

function editarUsuario(cedula) {
    // TODO: Implementar edición
    alert('Editar usuario: ' + cedula);
}

function verGrupo(id) {
    // TODO: Implementar vista de grupo
    alert('Ver grupo: ' + id);
}

function verFuncion(id) {
    // TODO: Implementar vista de función
    alert('Ver función: ' + id);
}

function gestionarEntradas(funcionId) {
    // TODO: Implementar gestión de entradas
    alert('Gestionar entradas de función: ' + funcionId);
}

function iniciarEscaneo() {
    // TODO: Implementar escáner QR
    alert('Escáner QR en desarrollo');
}
