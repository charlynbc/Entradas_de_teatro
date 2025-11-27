import AsyncStorage from '@react-native-async-storage/async-storage';

// Cambiar esta URL por tu backend de Render cuando lo deploys
export const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://tu-backend.onrender.com';

// Helper para incluir token en requests
async function getHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Auth
export async function login(phone, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return response.json();
}

export async function completarRegistro(phone, name, password) {
  const response = await fetch(`${API_URL}/api/auth/completar-registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, name, password })
  });
  return response.json();
}

// Users
export async function crearUsuario(data) {
  const response = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function listarVendedores() {
  const response = await fetch(`${API_URL}/api/users/vendedores`, {
    headers: await getHeaders()
  });
  return response.json();
}

// Shows
export async function getShows() {
  const response = await fetch(`${API_URL}/api/shows`, {
    headers: await getHeaders()
  });
  return response.json();
}

export async function createShow(data) {
  const response = await fetch(`${API_URL}/api/shows`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function assignTickets(showId, vendedor_phone, cantidad) {
  const response = await fetch(`${API_URL}/api/shows/${showId}/assign-tickets`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ vendedor_phone, cantidad })
  });
  return response.json();
}

// Tickets
export async function getMisTickets(showId = null) {
  const url = showId 
    ? `${API_URL}/api/tickets/mis-tickets?show_id=${showId}`
    : `${API_URL}/api/tickets/mis-tickets`;
  
  const response = await fetch(url, {
    headers: await getHeaders()
  });
  return response.json();
}

export async function reserveTicket(code, comprador_nombre, comprador_contacto) {
  const response = await fetch(`${API_URL}/api/tickets/${code}/reserve`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ comprador_nombre, comprador_contacto })
  });
  return response.json();
}

export async function reportTicketSold(code) {
  const response = await fetch(`${API_URL}/api/tickets/${code}/report-sold`, {
    method: 'POST',
    headers: await getHeaders()
  });
  return response.json();
}

export async function approveTicket(code, medio_pago, precio) {
  const response = await fetch(`${API_URL}/api/tickets/${code}/approve`, {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify({ medio_pago, precio })
  });
  return response.json();
}

export async function getQR(code) {
  const response = await fetch(`${API_URL}/api/tickets/${code}/qr`, {
    headers: await getHeaders()
  });
  return response.json();
}

export async function validateTicket(code) {
  const response = await fetch(`${API_URL}/api/tickets/${code}/validate`, {
    method: 'POST',
    headers: await getHeaders()
  });
  return response.json();
}

export async function buscarTickets(query) {
  const response = await fetch(`${API_URL}/api/tickets/search?q=${query}`, {
    headers: await getHeaders()
  });
  return response.json();
}

// Reportes
export async function reporteResumenAdmin(showId) {
  const response = await fetch(`${API_URL}/api/reportes/show/${showId}/resumen`, {
    headers: await getHeaders()
  });
  return response.json();
}

export async function reporteDeudores(showId) {
  const response = await fetch(`${API_URL}/api/reportes/show/${showId}/deudas`, {
    headers: await getHeaders()
  });
  return response.json();
}

export async function reporteVendedores(showId) {
  const response = await fetch(`${API_URL}/api/reportes/show/${showId}/vendedores`, {
    headers: await getHeaders()
  });
  return response.json();
}
