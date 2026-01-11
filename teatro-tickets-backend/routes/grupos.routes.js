/**
 * Routes: Grupos Teatrales
 * Fecha: 27-12-2025
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
    crearGrupo,
    listarGrupos,
    listarGruposFinalizados,
    obtenerGrupo,
    actualizarGrupo,
    agregarDirector,
    quitarDirector,
    agregarActor,
    quitarActor,
    subirFotoGrupo,
    eliminarGrupo,
    finalizarGrupo,
    obtenerResumenCierreGrupo,
    cerrarGrupoDefinitivo,
    obtenerLiquidacionFinalGrupo,
    crearLiquidacionFinalGrupo,
    generarPDFLiquidacionGrupo,
    generarPDFGrupo
} from '../controllers/grupos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/grupos
 * Crear grupo - SUPER, ADMIN
 */
router.post('/', requireRole('SUPER', 'ADMIN'), crearGrupo);

/**
 * GET /api/grupos
 * Listar grupos - SUPER, ADMIN, ACTOR
 */
router.get('/', listarGrupos);

/**
 * GET /api/grupos/finalizados/lista
 * Listar grupos finalizados/archivados - SUPER, ADMIN
 */
router.get('/finalizados/lista', requireRole('SUPER', 'ADMIN'), listarGruposFinalizados);

/**
 * GET /api/grupos/:id
 * Obtener grupo por ID - SUPER, ADMIN, ACTOR (si está asignado)
 */
router.get('/:id', obtenerGrupo);

/**
 * PUT /api/grupos/:id
 * Actualizar grupo - SUPER, ADMIN (si es director del grupo)
 */
router.put('/:id', requireRole('SUPER', 'ADMIN'), actualizarGrupo);

/**
 * POST /api/grupos/:id/directores
 * Agregar director al grupo - SUPER, ADMIN (si es director del grupo)
 */
router.post('/:id/directores', requireRole('SUPER', 'ADMIN'), agregarDirector);

/**
 * DELETE /api/grupos/:id/directores/:director_cedula
 * Quitar director del grupo - SUPER, ADMIN (si es director del grupo)
 */
router.delete('/:id/directores/:director_cedula', requireRole('SUPER', 'ADMIN'), quitarDirector);

/**
 * POST /api/grupos/:id/actores
 * Agregar actor al grupo - SUPER, ADMIN (si es director del grupo)
 */
router.post('/:id/actores', requireRole('SUPER', 'ADMIN'), agregarActor);

/**
 * DELETE /api/grupos/:id/actores/:actor_cedula
 * Quitar actor del grupo - SUPER, ADMIN (si es director del grupo)
 */
router.delete('/:id/actores/:actor_cedula', requireRole('SUPER', 'ADMIN'), quitarActor);

/**
 * PUT /api/grupos/:id/foto
 * Subir/actualizar foto del grupo - SUPER, ADMIN (si es director del grupo)
 */
router.put('/:id/foto', requireRole('SUPER', 'ADMIN'), subirFotoGrupo);

/**
 * DELETE /api/grupos/:id
 * Eliminar grupo - SUPER o ADMIN (si es director del grupo)
 */
router.delete('/:id', requireRole('SUPER', 'ADMIN'), eliminarGrupo);

/**
 * POST /api/grupos/:id/finalizar
 * Finalizar/Archivar grupo
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.post('/:id/finalizar', requireRole('SUPER', 'ADMIN'), finalizarGrupo);

/**
 * GET /api/grupos/:id/cierre-resumen
 * Resumen para cierre definitivo (DIRECTOR/SUPER)
 */
router.get('/:id/cierre-resumen', requireRole('SUPER', 'ADMIN'), obtenerResumenCierreGrupo);

/**
 * POST /api/grupos/:id/cerrar
 * Cierre definitivo irreversible (DIRECTOR/SUPER)
 */
router.post('/:id/cerrar', requireRole('SUPER', 'ADMIN'), cerrarGrupoDefinitivo);

/**
 * GET /api/grupos/:id/liquidacion-final
 * Obtener liquidación final (live + snapshot si existe)
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.get('/:id/liquidacion-final', requireRole('SUPER', 'ADMIN'), obtenerLiquidacionFinalGrupo);

/**
 * POST /api/grupos/:id/liquidacion-final
 * Crear snapshot congelado
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.post('/:id/liquidacion-final', requireRole('SUPER', 'ADMIN'), crearLiquidacionFinalGrupo);

/**
 * GET /api/grupos/:id/liquidacion/pdf
 * PDF de liquidación final (DIRECTOR/SUPER)
 */
router.get('/:id/liquidacion/pdf', requireRole('SUPER', 'ADMIN'), generarPDFLiquidacionGrupo);

/**
 * GET /api/grupos/:id/pdf
 * Generar PDF con reporte de grupo
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.get('/:id/pdf', requireRole('SUPER', 'ADMIN'), generarPDFGrupo);

export default router;
