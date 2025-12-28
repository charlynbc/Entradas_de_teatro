'use strict';

import request from './client';
import * as mock from './mock';

let currentSession = {
  token: null,
  user: null,
};

function normalizeRole(role) {
  const r = String(role || '').toUpperCase();
  // En el backend el rol del actor suele ser ACTOR; en la app se lo maneja como VENDEDOR
  if (r === 'ACTOR') return 'VENDEDOR';
  return r;
}

function authedRequest(path, init = {}) {
  if (!currentSession?.token) {
    const error = new Error('Sesion expirada. Volve a iniciar sesion.');
    error.status = 401;
    throw error;
  }
  return request(path, { ...init, token: currentSession.token });
}

function setSession(session) {
  currentSession = session ? { ...session } : { token: null, user: null };
}

function getSession() {
  return currentSession;
}

function requireUser() {
  if (!currentSession.user) {
    const error = new Error('Sesion expirada. Volve a iniciar sesion.');
    error.status = 401;
    throw error;
  }
  return currentSession.user;
}

function requireRole(roles) {
  const user = requireUser();
  const userRole = normalizeRole(user.role);
  const allowed = roles.map(normalizeRole);
  if (!allowed.includes(userRole)) {
    const error = new Error('No tenes permisos para esta accion');
    error.status = 403;
    throw error;
  }
  return user;
}

export async function login(credentials) {
  try {
    // Intenta login contra el backend real
    const body = { phone: credentials.cedula, password: credentials.password };
    const response = await request('/api/auth/login', { method: 'POST', body });

    // Backend devuelve: { token, user: { cedula, role, name } }
    const cedula = response?.user?.cedula || credentials.cedula;
    const name = response?.user?.name || 'Usuario';
    const role = normalizeRole(response?.user?.role);

    const user = {
      id: cedula,
      cedula,
      phone: cedula,
      nombre: name,
      role,
      email: `${cedula}@bacoteatro.com`,
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name),
    };
    
    const session = { token: response.token, user };
    setSession(session);
    return session;
  } catch (error) {
    console.warn('Backend login failed, falling back to mock if offline', error);
    if (error.offline || error.message.includes('Network request failed')) {
       const session = await mock.login(credentials);
       // Normalizar role también en mock
       setSession({ ...session, user: { ...session.user, role: normalizeRole(session.user?.role) } });
       return session;
    }
    throw error;
  }
}

export function clearSession() {
  setSession(null);
}

export function restoreSession(session) {
  if (session?.user && session?.token) {
    setSession(session);
  }
}

export async function getMyProfile() {
  requireUser();
  try {
    // Backend real
    const profile = await authedRequest('/api/usuarios/me');
    return {
      ...currentSession.user,
      ...profile,
      role: normalizeRole(profile?.role || currentSession.user?.role),
    };
  } catch (error) {
    // Si está offline, usar sesión actual
    if (error.offline) {
      return { ...currentSession.user, bio: currentSession.user?.bio || 'Usuario del sistema' };
    }
    throw error;
  }
}

export async function updateMyProfile(payload) {
  requireUser();
  try {
    const updated = await authedRequest('/api/usuarios/me', { method: 'PUT', body: payload });
    const merged = {
      ...currentSession.user,
      ...updated,
      role: normalizeRole(updated?.role || currentSession.user?.role),
    };
    setSession({ token: currentSession.token, user: merged });
    return merged;
  } catch (error) {
    if (error.offline) {
      const merged = { ...currentSession.user, ...payload };
      setSession({ token: currentSession.token, user: merged });
      return merged;
    }
    throw error;
  }
}

export async function getSuperDashboard() {
  requireRole(['SUPER']);
  return mock.getSuperDashboard();
}

export async function listDirectors() {
  requireRole(['SUPER']);
  // TODO: Implementar backend /api/usuarios?role=ADMIN
  return mock.listDirectors();
}

export async function createDirector(payload) {
  requireRole(['SUPER']);
  return mock.createDirector(payload);
}

export async function resetDirectorPassword(cedula) {
  requireRole(['SUPER']);
  return mock.resetDirectorPassword(cedula);
}

export async function deleteDirector(cedula) {
  requireRole(['SUPER']);
  return mock.deleteDirector(cedula);
}

export async function listProductions() {
  requireRole(['SUPER']);
  return mock.listProductions();
}

export async function createProduction(payload) {
  requireRole(['SUPER']);
  return mock.createProduction(payload);
}

export async function listVendors() {
  requireRole(['SUPER', 'ADMIN']);
  return mock.listVendors();
}

export async function createVendor(payload) {
  requireRole(['SUPER', 'ADMIN']);
  return mock.createVendor(payload);
}

export async function getDirectorDashboard() {
  const user = requireRole(['ADMIN']);
  return mock.getDirectorDashboard(user.id);
}

export async function listDirectorShows() {
  const user = requireRole(['ADMIN']);
  return mock.listDirectorShows(user.id);
}

export async function createShow(payload) {
  const user = requireRole(['ADMIN']);
  return mock.createShow(user.id, payload);
}

export async function assignTicketsToActor(payload) {
  const user = requireRole(['ADMIN']);
  return mock.assignTicketsToActor(user.id, payload);
}

export async function markTicketsAsPaid(payload) {
  const user = requireRole(['ADMIN']);
  return mock.markTicketsAsPaid(user.id, payload);
}

export async function getDirectorReports() {
  const user = requireRole(['ADMIN']);
  return mock.getDirectorReports(user.id);
}

export async function validateTicket(code) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await authedRequest(`/api/tickets/validar/${code}`);
    return {
      ok: response.ok,
      message: response.mensaje || response.error,
      ticket: response.ticket ? {
        code: response.ticket.code,
        estado: response.ticket.estado,
        obra: response.ticket.obra || 'Función',
        fecha: response.ticket.fecha || new Date().toISOString(),
        vendedor_nombre: response.ticket.vendedor_nombre || 'Sin asignar'
      } : null
    };
  } catch (error) {
    console.warn('Backend validateTicket failed, falling back to mock', error);
    return mock.validateTicket(code);
  }
}

export async function getActorStock() {
  const user = requireRole(['VENDEDOR']);
  return mock.getActorStock(user.id);
}

export async function updateTicketStatus(payload) {
  const user = requireRole(['VENDEDOR']);
  return mock.updateTicketStatus(user.id, payload);
}

export async function transferTicket(payload) {
  const user = requireRole(['VENDEDOR']);
  return mock.transferTicket(user.id, payload);
}

export async function getActorTransfers() {
  const user = requireRole(['VENDEDOR']);
  return mock.getActorTransfers(user.id);
}

export async function getActorHistory() {
  const user = requireRole(['VENDEDOR']);
  return mock.getActorHistory(user.id);
}

export function getCurrentUser() {
  return getSession().user;
}

export async function deleteVendor(cedula) {
  requireRole(['SUPER', 'ADMIN']);
  return mock.deleteVendor(cedula);
}

// --- New Features ---

export async function createRehearsal(payload) {
  requireRole(['ADMIN']);
  return mock.createRehearsal(payload);
}

export async function listRehearsals() {
  requireUser();
  return mock.listRehearsals();
}

export async function deleteRehearsal(id) {
  requireRole(['ADMIN']);
  return mock.deleteRehearsal(id);
}

export async function getShowRehearsals(showId) {
  // Both Admin and Actors can see rehearsals
  requireUser(); 
  return mock.getShowRehearsals(showId);
}

export async function getActorSchedule() {
  const user = requireRole(['VENDEDOR']);
  return mock.getActorSchedule(user.id);
}

// Public endpoints (no auth required)
export async function getPublicShows() {
  try {
    const shows = await request('/api/shows');
    // If backend returns empty array, fall back to mock data
    if (!shows || shows.length === 0) {
      console.warn('Backend returned empty shows, falling back to mock');
      return mock.getPublicShows();
    }
    return shows.map(s => ({
      id: s.id,
      obra: s.obra,
      fecha: s.fecha,
      lugar: s.lugar,
      imagen: 'https://images.unsplash.com/photo-1507676184212-d03816a97f81?auto=format&fit=crop&w=500&q=80' // Placeholder
    }));
  } catch (error) {
    console.warn('Backend getPublicShows failed, falling back to mock', error);
    return mock.getPublicShows();
  }
}

export async function getPublicShowDetails(showId) {
  return mock.getPublicShowDetails(showId);
}

export async function guestReserveTicket(payload) {
  return mock.guestReserveTicket(payload);
}
