import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { resumenObraProfesional, balanceObraProfesional, marcarCierreObra } from '../controllers/boleteria.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/obra/:obraId/resumen', resumenObraProfesional);
router.get('/obra/:obraId/balance', balanceObraProfesional);
router.post('/obra/:obraId/cierre', marcarCierreObra);

export default router;
