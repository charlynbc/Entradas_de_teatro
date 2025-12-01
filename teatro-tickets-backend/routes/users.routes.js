import express from 'express';
import { crearUsuario, listarUsuarios, listarVendedores, desactivarUsuario } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Solo admin y super pueden crear usuarios
router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearUsuario);
router.get('/', authenticate, requireRole('ADMIN', 'SUPER'), listarUsuarios);
router.get('/vendedores', authenticate, listarVendedores);
router.delete('/:phone', authenticate, requireRole('ADMIN', 'SUPER'), desactivarUsuario);

export default router;
