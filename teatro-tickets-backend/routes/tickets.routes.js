import express from 'express';
import {
	misTickets,
	stockActor,
	asignarTickets,
	generarQR,
	validarTicket,
	actualizarTicketLegacy,
	actualizarEstadoTicket,
	transferirTicket,
	cobrarTickets,
	anularTicket
} from '../controllers/tickets.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';
import {
	bloquearSiGrupoCerradoPorFuncionId,
	bloquearSiGrupoCerradoPorTicketCodes
} from '../middleware/grupo-cierre.middleware.js';

const router = express.Router();

// Endpoints de gestión de tickets (solo requieren estar autenticado)
router.get('/mis-tickets', authenticate, misTickets);

// Compatibilidad (tests): stock del actor
router.get('/stock', authenticate, requireRole('ACTOR'), stockActor);

// Asignar tickets a un actor/vendedor (solo SUPER/ADMIN)
router.post(
	'/asignar',
	authenticate,
	requireRole('SUPER', 'ADMIN'),
	// Puede venir por funcion_id (nuevo) o por ticketIds (legacy)
	bloquearSiGrupoCerradoPorFuncionId({ bodyKey: 'funcion_id' }),
	bloquearSiGrupoCerradoPorTicketCodes({ bodyKey: 'ticketIds' }),
	asignarTickets
);

// Compatibilidad (tests): actualizar ticket por code/id
router.put(
	'/:code',
	authenticate,
	requireRole('ACTOR'),
	bloquearSiGrupoCerradoPorTicketCodes({ paramName: 'code' }),
	actualizarTicketLegacy
);

// Actor/vendedor: actualizar estado (reservar/reportar venta) de un ticket propio
router.post(
	'/estado',
	authenticate,
	requireRole('ACTOR'),
	bloquearSiGrupoCerradoPorTicketCodes({ singleKey: 'ticketId' }),
	actualizarEstadoTicket
);

// Actor/vendedor: transferir un ticket propio a otro actor
router.post(
	'/transferir',
	authenticate,
	requireRole('ACTOR'),
	bloquearSiGrupoCerradoPorTicketCodes({ bodyKey: 'ticketIds', singleKey: 'ticketCode' }),
	transferirTicket
);

// Director/Super: cobrar (aprobar pago) para un actor en una función
router.post(
	'/cobrar',
	authenticate,
	requireRole('SUPER', 'ADMIN'),
	bloquearSiGrupoCerradoPorFuncionId({ bodyKey: 'showId' }),
	cobrarTickets
);

// Director/Super: anular ticket (motivo obligatorio)
router.post(
	'/:code/anular',
	authenticate,
	requireRole('SUPER', 'ADMIN'),
	bloquearSiGrupoCerradoPorTicketCodes({ paramName: 'code' }),
	anularTicket
);

// Generar QR para un ticket especifico
router.get('/:code/qr', authenticate, generarQR);

// Validar ticket (scanner): requiere auth para marcar USADO (evita que un tercero invalide tickets)
router.get('/validar/:code', optionalAuthenticate, validarTicket);

export default router;
