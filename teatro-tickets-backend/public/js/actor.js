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
    historial: [],
    statsEntradas: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
    try {
        await cargarUsuario();
        await cargarDatos();
        mostrarBannerCumpleanosAuto();
        prepararPerfilActor();
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
        cargarHistorial(),
        cargarStatsEntradas()
    ]);
    actualizarResumen();
}

async function cargarStatsEntradas() {
    try {
        const resp = await fetchAPI(`/api/entradas-v2/estadisticas/actor/${estado.usuario.cedula}`);
        if (resp.ok) {
            estado.statsEntradas = await resp.json();
            actualizarResumenEntradas();
        }
    } catch (error) {
        console.error('Error cargando stats de entradas:', error);
    }
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
        const response = await fetchAPI(`/api/entradas-v2`);
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

function actualizarResumenEntradas() {
    if (!estado.statsEntradas) return;
    const s = estado.statsEntradas;
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    set('stats-entradas-vendidas', s.vendidas || 0);
    set('stats-entradas-prontas', s.prontas || 0);
    set('stats-entradas-no', s.no_vendidas || 0);
    set('stats-entradas-perdonadas', s.perdonadas || s.deuda_perdonada || 0);
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
        const funcion = estado.funciones.find(f => String(f.id) === String(entrada.funcion_id));
        const grupo = estado.grupos.find(g => g.id === funcion?.grupo_id);
        const puedeReservar = entrada.estado === 'asignada';
        const puedePronta = entrada.estado === 'reservada';

        return `
            <div class="elemento-card">
                <div class="elemento-info">
                    <div class="elemento-titulo">Entrada ${entrada.code}</div>
                    <div class="elemento-subtitulo">
                        <i class="fas fa-calendar"></i> ${funcion?.nombre || 'Función'}
                        <i class="fas fa-users"></i> ${grupo?.nombre || 'Grupo'}
                    </div>
                    ${funcion ? `<div><i class="fas fa-calendar-day"></i> ${formatearFecha(funcion.fecha)} ${formatearHora(funcion.hora)}</div>` : ''}
                    <div class="elemento-stats">
                        <span class="badge ${getBadgeEstadoEntrada(entrada.estado)}">${formatearEstadoEntrada(entrada.estado)}</span>
                        ${entrada.reservante_nombre ? `<span class="badge badge-info">${entrada.reservante_nombre}</span>` : ''}
                        ${entrada.reservante_telefono ? `<span class="badge badge-secondary"><i class="fas fa-phone"></i> ${entrada.reservante_telefono}</span>` : ''}
                    </div>
                </div>
                <div class="elemento-acciones">
                    ${puedeReservar ? `
                        <button class="btn-accion" onclick="reservarEntradaActor('${entrada.code}')">
                            <i class="fas fa-user-plus"></i> Reservar
                        </button>
                    ` : ''}
                    ${puedePronta ? `
                        <button class="btn-accion" onclick="marcarProntaActor('${entrada.code}')">
                            <i class="fas fa-check-circle"></i> Pronta
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
        'pronta': 'badge-primary',
        'pagada': 'badge-success',
        'utilizada': 'badge-success',
        'no_vendida': 'badge-danger',
        'perdonada': 'badge-success'
    };
    return badges[estado] || 'badge-secondary';
}

function formatearEstadoEntrada(estado) {
    const estados = {
        'sin_asignar': 'Sin asignar',
        'asignada': 'Asignada',
        'reservada': 'Reservada',
        'pronta': 'Pronta para pagar',
        'pagada': 'Pagada',
        'utilizada': 'Utilizada',
        'no_vendida': 'No vendida',
        'perdonada': 'Perdonada'
    };
    return estados[estado] || estado;
}

async function reservarEntradaActor(code) {
    const nombre = prompt('Nombre de la persona que reserva:');
    const telefono = prompt('Teléfono de la persona:');
    if (!nombre || !telefono) return;
    try {
        const resp = await fetchAPI(`/api/entradas-v2/${code}/reservar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono })
        });
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.error || 'No se pudo reservar');
            return;
        }
        await cargarEntradas();
    } catch (error) {
        console.error('Error reservando entrada:', error);
        alert('Error reservando entrada');
    }
}

async function marcarProntaActor(code) {
    try {
        const resp = await fetchAPI(`/api/entradas-v2/${code}/pronta`, { method: 'POST' });
        if (!resp.ok) {
            const err = await resp.json();
            alert(err.error || 'No se pudo marcar pronta');
            return;
        }
        await cargarEntradas();
    } catch (error) {
        console.error('Error marcando pronta:', error);
        alert('Error marcando entrada');
    }
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

// ============================================
// PERFIL
// ============================================

function prepararPerfilActor() {
    const form = document.getElementById('form-perfil-actor');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPerfilActor(new FormData(form));
        });
    }
}

function verPerfil() {
    if (!estado.usuario) return;

    const foto = estado.usuario.foto || estado.usuario.foto_url;
    document.getElementById('perfil-actor-nombre').value = estado.usuario.nombre || '';
    document.getElementById('perfil-actor-celular').value = estado.usuario.celular || '';
    document.getElementById('perfil-actor-foto').value = foto || '';
    document.getElementById('perfil-actor-descripcion').value = estado.usuario.descripcion || estado.usuario.bio || '';
    document.getElementById('perfil-actor-password').value = '';
    abrirModal('perfilActor');
}

async function guardarPerfilActor(formData) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const cedula = estado.usuario?.cedula || user.cedula;

        const payload = {
            nombre: formData.get('nombre')?.trim() || undefined,
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

        await refrescarPerfilActor();

        mostrarExito('Perfil actualizado');
        document.getElementById('perfil-actor-password').value = '';
        cerrarModal('perfilActor');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarError(error.message || 'No se pudo actualizar el perfil');
    }
}

async function refrescarPerfilActor() {
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

async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function subirFotoPerfilActor() {
    const input = document.getElementById('perfil-actor-foto-file');
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

        document.getElementById('perfil-actor-foto').value = data.url;
        const fotoEl = document.getElementById('fotoUsuario');
        if (fotoEl) fotoEl.src = data.url;
        mostrarExito('Imagen subida. Guarda para aplicar al perfil.');
    } catch (error) {
        console.error('Error subiendo foto:', error);
        mostrarError('No se pudo subir la imagen');
    }
}

function abrirModal(modalId) {
    document.getElementById(`modal-${modalId}`)?.classList.add('activo');
}

function cerrarModal(modalId) {
    document.getElementById(`modal-${modalId}`)?.classList.remove('activo');
}

// Funciones de navegación
function verCumpleanos() {
    abrirModalCumpleanos();
}

function verDetalleEntrada(entradaId) {
    console.log('Ver detalle entrada:', entradaId);
}
