import express from 'express';
import { login, completarRegistro, verificarToken, register, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/completar-registro', completarRegistro);
router.post('/change-password', authenticate, changePassword);
router.get('/verificar', authenticate, verificarToken);
router.get('/me', authenticate, verificarToken); // Alias para verificar token

export default router;
