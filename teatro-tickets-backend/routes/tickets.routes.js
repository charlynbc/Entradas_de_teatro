import express from 'express';
import { misTickets, asignarTickets, generarQR, validarTicket } from '../controllers/tickets.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Endpoints de gestión de tickets (solo requieren estar autenticado)
router.get('/mis-tickets', authenticate, misTickets);
router.post('/asignar', authenticate, asignarTickets);

// Generar QR para un ticket especifico
router.get('/:code/qr', authenticate, generarQR);

// Validar ticket (acceso publico)
router.get('/validar/:code', validarTicket);

export default router;
