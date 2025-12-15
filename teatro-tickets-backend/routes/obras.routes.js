import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as obrasController from '../controllers/obras.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD de obras
router.post('/', obrasController.crearObra);
router.get('/', obrasController.listarObras);
router.get('/grupo/:grupoId', obrasController.listarObrasPorGrupo);
router.get('/:id', obrasController.obtenerObra);
router.put('/:id', obrasController.actualizarObra);
router.delete('/:id', obrasController.eliminarObra);
router.post('/:id/archivar', obrasController.archivarObra);

export default router;
