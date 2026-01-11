import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  generarEntradasFuncion,
  listarEntradas,
  asignarActor,
  reservarEntrada,
  marcarPronta,
  confirmarPago,
  marcarNoVendida,
  perdonarDeuda,
  escanearEntrada,
  statsFuncion,
  statsActor,
  generarPdfEntrada
} from '../controllers/entradasV2.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res, next) => {
  // Forzar filtro por actor para actores
  if (req.user?.role === 'ACTOR') {
    req.query.actor_cedula = req.user.cedula;
  }
  return listarEntradas(req, res, next);
});

router.post('/funcion/:funcionId/generar', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), generarEntradasFuncion);
router.post('/:code/asignar', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), asignarActor);
router.post('/:code/reservar', requireRole('ACTOR'), reservarEntrada);
router.post('/:code/pronta', requireRole('ACTOR'), marcarPronta);
router.post('/:code/pagar', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), confirmarPago);
router.post('/:code/no-vendida', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), marcarNoVendida);
router.post('/:code/perdonar', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), perdonarDeuda);
router.post('/:code/escanear', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), escanearEntrada);
router.get('/:code/pdf', requireRole('SUPER', 'ADMIN', 'DIRECTOR', 'ACTOR'), generarPdfEntrada);

router.get('/estadisticas/funcion/:funcionId', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), statsFuncion);
router.get('/estadisticas/actor/:actorCedula', requireRole('SUPER', 'ADMIN', 'DIRECTOR'), statsActor);

export default router;
