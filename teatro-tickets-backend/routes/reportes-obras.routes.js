import express from 'express';
import { 
  generarReporteObra, 
  listarReportes, 
  obtenerReporte, 
  eliminarReporte 
} from '../controllers/reportes-obras.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generar reporte de una obra
router.post('/generar/:showId', authenticate, requireRole('ADMIN', 'SUPER'), generarReporteObra);

// Listar todos los reportes (del director o todos si es SUPER)
router.get('/', authenticate, requireRole('ADMIN', 'SUPER'), listarReportes);

// Obtener un reporte específico
router.get('/:id', authenticate, requireRole('ADMIN', 'SUPER'), obtenerReporte);

// Eliminar un reporte
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarReporte);

export default router;
