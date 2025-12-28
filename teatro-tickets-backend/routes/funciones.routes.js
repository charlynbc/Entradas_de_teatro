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
    listarFuncionesConcluidas,
    listarFuncionesPublicas,
    obtenerFuncion,
    actualizarFuncion,
    eliminarFuncion,
    cerrarFuncion,
    generarPDFFuncion
} from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/funciones/publicas
 * Listar funciones públicas (próximas) - SIN AUTENTICACIÓN
 */
router.get('/publicas', listarFuncionesPublicas);

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
 * SIN AUTH: Lista funciones públicas próximas
 */
router.get('/', 
    (req, res, next) => {
        // Si no hay token, mostrar funciones públicas
        if (!req.headers.authorization) {
            return listarFuncionesPublicas(req, res);
        }
        next();
    },
    authenticate, 
    listarFunciones
);

/**
 * GET /api/funciones/concluidas
 * Listar funciones realizadas/concluidas
 * Roles: SUPER, ADMIN
 */
router.get('/concluidas', 
    authenticate, 
    requireRole(['SUPER', 'ADMIN']), 
    listarFuncionesConcluidas
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

/**
 * POST /api/funciones/:id/cerrar
 * Cerrar/Finalizar función (marcar como REALIZADA)
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.post('/:id/cerrar', 
    authenticate, 
    requireRole(['SUPER', 'ADMIN']), 
    cerrarFuncion
);

/**
 * GET /api/funciones/:id/pdf
 * Generar PDF con reporte de función
 * Roles: SUPER, ADMIN (directores del grupo)
 */
router.get('/:id/pdf', 
    authenticate, 
    requireRole(['SUPER', 'ADMIN']), 
    generarPDFFuncion
);

export default router;
