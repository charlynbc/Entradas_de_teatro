import QRCode from 'qrcode';
import { generateTicketCode } from '../utils/generateCode.js';
import { readData, writeData, nextId } from '../utils/dataStore.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function generarQR(code) {
  try {
    const url = `${BASE_URL}/validar/${code}`;
    const dataUrl = await QRCode.toDataURL(url);
    return dataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    return null;
  }
}

export async function crearShow(req, res) {
  try {
    const { obra, fecha, lugar, capacidad, base_price } = req.body;
    const capacidadNum = Number(capacidad);
    const basePriceNum = Number(base_price);

    if (!obra || !fecha || !capacidadNum || !basePriceNum) {
      return res.status(400).json({ 
        error: 'obra, fecha, capacidad y base_price son obligatorios' 
      });
    }
    const data = await readData();
    const showId = nextId(data.shows);
    const now = new Date().toISOString();

    const show = {
      id: showId,
      obra,
      fecha,
      lugar: lugar || null,
      capacidad: capacidadNum,
      base_price: basePriceNum,
      created_at: now
    };

    const tickets = [];
    let ticketSequence = nextId(data.tickets);
    for (let i = 0; i < capacidadNum; i++) {
      let code;
      do {
        code = generateTicketCode();
      } while (
        data.tickets.some(t => t.code === code) ||
        tickets.some(t => t.code === code)
      );

      const qrCode = await generarQR(code);
      tickets.push({
        id: ticketSequence++,
        code,
        show_id: showId,
        estado: 'DISPONIBLE',
        qr_code: qrCode,
        precio: basePriceNum,
        created_at: now
      });
    }

    data.shows.push(show);
    data.tickets.push(...tickets);
    await writeData(data);

    res.status(201).json({
      show,
      tickets_generados: tickets.length,
      mensaje: `Función creada con ${tickets.length} tickets disponibles`
    });
  } catch (error) {
    console.error('Error creando show:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarShows(req, res) {
  try {
    const data = await readData();
    const shows = [...(data.shows || [])].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(shows);
  } catch (error) {
    console.error('Error listando shows:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function asignarTickets(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { vendedor_phone, cantidad } = req.body;
    const cantidadNum = Number(cantidad);

    if (!vendedor_phone || !cantidadNum) {
      return res.status(400).json({ error: 'vendedor_phone y cantidad son obligatorios' });
    }
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const vendedor = (data.users || []).find(
      user => user.phone === vendedor_phone && user.role === 'VENDEDOR' && user.active !== false
    );
    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    const disponibles = data.tickets.filter(
      ticket => ticket.show_id === showId && ticket.estado === 'DISPONIBLE'
    );

    if (disponibles.length < cantidadNum) {
      return res.status(400).json({
        error: `Solo hay ${disponibles.length} tickets disponibles`
      });
    }

    const asignados = disponibles.slice(0, cantidadNum);
    const now = new Date().toISOString();
    asignados.forEach(ticket => {
      ticket.estado = 'STOCK_VENDEDOR';
      ticket.vendedor_phone = vendedor_phone;
      ticket.asignado_at = now;
    });

    await writeData(data);
    const codes = asignados.map(t => t.code);
    res.json({
      mensaje: `${codes.length} tickets asignados a ${vendedor.name || vendedor.phone}`,
      vendedor: { phone: vendedor.phone, name: vendedor.name },
      tickets: codes
    });
  } catch (error) {
    console.error('Error asignando tickets:', error);
    res.status(500).json({ error: error.message });
  }
}
