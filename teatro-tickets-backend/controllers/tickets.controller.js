import QRCode from 'qrcode';
import { generateTicketCode } from '../utils/generateCode.js';
import { getTickets, addTicket, updateTicketByCode } from '../utils/dataStore.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function misTickets(req, res) {
  try {
    const vendedorPhone = req.user.phone;
    const tickets = await getTickets();
    const { show_id } = req.query;
    let filtered = tickets.filter(t => t.vendedor_phone === vendedorPhone);
    if (show_id) {
      filtered = filtered.filter(t => t.show_id === parseInt(show_id));
    }
    res.json(filtered);
  } catch (error) {
    console.error('Error en misTickets:', error);
    res.status(500).json({ error: 'Error obteniendo tickets' });
  }
}

export async function asignarTickets(req, res) {
  try {
    const { cantidad, show_id } = req.body;
    const vendedorPhone = req.user.phone;
    if (!cantidad || !show_id) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    const tickets = [];
    for (let i = 0; i < cantidad; i++) {
      const ticket = {
        id: Date.now() + i,
        code: generateTicketCode(),
        show_id,
        vendedor_phone: vendedorPhone,
        usado: false,
      };
      await addTicket(ticket);
      tickets.push(ticket);
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
    const tickets = await getTickets();
    const ticket = tickets.find(t => t.id == ticket_id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const url = `${BASE_URL}/tickets/validar/${ticket.code}`;
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
    const tickets = await getTickets();
    const ticket = tickets.find(t => t.code === code);
    if (!ticket) {
      return res.status(404).json({ ok: false, mensaje: 'Ticket inválido' });
    }
    if (ticket.usado) {
      return res.json({ ok: false, mensaje: 'Ticket ya fue usado' });
    }
    await updateTicketByCode(code, { usado: true });
    res.json({ ok: true, mensaje: 'Ticket validado con éxito', ticket });
  } catch (error) {
    console.error('Error validarTicket:', error);
    res.status(500).json({ ok: false, error: 'Error validando ticket' });
  }
}
