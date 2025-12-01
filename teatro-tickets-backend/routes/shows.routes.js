import express from 'express';
import { crearShow, listarShows, asignarTickets, eliminarShow } from '../controllers/shows.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearShow);
router.get('/', listarShows);  // Public endpoint - no authentication required
router.post('/:id/assign-tickets', authenticate, requireRole('ADMIN', 'SUPER'), asignarTickets);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarShow);

export default router;
