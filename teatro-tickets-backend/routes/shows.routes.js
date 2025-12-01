import express from 'express';
import { crearShow, listarShows, asignarTickets } from '../controllers/shows.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('ADMIN'), crearShow);
router.get('/', listarShows);  // Public endpoint - no authentication required
router.post('/:id/assign-tickets', authenticate, requireRole('ADMIN'), asignarTickets);

export default router;
