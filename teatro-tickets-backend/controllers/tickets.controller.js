import QRCode from 'qrcode';
import { query } from '../db/postgres.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function misTickets(req, res) {
  try {
    const vendedorId = req.user.id;
    const { show_id } = req.query;
    const params = [vendedorId];
    let sql = 'SELECT * FROM tickets WHERE vendedor_id = $1';
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
    const vendedorId = req.user.id;
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || !show_id) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    const tickets = [];
    for (let i = 0; i < cantidadNum; i++) {
      const id = String(Date.now()) + '-' + i;
      const qr_code = `T-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      await query(
        `INSERT INTO tickets (id, show_id, qr_code, estado, vendedor_id, fecha_asignacion, created_at, updated_at)
         VALUES ($1, $2, $3, 'EN_PODER', $4, NOW(), NOW(), NOW())`,
        [id, String(show_id), qr_code, vendedorId]
      );
      tickets.push({ id, show_id: String(show_id), qr_code, estado: 'EN_PODER', vendedor_id: vendedorId });
    }
    res.json({ message: 'Tickets asignados', tickets });
  } catch (error) {
    console.error('Error asignarTickets:', error);
    res.status(500).json({ error: 'No se pudieron asignar tickets' });
  }
}

export async function generarQR(req, res) {
  try {
    const { ticket_id } = req.params;
    const result = await query('SELECT * FROM tickets WHERE id = $1', [String(ticket_id)]);
    const ticket = result.rows[0];
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const url = `${BASE_URL}/tickets/validar/${ticket.qr_code}`;
    const qr = await QRCode.toDataURL(url);
    res.json({ qr });
  } catch (error) {
    console.error('Error generarQR:', error);
    res.status(500).json({ error: 'Error generando QR' });
  }
}

export async function validarTicket(req, res) {
  try {
    const { code } = req.params;
    const result = await query('SELECT * FROM tickets WHERE qr_code = $1', [code]);
    const ticket = result.rows[0];
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket no encontrado o inválido' });
    }
    if (ticket.estado === 'USADA') {
      return res.json({ ok: false, mensaje: 'Ticket ya fue usado' });
    }
    try {
      await query('UPDATE tickets SET estado = $1, fecha_uso = NOW(), updated_at = NOW() WHERE id = $2', ['USADA', ticket.id]);
      res.json({ ok: true, mensaje: 'Ticket validado con éxito', ticket: { ...ticket, estado: 'USADA' } });
    } catch (e) {
      console.error('Update ticket failed:', e);
      return res.status(500).json({ ok: false, error: 'Error actualizando ticket' });
    }
  } catch (error) {
    console.error('Error validarTicket:', error);
    res.status(500).json({ ok: false, error: 'Error validando ticket' });
  }
}
