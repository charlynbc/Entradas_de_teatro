import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  crearEnsayo,
  listarEnsayos,
  obtenerEnsayo,
  actualizarEnsayo,
  eliminarEnsayo,
  registrarAsistencia,
  obtenerAsistencias,
  obtenerHistorialMiembro,
  obtenerResumenGrupo
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

// === ASISTENCIAS ===

// Registrar asistencia a ensayo (solo directores)
router.post('/:id/asistencia', requireRole('ADMIN', 'SUPER'), registrarAsistencia);

// Obtener todas las asistencias de un ensayo
router.get('/:id/asistencias', obtenerAsistencias);

// Obtener historial de asistencias de un miembro
router.get('/miembro/:cedula/historial', obtenerHistorialMiembro);

// Obtener resumen de asistencias por grupo
router.get('/grupo/:grupo_id/resumen', obtenerResumenGrupo);

export default router;
