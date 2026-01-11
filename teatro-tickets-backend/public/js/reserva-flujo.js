/**
 * 🎟️ FLUJO DE RESERVA - Lógica Unificada
 * Maneja ambos flujos: Grupo/Muestra vs Profesional
 * Fecha: 11-01-2026
 */

const PUBLIC_API_URL = '/api/public';

/**
 * 🎭 ENTRADA PRINCIPAL - Detecta tipo de función y ejecuta flujo correcto
 * @param {Number|String} funcionId - ID de la función
 * @param {Boolean} esProfesional - Flag de tipo de función
 * @param {String} fechaIso - Fecha en ISO (para mensajes)
 */
async function iniciarFlujoReserva(funcionId, esProfesional, fechaIso = '') {
  console.log('🎬 Iniciando flujo de reserva:', { funcionId, esProfesional, fechaIso });

  if (!funcionId) {
    alert('⚠️ Función inválida. Por favor, recargá la página.');
    return;
  }

  try {
    // Obtener datos completos de la función
    const funcion = await obtenerDatosFuncion(funcionId);
    if (!funcion) {
      alert('❌ No se pudo cargar la función. Intentá de nuevo.');
      return;
    }

    if (esProfesional) {
      // 🎪 CASO 2: FUNCIÓN PROFESIONAL → WhatsApp Boletería directo
      await iniciarFlujoProfesional(funcion);
    } else {
      // 🎭 CASO 1: FUNCIÓN DE GRUPO → Modal con vendedores
      await iniciarFlujoGrupo(funcion);
    }
  } catch (error) {
    console.error('Error en flujo de reserva:', error);
    alert('❌ Hubo un error. Por favor, intentá de nuevo.');
  }
}

/**
 * 🎭 FLUJO 1: FUNCIÓN DE GRUPO / MUESTRA
 * Muestra modal con lista de vendedores para elegir
 */
async function iniciarFlujoGrupo(funcion) {
  console.log('🎭 Flujo de GRUPO:', funcion);

  try {
    // Obtener vendedores disponibles
    const vendedores = await obtenerVendedores(funcion.id);

    if (!vendedores || vendedores.length === 0) {
      alert(
        'ℹ️ No hay vendedores disponibles en este momento.\nPor favor, intentá más tarde.'
      );
      return;
    }

    // Mostrar modal elegante de selección
    mostrarModalVendedores(funcion, vendedores);
  } catch (error) {
    console.error('Error en flujo de grupo:', error);
    alert('❌ Error al cargar vendedores.');
  }
}

/**
 * 🎪 FLUJO 2: FUNCIÓN PROFESIONAL
 * Redirige directo a WhatsApp de boletería (sin modal)
 */
async function iniciarFlujoProfesional(funcion) {
  console.log('🎪 Flujo PROFESIONAL:', funcion);

  const boleteriPhone = funcion.boleteria_contacto || funcion.telefono_boleteria || '';

  if (!boleteriPhone) {
    alert(
      '⚠️ Boletería no configurada.\nPor favor, contactá directamente con BACO Teatro.'
    );
    return;
  }

  // Limpiar número (solo dígitos)
  const phoneClean = String(boleteriPhone).replace(/\D/g, '');

  // Armar mensaje preformateado
  const mensaje = construirMensajeProfesional(funcion);

  // Abrir WhatsApp
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

/**
 * 📍 AUXILIAR: Obtener datos completos de la función
 */
async function obtenerDatosFuncion(funcionId) {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/funciones/${funcionId}`);
    if (!response.ok) throw new Error('Función no encontrada');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo función:', error);
    return null;
  }
}

/**
 * 📍 AUXILIAR: Obtener lista de vendedores de una función
 */
async function obtenerVendedores(funcionId) {
  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/funciones/${funcionId}/vendedores`
    );
    if (!response.ok) throw new Error('Error obteniendo vendedores');
    const data = await response.json();
    // Array o { vendedores: [] }
    return Array.isArray(data) ? data : (data.vendedores || []);
  } catch (error) {
    console.error('Error obteniendo vendedores:', error);
    return [];
  }
}

/**
 * 🎨 MODAL: "Elegí tu vendedor"
 * Muestra lista elegante de vendedores disponibles
 */
function mostrarModalVendedores(funcion, vendedores) {
  // Crear overlay + modal
  const modal = document.createElement('div');
  modal.className = 'reserva-modal-overlay';
  modal.id = 'vendedoresModal';

  const content = document.createElement('div');
  content.className = 'reserva-modal-content';

  // Header del modal
  const header = `
    <div class="reserva-modal-header">
      <h2 class="reserva-modal-title">
        <i class="fas fa-user-check"></i> Elegí tu vendedor
      </h2>
      <button class="reserva-modal-close" onclick="cerrarModalVendedores()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // Body con lista de vendedores
  const vendedoresHtml = vendedores
    .map((v) => renderVendedorSelectable(v, funcion))
    .join('');

  const body = `
    <div class="reserva-modal-body">
      <p class="reserva-modal-subtitle">
        ${escapeHtml(funcion.obra_nombre || 'Función')} - 
        ${escapeHtml(funcion.sala || 'Lugar')}
      </p>
      <div class="vendedores-lista">
        ${vendedoresHtml}
      </div>
    </div>
  `;

  content.innerHTML = header + body;
  modal.appendChild(content);

  // Agregar al DOM y mostrar
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);

  // Cerrar al clickear afuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModalVendedores();
  });
}

/**
 * 🎨 Card individual de vendedor (seleccionable)
 */
function renderVendedorSelectable(vendedor, funcion) {
  const nombre = vendedor.nombre || vendedor.vendedor_nombre || 'Vendedor';
  const rol = vendedor.rol || vendedor.tipo || 'Vendedor';
  const disponibles = vendedor.disponibles || vendedor.stock || 0;
  const phone = vendedor.phone || vendedor.telefono || vendedor.contacto_publico || '';

  const phoneClean = String(phone).replace(/\D/g, '');
  const tieneContacto = phoneClean.length > 0;

  const badge = disponibles > 0 ? `<span class="vendedor-badge">${disponibles} disp.</span>` : '';

  return `
    <div class="vendedor-card ${tieneContacto ? 'clickable' : 'disabled'}">
      <div class="vendedor-card-header">
        <div class="vendedor-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="vendedor-info">
          <h4 class="vendedor-nombre">${escapeHtml(nombre)}</h4>
          <p class="vendedor-rol">${escapeHtml(rol)}</p>
        </div>
      </div>
      
      <div class="vendedor-card-footer">
        ${badge}
        <div class="vendedor-actions">
          ${tieneContacto ? `
            <button class="btn-wa" onclick="abrirWhatsAppVendedor('${phoneClean}', ${escapeHtml(JSON.stringify(funcion))}, '${escapeHtml(nombre)}')">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
            <button class="btn-reservar" onclick="abrirFormularioReserva(${escapeHtml(JSON.stringify(funcion))}, ${escapeHtml(JSON.stringify(vendedor))})">
              <i class="fas fa-ticket-alt"></i> Reservar
            </button>
          ` : `
            <span class="texto-sin-contacto">Sin contacto disponible</span>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * 💬 Abrir WhatsApp con vendedor
 */
function abrirWhatsAppVendedor(phone, funcion, vendedorNombre) {
  const mensaje = construirMensajeVendedor(funcion, vendedorNombre);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

/**
 * 📝 Formulario de reserva con datos (nombre + teléfono)
 */
function abrirFormularioReserva(funcion, vendedor) {
  const modal = document.createElement('div');
  modal.className = 'reserva-modal-overlay';
  modal.id = 'formularioModal';

  const content = document.createElement('div');
  content.className = 'reserva-modal-content reserva-modal-form';

  const nombreGuardado = localStorage.getItem('reservaNombre') || '';
  const telefonoGuardado = localStorage.getItem('reservaTelefono') || '';

  const html = `
    <div class="reserva-modal-header">
      <h2 class="reserva-modal-title">
        <i class="fas fa-edit"></i> Completá tus datos
      </h2>
      <button class="reserva-modal-close" onclick="cerrarModalFormulario()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="reserva-modal-body">
      <p class="reserva-modal-subtitle">
        Vendedor: <strong>${escapeHtml(vendedor.nombre || 'Vendedor')}</strong>
      </p>
      
      <form id="formularioReserva" onsubmit="enviarReserva(event, ${escapeHtml(JSON.stringify(funcion))}, ${escapeHtml(JSON.stringify(vendedor))})">
        <div class="form-group">
          <label for="nombreReserva">Nombre completo</label>
          <input 
            id="nombreReserva" 
            type="text" 
            class="form-input" 
            placeholder="Tu nombre y apellido"
            value="${escapeHtml(nombreGuardado)}"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="telefonoReserva">Teléfono</label>
          <input 
            id="telefonoReserva" 
            type="tel" 
            class="form-input" 
            placeholder="+598 9 XXXX XXXX"
            value="${escapeHtml(telefonoGuardado)}"
            required
          />
        </div>
        
        <p class="reserva-aviso">
          <i class="fas fa-info-circle"></i>
          La entrada quedará reservada a este nombre. El vendedor confirmará el pago.
        </p>
        
        <button type="submit" class="btn-primary btn-block">
          <i class="fas fa-check"></i> Confirmar Reserva
        </button>
      </form>
    </div>
  `;

  content.innerHTML = html;
  modal.appendChild(content);
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModalFormulario();
  });
}

/**
 * 📤 Enviar reserva al backend
 */
async function enviarReserva(event, funcion, vendedor) {
  event.preventDefault();

  const nombre = document.getElementById('nombreReserva')?.value?.trim();
  const telefono = document.getElementById('telefonoReserva')?.value?.trim();

  if (!nombre || !telefono) {
    alert('Por favor, completá todos los campos.');
    return;
  }

  // Guardar en localStorage
  localStorage.setItem('reservaNombre', nombre);
  localStorage.setItem('reservaTelefono', telefono);

  try {
    const response = await fetch(
      `${PUBLIC_API_URL}/funciones/${funcion.id}/reservas`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          vendedor_cedula: vendedor.cedula,
          vendedor_phone: vendedor.phone || vendedor.contacto_publico,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la reserva');
    }

    const resultado = await response.json();
    mostrarResultadoReserva(resultado, vendedor, funcion);
    cerrarModalFormulario();
  } catch (error) {
    console.error('Error enviando reserva:', error);
    alert(`❌ ${error.message}`);
  }
}

/**
 * ✅ Mostrar resultado exitoso
 */
function mostrarResultadoReserva(resultado, vendedor, funcion) {
  const modal = document.createElement('div');
  modal.className = 'reserva-modal-overlay';
  modal.id = 'resultadoModal';

  const content = document.createElement('div');
  content.className = 'reserva-modal-content reserva-modal-resultado';

  const html = `
    <div class="resultado-body">
      <div class="resultado-icon success">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2 class="resultado-titulo">¡Entrada Reservada!</h2>
      <p class="resultado-texto">
        Tu entrada está bloqueada a nombre de <strong>${escapeHtml(resultado.nombre || '')}</strong>.
      </p>
      <p class="resultado-subtexto">
        El vendedor <strong>${escapeHtml(vendedor.nombre || '')}</strong> confirmará el pago.<br>
        Código: <code>${resultado.codigo || resultado.code || 'N/A'}</code>
      </p>
      <button class="btn-primary" onclick="cerrarModalResultado()">
        <i class="fas fa-check"></i> Entendido
      </button>
    </div>
  `;

  content.innerHTML = html;
  modal.appendChild(content);
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * 🔒 Cerrar modales
 */
function cerrarModalVendedores() {
  const modal = document.getElementById('vendedoresModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

function cerrarModalFormulario() {
  const modal = document.getElementById('formularioModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

function cerrarModalResultado() {
  const modal = document.getElementById('resultadoModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
  cerrarModalVendedores();
}

/**
 * 📝 CONSTRUCCIÓN DE MENSAJES
 */
function construirMensajeVendedor(funcion, vendedorNombre) {
  const fecha = funcion.fecha ? new Date(funcion.fecha).toLocaleDateString('es-UY') : '';
  const hora = funcion.hora || '20:00';

  return `Hola ${vendedorNombre}!\n\n` +
    `Quiero reservar una entrada para:\n\n` +
    `🎭 Obra: ${funcion.obra_nombre || 'Función'}\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕖 Hora: ${hora}\n` +
    `📍 Lugar: ${funcion.sala || 'A confirmar'}\n` +
    `🎫 Función Nº: ${funcion.id}\n\n` +
    `¿Hay disponibilidad?`;
}

function construirMensajeProfesional(funcion) {
  const fecha = funcion.fecha ? new Date(funcion.fecha).toLocaleDateString('es-UY') : '';
  const hora = funcion.hora || '20:00';

  return `Hola! 👋\n\n` +
    `Quiero comprar entradas para la función profesional:\n\n` +
    `🎭 Obra: ${funcion.obra_nombre || 'Función'}\n` +
    `📅 Fecha: ${fecha}\n` +
    `🕖 Hora: ${hora}\n` +
    `📍 Lugar: ${funcion.sala || 'A confirmar'}\n` +
    `🎫 Función Nº: ${funcion.id}\n\n` +
    `¿Cuál es la disponibilidad y el precio?`;
}

/**
 * 🛡️ HELPERS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
