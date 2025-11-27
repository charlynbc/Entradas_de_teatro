import db from '../db.js';
import { generateTicketCode } from '../utils/generateCode.js';
import QRCode from 'qrcode';

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
    
    if (!obra || !fecha || !capacidad || !base_price) {
      return res.status(400).json({ 
        error: 'obra, fecha, capacidad y base_price son obligatorios' 
      });
    }
    
    const result = await db.query(
      `INSERT INTO shows(obra, fecha, lugar, capacidad, base_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [obra, fecha, lugar || null, capacidad, base_price]
    );
    
    const show = result.rows[0];
    
    // Generar tickets automáticamente
    const tickets = [];
    for (let i = 0; i < capacidad; i++) {
      let code;
      do {
        code = generateTicketCode();
        const exists = await db.query('SELECT code FROM tickets WHERE code = $1', [code]);
        if (exists.rows.length === 0) break;
      } while (true);
      
      const qrCode = await generarQR(code);
      
      await db.query(
        `INSERT INTO tickets (code, show_id, estado, qr_code)
         VALUES ($1, $2, 'DISPONIBLE', $3)`,
        [code, show.id, qrCode]
      );
      
      tickets.push({ code, estado: 'DISPONIBLE' });
    }
    
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
    const result = await db.query('SELECT * FROM shows ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando shows:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function asignarTickets(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { vendedor_phone, cantidad } = req.body;
    
    if (!vendedor_phone || !cantidad) {
      return res.status(400).json({ error: 'vendedor_phone y cantidad son obligatorios' });
    }
    
    // Verificar vendedor
    const vendedor = await db.query(
      `SELECT phone, name FROM users WHERE phone = $1 AND role = 'VENDEDOR' AND active = TRUE`,
      [vendedor_phone]
    );
    
    if (vendedor.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    // Obtener tickets disponibles
    const disponibles = await db.query(
      `SELECT code FROM tickets 
       WHERE show_id = $1 AND estado = 'DISPONIBLE' 
       LIMIT $2`,
      [showId, cantidad]
    );
    
    if (disponibles.rows.length < cantidad) {
      return res.status(400).json({
        error: `Solo hay ${disponibles.rows.length} tickets disponibles`
      });
    }
    
    // Asignar
    const codes = disponibles.rows.map(r => r.code);
    await db.query(
      `UPDATE tickets 
       SET estado = 'STOCK_VENDEDOR', vendedor_phone = $1, asignado_at = NOW()
       WHERE code = ANY($2::text[])`,
      [vendedor_phone, codes]
    );
    
    res.json({
      mensaje: `${codes.length} tickets asignados a ${vendedor.rows[0].name}`,
      vendedor: vendedor.rows[0],
      tickets: codes
    });
  } catch (error) {
    console.error('Error asignando tickets:', error);
    res.status(500).json({ error: error.message });
  }
}
