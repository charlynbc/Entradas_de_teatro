// Servicio de API para comunicación con el backend
// Cambiar esta URL cuando esté en Render
export const API_URL = 'http://localhost:3000';

// ========== FUNCIONES ==========
export const getShows = async () => {
  const response = await fetch(`${API_URL}/api/shows`);
  return response.json();
};

export const getShowTickets = async (showId) => {
  const response = await fetch(`${API_URL}/api/shows/${showId}/tickets`);
  return response.json();
};

// ========== USUARIOS ==========
export const getUsuarios = async () => {
  const response = await fetch(`${API_URL}/api/usuarios`);
  return response.json();
};

export const getVendedores = async () => {
  const response = await fetch(`${API_URL}/api/vendedores`);
  return response.json();
};

// ========== TICKETS - INFO ==========
export const getTicket = async (code) => {
  const response = await fetch(`${API_URL}/api/tickets/${code}`);
  if (!response.ok) {
    throw new Error('Ticket no encontrado');
  }
  return response.json();
};

export const searchTickets = async (query) => {
  const response = await fetch(`${API_URL}/api/tickets/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

export const getVendedorTickets = async (vendedorId) => {
  const response = await fetch(`${API_URL}/api/vendedores/${vendedorId}/tickets`);
  return response.json();
};

// ========== TICKETS - ADMIN ACTIONS ==========
export const assignTickets = async (showId, vendedorId, cantidad) => {
  const response = await fetch(`${API_URL}/api/shows/${showId}/assign-tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendedorId, cantidad }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al asignar tickets');
  }
  return response.json();
};

export const markTicketPaid = async (code) => {
  const response = await fetch(`${API_URL}/api/tickets/${code}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al marcar como pagado');
  }
  return response.json();
};

export const validateTicket = async (code) => {
  const response = await fetch(`${API_URL}/api/tickets/${code}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.motivo || data.error || 'Error al validar');
  }
  return data;
};

// ========== TICKETS - VENDEDOR ACTIONS ==========
export const reserveTicket = async (code, nombreComprador, emailComprador) => {
  const response = await fetch(`${API_URL}/api/tickets/${code}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreComprador, emailComprador }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al reservar ticket');
  }
  return response.json();
};

export const transferTicket = async (code, nuevoVendedorId) => {
  const response = await fetch(`${API_URL}/api/tickets/${code}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevoVendedorId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al transferir ticket');
  }
  return response.json();
};

// ========== REPORTES ==========
export const getReporteVentas = async (showId) => {
  const url = showId 
    ? `${API_URL}/api/reportes/ventas?showId=${showId}`
    : `${API_URL}/api/reportes/ventas`;
  const response = await fetch(url);
  return response.json();
};
