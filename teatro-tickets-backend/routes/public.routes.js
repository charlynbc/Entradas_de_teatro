import express from 'express';
import { listarFuncionesInvitado, listarVendedoresPublicosPorFuncion } from '../controllers/public.controller.js';
import { 
  comprarTicket, 
  obtenerDetallesCompra,
  asignarCortesia,
  configurarCompraOnline
} from '../controllers/publicSales.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// ========================================
// ENDPOINTS PÚBLICOS (sin autenticación)
// ========================================

// GET /public/funciones
// Lista funciones disponibles para compra
router.get('/funciones', listarFuncionesInvitado);

// GET /public/funciones/:funcionId/vendedores
// Lista vendedores de una función (solo INDEPENDIENTE)
router.get('/funciones/:funcionId/vendedores', listarVendedoresPublicosPorFuncion);

// POST /public/comprar-ticket
// 🛒 INVITADO compra entrada directa (PROFESIONAL + permite_compra_online)
router.post('/comprar-ticket', comprarTicket);

// GET /public/compras/:codigo
// Ver detalles de una compra por código
router.get('/compras/:codigo', obtenerDetallesCompra);

// ========================================
// ENDPOINTS ADMIN (requieren autenticación)
// ========================================

// POST /public/cortesia
// 🎁 ADMIN/DIRECTOR asigna entrada de cortesía
router.post(
  '/cortesia',
  authenticate,
  requireRole('SUPER', 'ADMIN'),
  asignarCortesia
);

// PATCH /public/funciones/:id/configurar-compra
// ⚙️ Habilitar/deshabilitar compra online para función
router.patch(
  '/funciones/:id/configurar-compra',
  authenticate,
  requireRole('SUPER', 'ADMIN'),
  configurarCompraOnline
);

export default router;
