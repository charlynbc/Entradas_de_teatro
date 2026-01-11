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
    prepararModalPerfil();
    mostrarBannerCumpleanosAuto();
});

// Verificar autenticación
async function verificarAutenticacion() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || !user.role) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        // Verificar que sea SUPER
        if (user.role !== 'SUPER') {
            alert('Acceso denegado. Solo para Super Usuario.');
            window.location.href = '/';
            return;
        }

        // Obtener perfil completo
        const response = await fetch('/api/auth/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('No autenticado');
        }

        usuarioActual = await response.json();
        mostrarDatosUsuario();
    } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/auth/login.html';
    }
}

// Mostrar datos del usuario
function mostrarDatosUsuario() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!usuarioActual && !user.name) return;

    // Usar datos del perfil completo o del localStorage
    const nombre = (usuarioActual?.nombre || user.name) || 'Usuario';
    const apellido = usuarioActual?.apellido || '';
    
    const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
    document.getElementById('nombreUsuario').textContent = nombreCompleto;
    
    const fotoPerfil = usuarioActual?.foto || usuarioActual?.foto_url || '/images/logo-baco.svg';
    const fotoEl = document.getElementById('fotoUsuario');
    if (fotoEl) fotoEl.src = fotoPerfil;

    // Prellenar modal de perfil con datos actuales
    if (usuarioActual) {
        document.getElementById('perfil-nombre').value = usuarioActual.nombre || '';
        document.getElementById('perfil-apellido').value = usuarioActual.apellido || '';
        document.getElementById('perfil-celular').value = usuarioActual.celular || '';
        document.getElementById('perfil-foto').value = fotoPerfil;
        document.getElementById('perfil-descripcion').value = usuarioActual.descripcion || '';
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
                <img src="${u.foto_url || '/images/logo-baco.svg'}" alt="${u.nombre}" class="foto-perfil-mediana">
                <div class="usuario-info" style="flex: 1;">
                    <p class="usuario-nombre nombre-dorado">${u.nombre} ${u.apellido}</p>
                    <p class="usuario-descripcion">
                        <span class="badge-rol badge-${u.rol}">${traducirRol(u.rol)}</span>
                        ${u.celular ? ' • ' + u.celular : ''}
                    </p>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-header" onclick="verPerfilUsuario('${u.cedula}')">
                        <i class="fas fa-eye"></i> Ver perfil
                    </button>
                    <button class="btn-accion" onclick="editarUsuario('${u.cedula}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
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
                    <img src="${g.foto_url || '/images/logo-baco.svg'}" alt="${g.nombre}" class="foto-perfil-mediana">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px 0; color: var(--secondary);" class="nombre-dorado">${g.nombre}</h3>
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

        const data = await response.json();
        const funciones = Array.isArray(data) ? data : (data.funciones || []);
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
                        <h3 style="margin: 0 0 4px 0; color: var(--secondary);" class="nombre-dorado">${f.obra_nombre || 'Sin título'}</h3>
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

// Modal perfil del super
function prepararModalPerfil() {
    const form = document.getElementById('form-perfil-super');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const cedula = usuarioActual?.cedula || user.cedula;

        const payload = {
            celular: document.getElementById('perfil-celular').value || null,
            foto_url: document.getElementById('perfil-foto').value || null,
            descripcion: document.getElementById('perfil-descripcion').value || null,
            nueva_password: document.getElementById('perfil-password').value || undefined
        };

        // Filtrar campos vacíos para no sobreescribir con null
        Object.keys(payload).forEach((k) => {
            if (payload[k] === null || payload[k] === '') delete payload[k];
        });

        try {
            const resp = await fetch(`/api/usuarios/${cedula}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const err = await resp.json();
                alert(err.error || 'No se pudo actualizar el perfil');
                return;
            }

            alert('Perfil actualizado');
            document.getElementById('perfil-password').value = '';
            cerrarModal('perfilSuper');
            await verificarAutenticacion();
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            alert('Error de red al actualizar');
        }
    });
}

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function subirFotoPerfil() {
    const input = document.getElementById('perfil-foto-file');
    if (!input?.files?.length) {
        alert('Selecciona una imagen primero');
        return;
    }

    const file = input.files[0];
    if (!file) return;

    try {
        const base64 = await readFileAsDataURL(file);
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64, filename: file.name })
        });

        const data = await resp.json();
        if (!resp.ok) {
            alert(data.error || 'No se pudo subir la imagen');
            return;
        }

        document.getElementById('perfil-foto').value = data.url;
        document.getElementById('fotoUsuario').src = data.url;
        alert('Imagen subida. Guarda para aplicar al perfil.');
    } catch (error) {
        console.error('Error subiendo foto:', error);
        alert('No se pudo subir la imagen');
    }
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

async function verPerfilUsuario(cedula) {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`/api/usuarios/${cedula}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!resp.ok) {
            alert(data.error || 'No se pudo cargar el perfil');
            return;
        }

        document.getElementById('ver-usuario-foto').src = data.foto || data.foto_url || '/images/logo-baco.svg';
        document.getElementById('ver-usuario-nombre').textContent = `${data.nombre || ''} ${data.apellido || ''}`.trim();
        document.getElementById('ver-usuario-rol').textContent = traducirRol(data.rol);
        document.getElementById('ver-usuario-cedula').textContent = data.cedula || '';
        document.getElementById('ver-usuario-celular').textContent = data.celular || 'Sin celular';
        document.getElementById('ver-usuario-descripcion').textContent = data.descripcion || 'Sin descripción';
        abrirModal('ver-usuario');
    } catch (error) {
        console.error('Error cargando perfil:', error);
        alert('No se pudo cargar el perfil');
    }
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
    const codigo = prompt('Código de entrada a escanear:');
    if (!codigo) return;
    const funcionId = prompt('ID de función activa:');
    if (!funcionId) return;

    fetchAPI(`/api/entradas-v2/${codigo}/escanear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcion_id: funcionId })
    }).then(async (resp) => {
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.error || 'No se pudo validar la entrada');
            return;
        }
        alert('Entrada válida y marcada como utilizada');
    }).catch((error) => {
        console.error('Error escaneando:', error);
        alert('Error de red al escanear');
    });
}
