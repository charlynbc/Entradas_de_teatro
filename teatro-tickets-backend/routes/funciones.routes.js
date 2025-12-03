import express from 'express';
import { crearFuncion, listarFunciones, obtenerFuncion, actualizarFuncion, eliminarFuncion, asignarEntradas } from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.get('/', listarFunciones);
router.get('/:id', obtenerFuncion);

// Rutas protegidas
router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearFuncion);
router.put('/:id', authenticate, requireRole('ADMIN', 'SUPER'), actualizarFuncion);
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), eliminarFuncion);
router.post('/:id/asignar', authenticate, requireRole('ADMIN', 'SUPER'), asignarEntradas);

export default router;
