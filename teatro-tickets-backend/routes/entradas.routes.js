import express from 'express';
import { crearReserva, quitarReserva, misEntradas, reportarVenta, validarEntrada } from '../controllers/entradas.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/reservar', crearReserva); // Invitados pueden reservar

// Rutas de vendedor
router.get('/mis-entradas', authenticate, requireRole('VENDEDOR', 'ADMIN', 'SUPER'), misEntradas);
router.delete('/:code/reserva', authenticate, quitarReserva); // Quitar reserva
router.post('/:code/vender', authenticate, requireRole('VENDEDOR', 'ADMIN', 'SUPER'), reportarVenta);

// Rutas de admin
router.post('/:code/validar', authenticate, requireRole('ADMIN', 'SUPER'), validarEntrada);

export default router;
