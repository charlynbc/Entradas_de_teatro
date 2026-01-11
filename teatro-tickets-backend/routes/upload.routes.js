import express from 'express';
import { uploadImage, deleteImage, listImages } from '../controllers/upload.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Subir imagen (solo usuarios autenticados)
router.post('/image', authenticate, uploadImage);

// Listar imágenes (solo usuarios autenticados)
router.get('/image', authenticate, listImages);

// Eliminar imagen (solo SUPER y ADMIN por ahora)
router.delete('/image', authenticate, requireRole('ADMIN', 'SUPER'), deleteImage);

export default router;
