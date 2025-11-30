import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'data.json');

const DEFAULT_DATA = Object.freeze({
  tickets: [],
  users: [],
  shows: []
});

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function normalizeData(raw = {}) {
  const safe = cloneDefault();
  return {
    tickets: Array.isArray(raw.tickets) ? raw.tickets : safe.tickets,
    users: Array.isArray(raw.users) ? raw.users : safe.users,
    shows: Array.isArray(raw.shows) ? raw.shows : safe.shows
  };
}

async function loadData() {
  try {
    const content = await readFile(DATA_PATH, 'utf8');
    return normalizeData(JSON.parse(content));
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initial = cloneDefault();
      await writeFile(DATA_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw error;
  }
}

async function saveData(data) {
  const normalized = normalizeData(data);
  await writeFile(DATA_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export async function readData() {
  return await loadData();
}

export async function writeData(data) {
  return await saveData(data);
}

export async function updateData(updater) {
  const current = await loadData();
  const maybeUpdated = await updater(current);
  const finalData = maybeUpdated || current;
  return await saveData(finalData);
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
