import storage from '../utils/storage';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Datos locales simulados
let localData = {
  users: [
    {
      id: '48376669', // Cédula del supremo
      nombre: 'Barrios',
      rol: 'supremo',
      password: 'Te amo mama 1991'
    },
    {
      id: '48376668', // Admin fijo
      nombre: 'Admin Sistema',
      rol: 'admin',
      password: 'admin123'
    },
    {
      id: '48376667', // Vendedor fijo
      nombre: 'Vendedor Base',
      rol: 'vendedor',
      password: 'vendedor123'
    }
  ],
  shows: [],
  tickets: [],
  showAssignments: [] // Asignaciones de vendedores a funciones
};

// Helper para generar código QR único
const generateQRCode = () => {
  return 'QR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Helper para guardar datos locales
const saveLocalData = () => {
  localStorage.setItem('bacoTeatroData', JSON.stringify(localData));
};

// Helper para cargar datos locales
const loadLocalData = () => {
  const data = localStorage.getItem('bacoTeatroData');
  if (data) {
    localData = JSON.parse(data);
  }
};

// Cargar datos al inicio
loadLocalData();

// Exportar localData para acceso desde componentes
export { localData };

// Helper para incluir token en requests (simulado)
async function getHeaders() {
  const token = await storage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// ============= AUTH =============

export async function login(cedula, password) {
  await delay(500); // Simular delay
  
  const user = localData.users.find(u => u.id === cedula);
  if (!user || user.password !== password) {
    return { error: 'Credenciales incorrectas' };
  }
  
  // Generar token simulado
  const token = 'token_simulado_' + Date.now();
  
  return {
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol
    }
  };
}

// ============= SHOWS & TICKETS =============

export async function crearShow(data) {
  await delay(500);
  
  const newShow = {
    id: Date.now().toString(),
    nombre: data.nombre,
    fecha: data.fecha,
    precio: data.precio,
    totalTickets: parseInt(data.cantidadTickets),
    creadoPor: data.creadoPor
  };
  
  localData.shows.push(newShow);
  
  // Generar tickets
  const newTickets = Array.from({ length: newShow.totalTickets }, (_, i) => ({
    id: generateQRCode(),
    showId: newShow.id,
    estado: 'NO_ASIGNADO', // NO_ASIGNADO, EN_PODER, VENDIDA_NO_PAGADA, VENDIDA_PAGADA, USADA
    vendedorId: null,
    comprador: null,
    fechaVenta: null,
    fechaPago: null,
    fechaUso: null
  }));
  
  localData.tickets.push(...newTickets);
  saveLocalData();
  
  return { success: true, show: newShow };
}

export async function getShows() {
  await delay(300);
  return localData.shows;
}

export async function getVendedores() {
  await delay(300);
  return localData.users.filter(u => u.rol === 'vendedor');
}

export async function asignarTickets(showId, vendedorId, cantidad) {
  await delay(500);
  
  const ticketsDisponibles = localData.tickets.filter(
    t => t.showId === showId && t.estado === 'NO_ASIGNADO'
  );
  
  if (ticketsDisponibles.length < cantidad) {
    return { error: `Solo hay ${ticketsDisponibles.length} tickets disponibles` };
  }
  
  const ticketsAAsignar = ticketsDisponibles.slice(0, cantidad);
  ticketsAAsignar.forEach(t => {
    t.estado = 'EN_PODER';
    t.vendedorId = vendedorId;
  });
  
  saveLocalData();
  return { success: true, asignados: ticketsAAsignar.length };
}

export async function getTicketsVendedor(vendedorId) {
  await delay(300);
  const tickets = localData.tickets.filter(t => t.vendedorId === vendedorId);
  
  // Enriquecer con info del show
  return tickets.map(t => {
    const show = localData.shows.find(s => s.id === t.showId);
    return { ...t, showNombre: show?.nombre, showFecha: show?.fecha, precio: show?.precio };
  });
}

export async function registrarVenta(ticketId, compradorNombre) {
  await delay(500);
  const ticket = localData.tickets.find(t => t.id === ticketId);
  
  if (!ticket) return { error: 'Ticket no encontrado' };
  if (ticket.estado !== 'EN_PODER') return { error: 'Ticket no disponible para venta' };
  
  ticket.estado = 'VENDIDA_NO_PAGADA';
  ticket.comprador = compradorNombre;
  ticket.fechaVenta = new Date().toISOString();
  
  saveLocalData();
  return { success: true, ticket };
}

export async function entregarPlata(ticketId) {
  await delay(500);
  const ticket = localData.tickets.find(t => t.id === ticketId);
  
  if (!ticket) return { error: 'Ticket no encontrado' };
  if (ticket.estado !== 'VENDIDA_NO_PAGADA') return { error: 'Estado incorrecto' };
  
  ticket.estado = 'VENDIDA_PAGADA';
  ticket.fechaPago = new Date().toISOString();
  
  saveLocalData();
  return { success: true, ticket };
}

export async function validarTicket(qrCode) {
  await delay(500);
  const ticket = localData.tickets.find(t => t.id === qrCode);
  
  if (!ticket) return { error: 'Ticket inválido' };
  
  const show = localData.shows.find(s => s.id === ticket.showId);
  
  if (ticket.estado === 'USADA') {
    return { 
      error: 'Ticket ya utilizado', 
      ticket: { ...ticket, showNombre: show?.nombre } 
    };
  }
  
  if (ticket.estado !== 'VENDIDA_PAGADA' && ticket.estado !== 'VENDIDA_NO_PAGADA') {
    return { 
      error: 'Ticket no vendido o no válido para ingreso',
      ticket: { ...ticket, showNombre: show?.nombre }
    };
  }
  
  // Marcar como usada
  ticket.estado = 'USADA';
  ticket.fechaUso = new Date().toISOString();
  saveLocalData();
  
  return { 
    success: true, 
    ticket: { ...ticket, showNombre: show?.nombre },
    mensaje: '¡Bienvenido! Entrada válida.'
  };
}

export async function getReporteGeneral() {
  await delay(500);
  
  const reporte = localData.users
    .filter(u => u.rol === 'vendedor')
    .map(vendedor => {
      const tickets = localData.tickets.filter(t => t.vendedorId === vendedor.id);
      return {
        vendedor: vendedor.nombre,
        asignadas: tickets.length,
        vendidasNoPagadas: tickets.filter(t => t.estado === 'VENDIDA_NO_PAGADA').length,
        vendidasPagadas: tickets.filter(t => t.estado === 'VENDIDA_PAGADA').length,
        usadas: tickets.filter(t => t.estado === 'USADA').length,
        remanente: tickets.filter(t => t.estado === 'EN_PODER').length,
        totalPlata: tickets
          .filter(t => ['VENDIDA_PAGADA', 'USADA'].includes(t.estado))
          .reduce((acc, t) => {
            const show = localData.shows.find(s => s.id === t.showId);
            return acc + (parseInt(show?.precio) || 0);
          }, 0)
      };
    });
    
  return reporte;
}
  
  const newUser = {
    id: data.cedula,
    nombre: data.nombre,
    rol: 'admin',
    password: 'admin123' // Password por defecto
  };
  
  localData.users.push(newUser);
  saveLocalData();
  
  return { success: true };
}

export async function crearVendedor(data) {
  await delay(300);
  
  // Verificar IDs fijos del sistema
  const idsFijos = ['48376668', '48376667'];
  if (idsFijos.includes(data.cedula)) {
    return { error: 'Esta cédula está reservada para el sistema' };
  }
  
  if (localData.users.find(u => u.id === data.cedula)) {
    return { error: 'La cédula ya está registrada' };
  }
  
  const newUser = {
    id: data.cedula,
    nombre: data.nombre,
    rol: 'vendedor',
    password: 'vendedor123'
  };
  
  localData.users.push(newUser);
  saveLocalData();
  
  return { success: true };
}

export async function listarUsuarios(filtros = {}) {
  await delay(300);
  
  let users = localData.users.filter(u => u.rol !== 'supremo'); // No mostrar supremo
  
  if (filtros.rol) {
    users = users.filter(u => u.rol === filtros.rol);
  }
  
  return users;
}

// ============= SHOWS =============

export async function getShows() {
  await delay(300);
  return localData.shows;
}

export async function createShow(data) {
  console.log('=== API createShow LLAMADA ===');
  console.log('Datos recibidos:', data);
  await delay(300);

  const newShow = {
    id: Date.now().toString(),
    obra: data.obra,
    fecha: data.fecha,
    capacidad: data.capacidad,
    base_price: data.base_price,
    vendedores: [] // Vendedores asignados a esta función
  };

  // Crear tickets automáticamente
  const tickets = [];
  for (let i = 0; i < data.capacidad; i++) {
    const ticket = {
      id: `TICKET_${newShow.id}_${i + 1}`,
      show_id: newShow.id,
      qr_code: generateQRCode(),
      estado: 'pendiente', // pendiente, reservada, vendida, usado
      vendedor_id: null, // Se asignará cuando el admin distribuya
      precio: data.base_price,
      entregado: false, // Si se entregó físicamente al cliente
      vendido_at: null, // Timestamp cuando se vendió
      usado_at: null, // Timestamp cuando se validó en entrada
      created_at: new Date().toISOString()
    };
    tickets.push(ticket);
  }

  console.log(`Creados ${tickets.length} tickets para la función`);

  localData.shows.push(newShow);
  localData.tickets.push(...tickets);
  saveLocalData();

  console.log('Shows guardados en localStorage');

  return { success: true, show: newShow, tickets_created: tickets.length };
}

// ============= SHOW ASSIGNMENTS & TICKET DISTRIBUTION =============

export async function asignarVendedorAFuncion(showId, vendedorId) {
  await delay(300);

  const show = localData.shows.find(s => s.id === showId);
  if (!show) {
    return { error: 'Función no encontrada' };
  }

  const vendedor = localData.users.find(u => u.id === vendedorId && u.rol === 'vendedor');
  if (!vendedor) {
    return { error: 'Vendedor no encontrado' };
  }

  // Verificar si ya está asignado
  if (show.vendedores.includes(vendedorId)) {
    return { error: 'Vendedor ya asignado a esta función' };
  }

  show.vendedores.push(vendedorId);
  saveLocalData();

  return { success: true };
}

export async function quitarVendedorDeFuncion(showId, vendedorId) {
  await delay(300);

  const show = localData.shows.find(s => s.id === showId);
  if (!show) {
    return { error: 'Función no encontrada' };
  }

  show.vendedores = show.vendedores.filter(id => id !== vendedorId);
  saveLocalData();

  return { success: true };
}

export async function distribuirTickets(showId, distribucion) {
  // distribucion: [{ vendedor_id: string, cantidad: number }]
  await delay(300);

  const show = localData.shows.find(s => s.id === showId);
  if (!show) {
    return { error: 'Función no encontrada' };
  }

  const ticketsPendientes = localData.tickets.filter(t =>
    t.show_id === showId && t.estado === 'pendiente'
  );

  let ticketIndex = 0;

  for (const item of distribucion) {
    const cantidad = Math.min(item.cantidad, ticketsPendientes.length - ticketIndex);

    for (let i = 0; i < cantidad; i++) {
      ticketsPendientes[ticketIndex].vendedor_id = item.vendedor_id;
      ticketIndex++;
    }
  }

  saveLocalData();

  return { success: true, tickets_asignados: ticketIndex };
}

export async function getTicketsPorFuncion(showId) {
  await delay(300);

  const tickets = localData.tickets.filter(t => t.show_id === showId);
  const show = localData.shows.find(s => s.id === showId);

  if (!show) {
    return { error: 'Función no encontrada' };
  }

  // Agrupar por vendedor
  const porVendedor = {};
  show.vendedores.forEach(vendedorId => {
    const vendedor = localData.users.find(u => u.id === vendedorId);
    porVendedor[vendedorId] = {
      nombre: vendedor.nombre,
      tickets: tickets.filter(t => t.vendedor_id === vendedorId),
      estadisticas: {
        total: 0,
        vendidos: 0,
        reservados: 0,
        pendientes: 0
      }
    };
  });

  // Calcular estadísticas
  tickets.forEach(ticket => {
    if (ticket.vendedor_id && porVendedor[ticket.vendedor_id]) {
      porVendedor[ticket.vendedor_id].estadisticas.total++;
      porVendedor[ticket.vendedor_id].estadisticas[ticket.estado + 's']++;
    }
  });

  return {
    show: show,
    tickets: tickets,
    por_vendedor: porVendedor,
    sin_asignar: tickets.filter(t => !t.vendedor_id).length
  };
}

export async function actualizarEstadoTicket(ticketId, nuevoEstado, vendedorId = null) {
  await delay(300);

  const ticket = localData.tickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { error: 'Ticket no encontrado' };
  }

  // Validar estados permitidos
  const estadosValidos = ['pendiente', 'reservada', 'vendida', 'usado'];
  if (!estadosValidos.includes(nuevoEstado)) {
    return { error: 'Estado no válido' };
  }

  ticket.estado = nuevoEstado;
  if (vendedorId) {
    ticket.vendedor_id = vendedorId;
  }

  // Actualizar timestamps según el estado
  if (nuevoEstado === 'vendida' && !ticket.vendido_at) {
    ticket.vendido_at = new Date().toISOString();
  } else if (nuevoEstado === 'usado' && !ticket.usado_at) {
    ticket.usado_at = new Date().toISOString();
  }

  saveLocalData();

  return { success: true, ticket: ticket };
}

export async function marcarTicketEntregado(ticketId) {
  await delay(300);

  const ticket = localData.tickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { error: 'Ticket no encontrado' };
  }

  ticket.entregado = true;
  saveLocalData();

  return { success: true, ticket: ticket };
}

export async function validarQRCode(qrCode) {
  await delay(300);

  const ticket = localData.tickets.find(t => t.qr_code === qrCode);
  if (!ticket) {
    return { error: 'Código QR no válido' };
  }

  const show = localData.shows.find(s => s.id === ticket.show_id);
  const vendedor = ticket.vendedor_id ? localData.users.find(u => u.id === ticket.vendedor_id) : null;

  return {
    valido: true,
    ticket: ticket,
    show: show,
    vendedor: vendedor,
    ya_usado: ticket.estado === 'usado',
    puede_usar: ticket.estado === 'vendida' && ticket.entregado
  };
}

export async function usarTicket(qrCode) {
  await delay(300);

  const ticket = localData.tickets.find(t => t.qr_code === qrCode);
  if (!ticket) {
    return { error: 'Código QR no válido' };
  }

  if (ticket.estado !== 'vendida' || !ticket.entregado) {
    return { error: 'Ticket no válido para usar' };
  }

  if (ticket.estado === 'usado') {
    return { error: 'Ticket ya fue usado' };
  }

  ticket.estado = 'usado';
  ticket.usado_at = new Date().toISOString();
  saveLocalData();

  return { success: true, ticket: ticket };
}

export async function getUserById(userId) {
  await delay(300);
  return localData.users.find(u => u.id === userId);
}

// ============= TICKETS (simplificado) =============

export async function getMisTickets(showId = null) {
  await delay(300);
  
  let tickets = localData.tickets;
  if (showId) {
    tickets = tickets.filter(t => t.show_id === showId);
  }
  
  return tickets;
}
