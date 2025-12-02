import express from 'express';
import { resumenPorVendedor, resumenAdmin, deudores, resumenFuncion, dashboardSuper, dashboardDirector } from '../controllers/reportes.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Dashboard super
router.get('/super', authenticate, requireRole('SUPER'), dashboardSuper);

// Dashboard director (admin)
router.get('/director', authenticate, requireRole('ADMIN'), dashboardDirector);

// Todos requieren admin
router.get('/shows/:id/resumen-por-vendedor', authenticate, requireRole('ADMIN'), resumenPorVendedor);
router.get('/shows/:id/resumen-admin', authenticate, requireRole('ADMIN'), resumenAdmin);
router.get('/shows/:id/deudores', authenticate, requireRole('ADMIN'), deudores);
router.get('/shows/:id/resumen', authenticate, requireRole('ADMIN'), resumenFuncion);

export default router;
