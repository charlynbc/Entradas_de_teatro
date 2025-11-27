import express from 'express';
import {
  misTickets,
  reservarTicket,
  reportarVenta,
  aprobarPago,
  generarQRTicket,
  validarTicket,
  buscarTickets,
  transferirTicket
} from '../controllers/tickets.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Vendedor
router.get('/mis-tickets', authenticate, requireRole('VENDEDOR'), misTickets);
router.post('/:code/reserve', authenticate, requireRole('VENDEDOR'), reservarTicket);
router.post('/:code/report-sold', authenticate, requireRole('VENDEDOR'), reportarVenta);
router.post('/:code/transfer', authenticate, requireRole('VENDEDOR'), transferirTicket);

// Admin
router.post('/:code/approve-payment', authenticate, requireRole('ADMIN'), aprobarPago);
router.get('/search', authenticate, requireRole('ADMIN'), buscarTickets);
router.post('/:code/validate', authenticate, requireRole('ADMIN'), validarTicket);

// Público (con autenticación)
router.get('/:code/qr', authenticate, generarQRTicket);

export default router;
