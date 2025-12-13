import QRCode from 'qrcode';
import { generateTicketCode } from '../utils/generateCode.js';
import { readData, writeData, nextId } from '../utils/dataStore.js';
import { query } from '../db/postgres.js';

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

    // Crear el show en PostgreSQL
    const showResult = await query(
      `INSERT INTO shows (obra, fecha, lugar, capacidad, base_price) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [obra, fecha, lugar || 'Teatro Principal', capacidadNum, basePriceNum]
    );

    const show = showResult.rows[0];

    // Generar tickets
    const tickets = [];
    for (let i = 0; i < capacidadNum; i++) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateTicketCode();
        const existing = await query('SELECT code FROM tickets WHERE code = $1', [code]);
        isUnique = existing.rows.length === 0;
      }

      const qrCode = await generarQR(code);
      
      const ticketResult = await query(
        `INSERT INTO tickets (code, show_id, qr_code, estado, precio) 
         VALUES ($1, $2, $3, 'DISPONIBLE', $4) 
         RETURNING *`,
        [code, show.id, qrCode, basePriceNum]
      );
      
      tickets.push(ticketResult.rows[0]);
    }

    res.status(201).json({
      show: {
        id: show.id,
        obra: show.obra,
        fecha: show.fecha,
        lugar: show.lugar,
        capacidad: show.capacidad,
        base_price: show.base_price
      },
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
    const result = await query(
      'SELECT * FROM shows ORDER BY fecha DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando shows:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function obtenerShow(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const result = await query(
      'SELECT * FROM shows WHERE id = $1',
      [showId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show no encontrado' });
    }
    
    // Obtener tickets del show
    const ticketsResult = await query(
      'SELECT * FROM tickets WHERE show_id = $1 ORDER BY code',
      [showId]
    );
    
    const show = result.rows[0];
    show.tickets = ticketsResult.rows;
    
    res.json(show);
  } catch (error) {
    console.error('Error obteniendo show:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function asignarTickets(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { vendedor_cedula, cantidad } = req.body;
    const cantidadNum = Number(cantidad);

    if (!vendedor_cedula || !cantidadNum) {
      return res.status(400).json({ error: 'vendedor_cedula y cantidad son obligatorios' });
    }
    
    // Verificar que el show existe
    const showResult = await query('SELECT * FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    // Verificar que el vendedor existe
    const vendedorResult = await query(
      'SELECT * FROM users WHERE cedula = $1 AND role = $2 AND active = TRUE',
      [vendedor_cedula, 'VENDEDOR']
    );
    if (vendedorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    const vendedor = vendedorResult.rows[0];

    // Obtener tickets disponibles
    const disponiblesResult = await query(
      'SELECT * FROM tickets WHERE show_id = $1 AND estado = $2 LIMIT $3',
      [showId, 'DISPONIBLE', cantidadNum]
    );

    if (disponiblesResult.rows.length < cantidadNum) {
      return res.status(400).json({
        error: `Solo hay ${disponiblesResult.rows.length} tickets disponibles`
      });
    }

    // Asignar tickets al vendedor
    const codes = disponiblesResult.rows.map(t => t.code);
    await query(
      `UPDATE tickets 
       SET estado = 'STOCK_VENDEDOR', vendedor_cedula = $1, reservado_at = NOW() 
       WHERE code = ANY($2::text[])`,
      [vendedor_cedula, codes]
    );

    res.json({
      mensaje: `${codes.length} tickets asignados a ${vendedor.name}`,
      vendedor: { cedula: vendedor.cedula, name: vendedor.name },
      tickets: codes
    });
  } catch (error) {
    console.error('Error asignando tickets:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarShow(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    // Verificar que el show existe
    const showResult = await query(
      'SELECT * FROM shows WHERE id = $1',
      [showId]
    );
    
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    const show = showResult.rows[0];
    
    // Eliminar tickets asociados (por CASCADE debería hacerse automático)
    await query('DELETE FROM tickets WHERE show_id = $1', [showId]);
    
    // Eliminar el show
    await query('DELETE FROM shows WHERE id = $1', [showId]);
    
    res.json({ 
      ok: true, 
      mensaje: 'Obra eliminada correctamente',
      obra: show.obra 
    });
  } catch (error) {
    console.error('Error eliminando show:', error);
    res.status(500).json({ error: error.message });
  }
}
