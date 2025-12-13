import express from 'express';
import { crearUsuario, listarUsuarios, listarVendedores, desactivarUsuario, listarMiembros, resetPassword, crearActor, crearDirector } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Crear actores (vendedores) - ADMIN y SUPER
router.post('/actores', authenticate, requireRole('ADMIN', 'SUPER'), crearActor);

// Crear directores (admins) - solo SUPER
router.post('/directores', authenticate, requireRole('SUPER'), crearDirector);

// Solo admin y super pueden crear usuarios (genérico)
router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearUsuario);
router.get('/', authenticate, requireRole('ADMIN', 'SUPER'), listarUsuarios);
router.get('/vendedores', authenticate, listarVendedores);
router.get('/miembros', authenticate, listarMiembros); // Nueva ruta para todos los miembros
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), desactivarUsuario);
// Resetear contraseña (solo SUPER). Acepta id o cedula en :id. Body opcional { newPassword }
router.post('/:id/reset-password', authenticate, requireRole('SUPER'), resetPassword);

export default router;
