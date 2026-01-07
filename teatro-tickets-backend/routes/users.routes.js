import express from 'express';
import { crearUsuario, listarUsuarios, listarVendedores as listarActores, desactivarUsuario, listarMiembros, resetPassword, crearActor, crearDirector, getWeeklyBirthdays, getMe, updateMe, changePassword } from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Perfil del usuario actual (debe ir ANTES de las rutas con parámetros)
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.post('/change-password', authenticate, changePassword);

// Cumpleaños semanales - todos los roles autenticados
router.get('/birthdays/weekly', authenticate, getWeeklyBirthdays);

// Crear actores (vendedores) - ADMIN y SUPER
router.post('/actores', authenticate, requireRole('ADMIN', 'SUPER'), crearActor);

// Crear directores (admins) - solo SUPER
router.post('/directores', authenticate, requireRole('SUPER'), crearDirector);

// Solo admin y super pueden crear usuarios (genérico)
router.post('/', authenticate, requireRole('ADMIN', 'SUPER'), crearUsuario);
router.get('/', authenticate, requireRole('ADMIN', 'SUPER'), listarUsuarios);
router.get('/actores', authenticate, listarActores);
router.get('/vendedores', authenticate, listarActores); // Compatibilidad
router.get('/miembros', authenticate, listarMiembros); // Nueva ruta para todos los miembros
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPER'), desactivarUsuario);
// Resetear contraseña (solo SUPER). Acepta id o cedula en :id. Body opcional { newPassword }
router.post('/:id/reset-password', authenticate, requireRole('SUPER'), resetPassword);

export default router;
