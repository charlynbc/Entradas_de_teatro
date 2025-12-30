import express from 'express';
import { resumenPorVendedor, resumenAdmin, deudores, resumenFuncion, dashboardSuper, dashboardDirector, historialVendedor } from '../controllers/reportes.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Root: listado mínimo de reportes (placeholder)
router.get('/', authenticate, requireRole('SUPER', 'ADMIN'), (req, res) => {
	res.json([]);
});

// Dashboard super
router.get('/super', authenticate, requireRole('SUPER'), dashboardSuper);

// Dashboard director (admin)
router.get('/director', authenticate, requireRole('ADMIN'), dashboardDirector);

// Historial del vendedor/actor
router.get('/vendedor', authenticate, requireRole('ACTOR'), historialVendedor);

// Todos requieren admin
router.get('/shows/:id/resumen-por-vendedor', authenticate, requireRole('ADMIN'), resumenPorVendedor);
router.get('/shows/:id/resumen-admin', authenticate, requireRole('ADMIN'), resumenAdmin);
router.get('/shows/:id/deudores', authenticate, requireRole('ADMIN'), deudores);
router.get('/shows/:id/resumen', authenticate, requireRole('ADMIN'), resumenFuncion);

// Alias: funciones (modelo actual)
router.get('/funciones/:id/resumen-por-vendedor', authenticate, requireRole('ADMIN'), resumenPorVendedor);
router.get('/funciones/:id/resumen-admin', authenticate, requireRole('ADMIN'), resumenAdmin);
router.get('/funciones/:id/deudores', authenticate, requireRole('ADMIN'), deudores);
router.get('/funciones/:id/resumen', authenticate, requireRole('ADMIN'), resumenFuncion);

export default router;
