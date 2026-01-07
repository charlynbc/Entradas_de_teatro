/**
 * Routes: Auditoría y Reportes
 * GET /api/auditoria/logs - Historial de acciones
 * GET /api/reportes/ventas - Reportes de ventas
 * GET /public/obras/:obraId - Página pública de obra
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  obtenerLogsGrupo,
  obtenerReportesVentas,
  exportarVentasCSV,
  exportarVentasPDF,
  obtenerObraPublica,
  obtenerFuncionesObraPublica
} from '../controllers/auditoria-reportes.controller.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// AUDITORÍA: Historial de acciones
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/auditoria/logs
 * Obtener historial de acciones de un grupo
 * Protegido: SUPER, ADMIN (director del grupo)
 */
router.get('/logs', authenticate, requireRole('SUPER', 'ADMIN'), obtenerLogsGrupo);

/**
 * GET /api/auditoria/logs/export/csv
 * Exportar historial en CSV
 */
router.get('/logs/export/csv', authenticate, requireRole('SUPER', 'ADMIN'), 
  (req, res) => exportarVentasCSV(req, res, 'logs'));

// ═══════════════════════════════════════════════════════════════════════════
// REPORTES: Ventas simples
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reportes/ventas (registrado como /api/auditoria/reportes/ventas)
 * Reportes de ventas (por función, vendedor, día)
 * Query params: grupo_id, funcion_id, vendedor_cedula, desde, hasta
 * Protegido: DIRECTOR del grupo, SUPER
 */
router.get('/reportes/ventas', authenticate, requireRole('SUPER', 'ADMIN'), obtenerReportesVentas);

/**
 * GET /api/reportes/ventas/export/csv
 * Exportar reporte en CSV
 */
router.get('/reportes/ventas/export/csv', authenticate, requireRole('SUPER', 'ADMIN'), 
  (req, res) => exportarVentasCSV(req, res, 'ventas'));

/**
 * GET /api/reportes/ventas/export/pdf
 * Exportar reporte en PDF
 */
router.get('/reportes/ventas/export/pdf', authenticate, requireRole('SUPER', 'ADMIN'), 
  (req, res) => exportarVentasPDF(req, res));

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PÚBLICA: Obra individual
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/auditoria/public/obras/:obraId
 * Información pública de una obra (sin vender, sin dinero)
 * Sin autenticación
 */
router.get('/public/obras/:obraId', obtenerObraPublica);

/**
 * GET /api/auditoria/public/obras/:obraId/funciones
 * Funciones próximas de una obra (público)
 */
router.get('/public/obras/:obraId/funciones', obtenerFuncionesObraPublica);

export default router;
