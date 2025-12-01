import { query } from '../db/postgres.js';

// Leer todos los datos de la base de datos (equivalente a readData del archivo JSON)
export async function readData() {
  try {
    const [usersRes, showsRes, ticketsRes] = await Promise.all([
      query('SELECT * FROM users ORDER BY created_at DESC'),
      query('SELECT * FROM shows ORDER BY created_at DESC'),
      query('SELECT * FROM tickets ORDER BY created_at DESC')
    ]);

    return {
      users: usersRes.rows,
      shows: showsRes.rows,
      tickets: ticketsRes.rows
    };
  } catch (error) {
    console.error('Error leyendo datos:', error);
    throw error;
  }
}

// Escribir datos completos (útil para migraciones, pero no recomendado en producción)
export async function writeData(data) {
  console.warn('writeData: Esta función reemplaza TODOS los datos. Usar con precaución.');
  
  try {
    // Limpiar tablas existentes
    await query('DELETE FROM tickets');
    await query('DELETE FROM shows');
    await query('DELETE FROM users');

    // Insertar usuarios
    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        await query(
          `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.cedula, user.nombre, user.password, user.rol, user.created_at || new Date(), user.updated_at || new Date()]
        );
      }
    }

    // Insertar shows
    if (data.shows && data.shows.length > 0) {
      for (const show of data.shows) {
        await query(
          `INSERT INTO shows (id, nombre, fecha, precio, total_tickets, creado_por, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [show.id, show.nombre, show.fecha, show.precio, show.total_tickets || show.totalTickets, show.creado_por || show.creadoPor, show.created_at || new Date(), show.updated_at || new Date()]
        );
      }
    }

    // Insertar tickets
    if (data.tickets && data.tickets.length > 0) {
      for (const ticket of data.tickets) {
        await query(
          `INSERT INTO tickets (id, show_id, qr_code, estado, vendedor_id, precio_venta, comprador_nombre, comprador_contacto, 
                                fecha_asignacion, fecha_venta, fecha_uso, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            ticket.id, 
            ticket.show_id || ticket.showId, 
            ticket.qr_code || ticket.qrCode, 
            ticket.estado, 
            ticket.vendedor_id || ticket.vendedorId, 
            ticket.precio_venta || ticket.precioVenta,
            ticket.comprador_nombre || ticket.compradorNombre,
            ticket.comprador_contacto || ticket.compradorContacto,
            ticket.fecha_asignacion || ticket.fechaAsignacion,
            ticket.fecha_venta || ticket.fechaVenta,
            ticket.fecha_uso || ticket.fechaUso,
            ticket.created_at || new Date(),
            ticket.updated_at || new Date()
          ]
        );
      }
    }

    return await readData();
  } catch (error) {
    console.error('Error escribiendo datos:', error);
    throw error;
  }
}

// Actualizar datos usando una función callback (manteniendo compatibilidad con código existente)
export async function updateData(updater) {
  try {
    const current = await readData();
    const updated = await updater(current);
    const finalData = updated || current;
    await writeData(finalData);
    return finalData;
  } catch (error) {
    console.error('Error actualizando datos:', error);
    throw error;
  }
}

export async function getUsers() {
  const data = await loadData();
  return data.users;
}

export async function saveUsers(users) {
  return await updateData(data => {
    data.users = users;
    return data;
  });
}

export async function getShows() {
  const data = await loadData();
  return data.shows;
}

export async function saveShows(shows) {
  return await updateData(data => {
    data.shows = shows;
    return data;
  });
}

export async function getTickets() {
  const data = await loadData();
  return data.tickets;
}

export async function saveTickets(tickets) {
  return await updateData(data => {
    data.tickets = tickets;
    return data;
  });
}

export async function addTicket(ticket) {
  let stored;
  await updateData(data => {
    data.tickets.push(ticket);
    stored = ticket;
    return data;
  });
  return stored;
}

export async function updateTicketByCode(code, updates = {}) {
  let updatedTicket = null;
  await updateData(data => {
    const idx = data.tickets.findIndex(t => t.code === code);
    if (idx === -1) return data;
    data.tickets[idx] = { ...data.tickets[idx], ...updates };
    updatedTicket = data.tickets[idx];
    return data;
  });
  return updatedTicket;
}

export async function findShowById(id) {
  const shows = await getShows();
  return shows.find(show => show.id === id) || null;
}

export async function findUserByPhone(phone) {
  const users = await getUsers();
  return users.find(user => user.phone === phone) || null;
}

export function nextId(items, field = 'id') {
  if (!Array.isArray(items) || items.length === 0) {
    return 1;
  }
  const max = items.reduce((acc, item) => {
    const value = Number(item?.[field]) || 0;
    return Math.max(acc, value);
  }, 0);
  return max + 1;
}

const dataStore = {
  readData,
  writeData,
  updateData,
  getUsers,
  saveUsers,
  getShows,
  saveShows,
  getTickets,
  saveTickets,
  addTicket,
  updateTicketByCode,
  findShowById,
  findUserByPhone,
  nextId
};

export default dataStore;
