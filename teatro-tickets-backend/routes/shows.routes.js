import express from 'express';
import { 
  crearShow, 
  listarShows, 
  obtenerShow, 
  asignarTickets, 
  eliminarShow, 
  updateShow,
  cerrarFuncion,
  generarPDFFuncion,
  listarFuncionesConcluideas
} from '../controllers/shows.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearShow);
router.get('/', listarShows);  // Public endpoint - no authentication required
router.get('/public', listarShows);  // Alias público explícito
router.get('/concluidas', authenticate, requireRole('ADMIN', 'SUPER'), listarFuncionesConcluideas);  // Funciones concluidas
router.get('/:id', obtenerShow);  // Detalle de show - público
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER', 'DIRECTOR'), updateShow);  // Actualizar función
router.post('/:id/assign-tickets', authenticate, requireRole('ADMIN', 'SUPER'), asignarTickets);
router.post('/:id/cerrar', authenticate, requireRole('ADMIN', 'SUPER'), cerrarFuncion);  // Cerrar función
router.get('/:id/pdf', authenticate, requireRole('ADMIN', 'SUPER'), generarPDFFuncion);  // Generar PDF
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarShow);

export default router;
