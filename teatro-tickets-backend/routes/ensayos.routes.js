import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  crearEnsayo,
  listarEnsayos,
  obtenerEnsayo,
  actualizarEnsayo,
  eliminarEnsayo
} from '../controllers/ensayos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Crear ensayo (solo directores y super)
router.post('/', requireRole('ADMIN', 'SUPER'), crearEnsayo);

// Listar ensayos (todos los usuarios autenticados)
router.get('/', listarEnsayos);

// Obtener ensayo específico
router.get('/:id', obtenerEnsayo);

// Actualizar ensayo (solo creador o super)
router.put('/:id', requireRole('ADMIN', 'SUPER'), actualizarEnsayo);

// Eliminar ensayo (solo creador o super)
router.delete('/:id', requireRole('ADMIN', 'SUPER'), eliminarEnsayo);

export default router;
