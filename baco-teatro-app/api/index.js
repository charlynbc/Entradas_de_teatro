'use strict';

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
  const session = await mock.login(credentials);
  setSession(session);
  return session;
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
  return mock.getProfile(user.id);
}

export async function updateMyProfile(payload) {
  requireUser();
  const updated = await mock.updateProfile(currentSession.user.id, payload);
  setSession({ token: currentSession.token, user: updated });
  return updated;
}

export async function getSuperDashboard() {
  requireRole(['SUPER']);
  return mock.getSuperDashboard();
}

export async function listDirectors() {
  requireRole(['SUPER']);
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
  return mock.validateTicket(code);
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
  return mock.getPublicShows();
}

export async function getPublicShowDetails(showId) {
  return mock.getPublicShowDetails(showId);
}

export async function guestReserveTicket(payload) {
  return mock.guestReserveTicket(payload);
}
