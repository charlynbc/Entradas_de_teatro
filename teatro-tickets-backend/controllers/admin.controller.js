import { query } from '../db/postgres.js';

// Aprobar venta (admin confirma que recibió el dinero)
export async function aprobarVenta(req, res) {
  try {
    const { ticket_codes } = req.body; // Puede ser un array de códigos o un solo código
    const userRole = req.user.role;

    // Solo ADMIN y SUPER pueden aprobar ventas
    if (userRole !== 'ADMIN' && userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Solo administradores pueden aprobar ventas' });
    }

    // Convertir a array si es un solo código
    const codes = Array.isArray(ticket_codes) ? ticket_codes : [ticket_codes];

    if (!codes || codes.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un código de ticket' });
    }

    // Verificar que todos los tickets existen y están en estado REPORTADA_VENDIDA
    const placeholders = codes.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(
      `SELECT * FROM tickets WHERE code IN (${placeholders})`,
      codes
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron tickets' });
    }

    // Verificar que todos estén en estado correcto
    const invalidTickets = result.rows.filter(t => t.estado !== 'REPORTADA_VENDIDA');
    if (invalidTickets.length > 0) {
      return res.status(400).json({ 
        error: 'Solo se pueden aprobar tickets en estado REPORTADA_VENDIDA',
        tickets_invalidos: invalidTickets.map(t => ({ 
          code: t.code, 
          estado: t.estado 
        }))
      });
    }

    // Aprobar todas las ventas
    await query(
      `UPDATE tickets 
       SET estado = $1, 
           aprobada_por_admin = TRUE,
           pagado_at = NOW()
       WHERE code IN (${placeholders})`,
      ['PAGADO', ...codes]
    );

    const updated = await query(
      `SELECT * FROM tickets WHERE code IN (${placeholders})`,
      codes
    );

    res.json({ 
      ok: true, 
      message: `${codes.length} venta(s) aprobada(s) exitosamente`,
      tickets: updated.rows
    });
  } catch (error) {
    console.error('Error aprobarVenta:', error);
    res.status(500).json({ error: 'Error aprobando venta' });
  }
}

// Rechazar venta (devolver a RESERVADO o STOCK_VENDEDOR)
export async function rechazarVenta(req, res) {
  try {
    const { ticket_code, motivo } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'ADMIN' && userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Solo administradores pueden rechazar ventas' });
    }

    if (!ticket_code) {
      return res.status(400).json({ error: 'Debe proporcionar un código de ticket' });
    }

    const result = await query(
      'SELECT * FROM tickets WHERE code = $1',
      [ticket_code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = result.rows[0];

    if (ticket.estado !== 'REPORTADA_VENDIDA') {
      return res.status(400).json({ 
        error: `Solo se pueden rechazar tickets en estado REPORTADA_VENDIDA. Estado actual: ${ticket.estado}` 
      });
    }

    // Determinar el estado al que debe volver
    const nuevoEstado = ticket.comprador_nombre ? 'RESERVADO' : 'STOCK_VENDEDOR';

    // Rechazar la venta
    await query(
      `UPDATE tickets 
       SET estado = $1, 
           reportada_por_vendedor = FALSE,
           reportada_at = NULL,
           precio = NULL,
           medio_pago = NULL
       WHERE code = $2`,
      [nuevoEstado, ticket_code]
    );

    const updated = await query('SELECT * FROM tickets WHERE code = $1', [ticket_code]);

    res.json({ 
      ok: true, 
      message: `Venta rechazada. Ticket devuelto a estado ${nuevoEstado}`,
      motivo,
      ticket: updated.rows[0]
    });
  } catch (error) {
    console.error('Error rechazarVenta:', error);
    res.status(500).json({ error: 'Error rechazando venta' });
  }
}

// Listar ventas pendientes de aprobación
export async function listarVentasPendientes(req, res) {
  try {
    const userRole = req.user.role;

    if (userRole !== 'ADMIN' && userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Solo administradores pueden ver ventas pendientes' });
    }

    const { show_id } = req.query;

    let sql = `
      SELECT 
        t.*,
        s.obra,
        s.fecha as show_fecha,
        s.lugar,
        u.name as vendedor_nombre
      FROM tickets t
      JOIN shows s ON s.id = t.show_id
      LEFT JOIN users u ON u.phone = t.vendedor_phone
      WHERE t.estado = 'REPORTADA_VENDIDA'
        AND t.reportada_por_vendedor = TRUE
        AND t.aprobada_por_admin = FALSE
    `;

    const params = [];
    
    if (show_id) {
      params.push(show_id);
      sql += ` AND t.show_id = $1`;
    }

    sql += ` ORDER BY t.reportada_at DESC`;

    const result = await query(sql, params);

    // Calcular total pendiente de aprobación
    const totalPendiente = result.rows.reduce((sum, ticket) => {
      return sum + (Number(ticket.precio) || 0);
    }, 0);

    res.json({ 
      ok: true, 
      total_tickets: result.rows.length,
      total_pendiente: totalPendiente,
      tickets: result.rows
    });
  } catch (error) {
    console.error('Error listarVentasPendientes:', error);
    res.status(500).json({ error: 'Error listando ventas pendientes' });
  }
}
