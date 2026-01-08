import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { resumenAnual } from '../controllers/contabilidad.controller.js';

const router = express.Router();

router.use(authenticate);
router.get('/anual', resumenAnual);

export default router;
