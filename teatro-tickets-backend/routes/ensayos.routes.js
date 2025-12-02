import express from 'express';
import { authMiddleware, isAdminOrSuper } from '../middleware/auth.js';
import {
  crearEnsayo,
  listarEnsayos,
  obtenerEnsayo,
  actualizarEnsayo,
  eliminarEnsayo
} from '../controllers/ensayos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear ensayo (solo directores y super)
router.post('/', isAdminOrSuper, crearEnsayo);

// Listar ensayos (todos los usuarios autenticados)
router.get('/', listarEnsayos);

// Obtener ensayo específico
router.get('/:id', obtenerEnsayo);

// Actualizar ensayo (solo creador o super)
router.put('/:id', isAdminOrSuper, actualizarEnsayo);

// Eliminar ensayo (solo creador o super)
router.delete('/:id', isAdminOrSuper, eliminarEnsayo);

export default router;
