/**
 * BACO Teatro - Dashboard Actor
 * Vista simplificada para actores: ver grupos, ensayos, funciones, entradas y cuotas propias
 */

// Estado global
let estado = {
    usuario: null,
    grupos: [],
    ensayos: [],
    funciones: [],
    entradas: [],
    cuotas: [],
    historial: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
    try {
        await cargarUsuario();
        await cargarDatos();
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

    // Verificar que sea ACTOR
    if (user.role !== 'ACTOR') {
        alert('Acceso denegado. Solo para actores.');
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
        document.getElementById('nombreUsuario').textContent = `🎭 ${estado.usuario.nombre || user.name}`;
        document.getElementById('cedulaUsuario').textContent = `Cédula: ${estado.usuario.cedula || user.cedula}`;
        if (estado.usuario.foto) {
            document.getElementById('fotoUsuario').src = estado.usuario.foto;
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        // No cerrar sesión por error al cargar perfil completo
        // Usar datos de localStorage
        estado.usuario = {
            cedula: user.cedula,
            nombre: user.name,
            rol: user.role
        };
        document.getElementById('nombreUsuario').textContent = `🎭 ${user.name}`;
        document.getElementById('cedulaUsuario').textContent = `Cédula: ${user.cedula}`;
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
        cargarEntradas(),
        cargarCuotas(),
        cargarHistorial()
    ]);
    actualizarResumen();
}

async function cargarGrupos() {
    try {
        const response = await fetchAPI('/api/grupos');
        if (response.ok) {
            const todosGrupos = await response.json();
            // Solo grupos donde soy integrante
            estado.grupos = todosGrupos.filter(g => 
                g.integrantes?.some(i => i.cedula === estado.usuario.cedula)
            );
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
            const todosEnsayos = await response.json();
            // Solo ensayos de mis grupos
            const misGruposIds = estado.grupos.map(g => g.id);
            estado.ensayos = todosEnsayos.filter(e => misGruposIds.includes(e.grupo_id));
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
            const todasFunciones = await response.json();
            // Solo funciones de mis grupos
            const misGruposIds = estado.grupos.map(g => g.id);
            estado.funciones = todasFunciones.filter(f => misGruposIds.includes(f.grupo_id));
            renderizarFunciones();
        }
    } catch (error) {
        console.error('Error al cargar funciones:', error);
    }
}

async function cargarEntradas() {
    try {
        const response = await fetchAPI(`/api/entradas?actor_cedula=${estado.usuario.cedula}`);
        if (response.ok) {
            estado.entradas = await response.json();
            renderizarEntradas();
        }
    } catch (error) {
        console.error('Error al cargar entradas:', error);
    }
}

async function cargarCuotas() {
    try {
        const response = await fetchAPI(`/api/cuotas?actor_cedula=${estado.usuario.cedula}`);
        if (response.ok) {
            estado.cuotas = await response.json();
            renderizarCuotas();
        }
    } catch (error) {
        console.error('Error al cargar cuotas:', error);
    }
}

async function cargarHistorial() {
    try {
        const response = await fetchAPI(`/api/usuarios/${estado.usuario.cedula}/historial`);
        if (response.ok) {
            estado.historial = await response.json();
            renderizarHistorial();
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================

function actualizarResumen() {
    document.getElementById('total-grupos').textContent = estado.grupos.length;
    document.getElementById('total-funciones').textContent = estado.funciones.length;
    document.getElementById('total-entradas').textContent = estado.entradas.length;
    
    const cuotasAlDia = estado.cuotas.filter(c => c.estado === 'al_dia').length;
    document.getElementById('total-cuotas-dia').textContent = cuotasAlDia;
}

// ============================================
// RENDERIZADO - GRUPOS
// ============================================

function renderizarGrupos() {
    const container = document.getElementById('lista-mis-grupos');
    
    if (estado.grupos.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-users"></i>
                <p>No perteneces a ningún grupo</p>
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.6);">
                    Contacta a un director para unirte a un grupo
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.grupos.map(grupo => `
        <div class="grupo-card-simple">
            <img src="${grupo.foto || '/assets/baco.png'}" class="foto-perfil-mediana" alt="${grupo.nombre}">
            <div class="grupo-card-simple-info">
                <h3>${grupo.nombre}</h3>
                <p>
                    <i class="fas fa-user-tie"></i> ${grupo.director_nombre || 'Director'}
                    ${grupo.horario_fijo ? `<i class="fas fa-clock"></i> ${grupo.horario_fijo}` : ''}
                </p>
                <p>
                    <i class="fas fa-theater-masks"></i> ${grupo.obra_nombre || 'Sin obra'}
                    <i class="fas fa-users"></i> ${grupo.cantidad_integrantes || 0} integrantes
                </p>
            </div>
        </div>
    `).join('');
}

// ============================================
// RENDERIZADO - ENSAYOS
// ============================================

function renderizarEnsayos() {
    const container = document.getElementById('lista-mis-ensayos');
    
    if (!estado.ensayos || estado.ensayos.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-theater-masks"></i>
                <p>No hay ensayos programados</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha (próximos primero)
    const ensayosOrdenados = [...estado.ensayos].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
    );

    container.innerHTML = ensayosOrdenados.map(ensayo => {
        const grupo = estado.grupos.find(g => g.id === ensayo.grupo_id);
        return `
            <div class="elemento-card">
                <div class="elemento-info">
                    <div class="elemento-titulo">${formatearFecha(ensayo.fecha)}</div>
                    <div class="elemento-subtitulo">
                        <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                        <i class="fas fa-clock"></i> ${formatearHora(ensayo.hora)}
                    </div>
                    ${ensayo.lugar ? `<div><i class="fas fa-map-marker-alt"></i> ${ensayo.lugar}</div>` : ''}
                    ${ensayo.notas ? `<div class="elemento-descripcion">${ensayo.notas}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDERIZADO - FUNCIONES
// ============================================

function renderizarFunciones() {
    const container = document.getElementById('lista-mis-funciones');
    
    if (!estado.funciones || estado.funciones.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-calendar"></i>
                <p>No hay funciones programadas</p>
            </div>
        `;
        return;
    }

    // Ordenar por fecha (próximas primero)
    const funcionesOrdenadas = [...estado.funciones].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
    );

    container.innerHTML = funcionesOrdenadas.map(funcion => {
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
                        <span class="badge badge-info">
                            <i class="fas fa-ticket-alt"></i> ${funcion.entradas_vendidas || 0} vendidas
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDERIZADO - ENTRADAS
// ============================================

function renderizarEntradas() {
    const container = document.getElementById('lista-mis-entradas');
    
    if (!estado.entradas || estado.entradas.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-ticket-alt"></i>
                <p>No tienes entradas asignadas</p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.entradas.map(entrada => {
        const funcion = estado.funciones.find(f => f.id === entrada.funcion_id);
        const grupo = estado.grupos.find(g => g.id === funcion?.grupo_id);
        
        return `
            <div class="elemento-card">
                <div class="elemento-info">
                    <div class="elemento-titulo">Entrada #${entrada.numero}</div>
                    <div class="elemento-subtitulo">
                        <i class="fas fa-calendar"></i> ${funcion?.nombre || 'Función'}
                        <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                    </div>
                    ${funcion ? `<div><i class="fas fa-calendar-day"></i> ${formatearFecha(funcion.fecha)} ${formatearHora(funcion.hora)}</div>` : ''}
                    <div class="elemento-stats">
                        <span class="badge ${getBadgeEstadoEntrada(entrada.estado)}">${formatearEstadoEntrada(entrada.estado)}</span>
                        ${entrada.comprador_nombre ? `<span class="badge badge-info">${entrada.comprador_nombre}</span>` : ''}
                    </div>
                </div>
                <div class="elemento-acciones">
                    ${entrada.estado === 'asignada' ? `
                        <button class="btn-accion" onclick="verDetalleEntrada(${entrada.id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getBadgeEstadoEntrada(estado) {
    const badges = {
        'sin_asignar': 'badge-secondary',
        'asignada': 'badge-info',
        'reservada': 'badge-warning',
        'pagada': 'badge-success'
    };
    return badges[estado] || 'badge-secondary';
}

function formatearEstadoEntrada(estado) {
    const estados = {
        'sin_asignar': 'Sin asignar',
        'asignada': 'Asignada',
        'reservada': 'Reservada',
        'pagada': 'Pagada'
    };
    return estados[estado] || estado;
}

// ============================================
// RENDERIZADO - CUOTAS
// ============================================

function renderizarCuotas() {
    const container = document.getElementById('lista-mis-cuotas');
    
    if (!estado.cuotas || estado.cuotas.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-money-bill-wave"></i>
                <p>No tienes cuotas registradas</p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.cuotas.map(cuota => {
        const grupo = estado.grupos.find(g => g.id === cuota.grupo_id);
        return `
            <div class="mi-cuota-card ${cuota.estado}">
                <div class="mi-cuota-header">
                    <span class="mi-cuota-grupo">
                        <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                    </span>
                    <span class="mi-cuota-estado badge ${getBadgeEstadoCuota(cuota.estado)}">
                        ${formatearEstadoCuota(cuota.estado)}
                    </span>
                </div>
                <div style="font-size: 13px; color: rgba(255, 255, 255, 0.7);">
                    <p><i class="fas fa-calendar"></i> Cuota mensual de escuela de teatro</p>
                    ${cuota.estado === 'adeuda' ? `
                        <p style="color: var(--danger); margin-top: 8px;">
                            <i class="fas fa-exclamation-triangle"></i> 
                            Recuerda ponerte al día con tu cuota
                        </p>
                    ` : ''}
                    ${cuota.estado === 'parcial' ? `
                        <p style="color: var(--warning); margin-top: 8px;">
                            <i class="fas fa-info-circle"></i> 
                            Tienes un pago parcial pendiente
                        </p>
                    ` : ''}
                    ${cuota.estado === 'al_dia' ? `
                        <p style="color: var(--success); margin-top: 8px;">
                            <i class="fas fa-check-circle"></i> 
                            ¡Excelente! Estás al día con tus pagos
                        </p>
                    ` : ''}
                </div>
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

// ============================================
// RENDERIZADO - HISTORIAL
// ============================================

function renderizarHistorial() {
    const container = document.getElementById('lista-mi-historial');
    
    if (!estado.historial || estado.historial.length === 0) {
        container.innerHTML = `
            <div class="estado-vacio">
                <i class="fas fa-history"></i>
                <p>Sin historial de funciones</p>
            </div>
        `;
        return;
    }

    container.innerHTML = estado.historial.map(item => `
        <div class="elemento-card">
            <div class="elemento-info">
                <div class="elemento-titulo">${item.funcion_nombre}</div>
                <div class="elemento-subtitulo">
                    <i class="fas fa-users"></i> ${item.grupo_nombre}
                    <i class="fas fa-calendar"></i> ${formatearFecha(item.fecha)}
                </div>
                <div class="elemento-stats">
                    <span class="badge badge-info">
                        <i class="fas fa-ticket-alt"></i> ${item.entradas_asignadas} entradas
                    </span>
                    <span class="badge badge-success">
                        <i class="fas fa-dollar-sign"></i> ${item.entradas_pagadas} pagadas
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// NAVEGACIÓN TABS
// ============================================

function mostrarTab(tabName) {
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
    event.target.closest('.tab')?.classList.add('activo');
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

function mostrarExito(mensaje) {
    // TODO: Implementar toast/notification
    alert(mensaje);
}

function mostrarError(mensaje) {
    // TODO: Implementar toast/notification
    alert(mensaje);
}

// Funciones de navegación
function verCumpleanos() {
    abrirModalCumpleanos();
}

function verPerfil() {
    // TODO: Implementar modal de perfil
    console.log('Ver perfil');
}

function verDetalleEntrada(entradaId) {
    console.log('Ver detalle entrada:', entradaId);
}
