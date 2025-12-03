import express from 'express';
import { agregarVendedor, removerVendedor, listarElenco } from '../controllers/cast.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Gestionar elenco de una obra (ahora usa /api/obras/:id/elenco)
router.get('/:id/elenco', listarElenco);  // Listar elenco (público)
router.post('/:id/elenco', authenticate, requireRole('ADMIN', 'SUPER'), agregarVendedor);
router.delete('/:id/elenco/:cedula', authenticate, requireRole('ADMIN', 'SUPER'), removerVendedor);

export default router;
