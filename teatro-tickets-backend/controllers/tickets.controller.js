import QRCode from 'qrcode';
import { query } from '../db/postgres.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function misTickets(req, res) {
  try {
    const vendedorPhone = req.user.phone || req.user.cedula;
    const { show_id } = req.query;
    const params = [vendedorPhone];
    let sql = 'SELECT * FROM tickets WHERE vendedor_phone = $1';
    if (show_id) { sql += ' AND show_id = $2'; params.push(String(show_id)); }
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en misTickets:', error);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
}

export async function asignarTickets(req, res) {
  try {
    const { cantidad, show_id } = req.body;
    const vendedorPhone = req.user.phone || req.user.cedula;
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || !show_id) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    const tickets = [];
    for (let i = 0; i < cantidadNum; i++) {
      const code = `T-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      await query(
        `INSERT INTO tickets (code, show_id, estado, vendedor_phone, created_at)
         VALUES ($1, $2, 'STOCK_VENDEDOR', $3, NOW())`,
        [code, String(show_id), vendedorPhone]
      );
      tickets.push({ code, show_id: String(show_id), estado: 'STOCK_VENDEDOR', vendedor_phone: vendedorPhone });
    }
    res.json({ message: 'Tickets asignados', tickets });
  } catch (error) {
    console.error('Error asignarTickets:', error);
    res.status(500).json({ error: 'No se pudieron asignar tickets' });
  }
}

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
    console.error('Error generarQR:', error);
    res.status(500).json({ error: 'Error generando QR' });
  }
}

export async function validarTicket(req, res) {
  try {
    const { code } = req.params;
    const result = await query('SELECT * FROM tickets WHERE code = $1', [code]);
    const ticket = result.rows[0];
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado o inválido' });
    }
    if (ticket.estado === 'USADO') {
      return res.json({ ok: false, mensaje: 'Ticket ya fue usado' });
    }
    try {
      await query('UPDATE tickets SET estado = $1, usado_at = NOW() WHERE code = $2', ['USADO', code]);
      res.json({ ok: true, mensaje: 'Ticket validado con éxito', ticket: { ...ticket, estado: 'USADO' } });
    } catch (e) {
      console.error('Update ticket failed:', e);
      return res.status(500).json({ ok: false, error: 'Error actualizando ticket' });
    }
  } catch (error) {
    console.error('Error validarTicket:', error);
    res.status(500).json({ ok: false, error: 'Error validando ticket' });
  }
}

// Reservar ticket (vendedor pone nombre del comprador)
export async function reservarTicket(req, res) {
  try {
    const { code } = req.params;
    const { comprador_nombre, comprador_contacto } = req.body;
    const vendedorPhone = req.user.phone || req.user.cedula;

    if (!comprador_nombre) {
      return res.status(400).json({ error: 'Nombre del comprador es obligatorio' });
    }

    // Verificar que el ticket existe y pertenece al vendedor
    const result = await query(
      'SELECT * FROM tickets WHERE code = $1 AND vendedor_phone = $2',
      [code, vendedorPhone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o no le pertenece' });
    }

    const ticket = result.rows[0];

    // Solo se puede reservar si está en STOCK_VENDEDOR
    if (ticket.estado !== 'STOCK_VENDEDOR') {
      return res.status(400).json({ 
        error: `No se puede reservar. Estado actual: ${ticket.estado}` 
      });
    }

    // Actualizar a RESERVADO
    await query(
      `UPDATE tickets 
       SET estado = $1, 
           comprador_nombre = $2, 
           comprador_contacto = $3,
           reservado_at = NOW()
       WHERE code = $4`,
      ['RESERVADO', comprador_nombre, comprador_contacto, code]
    );

    const updated = await query('SELECT * FROM tickets WHERE code = $1', [code]);

    res.json({ 
      ok: true, 
      message: 'Ticket reservado exitosamente',
      ticket: updated.rows[0]
    });
  } catch (error) {
    console.error('Error reservarTicket:', error);
    res.status(500).json({ error: 'Error reservando ticket' });
  }
}

// Reportar venta (vendedor indica que cobró)
export async function reportarVenta(req, res) {
  try {
    const { code } = req.params;
    const { precio, medio_pago } = req.body;
    const vendedorPhone = req.user.phone || req.user.cedula;

    if (!precio) {
      return res.status(400).json({ error: 'El precio es obligatorio' });
    }

    // Verificar que el ticket existe y pertenece al vendedor
    const result = await query(
      'SELECT t.*, s.base_price FROM tickets t JOIN shows s ON s.id = t.show_id WHERE t.code = $1 AND t.vendedor_phone = $2',
      [code, vendedorPhone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o no le pertenece' });
    }

    const ticket = result.rows[0];

    // Solo se puede reportar si está RESERVADO o STOCK_VENDEDOR
    if (ticket.estado !== 'RESERVADO' && ticket.estado !== 'STOCK_VENDEDOR') {
      return res.status(400).json({ 
        error: `No se puede reportar venta. Estado actual: ${ticket.estado}` 
      });
    }

    // Actualizar a REPORTADA_VENDIDA
    await query(
      `UPDATE tickets 
       SET estado = $1, 
           precio = $2,
           medio_pago = $3,
           reportada_por_vendedor = TRUE,
           reportada_at = NOW()
       WHERE code = $4`,
      ['REPORTADA_VENDIDA', precio, medio_pago || 'efectivo', code]
    );

    const updated = await query('SELECT * FROM tickets WHERE code = $1', [code]);

    res.json({ 
      ok: true, 
      message: 'Venta reportada exitosamente. Pendiente de aprobación del admin.',
      ticket: updated.rows[0]
    });
  } catch (error) {
    console.error('Error reportarVenta:', error);
    res.status(500).json({ error: 'Error reportando venta' });
  }
}
