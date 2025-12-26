'use strict';

import storage from '../utils/storage';

const STORAGE_KEY = 'baco:mock-data:v4-secure';
const SECRET_KEY = 'BACO_SECURE_V3';

function hashPassword(password) {
  // Simulación de hashing seguro (en producción usar bcrypt)
  return `hashed_${password.split('').reverse().join('')}`;
}

const defaultData = {
  users: [
    {
      id: '48376669',
      nombre: 'Super Baco',
      role: 'SUPER',
      password: hashPassword('1234'),
      email: 'super@bacoteatro.com',
      telefono: '+598 92 000 001',
      edad: 38,
      avatar: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=300&q=80',
      bio: 'Super usuario responsable de toda la experiencia Baco.',
    },
    {
      id: '48376668',
      nombre: 'Ana Directora',
      role: 'ADMIN',
      password: hashPassword('1234'),
      email: 'ana.directora@bacoteatro.com',
      telefono: '+598 92 000 002',
      edad: 34,
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80',
      bio: 'Directora artística y coordinadora de elenco.',
    },
    {
      id: '48376667',
      nombre: 'Lucas Actor',
      role: 'VENDEDOR',
      password: hashPassword('1234'),
      email: 'lucas.actor@bacoteatro.com',
      telefono: '+598 92 000 003',
      edad: 29,
      avatar: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=300&q=80',
      bio: 'Actor y vendedor principal en sala grande.',
    },
    {
      id: '48999111',
      nombre: 'Maria Actriz',
      role: 'VENDEDOR',
      password: hashPassword('1234'),
      email: 'maria.actriz@bacoteatro.com',
      telefono: '+598 92 000 004',
      edad: 30,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Actriz de reparto y asistente de dirección.',
    },
  ],
  rehearsals: [
    {
      id: 'reh-1',
      title: 'Lectura de guion',
      date: new Date(Date.now() + 86400000).toISOString(),
      location: 'Sala 1',
      notes: 'Traer copias impresas',
    }
  ],
  productions: [
    {
      id: 'prd-1',
      titulo: 'Las Voces de Baco',
      descripcion: 'Una noche inmersiva en sala principal',
      color: '#F48C06',
      directorId: '48376668',
      funciones: ['show-1'],
    },
  ],
  shows: [
    {
      id: 'show-1',
      obra: 'Las Voces de Baco',
      fecha: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 días en el futuro
      lugar: 'Sala principal',
      capacidad: 80,
      base_price: 900,
      directorId: '48376668',
      actores: ['48376667', '48999111'],
    },
    {
      id: 'show-2',
      obra: 'Sueños en la Oscuridad',
      fecha: new Date(Date.now() + 14 * 86400000).toISOString(), // 14 días en el futuro
      lugar: 'Teatro Circular',
      capacidad: 120,
      base_price: 750,
      directorId: '48376668',
      actores: ['48376667', '48999111'],
    },
    {
      id: 'show-3',
      obra: 'Cuentos de la Noche',
      fecha: new Date(Date.now() + 21 * 86400000).toISOString(), // 21 días en el futuro
      lugar: 'Sala alternativa',
      capacidad: 60,
      base_price: 850,
      directorId: '48376668',
      actores: ['48376667'],
    },
  ],
  tickets: [],
  transfers: [],
};

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadData() {
  const raw = await storage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : defaultData;
  if (!data.tickets.length) {
    seedTickets(data);
  }
  await storage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

async function saveData(data) {
  await storage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function seedTickets(data) {
  const existingCodes = new Set();
  const tickets = [];
  data.shows.forEach((show) => {
    for (let i = 0; i < show.capacidad; i++) {
      const code = generateTicketCode(existingCodes);
      tickets.push({
        id: `tck-${show.id}-${i + 1}`,
        code,
        showId: show.id,
        estado: 'DISPONIBLE',
        precio: show.base_price,
        actorId: null,
        history: [],
        createdAt: new Date().toISOString(),
      });
    }
  });
  data.tickets = tickets;
}

function generateChecksum(code) {
  let hash = 0;
  const str = code + SECRET_KEY;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 4).toUpperCase();
}

function generateTicketCode(existing) {
  let code;
  do {
    // High entropy code: 12 chars random + 4 chars checksum
    const randomPart = Array.from({ length: 12 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const checksum = generateChecksum(randomPart);
    code = `T-${randomPart}-${checksum}`;
  } while (existing.has(code));
  existing.add(code);
  return code;
}

function findUser(data, id) {
  return data.users.find((u) => u.id === id);
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

export async function getProfile(userId) {
  await delay();
  const data = await loadData();
  const user = findUser(data, userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return sanitizeUser(user);
}

export async function updateProfile(userId, payload) {
  await delay();
  const data = await loadData();
  const user = findUser(data, userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const allowed = ['nombre', 'email', 'telefono', 'edad', 'avatar', 'bio'];
  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      user[field] = field === 'edad' ? Number(payload[field]) || null : payload[field];
    }
  });

  if (payload.passwordChange) {
    const { currentPassword, newPassword } = payload.passwordChange;
    if (!currentPassword || !newPassword) {
      throw new Error('Para cambiar la contraseña completá los dos campos');
    }
    if (user.password !== hashPassword(currentPassword)) {
      throw new Error('La contraseña actual no coincide');
    }
    if (String(newPassword).length < 4) {
      throw new Error('La nueva contraseña debe tener al menos 4 dígitos');
    }
    user.password = hashPassword(String(newPassword));
  }

  await saveData(data);
  return sanitizeUser(user);
}

function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) {
    const err = new Error('No autorizado');
    err.status = 403;
    throw err;
  }
}

export async function login({ cedula, password }) {
  await delay();
  const data = await loadData();
  const hashedPassword = hashPassword(password);
  const user = data.users.find((u) => u.id === cedula && u.password === hashedPassword);
  if (!user) {
    const err = new Error('Credenciales incorrectas');
    err.status = 401;
    throw err;
  }
  return {
    token: `mock-${user.id}-${Date.now()}`,
    user: sanitizeUser(user),
  };
}

export async function getSuperDashboard() {
  await delay();
  const data = await loadData();
  const totals = {
    productions: data.productions.length,
    functions: data.shows.length,
    tickets: data.tickets.length,
    sold: data.tickets.filter((t) => t.estado === 'REPORTADA_VENDIDA' || t.estado === 'PAGADO').length,
    attendees: data.tickets.filter((t) => t.estado === 'USADO').length,
  };
  const upcomingShows = data.shows
    .filter((show) => new Date(show.fecha) > new Date())
    .slice(0, 3)
    .map((show) => ({
      ...show,
      ventasPagadas: data.tickets.filter((t) => t.showId === show.id && t.estado === 'PAGADO').length,
      actoresAsignados: show.actores.length,
    }));

  const alerts = data.transfers.slice(-5).reverse().map((event) => ({
    id: event.id,
    title: event.title,
    body: event.subtitle,
  }));

  return { totals, upcomingShows, alerts };
}

export async function listDirectors() {
  await delay();
  const data = await loadData();
  return data.users
    .filter((u) => u.role === 'ADMIN')
    .map((dir) => {
      const directorShows = data.shows.filter((s) => s.directorId === dir.id);
      return {
        cedula: dir.id,
        nombre: dir.nombre,
        obras: data.productions.filter((p) => p.directorId === dir.id).length,
        funciones: directorShows.length,
      };
    });
}

export async function listVendors() {
  await delay();
  const data = await loadData();
  return data.users
    .filter((u) => u.role === 'VENDEDOR')
    .map((actor) => {
      const tickets = data.tickets.filter((t) => t.actorId === actor.id);
      return {
        cedula: actor.id,
        nombre: actor.nombre,
        email: actor.email,
        telefono: actor.telefono,
        stock: tickets.length,
        vendidas: tickets.filter((t) => t.estado === 'REPORTADA_VENDIDA').length,
        pagadas: tickets.filter((t) => t.estado === 'PAGADO').length,
      };
    });
}

export async function deleteDirector(cedula) {
  await delay();
  const data = await loadData();
  const index = data.users.findIndex((u) => u.id === cedula && u.role === 'ADMIN');
  if (index === -1) throw new Error('Director no encontrado');

  const showsToRemove = data.shows.filter((show) => show.directorId === cedula).map((show) => show.id);
  const productionsToRemove = data.productions.filter((obra) => obra.directorId === cedula).map((obra) => obra.id);

  data.users.splice(index, 1);
  data.shows = data.shows.filter((show) => show.directorId !== cedula);
  data.productions = data.productions.filter((obra) => obra.directorId !== cedula);
  data.tickets = data.tickets.filter((ticket) => !showsToRemove.includes(ticket.showId));
  data.productions.forEach((obra) => {
    obra.funciones = obra.funciones.filter((showId) => !showsToRemove.includes(showId));
  });

  await saveData(data);
  return true;
}

export async function deleteVendor(cedula) {
  await delay();
  const data = await loadData();
  const index = data.users.findIndex((u) => u.id === cedula && u.role === 'VENDEDOR');
  if (index === -1) throw new Error('Vendedor no encontrado');

  data.users.splice(index, 1);
  data.tickets.forEach((ticket) => {
    if (ticket.actorId === cedula) {
      ticket.actorId = null;
      if (ticket.estado === 'RESERVADO') {
        ticket.estado = 'DISPONIBLE';
      }
      ticket.history.push({
        id: `evt-${Date.now()}`,
        type: 'REMOVE_ACTOR',
        from: cedula,
        date: new Date().toISOString(),
      });
    }
  });

  data.transfers.push({
    id: `remove-actor-${Date.now()}`,
    title: `Vendedor ${cedula} eliminado`,
    subtitle: 'Stock devuelto a la direccion',
    date: new Date().toISOString(),
  });

  await saveData(data);
  return true;
}

export async function createDirector({ nombre, cedula }) {
  await delay();
  const data = await loadData();
  if (findUser(data, cedula)) {
    throw new Error('La cedula ya existe');
  }
  data.users.push({ id: cedula, nombre, role: 'ADMIN', password: hashPassword('1234') });
  await saveData(data);
  return true;
}

export async function createVendor({ nombre, cedula }) {
  await delay();
  const data = await loadData();
  if (findUser(data, cedula)) {
    throw new Error('La cedula ya existe');
  }
  data.users.push({ id: cedula, nombre, role: 'VENDEDOR', password: hashPassword('1234') });
  await saveData(data);
  return true;
}

export async function resetDirectorPassword(cedula) {
  await delay();
  const data = await loadData();
  const user = findUser(data, cedula);
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Director no encontrado');
  }
  user.password = hashPassword('1234');
  await saveData(data);
  return true;
}

export async function listProductions() {
  await delay();
  const data = await loadData();
  return data.productions.map((obra) => {
    const funciones = obra.funciones.length;
    const entradas = data.tickets.filter((t) => obra.funciones.includes(t.showId)).length;
    return {
      ...obra,
      funciones,
      entradas,
      estado: funciones ? 'En venta' : 'Pre-produccion',
    };
  });
}

export async function createProduction(payload) {
  await delay();
  const data = await loadData();
  const newProduction = {
    id: `prd-${Date.now()}`,
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    color: payload.color || '#F48C06',
    directorId: payload.directorId || data.users.find((u) => u.role === 'ADMIN')?.id,
    funciones: [],
  };
  data.productions.push(newProduction);
  await saveData(data);
  return newProduction;
}

export async function listDirectorShows(directorId) {
  await delay();
  const data = await loadData();
  return data.shows
    .filter((show) => show.directorId === directorId)
    .map((show) => {
      const tickets = data.tickets.filter((t) => t.showId === show.id);
      const salesByActor = {};
      tickets.forEach((ticket) => {
        if (!ticket.actorId) return;
        if (!salesByActor[ticket.actorId]) {
          salesByActor[ticket.actorId] = {
            stock: 0,
            vendidas: 0,
            pagadas: 0,
            entregado: 0,
            deuda: 0,
          };
        }
        const bucket = salesByActor[ticket.actorId];
        if (ticket.estado === 'STOCK_VENDEDOR' || ticket.estado === 'RESERVADO') {
          bucket.stock += 1;
        }
        if (ticket.estado === 'REPORTADA_VENDIDA') {
          bucket.vendidas += 1;
          bucket.deuda += ticket.precio || 0;
        }
        if (ticket.estado === 'PAGADO') {
          bucket.pagadas += 1;
          bucket.entregado += ticket.precio || 0;
        }
        if (ticket.estado === 'USADO') {
          bucket.pagadas += 1;
          bucket.entregado += ticket.precio || 0;
        }
      });

      const actorsDetails = Object.entries(salesByActor).map(([actorId, stats]) => {
        const actor = data.users.find((u) => u.id === actorId);
        return {
          id: actorId,
          nombre: actor?.nombre || 'Sin nombre',
          ...stats,
        };
      });

      const topSeller = [...actorsDetails]
        .sort((a, b) => (b.pagadas - a.pagadas) || (b.vendidas - a.vendidas))
        [0] || null;

      const asistencia = tickets.filter((t) => t.estado === 'USADO').length;
      const recaudacion = tickets
        .filter((t) => ['PAGADO', 'USADO'].includes(t.estado))
        .reduce((sum, t) => sum + (t.precio || 0), 0);
      const deudaPendiente = tickets
        .filter((t) => t.estado === 'REPORTADA_VENDIDA')
        .reduce((sum, t) => sum + (t.precio || 0), 0);

      return {
        ...show,
        enStock: tickets.filter((t) => t.estado === 'STOCK_VENDEDOR').length,
        vendidas: tickets.filter((t) => t.estado === 'REPORTADA_VENDIDA').length,
        pagadas: tickets.filter((t) => t.estado === 'PAGADO').length,
        insights: {
          asistencia,
          recaudacion,
          deudaPendiente,
          topSeller: topSeller
            ? { nombre: topSeller.nombre, pagadas: topSeller.pagadas, vendidas: topSeller.vendidas }
            : null,
          actores: actorsDetails,
        },
      };
    });
}

export async function createShow(directorId, payload) {
  await delay();
  const data = await loadData();
  
  // Security Check: Ensure user is ADMIN
  const director = findUser(data, directorId);
  requireRole(director, ['ADMIN', 'SUPER']);

  const id = `show-${Date.now()}`;
  const show = {
    id,
    obra: payload.obra,
    fecha: payload.fecha,
    lugar: payload.lugar,
    capacidad: payload.capacidad,
    base_price: payload.base_price,
    directorId,
    actores: [],
  };
  data.shows.push(show);
  const existingCodes = new Set(data.tickets.map((t) => t.code));
  for (let i = 0; i < payload.capacidad; i++) {
    data.tickets.push({
      id: `tck-${id}-${i + 1}`,
      code: generateTicketCode(existingCodes),
      showId: id,
      estado: 'DISPONIBLE',
      precio: payload.base_price,
      actorId: null,
      history: [],
      createdAt: new Date().toISOString(),
    });
  }
  await saveData(data);
  return show;
}

export async function assignTicketsToActor(directorId, { showId, actorId, cantidad }) {
  await delay();
  const data = await loadData();

  // Security Check: Ensure user is ADMIN
  const director = findUser(data, directorId);
  requireRole(director, ['ADMIN', 'SUPER']);

  const show = data.shows.find((s) => s.id === showId && s.directorId === directorId);
  if (!show) throw new Error('Funcion no encontrada');
  const actor = findUser(data, actorId);
  if (!actor || actor.role !== 'VENDEDOR') throw new Error('Actor inexistente');
  const disponibles = data.tickets.filter((t) => t.showId === showId && t.estado === 'DISPONIBLE');
  if (disponibles.length < cantidad) throw new Error(`Solo hay ${disponibles.length} entradas libres`);
  disponibles.slice(0, cantidad).forEach((ticket) => {
    ticket.estado = 'STOCK_VENDEDOR';
    ticket.actorId = actorId;
    ticket.history.push({
      id: `evt-${Date.now()}`,
      type: 'ASIGNACION',
      from: 'Direccion',
      to: actorId,
      date: new Date().toISOString(),
    });
  });
  if (!show.actores.includes(actorId)) {
    show.actores.push(actorId);
  }
  await saveData(data);
  return true;
}

export async function markTicketsAsPaid(directorId, { showId, actorId }) {
  await delay();
  const data = await loadData();

  // Security Check: Ensure user is ADMIN
  const director = findUser(data, directorId);
  requireRole(director, ['ADMIN', 'SUPER']);

  const show = data.shows.find((s) => s.id === showId && s.directorId === directorId);
  if (!show) throw new Error('Funcion no encontrada');
  
  const ticketsToPay = data.tickets.filter(t => 
    t.showId === showId && 
    t.actorId === actorId && 
    t.estado === 'REPORTADA_VENDIDA'
  );
  
  if (ticketsToPay.length === 0) throw new Error('No hay entradas vendidas para cobrar');
  
  ticketsToPay.forEach(ticket => {
    ticket.estado = 'PAGADO';
    ticket.history.push({
      id: `evt-${Date.now()}`,
      type: 'COBRO_DIRECTOR',
      from: actorId,
      to: 'Direccion',
      date: new Date().toISOString(),
    });
  });
  
  await saveData(data);
  return ticketsToPay.length;
}

export async function getDirectorDashboard(directorId) {
  await delay();
  const data = await loadData();
  const shows = data.shows.filter((show) => show.directorId === directorId);
  const tickets = data.tickets.filter((t) => shows.some((show) => show.id === t.showId));
  const actors = data.users.filter((u) => u.role === 'VENDEDOR');
  return {
    obraPrincipal: shows[0]?.obra,
    stats: {
      tickets: tickets.length,
      pagadas: tickets.filter((t) => t.estado === 'PAGADO').length,
      actores: new Set(tickets.map((t) => t.actorId).filter(Boolean)).size,
    },
    functions: shows.map((show) => {
      const showTickets = tickets.filter((t) => t.showId === show.id);
      return {
        id: show.id,
        titulo: show.obra,
        fecha: show.fecha,
        localidad: show.lugar,
        pagadas: showTickets.filter((t) => t.estado === 'PAGADO').length,
        usadas: showTickets.filter((t) => t.estado === 'USADO').length,
      };
    }),
    actors: actors.map((actor) => {
      const actorTickets = tickets.filter((t) => t.actorId === actor.id);
      const vendidas = actorTickets.filter((t) => t.estado === 'REPORTADA_VENDIDA').length;
      const pagadas = actorTickets.filter((t) => t.estado === 'PAGADO').length;
      const caja = actorTickets
        .filter((t) => ['PAGADO', 'USADO'].includes(t.estado))
        .reduce((sum, t) => sum + (t.precio || 0), 0);
      return {
        id: actor.id,
        nombre: actor.nombre,
        stock: actorTickets.length,
        vendidas,
        pagadas,
        caja,
      };
    }),
  };
}

export async function getDirectorReports(directorId) {
  await delay();
  const data = await loadData();
  const shows = data.shows.filter((show) => show.directorId === directorId);
  const tickets = data.tickets.filter((t) => shows.some((show) => show.id === t.showId));
  const actorsSummary = data.users
    .filter((u) => u.role === 'VENDEDOR')
    .map((actor) => {
      const actorTickets = tickets.filter((t) => t.actorId === actor.id);
      const pagadas = actorTickets.filter((t) => t.estado === 'PAGADO').length;
      const entregado = actorTickets
        .filter((t) => ['PAGADO', 'USADO'].includes(t.estado))
        .reduce((sum, t) => sum + (t.precio || 0), 0);
      const deuda = actorTickets
        .filter((t) => t.estado === 'REPORTADA_VENDIDA')
        .reduce((sum, t) => sum + (t.precio || 0), 0);
      return {
        id: actor.id,
        nombre: actor.nombre,
        vendidas: actorTickets.length,
        pagadas,
        entregado,
        deuda,
      };
    });
  return {
    actors: actorsSummary,
    events: data.transfers.slice(-10).reverse(),
  };
}

export async function validateTicket(code) {
  await delay();

  // 1. Security Check: Validate format and checksum
  const parts = code.split('-');
  if (parts.length !== 3 || parts[0] !== 'T') {
     return { ok: false, message: 'Formato de entrada invalido' };
  }
  const randomPart = parts[1];
  const checksum = parts[2];
  if (generateChecksum(randomPart) !== checksum) {
     return { ok: false, message: 'Entrada falsificada o invalida (Firma incorrecta)' };
  }

  const data = await loadData();
  const ticket = data.tickets.find((t) => t.code === code || t.id === code);
  if (!ticket) {
    return { ok: false, message: 'Ticket inexistente' };
  }
  const show = data.shows.find((s) => s.id === ticket.showId);
  
  // 2. Security Check: Validate Show Date (Optional but good)
  // if (new Date(show.fecha) < new Date()) { ... }

  if (!['PAGADO', 'USADO'].includes(ticket.estado)) {
    return { ok: false, message: 'La entrada debe estar PAGADA para ingresar', ticket: enrichTicket(ticket, show, data) };
  }
  if (ticket.estado === 'USADO') {
    return { ok: false, message: 'Ticket ya utilizado', ticket: enrichTicket(ticket, show, data) };
  }
  ticket.estado = 'USADO';
  ticket.history.push({
    id: `evt-${Date.now()}`,
    type: 'SCAN',
    date: new Date().toISOString(),
    to: 'Sala',
  });
  await saveData(data);
  return { ok: true, message: 'Ingreso aprobado', ticket: enrichTicket(ticket, show, data) };
}

function enrichTicket(ticket, show, data) {
  const actor = ticket.actorId ? data.users.find((u) => u.id === ticket.actorId) : null;
  return {
    ...ticket,
    obra: show?.obra,
    fecha: show?.fecha,
    vendedor_nombre: actor?.nombre,
  };
}

export async function getActorStock(actorId) {
  await delay();
  const data = await loadData();
  const tickets = data.tickets.filter((t) => t.actorId === actorId && t.estado !== 'USADO');
  const grouped = {};
  tickets.forEach((ticket) => {
    const show = data.shows.find((s) => s.id === ticket.showId);
    grouped[ticket.showId] = grouped[ticket.showId] || { 
      showId: ticket.showId, 
      obra: show?.obra, 
      fecha: show?.fecha,
      lugar: show?.lugar,
      tickets: [] 
    };
    grouped[ticket.showId].tickets.push(ticket);
  });
  return Object.values(grouped).map((group) => ({
    ...group,
    vendidas: group.tickets.filter((t) => t.estado === 'REPORTADA_VENDIDA').length,
    pagadas: group.tickets.filter((t) => t.estado === 'PAGADO').length,
  }));
}

export async function updateTicketStatus(actorId, { ticketId, estado, comprador_nombre, comprador_telefono }) {
  await delay();
  const data = await loadData();
  const ticket = data.tickets.find((t) => t.id === ticketId && t.actorId === actorId);
  if (!ticket) throw new Error('Ticket no encontrado');
  
  ticket.estado = estado;
  if (comprador_nombre !== undefined) ticket.comprador_nombre = comprador_nombre;
  if (comprador_telefono !== undefined) ticket.comprador_telefono = comprador_telefono;

  ticket.history.push({
    id: `evt-${Date.now()}`,
    type: estado,
    actorId,
    date: new Date().toISOString(),
    details: { comprador_nombre, comprador_telefono }
  });
  await saveData(data);
  return ticket;
}

export async function transferTicket(actorId, { ticketCode, destino, motivo }) {
  await delay();
  const data = await loadData();
  const ticket = data.tickets.find((t) => t.code === ticketCode && t.actorId === actorId);
  if (!ticket) throw new Error('Ticket no encontrado en tu stock');
  const target = findUser(data, destino);
  if (!target || target.role !== 'VENDEDOR') throw new Error('Actor destino invalido');
  ticket.actorId = destino;
  ticket.history.push({
    id: `evt-${Date.now()}`,
    type: 'TRANSFER',
    from: actorId,
    to: destino,
    reason: motivo,
    date: new Date().toISOString(),
  });
  data.transfers.push({
    id: `transfer-${Date.now()}`,
    title: `Ticket ${ticket.code} transferido`,
    subtitle: `${actorId} -> ${destino}`,
    date: new Date().toISOString(),
  });
  await saveData(data);
  return ticket;
}

export async function getActorTransfers(actorId) {
  await delay();
  const data = await loadData();
  return data.transfers.filter((t) => t.subtitle.includes(actorId)).slice(-10).reverse();
}

export async function getActorHistory(actorId) {
  await delay();
  const data = await loadData();
  const tickets = data.tickets.filter((t) => t.actorId === actorId || t.history.some((evt) => evt.from === actorId));
  const resumen = {
    vendidas: tickets.filter((t) => t.estado === 'REPORTADA_VENDIDA').length,
    pagadas: tickets.filter((t) => t.estado === 'PAGADO').length,
    entregado: tickets
      .filter((t) => ['PAGADO', 'USADO'].includes(t.estado))
      .reduce((sum, t) => sum + (t.precio || 0), 0),
  };
  const usadas = data.shows
    .map((show) => ({
      showId: show.id,
      obra: show.obra,
      fecha: show.fecha,
      cantidad: data.tickets.filter((t) => t.showId === show.id && t.estado === 'USADO').length,
    }))
    .filter((item) => item.cantidad > 0);
  return { resumen, usadas };
}

// --- Rehearsals & Guest Features ---

export async function createRehearsal(payload) {
  await delay();
  const data = await loadData();
  const rehearsal = {
    id: `reh-${Date.now()}`,
    ...payload,
  };
  if (!data.rehearsals) data.rehearsals = [];
  data.rehearsals.push(rehearsal);
  await saveData(data);
  return rehearsal;
}

export async function getShowRehearsals(showId) {
  await delay();
  const data = await loadData();
  return (data.rehearsals || []).filter(r => r.showId === showId);
}

export async function getActorSchedule(actorId) {
  await delay();
  const data = await loadData();
  // Find shows where actor is assigned
  const myShows = data.shows.filter(s => s.actores.includes(actorId));
  const myShowIds = myShows.map(s => s.id);
  
  // Find rehearsals for those shows
  const rehearsals = (data.rehearsals || []).filter(r => myShowIds.includes(r.showId));
  
  return {
    shows: myShows,
    rehearsals: rehearsals.map(r => ({
      ...r,
      obra: data.shows.find(s => s.id === r.showId)?.obra
    }))
  };
}

export async function getPublicShows() {
  await delay();
  const data = await loadData();
  // Return only future shows
  return data.shows
    .filter(s => new Date(s.fecha) > new Date())
    .map(s => ({
      id: s.id,
      obra: s.obra,
      fecha: s.fecha,
      lugar: s.lugar,
      capacidad: s.capacidad,
      actoresCount: s.actores.length
    }));
}

export async function getPublicShowDetails(showId) {
  await delay();
  const data = await loadData();
  const show = data.shows.find(s => s.id === showId);
  if (!show) throw new Error('Show no encontrado');
  
  const actors = show.actores.map(actorId => {
    const actor = data.users.find(u => u.id === actorId);
    const stock = data.tickets.filter(t => t.showId === showId && t.actorId === actorId && t.estado === 'STOCK_VENDEDOR').length;
    return {
      id: actor.id,
      nombre: actor.nombre,
      avatar: actor.avatar,
      stock
    };
  }).filter(a => a.stock > 0); // Only show actors with stock

  return {
    ...show,
    actores: actors
  };
}

export async function guestReserveTicket({ showId, actorId, nombre, telefono }) {
  await delay();
  const data = await loadData();
  
  // Find a ticket
  const ticket = data.tickets.find(t => 
    t.showId === showId && 
    t.actorId === actorId && 
    t.estado === 'STOCK_VENDEDOR'
  );
  
  if (!ticket) throw new Error('No quedan entradas con este vendedor');
  
  ticket.estado = 'RESERVADO';
  ticket.comprador_nombre = nombre;
  ticket.comprador_telefono = telefono;
  ticket.history.push({
    id: `evt-${Date.now()}`,
    type: 'RESERVA_INVITADO',
    date: new Date().toISOString(),
    details: { nombre, telefono }
  });
  
  await saveData(data);
  return ticket;
}

export async function listRehearsals() {
  await delay();
  const data = await loadData();
  return (data.rehearsals || []).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function deleteRehearsal(id) {
  await delay();
  const data = await loadData();
  if (data.rehearsals) {
    data.rehearsals = data.rehearsals.filter(r => r.id !== id);
    await saveData(data);
  }
}
