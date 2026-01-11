/**
 * Controlador de Tickets - Capa HTTP
 * Controller DELGADO: solo maneja HTTP, delega lógica a ticketService
 */

import QRCode from 'qrcode';
import { query } from '../db/postgres.js';
import { logAction } from '../services/action-logs.service.js';
import * as ticketService from '../services/ticketService.js';
import { logger } from '../utils/logger.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * GET /mis-tickets
 * Obtiene tickets del vendedor autenticado
 */
export async function misTickets(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    const { funcion_id } = req.query;

    // Si piden función específica, filtrar en SQL
    if (funcion_id) {
      const result = await query(
        `SELECT 
          t.*,
          f.fecha as funcion_fecha,
          f.lugar as funcion_lugar,
          o.nombre as obra_nombre
        FROM tickets t
        JOIN funciones f ON f.id = t.funcion_id
        JOIN obras o ON o.id = f.obra_id
        WHERE t.vendedor_phone = $1 AND t.funcion_id = $2
        ORDER BY f.fecha ASC, t.code ASC`,
        [vendedorPhone, String(funcion_id)]
      );
      return res.json(result.rows);
    }

    // Obtener todo el stock (agrupado)
    const result = await ticketService.getVendorStock(vendedorPhone);
    
    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.stock);
  } catch (error) {
    logger.error(`Error en misTickets: ${error.message}`);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
}

/**
 * POST /asignar
 * Asigna tickets a un vendedor (SUPER/ADMIN)
 */
export async function asignarTickets(req, res) {
  try {
    const { funcionId, showId, vendedorId, vendedorPhone, cantidad, precioVenta } = req.body || {};
    
    // Soportar múltiples formatos de payload (legacy + nuevo)
    const finalFuncionId = funcionId || showId;
    const finalVendedorPhone = vendedorPhone || vendedorId;

    // Validar datos requeridos
    if (!finalFuncionId || !finalVendedorPhone || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos: funcionId/showId, vendedorPhone/vendedorId, cantidad' });
    }

    // Llamar al servicio
    const result = await ticketService.assignTickets({
      funcionId: finalFuncionId,
      vendedorPhone: finalVendedorPhone,
      cantidad: parseInt(cantidad, 10),
      precioVenta,
      assignedBy: req.user.phone || req.user.cedula
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acción
    await logAction(req, {
      accion: 'asignacion',
      entidad: 'tickets',
      entidad_id: finalFuncionId,
      descripcion: `Asignados ${result.tickets.length} tickets a ${finalVendedorPhone}`
    });

    res.json({ message: 'Tickets asignados', tickets: result.tickets });
  } catch (error) {
    logger.error(`Error asignarTickets: ${error.message}`);
    res.status(500).json({ error: 'No se pudieron asignar tickets' });
  }
}

/**
 * GET /stock
 * Obtiene stock agrupado por función (ACTOR)
 */
export async function stockActor(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    
    const result = await ticketService.getVendorStock(vendedorPhone);
    
    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    res.json(result.stock);
  } catch (error) {
    logger.error(`Error stockActor: ${error.message}`);
    res.status(500).json({ error: 'Error obteniendo stock' });
  }
}

/**
 * PUT /:code (LEGACY)
 * Actualiza ticket - compatibilidad con tests antiguos
 */
export async function actualizarTicketLegacy(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    const code = String(req.params.code || '').trim();
    const { estado, comprador_nombre, comprador_telefono } = req.body || {};

    if (!code || !estado) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Normalizar estados legacy
    let normalized = String(estado).toUpperCase();
    if (normalized === 'VENDIDA_PAGADA' || normalized === 'VENDIDA') {
      normalized = 'REPORTADA_VENDIDA';
    }
    if (normalized === 'RESERVADA') {
      normalized = 'RESERVADO';
    }

    // Llamar al servicio
    const result = await ticketService.updateTicketStatus({
      code,
      newState: normalized,
      vendedorPhone,
      compradorNombre: comprador_nombre,
      compradorTelefono: comprador_telefono
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acción
    if (normalized === 'REPORTADA_VENDIDA') {
      await logAction(req, {
        accion: 'venta',
        entidad: 'ticket',
        entidad_id: result.ticket.code,
        descripcion: `Venta reportada - Comprador: ${comprador_nombre || 'N/A'}`
      });
    }

    res.json(result.ticket);
  } catch (error) {
    logger.error(`Error actualizarTicketLegacy: ${error.message}`);
    res.status(500).json({ error: 'No se pudo actualizar el ticket' });
  }
}

/**
 * POST /estado
 * Actualiza estado de ticket (ACTOR)
 */
export async function actualizarEstadoTicket(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    const { ticketId, ticketCode, estado, comprador_nombre, comprador_telefono } = req.body || {};
    const code = String(ticketId || ticketCode || '').trim();
    const newState = String(estado || '').trim();

    if (!code || !newState) {
      return res.status(400).json({ error: 'Faltan datos: ticketId/ticketCode, estado' });
    }

    // Llamar al servicio
    const result = await ticketService.updateTicketStatus({
      code,
      newState,
      vendedorPhone,
      compradorNombre: comprador_nombre,
      compradorTelefono: comprador_telefono
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acción
    if (newState === 'REPORTADA_VENDIDA') {
      await logAction(req, {
        accion: 'venta',
        entidad: 'ticket',
        entidad_id: result.ticket.code,
        descripcion: `Venta reportada - Comprador: ${comprador_nombre || 'N/A'}`
      });
    }

    res.json(result.ticket);
  } catch (error) {
    logger.error(`Error actualizarEstadoTicket: ${error.message}`);
    res.status(500).json({ error: 'No se pudo actualizar el ticket' });
  }
}

/**
 * POST /transferir
 * Transfiere ticket a otro vendedor (ACTOR)
 */
export async function transferirTicket(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    const body = req.body || {};

    // Payload LEGACY (tests): { ticketIds: [code], targetVendedorId: cedula }
    if (Array.isArray(body.ticketIds) && body.ticketIds.length > 0 && body.targetVendedorId) {
      const codes = body.ticketIds.map(String);
      const targetCedula = String(body.targetVendedorId);
      const motivo = body.motivo || 'Transferencia múltiple (legacy)';

      // Transferir cada ticket
      const results = [];
      const errors = [];

      for (const code of codes) {
        const result = await ticketService.transferTicket({
          code,
          fromVendorPhone: vendedorPhone,
          toVendorCedula: targetCedula,
          motivo
        });

        if (result.error) {
          errors.push({ code, error: result.error });
        } else {
          results.push(result.ticket);
          await logAction(req, {
            accion: 'transferencia',
            entidad: 'ticket',
            entidad_id: code,
            descripcion: `Ticket transferido a ${result.destinoName || targetCedula}`
          });
        }
      }

      if (results.length === 0) {
        return res.status(400).json({ error: 'No se pudo transferir ningún ticket', details: errors });
      }

      return res.json({ ok: true, tickets: results, errors: errors.length > 0 ? errors : undefined });
    }

    // Payload NUEVO (frontend): { ticketCode, destino, motivo }
    const { ticketCode, destino, motivo } = body;
    const code = String(ticketCode || '').trim();
    const targetCedula = String(destino || '').trim();

    if (!code || !targetCedula) {
      return res.status(400).json({ error: 'Faltan datos: ticketCode, destino' });
    }

    // Llamar al servicio
    const result = await ticketService.transferTicket({
      code,
      fromVendorPhone: vendedorPhone,
      toVendorCedula: targetCedula,
      motivo: motivo || 'Transferencia entre vendedores'
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acción
    await logAction(req, {
      accion: 'transferencia',
      entidad: 'ticket',
      entidad_id: code,
      descripcion: `Ticket transferido a ${result.destinoName || targetCedula}`
    });

    res.json({ ok: true, ticket: result.ticket });
  } catch (error) {
    logger.error(`Error transferirTicket: ${error.message}`);
    res.status(500).json({ error: 'No se pudo transferir el ticket' });
  }
}

/**
 * POST /cobrar
 * Aprueba pagos de tickets reportados (SUPER/ADMIN)
 */
export async function cobrarTickets(req, res) {
  try {
    const { showId, actorId } = req.body || {};
    const funcionId = String(showId || '').trim();
    const actorCedula = String(actorId || '').trim();

    if (!funcionId || !actorCedula) {
      return res.status(400).json({ error: 'Faltan datos: showId, actorId' });
    }

    // Llamar al servicio
    const result = await ticketService.approvePayments({
      funcionId,
      vendedorCedula: actorCedula,
      approvedBy: req.user.phone || req.user.cedula
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acciones
    await logAction(req, {
      accion: 'cobro',
      entidad: 'tickets',
      entidad_id: funcionId,
      descripcion: `Aprobados ${result.count} pagos para función ${funcionId}`
    });

    res.json({ ok: true, count: result.count });
  } catch (error) {
    logger.error(`Error cobrarTickets: ${error.message}`);
    res.status(500).json({ error: 'No se pudieron cobrar tickets' });
  }
}

/**
 * GET /:code/qr
 * Genera código QR para un ticket
 */
export async function generarQR(req, res) {
  try {
    const { code } = req.params;
    const result = await query('SELECT * FROM tickets WHERE code = $1', [code]);
    const ticket = result.rows[0];
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const url = `${BASE_URL}/tickets/validar/${ticket.code}`;
    const qr = await QRCode.toDataURL(url);
    
    res.json({ qr, ticket });
  } catch (error) {
    logger.error(`Error generarQR: ${error.message}`);
    res.status(500).json({ error: 'Error generando QR' });
  }
}

/**
 * GET /validar/:code
 * Valida ticket en puerta (SUPER/ADMIN)
 */
export async function validarTicket(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, mensaje: 'No autorizado' });
    }

    if (!['SUPER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ ok: false, mensaje: 'No autorizado' });
    }

    const { code } = req.params;

    // Llamar al servicio
    const result = await ticketService.validateTicket({
      code,
      validatorRole: req.user.role,
      validatorCedula: req.user.cedula,
      validatorPhone: req.user.phone
    });

    // Si hay error con status, usarlo
    if (result.status) {
      return res.status(result.status).json(result);
    }

    // Log de acción solo si fue exitoso
    if (result.ok) {
      await logAction(req, {
        accion: 'validacion',
        entidad: 'ticket',
        entidad_id: code,
        descripcion: 'Ticket validado en puerta'
      });
    }

    res.json(result);
  } catch (error) {
    logger.error(`Error validarTicket: ${error.message}`);
    res.status(500).json({ ok: false, error: 'Error validando ticket' });
  }
}

/**
 * POST /:code/anular
 * Anula un ticket (SUPER/ADMIN)
 */
export async function anularTicket(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!['SUPER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { code } = req.params;
    const { motivo } = req.body || {};

    // Llamar al servicio
    const result = await ticketService.annulateTicket({
      code,
      motivo,
      annulatedByRole: req.user.role,
      annulatedByCedula: req.user.cedula,
      annulatedByPhone: req.user.phone
    });

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // Log de acción
    await logAction(req, {
      accion: 'anulacion',
      entidad: 'ticket',
      entidad_id: code,
      descripcion: `Ticket anulado. Motivo: ${motivo}`
    });

    res.json(result);
  } catch (error) {
    logger.error(`Error anularTicket: ${error.message}`);
    res.status(500).json({ error: 'No se pudo anular el ticket' });
  }
}
