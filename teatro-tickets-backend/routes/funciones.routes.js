import express from 'express';
import { 
  crearFuncion, 
  listarFuncions, 
  obtenerFuncion, 
  asignarTickets, 
  eliminarFuncion, 
  updateFuncion,
  cerrarFuncion,
  generarPDFFuncion,
  listarFuncionesConcluideas
} from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearFuncion);
router.get('/', listarFuncions);  // Public endpoint - no authentication required
router.get('/public', listarFuncions);  // Alias público explícito
router.get('/concluidas', authenticate, requireRole('ADMIN', 'SUPER'), listarFuncionesConcluideas);  // Funciones concluidas
router.get('/:id', obtenerFuncion);  // Detalle de show - público
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER', 'DIRECTOR'), updateFuncion);  // Actualizar función
router.post('/:id/assign-tickets', authenticate, requireRole('ADMIN', 'SUPER'), asignarTickets);
router.post('/:id/cerrar', authenticate, requireRole('ADMIN', 'SUPER'), cerrarFuncion);  // Cerrar función
router.get('/:id/pdf', authenticate, requireRole('ADMIN', 'SUPER'), generarPDFFuncion);  // Generar PDF
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarFuncion);

export default router;
