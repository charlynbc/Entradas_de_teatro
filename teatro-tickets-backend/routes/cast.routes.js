import express from 'express';
import { agregarVendedor, removerVendedor, listarElenco } from '../controllers/cast.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Gestionar elenco de una obra
router.get('/:id/cast', listarElenco);  // Listar elenco (público)
router.post('/:id/cast', authenticate, requireRole('ADMIN', 'SUPER'), agregarVendedor);
router.delete('/:id/cast/:cedula', authenticate, requireRole('ADMIN', 'SUPER'), removerVendedor);

export default router;
