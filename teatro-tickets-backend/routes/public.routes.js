import express from 'express';
import { listarFuncionesInvitado, listarVendedoresPublicosPorFuncion } from '../controllers/public.controller.js';

const router = express.Router();

// GET /public/funciones
router.get('/funciones', listarFuncionesInvitado);

// GET /public/funciones/:funcionId/vendedores
router.get('/funciones/:funcionId/vendedores', listarVendedoresPublicosPorFuncion);

export default router;
