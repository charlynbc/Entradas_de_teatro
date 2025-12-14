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
    const body = { cedula: credentials.cedula, password: credentials.password };
    const response = await request('/api/auth/login', { method: 'POST', body });
    
    const user = {
      id: response.user.cedula,
      name: response.user.name,
      role: response.user.role,
      email: response.user.cedula + '@bacoteatro.com',
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
    const token = currentSession.token;
    const response = await request('/api/super/dashboard', { token });
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
    const token = currentSession.token;
    const response = await request('/api/usuarios?role=ADMIN', { token });
    return response;
  } catch (error) {
    console.log('Backend no disponible, retornando lista vacía');
    return [];
  }
}

export async function createDirector(payload) {
  requireRole(['SUPER']);
  try {
    const token = currentSession.token;
    // SUPER crea admin (director)
    const response = await request('/api/usuarios/directores', { 
      method: 'POST',
      token,
      body: {
        cedula: payload.cedula,
        name: payload.name,
        genero: payload.genero || 'otro',
        password: 'admin123' // Contraseña por defecto
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
    const token = currentSession.token;
    const response = await request(`/api/usuarios/${cedula}/reset-password`, { 
      method: 'POST',
      token,
      body: { newPassword: 'admin123' }
    });
    return response;
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    throw error;
  }
}

export async function deleteDirector(cedula) {
  console.log('[API] deleteDirector llamado con cedula:', cedula);
  requireRole(['SUPER']);
  try {
    const token = currentSession.token;
    console.log('[API] Token presente:', !!token);
    console.log('[API] Haciendo DELETE a:', `/api/usuarios/${cedula}`);
    const response = await request(`/api/usuarios/${cedula}`, { 
      method: 'DELETE',
      token
    });
    console.log('[API] Respuesta exitosa:', response);
    return response;
  } catch (error) {
    console.error('[API] Error eliminando director:', error);
    throw error;
  }
}

export async function listProductions() {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    const response = await request('/api/shows', { token });
    return response;
  } catch (error) {
    console.log('Backend no disponible, retornando lista vacía');
    return [];
  }
}

export async function createProduction(payload) {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    const response = await request('/api/shows', { 
      method: 'POST',
      token,
      body: payload 
    });
    return response;
  } catch (error) {
    console.error('Error creando producción:', error);
    throw error;
  }
}

export async function deleteProduction(id) {
  try {
    requireRole(['SUPER', 'ADMIN']);
    const token = currentSession.token;
    console.log('Eliminando show con ID:', id, 'Token:', token ? 'presente' : 'ausente');
    const response = await request(`/api/shows/${id}`, { 
      method: 'DELETE',
      token
    });
    console.log('Show eliminado exitosamente:', response);
    return response;
  } catch (error) {
    console.error('Error eliminando obra:', error);
    throw error;
  }
}

export async function listVendors() {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    const response = await request('/api/usuarios/vendedores', { token });
    return response;
  } catch (error) {
    console.error('Error listando vendedores:', error);
    return [];
  }
}

export async function createVendor(payload) {
  requireRole(['SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    // ADMIN y SUPER pueden crear vendedor (actor)
    const response = await request('/api/usuarios/actores', { 
      method: 'POST',
      token,
      body: {
        cedula: payload.cedula,
        name: payload.name,
        genero: payload.genero || 'otro',
        password: 'admin123' // Contraseña por defecto
      }
    });
    return response;
  } catch (error) {
    console.error('Error creando vendedor:', error);
    throw error;
  }
}

export async function getDirectorDashboard() {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/reportes/director', { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo dashboard director:', error);
    return {
      totals: { shows: 0, tickets: 0, sold: 0, revenue: 0 },
      upcomingShows: [],
      vendors: []
    };
  }
}

export async function listDirectorShows() {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/shows', { token });
    return response;
  } catch (error) {
    console.error('Error listando funciones:', error);
    return [];
  }
}

export async function createShow(payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/shows', { 
      method: 'POST',
      token,
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Error creando función:', error);
    throw error;
  }
}

export async function assignTicketsToActor(payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    // payload should have: showId, actorId (cedula), cantidad
    const response = await request(`/api/shows/${payload.showId}/assign-tickets`, {
      method: 'POST',
      token,
      body: {
        vendedor_cedula: payload.actorId,
        cantidad: payload.cantidad
      }
    });
    return response;
  } catch (error) {
    console.error('Error asignando tickets:', error);
    throw error;
  }
}

export async function markTicketsAsPaid(payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    // payload should have: tickets (array of ticket codes)
    // Marcar múltiples tickets como pagados
    const promises = payload.tickets.map(code => 
      request(`/api/tickets/${code}/marcar-pagado`, {
        method: 'POST',
        token
      })
    );
    await Promise.all(promises);
    return { ok: true, mensaje: 'Tickets marcados como pagados' };
  } catch (error) {
    console.error('Error marcando tickets como pagados:', error);
    throw error;
  }
}

export async function getDirectorReports() {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/reportes/director', { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    return { shows: [], totals: {} };
  }
}

export async function validateTicket(code) {
  requireRole(['ADMIN', 'SUPER', 'VENDEDOR']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/tickets/validar/${code}`, { token });
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
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    const response = await request('/api/tickets/mis-tickets', { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo stock:', error);
    return [];
  }
}

export async function updateTicketStatus(payload) {
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    // payload should have: code, estado
    const response = await request(`/api/tickets/${payload.code}/estado`, {
      method: 'PUT',
      token,
      body: { estado: payload.estado }
    });
    return response;
  } catch (error) {
    console.error('Error actualizando ticket:', error);
    throw error;
  }
}

export async function transferTicket(payload) {
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  // TODO: Implementar endpoint en backend
  console.log('transferTicket - usando mock (no implementado en backend)');
  const user = requireUser();
  return mock.transferTicket(user.id, payload);
}

export async function getActorTransfers() {
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  // TODO: Implementar endpoint en backend
  console.log('getActorTransfers - usando mock (no implementado en backend)');
  const user = requireUser();
  return mock.getActorTransfers(user.id);
}

export async function getActorHistory() {
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  // TODO: Implementar endpoint en backend
  console.log('getActorHistory - usando mock (no implementado en backend)');
  const user = requireUser();
  return mock.getActorHistory(user.id);
}

export function getCurrentUser() {
  return getSession().user;
}

export async function deleteVendor(cedula) {
  console.log('[API] deleteVendor llamado con cedula:', cedula);
  requireRole(['SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    console.log('[API] Token presente:', !!token);
    console.log('[API] Haciendo DELETE a:', `/api/usuarios/${cedula}`);
    const response = await request(`/api/usuarios/${cedula}`, { 
      method: 'DELETE',
      token
    });
    console.log('[API] Respuesta exitosa:', response);
    return response;
  } catch (error) {
    console.error('[API] Error eliminando vendedor:', error);
    throw error;
  }
}

// --- New Features ---

export async function createRehearsal(payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/ensayos', {
      method: 'POST',
      token,
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Error creando ensayo:', error);
    throw error;
  }
}

export async function listRehearsals() {
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request('/api/ensayos', { token });
    return response;
  } catch (error) {
    console.error('Error listando ensayos:', error);
    return [];
  }
}

export async function deleteRehearsal(id) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/ensayos/${id}`, {
      method: 'DELETE',
      token
    });
    return response;
  } catch (error) {
    console.error('Error eliminando ensayo:', error);
    throw error;
  }
}

export async function getShowRehearsals(showId) {
  // Both Admin and Actors can see rehearsals
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request(`/api/ensayos?showId=${showId}`, { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo ensayos:', error);
    return [];
  }
}

export async function getActorSchedule() {
  requireRole(['VENDEDOR', 'SUPER', 'ADMIN']);
  try {
    const token = currentSession.token;
    const response = await request('/api/ensayos', { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo agenda:', error);
    return [];
  }
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
  try {
    const response = await request(`/api/shows/${showId}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    return null;
  }
}

export async function guestReserveTicket(payload) {
  try {
    const response = await request('/api/tickets/reservar', {
      method: 'POST',
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Error reservando ticket:', error);
    throw error;
  }
}

// Reportes de obras
export async function generarReporteObra(showId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/reportes-obras/generar/${showId}`, {
      method: 'POST',
      token
    });
    return response;
  } catch (error) {
    console.error('Error generando reporte:', error);
    throw error;
  }
}

export async function listarReportesObras() {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/reportes-obras', { token });
    return response.reportes || [];
  } catch (error) {
    console.error('Error listando reportes:', error);
    throw error;
  }
}

export async function obtenerReporteObra(reporteId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/reportes-obras/${reporteId}`, { token });
    return response.reporte;
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    throw error;
  }
}

export async function eliminarReporteObra(reporteId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/reportes-obras/${reporteId}`, {
      method: 'DELETE',
      token
    });
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
    const token = currentSession.token;
    const response = await request('/api/ensayos', {
      method: 'POST',
      token,
      body: ensayoData
    });
    return response;
  } catch (error) {
    console.error('Error creando ensayo:', error);
    throw error;
  }
}

export async function listarEnsayos() {
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request('/api/ensayos', { token });
    return response || [];
  } catch (error) {
    console.error('Error listando ensayos:', error);
    throw error;
  }
}

export async function obtenerEnsayo(ensayoId) {
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request(`/api/ensayos/${ensayoId}`, { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo ensayo:', error);
    throw error;
  }
}

export async function actualizarEnsayo(ensayoId, ensayoData) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/ensayos/${ensayoId}`, {
      method: 'PUT',
      token,
      body: ensayoData
    });
    return response;
  } catch (error) {
    console.error('Error actualizando ensayo:', error);
    throw error;
  }
}

export async function eliminarEnsayo(ensayoId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/ensayos/${ensayoId}`, {
      method: 'DELETE',
      token
    });
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
    const token = currentSession.token;
    const response = await request('/api/usuarios/miembros', { token });
    return response || [];
  } catch (error) {
    console.error('Error listando miembros:', error);
    throw error;
  }
}

// ============================================
// GRUPOS (Sistema de clases de teatro)
// ============================================

export async function crearGrupo(payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request('/api/grupos', {
      method: 'POST',
      token,
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Error creando grupo:', error);
    throw error;
  }
}

export async function listarGrupos() {
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request('/api/grupos', { token });
    return response || [];
  } catch (error) {
    console.error('Error listando grupos:', error);
    throw error;
  }
}

export async function obtenerGrupo(grupoId) {
  requireUser();
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}`, { token });
    return response;
  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    throw error;
  }
}

export async function actualizarGrupo(grupoId, payload) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}`, {
      method: 'PUT',
      token,
      body: payload
    });
    return response;
  } catch (error) {
    console.error('Error actualizando grupo:', error);
    throw error;
  }
}

export async function agregarMiembroGrupo(grupoId, miembroCedula) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}/miembros`, {
      method: 'POST',
      token,
      body: { miembro_cedula: miembroCedula }
    });
    return response;
  } catch (error) {
    console.error('Error agregando miembro al grupo:', error);
    throw error;
  }
}

export async function eliminarMiembroGrupo(grupoId, miembroCedula) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}/miembros/${miembroCedula}`, {
      method: 'DELETE',
      token
    });
    return response;
  } catch (error) {
    console.error('Error eliminando miembro del grupo:', error);
    throw error;
  }
}

export async function archivarGrupo(grupoId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}/archivar`, {
      method: 'POST',
      token
    });
    return response;
  } catch (error) {
    console.error('Error archivando grupo:', error);
    throw error;
  }
}

export async function listarActoresDisponibles(grupoId) {
  requireRole(['ADMIN', 'SUPER']);
  try {
    const token = currentSession.token;
    const response = await request(`/api/grupos/${grupoId}/actores-disponibles`, { token });
    return response || [];
  } catch (error) {
    console.error('Error listando actores disponibles:', error);
    throw error;
  }
}
