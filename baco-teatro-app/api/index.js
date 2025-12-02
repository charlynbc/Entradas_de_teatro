'use strict';

import request from './client';
import * as mock from './mock';

let currentSession = {
  token: null,
  user: null,
};

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
  if (!roles.includes(user.role)) {
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
    
    const user = {
      id: response.user.phone,
      nombre: response.user.name,
      role: response.user.role,
      email: response.user.phone + '@bacoteatro.com',
      avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(response.user.name)
    };
    
    const session = { token: response.token, user };
    setSession(session);
    return session;
  } catch (error) {
    console.warn('Backend login failed:', error.message);
    // Solo usar mock si es un error de red/timeout, NO si es error de autenticación
    if (error.offline && (error.message.includes('Network request failed') || error.message.includes('Tiempo de espera'))) {
       console.log('Usando modo offline con mock');
       const session = await mock.login(credentials);
       setSession(session);
       return session;
    }
    // Re-lanzar error de autenticación (credenciales incorrectas, etc)
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
  const user = requireUser();
  // Si el usuario viene del backend (tiene phone como ID), usamos mock por ahora o implementamos endpoint
  // Por simplicidad, devolvemos el usuario de la sesión
  return { ...user, bio: 'Usuario del sistema' };
}

export async function updateMyProfile(payload) {
  requireUser();
  // Mock implementation for now
  const updated = { ...currentSession.user, ...payload };
  setSession({ token: currentSession.token, user: updated });
  return updated;
}

export async function getSuperDashboard() {
  requireRole(['SUPER']);
  try {
    const response = await request('/api/super/dashboard');
    return response;
  } catch (error) {
    console.log('Backend no disponible, usando datos vacíos');
    // Retornar estructura vacía en lugar de datos mock
    return {
      totals: {
        productions: 0,
        functions: 0,
        tickets: 0,
        sold: 0,
        attendees: 0,
      },
      upcomingShows: [],
      alerts: [],
    };
  }
}

export async function listDirectors() {
  requireRole(['SUPER']);
  try {
    const response = await request('/api/usuarios?role=ADMIN');
    return response;
  } catch (error) {
    console.log('Backend no disponible, retornando lista vacía');
    return [];
  }
}

export async function createDirector(payload) {
  requireRole(['SUPER']);
  try {
    // SUPER crea admin (director)
    const response = await request('/api/usuarios', { 
      method: 'POST', 
      body: {
        cedula: payload.cedula,
        nombre: payload.nombre,
        password: '1234', // Contraseña por defecto
        rol: 'admin' // Director
      }
    });
    return response;
  } catch (error) {
    console.error('Error creando director:', error);
    throw error;
  }
}

export async function resetDirectorPassword(cedula) {
  requireRole(['SUPER']);
  try {
    const response = await request(`/api/usuarios/${cedula}/reset-password`, { method: 'POST' });
    return response;
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    throw error;
  }
}

export async function deleteDirector(cedula) {
  requireRole(['SUPER']);
  try {
    const response = await request('DELETE', `/users/${cedula}`);
    return response;
  } catch (error) {
    console.error('Error eliminando director:', error);
    throw error;
  }
}

export async function listProductions() {
  requireRole(['SUPER']);
  try {
    const response = await request('/api/obras');
    return response;
  } catch (error) {
    console.log('Backend no disponible, retornando lista vacía');
    return [];
  }
}

export async function createProduction(payload) {
  requireRole(['SUPER']);
  try {
    const response = await request('/api/obras', { method: 'POST', body: payload });
    return response;
  } catch (error) {
    console.error('Error creando producción:', error);
    throw error;
  }
}

export async function deleteProduction(id) {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const response = await request('DELETE', `/shows/${id}`);
    return response;
  } catch (error) {
    console.error('Error eliminando obra:', error);
    throw error;
  }
}

export async function listVendors() {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const response = await request('/api/usuarios/vendedores');
    return response;
  } catch (error) {
    console.error('Error listando vendedores:', error);
    return [];
  }
}

export async function createVendor(payload) {
  requireRole(['SUPER', 'ADMIN']);
  try {
    // ADMIN y SUPER pueden crear vendedor (actor)
    const response = await request('/api/usuarios', { 
      method: 'POST', 
      body: {
        cedula: payload.cedula,
        nombre: payload.nombre,
        password: '1234', // Contraseña por defecto
        rol: 'vendedor' // Actor/Vendedor
      }
    });
    return response;
  } catch (error) {
    console.error('Error creando vendedor:', error);
    throw error;
  }
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
    const response = await request(`/api/tickets/validar/${code}`);
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
  try {
    const response = await request('DELETE', `/users/${cedula}`);
    return response;
  } catch (error) {
    console.error('Error eliminando vendedor:', error);
    throw error;
  }
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
    // Return empty array if no shows, DO NOT fallback to mock in production
    if (!shows || shows.length === 0) {
      console.log('No hay funciones disponibles en este momento');
      return [];
    }
    return shows.map(s => ({
      id: s.id,
      obra: s.obra,
      fecha: s.fecha,
      lugar: s.lugar,
      imagen: 'https://images.unsplash.com/photo-1507676184212-d03816a97f81?auto=format&fit=crop&w=500&q=80' // Placeholder
    }));
  } catch (error) {
    console.error('Error conectando con backend:', error);
    // Return empty array instead of mock data
    return [];
  }
}

export async function getPublicShowDetails(showId) {
  return mock.getPublicShowDetails(showId);
}

export async function guestReserveTicket(payload) {
  return mock.guestReserveTicket(payload);
}

// Reportes de obras
export async function generarReporteObra(showId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('POST', `/reportes-obras/generar/${showId}`);
    return response;
  } catch (error) {
    console.error('Error generando reporte:', error);
    throw error;
  }
}

export async function listarReportesObras() {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('GET', '/reportes-obras');
    return response.reportes || [];
  } catch (error) {
    console.error('Error listando reportes:', error);
    throw error;
  }
}

export async function obtenerReporteObra(reporteId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('GET', `/reportes-obras/${reporteId}`);
    return response.reporte;
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    throw error;
  }
}

export async function eliminarReporteObra(reporteId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('DELETE', `/reportes-obras/${reporteId}`);
    return response;
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    throw error;
  }
}

// Ensayos Generales
export async function crearEnsayo(ensayoData) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('POST', '/ensayos', ensayoData);
    return response;
  } catch (error) {
    console.error('Error creando ensayo:', error);
    throw error;
  }
}

export async function listarEnsayos() {
  requireUser();
  try {
    const response = await request('GET', '/ensayos');
    return response || [];
  } catch (error) {
    console.error('Error listando ensayos:', error);
    throw error;
  }
}

export async function obtenerEnsayo(ensayoId) {
  requireUser();
  try {
    const response = await request('GET', `/ensayos/${ensayoId}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo ensayo:', error);
    throw error;
  }
}

export async function actualizarEnsayo(ensayoId, ensayoData) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('PUT', `/ensayos/${ensayoId}`, ensayoData);
    return response;
  } catch (error) {
    console.error('Error actualizando ensayo:', error);
    throw error;
  }
}

export async function eliminarEnsayo(ensayoId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const response = await request('DELETE', `/ensayos/${ensayoId}`);
    return response;
  } catch (error) {
    console.error('Error eliminando ensayo:', error);
    throw error;
  }
}

// Miembros del elenco
export async function listarMiembros() {
  requireUser();
  try {
    const response = await request('GET', '/usuarios/miembros');
    return response || [];
  } catch (error) {
    console.error('Error listando miembros:', error);
    throw error;
  }
}
