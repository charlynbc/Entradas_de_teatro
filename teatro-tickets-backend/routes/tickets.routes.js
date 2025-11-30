import express from 'express';
import { misTickets, asignarTickets, generarQR, validarTicket } from '../controllers/tickets.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Vendedor endpoints
router.get('/mis-tickets', authenticate, requireRole('VENDEDOR'), misTickets);
router.post('/asignar', authenticate, requireRole('VENDEDOR'), asignarTickets);

// Generar QR para un ticket especifico
router.get('/:ticket_id/qr', authenticate, requireRole('VENDEDOR'), generarQR);

// Validar ticket (acceso publico)
router.get('/validar/:code', validarTicket);

export default router;
