/**
 * Routes: Funciones (asociadas a Grupos)
 * Descripción: Endpoints para gestionar funciones dentro de grupos
 * Fecha: 27-12-2025
 */

import express from 'express';
import { 
    crearFuncion,
    listarFunciones,
    listarFuncionesGrupo,
    obtenerFuncion,
    actualizarFuncion,
    eliminarFuncion
} from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/funciones
 * Crear función en un grupo
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.post('/', 
    authenticate, 
    requireRole(['SUPER', 'ADMIN']), 
    crearFuncion
);

/**
 * GET /api/funciones
 * Listar funciones con filtros
 * Roles: SUPER (todas), ADMIN (sus grupos), ACTOR (grupos donde es actor)
 */
router.get('/', 
    authenticate, 
    listarFunciones
);

/**
 * GET /api/funciones/grupo/:grupo_id
 * Listar funciones de un grupo específico
 * Roles: Todos autenticados
 */
router.get('/grupo/:grupo_id', 
    authenticate, 
    listarFuncionesGrupo
);

/**
 * GET /api/funciones/:id
 * Obtener función por ID con estadísticas
 * Roles: Todos autenticados
 */
router.get('/:id', 
    authenticate, 
    obtenerFuncion
);

/**
 * PUT /api/funciones/:id
 * Actualizar función
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.put('/:id', 
    authenticate, 
    requireRole(['SUPER', 'ADMIN']), 
    actualizarFuncion
);

/**
 * DELETE /api/funciones/:id
 * Eliminar función (solo si no tiene entradas vendidas)
 * Roles: SUPER
 */
router.delete('/:id', 
    authenticate, 
    requireRole(['SUPER']), 
    eliminarFuncion
);

export default router;
