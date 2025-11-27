import express from 'express';
import { crearUsuario, listarUsuarios, listarVendedores, desactivarUsuario } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Solo admin puede crear usuarios
router.post('/', authenticate, requireRole('ADMIN'), crearUsuario);
router.get('/', authenticate, requireRole('ADMIN'), listarUsuarios);
router.get('/vendedores', authenticate, listarVendedores);
router.delete('/:phone', authenticate, requireRole('ADMIN'), desactivarUsuario);

export default router;
