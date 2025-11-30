import { readFile, writeFile } from 'fs/promises';

const DATA_FILE = new URL('../data.json', import.meta.url).pathname;

async function loadData() {
  try {
    const content = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return { tickets: [], users: [], shows: [] };
  }
}

async function saveData(data) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function getTickets() {
  const data = await loadData();
  return data.tickets;
}

export async function addTicket(ticket) {
  const data = await loadData();
  data.tickets.push(ticket);
  await saveData(data);
  return ticket;
}

export async function getUsers() {
  const data = await loadData();
  return data.users;
}

export async function addUser(user) {
  const data = await loadData();
  data.users.push(user);
  await saveData(data);
  return user;
}

export async function getShows() {
  const data = await loadData();
  return data.shows;
}

export async function addShow(show) {
  const data = await loadData();
  data.shows.push(show);
  await saveData(data);
  return show;
}

export async function updateTicketByCode(code, updates) {
  const data = await loadData();
  const ticket = data.tickets.find(t => t.code === code);
  if (ticket) {
    Object.assign(ticket, updates);
    await saveData(data);
  }
  return ticket;
}
