import QRCode from 'qrcode';
import { query } from '../db/postgres.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function misTickets(req, res) {
  try {
    const vendedorCedula = req.user.cedula;
    const { show_id } = req.query;
    const params = [vendedorCedula];
    let sql = 'SELECT * FROM tickets WHERE vendedor_cedula = $1';
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
    const vendedorCedula = req.user.cedula;
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || !show_id) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    const tickets = [];
    for (let i = 0; i < cantidadNum; i++) {
      const code = `T-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      await query(
        `INSERT INTO tickets (code, show_id, estado, vendedor_cedula, created_at)
         VALUES ($1, $2, 'STOCK_VENDEDOR', $3, NOW())`,
        [code, String(show_id), vendedorCedula]
      );
      tickets.push({ code, show_id: String(show_id), estado: 'STOCK_VENDEDOR', vendedor_cedula: vendedorCedula });
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
