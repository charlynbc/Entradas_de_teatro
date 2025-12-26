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
  listarActoresDisponibles,
  finalizarGrupo,
  listarGruposFinalizados,
  generarPDFGrupo
} from '../controllers/grupos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD básico de grupos
router.post('/', crearGrupo);                          // Crear grupo
router.get('/', listarGrupos);                         // Listar grupos
router.get('/finalizados/lista', listarGruposFinalizados);  // Listar grupos finalizados
router.get('/:id', obtenerGrupo);                      // Obtener grupo específico
router.put('/:id', actualizarGrupo);                   // Actualizar grupo

// Gestión de miembros
router.post('/:id/miembros', agregarMiembro);          // Agregar miembro al grupo
router.delete('/:id/miembros/:miembroCedula', eliminarMiembro);  // Eliminar miembro del grupo
router.get('/:id/actores-disponibles', listarActoresDisponibles); // Listar actores disponibles

// Archivar y finalizar grupo
router.post('/:id/archivar', archivarGrupo);           // Archivar grupo manualmente
router.post('/:id/finalizar', finalizarGrupo);         // Finalizar grupo con conclusión
router.get('/:id/pdf', generarPDFGrupo);               // Generar PDF de grupo finalizado

export default router;
