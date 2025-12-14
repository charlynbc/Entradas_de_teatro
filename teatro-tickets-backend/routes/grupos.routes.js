import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  crearGrupo,
  listarGrupos,
  obtenerGrupo,
  actualizarGrupo,
  agregarMiembro,
  eliminarMiembro,
  archivarGrupo,
  listarActoresDisponibles
} from '../controllers/grupos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD básico de grupos
router.post('/', crearGrupo);                          // Crear grupo
router.get('/', listarGrupos);                         // Listar grupos
router.get('/:id', obtenerGrupo);                      // Obtener grupo específico
router.put('/:id', actualizarGrupo);                   // Actualizar grupo

// Gestión de miembros
router.post('/:id/miembros', agregarMiembro);          // Agregar miembro al grupo
router.delete('/:id/miembros/:miembroCedula', eliminarMiembro);  // Eliminar miembro del grupo
router.get('/:id/actores-disponibles', listarActoresDisponibles); // Listar actores disponibles

// Archivar grupo
router.post('/:id/archivar', archivarGrupo);           // Archivar grupo manualmente

export default router;
