import express from 'express';
import { login, completarRegistro, verificarToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/completar-registro', completarRegistro);
router.get('/verificar', authenticate, verificarToken);

export default router;
