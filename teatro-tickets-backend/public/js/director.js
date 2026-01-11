/**
 * BACO Teatro - Dashboard Director
 * Gestión de grupos, ensayos, funciones, entradas, cuotas y balance
 */

// Estado global
let estado = {
    usuario: null,
    grupos: [],
    grupoSeleccionado: null,
    funciones: [],
    cuotas: [],
    balance: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
    try {
        await cargarUsuario();
        await cargarDatos();
        configurarEventos();
        mostrarBannerCumpleanosAuto();
    } catch (error) {
        console.error('Error al inicializar:', error);
        mostrarError('Error al cargar el dashboard');
    }
}

// ============================================
// AUTENTICACIÓN Y USUARIO
// ============================================

async function cargarUsuario() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.role) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Verificar que sea ADMIN (director)
    if (user.role !== 'ADMIN') {
        alert('Acceso denegado. Solo para directores.');
        cerrarSesion();
        return;
    }

    try {
        const response = await fetch('/api/auth/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Sesión inválida');

        estado.usuario = await response.json();

        // Actualizar UI
        document.getElementById('nombreUsuario').textContent = estado.usuario.nombre || user.name;
        const fotoPerfil = estado.usuario.foto || estado.usuario.foto_url || '/assets/baco.png';
        document.getElementById('fotoUsuario').src = fotoPerfil;
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        // No cerrar sesión por error al cargar perfil completo
        // Usar datos de localStorage
        estado.usuario = {
            cedula: user.cedula,
            nombre: user.name,
            rol: user.role
        };
        document.getElementById('nombreUsuario').textContent = user.name;
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// ============================================
// CARGA DE DATOS
// ============================================

async function cargarDatos() {
    await Promise.all([
        cargarGrupos(),
        cargarEnsayos(),
        cargarFunciones(),
        cargarCuotas(),
        cargarBalance()
    ]);
    actualizarOverview();
}

// Actualizar estadísticas del overview
function actualizarOverview() {
    // Grupos
    const statGrupos = document.getElementById('stat-grupos');
    if (statGrupos) statGrupos.textContent = estado.grupos.length;

    // Funciones
    const statFunciones = document.getElementById('stat-funciones');
    if (statFunciones) statFunciones.textContent = estado.funciones?.length || 0;

    // Ensayos
    const statEnsayos = document.getElementById('stat-ensayos');
    if (statEnsayos) statEnsayos.textContent = estado.ensayos?.length || 0;

    // Balance
    const statBalance = document.getElementById('stat-balance');
    if (statBalance && estado.balance?.length > 0) {
        const total = estado.balance.reduce((sum, item) => {
            return sum + (parseFloat(item.ingresos || 0) - parseFloat(item.gastos || 0));
        }, 0);
        statBalance.textContent = `$${total.toFixed(0)}`;
    }
}

async function cargarGrupos() {
    try {
        const response = await fetchAPI('/api/grupos');
        if (response.ok) {
            const data = await response.json();
            // Solo grupos donde soy director
            estado.grupos = data.filter(g => g.director_cedula === estado.usuario.cedula);
            renderizarGrupos();
        }
    } catch (error) {
        console.error('Error al cargar grupos:', error);
    }
}

async function cargarEnsayos() {
    try {
        const response = await fetchAPI('/api/ensayos');
        if (response.ok) {
            const data = await response.json();
            // Solo ensayos de mis grupos
            const misGruposIds = estado.grupos.map(g => g.id);
            estado.ensayos = data.filter(e => misGruposIds.includes(e.grupo_id));
            renderizarEnsayos();
        }
    } catch (error) {
        console.error('Error al cargar ensayos:', error);
    }
}

async function cargarFunciones() {
    try {
        const response = await fetchAPI('/api/funciones');
        if (response.ok) {
            const data = await response.json();
            // Solo funciones de mis grupos
            const misGruposIds = estado.grupos.map(g => g.id);
            estado.funciones = data.filter(f => misGruposIds.includes(f.grupo_id));
            renderizarFunciones();
        }
    } catch (error) {
        console.error('Error al cargar funciones:', error);
    }
}

async function cargarCuotas() {
    try {
        const response = await fetchAPI('/api/cuotas');
        if (response.ok) {
            estado.cuotas = await response.json();
            renderizarCuotas();
        }
    } catch (error) {
        console.error('Error al cargar cuotas:', error);
    }
}

async function cargarBalance() {
    try {
        const response = await fetchAPI('/api/balance');
        if (response.ok) {
            estado.balance = await response.json();
            renderizarBalance();
        }
    } catch (error) {
        console.error('Error al cargar balance:', error);
    }
}

// ============================================
// RENDERIZADO - GRUPOS
// ============================================

function renderizarGrupos() {
    const container = document.getElementById('lista-grupos');
    
    if (estado.grupos.length === 0) {
        container.innerHTML = `
            <div class="sin-grupos">
                <i class="fas fa-users"></i>
                <p>Aún no has creado ningún grupo</p>
                <button class="btn-accion" onclick="abrirModal('crearGrupo')">
                    <i class="fas fa-plus"></i> Crear Mi Primer Grupo
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.grupos.map(grupo => `
        <div class="card-grupo" onclick="verDetalleGrupo(${grupo.id})">
            <div class="card-grupo-header">
                <img src="${grupo.foto || '/assets/baco.png'}" class="foto-perfil-mediana" alt="${grupo.nombre}">
                <div class="card-grupo-info">
                    <h3>${grupo.nombre}</h3>
                    <p><i class="fas fa-clock"></i> ${grupo.horario_fijo || 'Sin horario fijo'}</p>
                    <p><i class="fas fa-theater-masks"></i> ${grupo.obra_nombre || 'Sin obra asignada'}</p>
                </div>
            </div>
            <div class="card-grupo-stats">
                <div class="stat">
                    <span class="stat-value">${grupo.cantidad_integrantes || 0}</span>
                    <span class="stat-label">Actores</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${contarEnsayos(grupo.id)}</span>
                    <span class="stat-label">Ensayos</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${contarFunciones(grupo.id)}</span>
                    <span class="stat-label">Funciones</span>
                </div>
            </div>
        </div>
    `).join('');
}

function contarEnsayos(grupoId) {
    return estado.ensayos?.filter(e => e.grupo_id === grupoId).length || 0;
}

function contarFunciones(grupoId) {
    return estado.funciones?.filter(f => f.grupo_id === grupoId).length || 0;
}

function verDetalleGrupo(grupoId) {
    estado.grupoSeleccionado = estado.grupos.find(g => g.id === grupoId);
    // TODO: Modal detalle grupo
    console.log('Ver detalle grupo:', estado.grupoSeleccionado);
}

// ============================================
// RENDERIZADO - ENSAYOS
// ============================================

function renderizarEnsayos() {
    const container = document.getElementById('lista-ensayos');
    
    if (!estado.ensayos || estado.ensayos.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-theater-masks"></i>
                <p>No hay ensayos programados</p>
            </div>
        `;
        return;
    }

    // Agrupar por grupo
    const ensayosPorGrupo = {};
    estado.ensayos.forEach(ensayo => {
        if (!ensayosPorGrupo[ensayo.grupo_id]) {
            ensayosPorGrupo[ensayo.grupo_id] = [];
        }
        ensayosPorGrupo[ensayo.grupo_id].push(ensayo);
    });

    container.innerHTML = Object.entries(ensayosPorGrupo).map(([grupoId, ensayos]) => {
        const grupo = estado.grupos.find(g => g.id == grupoId);
        return `
            <div class="grupo-seccion">
                <h3><i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}</h3>
                ${ensayos.map(ensayo => `
                    <div class="elemento-card">
                        <div class="elemento-info">
                            <div class="elemento-titulo">${formatearFecha(ensayo.fecha)}</div>
                            <div class="elemento-subtitulo">
                                <i class="fas fa-clock"></i> ${formatearHora(ensayo.hora)}
                                ${ensayo.lugar ? `<i class="fas fa-map-marker-alt"></i> ${ensayo.lugar}` : ''}
                            </div>
                            ${ensayo.notas ? `<div class="elemento-descripcion">${ensayo.notas}</div>` : ''}
                        </div>
                        <div class="elemento-acciones">
                            <button class="btn-icon" onclick="editarEnsayo(${ensayo.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="eliminarEnsayo(${ensayo.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// ============================================
// RENDERIZADO - FUNCIONES
// ============================================

function renderizarFunciones() {
    const container = document.getElementById('lista-funciones');
    
    if (!estado.funciones || estado.funciones.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-calendar"></i>
                <p>No hay funciones programadas</p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.funciones.map(funcion => {
        const grupo = estado.grupos.find(g => g.id === funcion.grupo_id);
        return `
            <div class="elemento-card">
                <div class="elemento-info">
                    <div class="elemento-titulo">${funcion.nombre}</div>
                    <div class="elemento-subtitulo">
                        <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                        <i class="fas fa-calendar"></i> ${formatearFecha(funcion.fecha)}
                        <i class="fas fa-clock"></i> ${formatearHora(funcion.hora)}
                    </div>
                    ${funcion.lugar ? `<div><i class="fas fa-map-marker-alt"></i> ${funcion.lugar}</div>` : ''}
                    <div class="elemento-stats">
                        <span class="badge badge-success">${funcion.entradas_vendidas || 0} vendidas</span>
                        <span class="badge badge-warning">${funcion.entradas_sin_asignar || 0} disponibles</span>
                    </div>
                </div>
                <div class="elemento-acciones">
                    <button class="btn-icon" onclick="gestionarEntradas(${funcion.id})" title="Entradas">
                        <i class="fas fa-ticket-alt"></i>
                    </button>
                    <button class="btn-icon" onclick="verBalance(${funcion.id})" title="Balance">
                        <i class="fas fa-dollar-sign"></i>
                    </button>
                    <button class="btn-icon" onclick="editarFuncion(${funcion.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDERIZADO - CUOTAS
// ============================================

function renderizarCuotas() {
    const container = document.getElementById('lista-cuotas');
    
    if (!estado.cuotas || estado.cuotas.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-money-bill-wave"></i>
                <p>No hay cuotas registradas</p>
            </div>
        `;
        return;
    }

    // Agrupar por grupo
    const cuotasPorGrupo = {};
    estado.cuotas.forEach(cuota => {
        if (!cuotasPorGrupo[cuota.grupo_id]) {
            cuotasPorGrupo[cuota.grupo_id] = [];
        }
        cuotasPorGrupo[cuota.grupo_id].push(cuota);
    });

    container.innerHTML = Object.entries(cuotasPorGrupo).map(([grupoId, cuotas]) => {
        const grupo = estado.grupos.find(g => g.id == grupoId);
        const alDia = cuotas.filter(c => c.estado === 'al_dia').length;
        const parcial = cuotas.filter(c => c.estado === 'parcial').length;
        const adeuda = cuotas.filter(c => c.estado === 'adeuda').length;
        
        return `
            <div class="grupo-seccion">
                <h3>
                    <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                    <span class="grupo-stats">
                        <span class="badge badge-success">${alDia} al día</span>
                        <span class="badge badge-warning">${parcial} parcial</span>
                        <span class="badge badge-danger">${adeuda} adeuda</span>
                    </span>
                </h3>
                ${cuotas.map(cuota => `
                    <div class="elemento-card">
                        <div class="elemento-info">
                            <div class="usuario-con-foto">
                                <img src="${cuota.actor_foto || '/assets/baco.png'}" class="foto-perfil-pequena" alt="${cuota.actor_nombre}">
                                <div>
                                    <div class="elemento-titulo">${cuota.actor_nombre}</div>
                                    <div class="elemento-subtitulo">Cuota mensual</div>
                                </div>
                            </div>
                            <div class="elemento-stats" style="margin-top: 8px;">
                                <span class="badge ${getBadgeEstadoCuota(cuota.estado)}">${formatearEstadoCuota(cuota.estado)}</span>
                            </div>
                        </div>
                        <div class="elemento-acciones">
                            <select class="form-select-small" onchange="cambiarEstadoCuota(${cuota.id}, this.value)" data-cuota-id="${cuota.id}">
                                <option value="al_dia" ${cuota.estado === 'al_dia' ? 'selected' : ''}>Al día</option>
                                <option value="parcial" ${cuota.estado === 'parcial' ? 'selected' : ''}>Parcial</option>
                                <option value="adeuda" ${cuota.estado === 'adeuda' ? 'selected' : ''}>Adeuda</option>
                            </select>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function getBadgeEstadoCuota(estado) {
    const badges = {
        'al_dia': 'badge-success',
        'parcial': 'badge-warning',
        'adeuda': 'badge-danger'
    };
    return badges[estado] || 'badge-secondary';
}

function formatearEstadoCuota(estado) {
    const estados = {
        'al_dia': 'Al día',
        'parcial': 'Parcial',
        'adeuda': 'Adeuda'
    };
    return estados[estado] || estado;
}

async function cambiarEstadoCuota(cuotaId, nuevoEstado) {
    try {
        const response = await fetchAPI(`/api/cuotas/${cuotaId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (response.ok) {
            mostrarExito('Estado de cuota actualizado');
            await cargarCuotas();
        } else {
            throw new Error('Error al actualizar cuota');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo actualizar el estado de la cuota');
        await cargarCuotas(); // Recargar para revertir UI
    }
}

// ============================================
// RENDERIZADO - BALANCE
// ============================================

function renderizarBalance() {
    const container = document.getElementById('lista-balance');
    
    if (!estado.balance || estado.balance.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-chart-line"></i>
                <p>No hay datos de balance</p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.balance.map(item => `
        <div class="elemento-card">
            <div class="elemento-info">
                <div class="elemento-titulo">${item.funcion_nombre}</div>
                <div class="elemento-subtitulo">
                    <i class="fas fa-calendar"></i> ${formatearFecha(item.fecha)}
                    <i class="fas fa-users"></i> ${item.grupo_nombre}
                </div>
            </div>
            <div class="elemento-stats">
                <div class="stat">
                    <span class="stat-label">Ingresos</span>
                    <span class="stat-value" style="color: var(--success);">+${formatearMoneda(item.ingresos)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Gastos</span>
                    <span class="stat-value" style="color: var(--danger);">-${formatearMoneda(item.egresos)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Balance</span>
                    <span class="stat-value" style="color: ${item.balance >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${formatearMoneda(item.balance)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// CREAR GRUPO
// ============================================

function configurarEventos() {
    const formGrupo = document.getElementById('form-crear-grupo');
    if (formGrupo) {
        formGrupo.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearGrupo(new FormData(formGrupo));
        });
    }
    
    const formPerfil = document.getElementById('form-perfil-director');
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPerfilDirector(new FormData(formPerfil));
        });
    }
}

async function crearGrupo(formData) {
    try {
        const datos = {
            nombre: formData.get('nombre'),
            horario_fijo: formData.get('horario_fijo'),
            obra_nombre: formData.get('obra_nombre'),
            director_cedula: estado.usuario.cedula
        };

        const response = await fetchAPI('/api/grupos', {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            mostrarExito('Grupo creado exitosamente');
            cerrarModal('crearGrupo');
            await cargarGrupos();
            document.getElementById('form-crear-grupo').reset();
        } else {
            throw new Error('Error al crear grupo');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo crear el grupo');
    }
}

function verPerfil() {
    if (!estado.usuario) return;

    const foto = estado.usuario.foto || estado.usuario.foto_url;
    document.getElementById('perfil-dir-nombre').value = estado.usuario.nombre || '';
    document.getElementById('perfil-dir-apellido').value = estado.usuario.apellido || '';
    document.getElementById('perfil-dir-celular').value = estado.usuario.celular || '';
    document.getElementById('perfil-dir-foto').value = foto || '';
    document.getElementById('perfil-dir-descripcion').value = estado.usuario.descripcion || estado.usuario.bio || '';
    document.getElementById('perfil-dir-password').value = '';
    abrirModal('perfilDirector');
}

async function guardarPerfilDirector(formData) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const cedula = estado.usuario?.cedula || user.cedula;

        const payload = {
            nombre: formData.get('nombre')?.trim() || undefined,
            apellido: formData.get('apellido')?.trim() || undefined,
            celular: formData.get('celular')?.trim() || undefined,
            foto_url: formData.get('foto_url')?.trim() || undefined,
            descripcion: formData.get('descripcion')?.trim() || undefined,
            nueva_password: formData.get('nueva_password')?.trim() || undefined
        };

        Object.keys(payload).forEach((k) => {
            if (payload[k] === undefined || payload[k] === '') delete payload[k];
        });

        const resp = await fetch(`/api/usuarios/${cedula}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data.error || 'No se pudo actualizar el perfil');
        }

        await refrescarPerfilDirector();

        mostrarExito('Perfil actualizado');
        document.getElementById('perfil-dir-password').value = '';
        cerrarModal('perfilDirector');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarError(error.message || 'No se pudo actualizar el perfil');
    }
}

async function refrescarPerfilDirector() {
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/auth/perfil', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const perfil = await resp.json();
        estado.usuario = perfil;
        const fotoEl = document.getElementById('fotoUsuario');
        if (fotoEl) fotoEl.src = perfil.foto || perfil.foto_url || '/assets/baco.png';
    } catch (error) {
        console.error('No se pudo refrescar perfil:', error);
    }
}

// ============================================
// NAVEGACIÓN TABS
// ============================================

function mostrarTab(tabName) {
    // Ocultar overview y cards de acciones al navegar a una sección específica
    const overview = document.querySelector('.overview-card');
    const seccionesAcciones = document.querySelectorAll('.seccion-acciones');
    const tabsNav = document.querySelector('.tabs');
    
    if (overview) overview.style.display = 'none';
    seccionesAcciones.forEach(s => s.style.display = 'none');
    if (tabsNav) tabsNav.style.display = 'flex';

    // Ocultar todos los tabs
    document.querySelectorAll('.tab-contenido').forEach(tab => {
        tab.classList.remove('activo');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('activo');
    });

    // Mostrar el tab seleccionado
    const tabSeleccionado = document.getElementById(`tab-${tabName}`);
    if (tabSeleccionado) {
        tabSeleccionado.classList.add('activo');
    }

    // Activar botón correspondiente
    const buttons = document.querySelectorAll('.tabs .tab');
    buttons.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(tabName)) {
            btn.classList.add('activo');
        }
    });
}

// Función para volver al dashboard principal
function volverAlDashboard() {
    const overview = document.querySelector('.overview-card');
    const seccionesAcciones = document.querySelectorAll('.seccion-acciones');
    const tabsNav = document.querySelector('.tabs');
    
    // Mostrar overview y acciones
    if (overview) overview.style.display = 'block';
    seccionesAcciones.forEach(s => s.style.display = 'block');
    
    // Ocultar tabs de navegación
    if (tabsNav) tabsNav.style.display = 'none';
    
    // Mostrar tab de grupos por defecto
    document.querySelectorAll('.tab-contenido').forEach(tab => {
        tab.classList.remove('activo');
    });
    const tabGrupos = document.getElementById('tab-grupos');
    if (tabGrupos) tabGrupos.classList.add('activo');
}

// ============================================
// MODALS
// ============================================

function abrirModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) {
        modal.classList.add('activo');
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(`modal-${modalId}`);
    if (modal) {
        modal.classList.remove('activo');
    }
}

// ============================================
// UTILIDADES API
// ============================================

async function fetchAPI(url, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    return fetch(url, { ...defaultOptions, ...options });
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU'
    }).format(valor || 0);
}

function mostrarExito(mensaje) {
    // TODO: Implementar toast/notification
    alert(mensaje);
}

function mostrarError(mensaje) {
    // TODO: Implementar toast/notification
    alert(mensaje);
}

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function subirFotoPerfilDirector() {
    const input = document.getElementById('perfil-dir-foto-file');
    if (!input?.files?.length) {
        mostrarError('Selecciona una imagen primero');
        return;
    }

    const file = input.files[0];
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
            mostrarError(data.error || 'No se pudo subir la imagen');
            return;
        }

        document.getElementById('perfil-dir-foto').value = data.url;
        const fotoEl = document.getElementById('fotoUsuario');
        if (fotoEl) fotoEl.src = data.url;
        mostrarExito('Imagen subida. Guarda para aplicar al perfil.');
    } catch (error) {
        console.error('Error subiendo foto:', error);
        mostrarError('No se pudo subir la imagen');
    }
}

// Funciones de navegación
function verCumpleanos() {
    abrirModalCumpleanos();
}

function iniciarEscaneo() {
    console.log('Iniciar escaneo QR');
}

function gestionarEntradas(funcionId) {
    console.log('Gestionar entradas:', funcionId);
}

function verBalance(funcionId) {
    console.log('Ver balance:', funcionId);
}

function editarFuncion(funcionId) {
    console.log('Editar función:', funcionId);
}

function editarEnsayo(ensayoId) {
    console.log('Editar ensayo:', ensayoId);
}

function eliminarEnsayo(ensayoId) {
    console.log('Eliminar ensayo:', ensayoId);
}
