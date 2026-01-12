/**
 * Rutas unificadas para reservas
 * Funcionan con ambos sistemas (tickets y entradas_v2)
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  crearReserva,
  misEntradas,
  estadisticasFuncion,
  detectarSistema
} from '../controllers/reservasUnificadas.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/reservas/crear
 * Crea una reserva (detecta automáticamente qué sistema usar)
 * Body: { funcion_id, comprador_nombre, comprador_telefono }
 */
router.post('/crear', requireRole('ACTOR', 'VENDEDOR'), crearReserva);

/**
 * GET /api/reservas/mis-entradas
 * Lista todas las entradas del vendedor (ambos sistemas)
 * Query: ?funcion_id=123 (opcional)
 */
router.get('/mis-entradas', requireRole('ACTOR', 'VENDEDOR'), misEntradas);

/**
 * GET /api/reservas/estadisticas/:funcionId
 * Estadísticas de una función (unificado)
 */
router.get('/estadisticas/:funcionId', estadisticasFuncion);

/**
 * GET /api/reservas/sistema/:funcionId
 * Detecta qué sistema usa una función
 */
router.get('/sistema/:funcionId', detectarSistema);

export default router;
