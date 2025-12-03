import express from 'express';
import { crearObra, listarObras, obtenerObra, actualizarObra, eliminarObra } from '../controllers/obras.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', listarObras);
router.get('/:id', obtenerObra);

// Rutas protegidas
router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearObra);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER'), actualizarObra);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarObra);

export default router;
