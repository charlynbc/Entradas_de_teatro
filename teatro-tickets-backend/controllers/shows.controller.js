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
    const adminId = req.user?.id; // ID del director que crea el show

    if (!obra || !fecha || !capacidadNum || !basePriceNum) {
      return res.status(400).json({ 
        error: 'obra, fecha, capacidad y base_price son obligatorios' 
      });
    }

    // Crear el show en PostgreSQL
    const showResult = await query(
      `INSERT INTO shows (titulo, fecha, lugar, capacidad, precio_base, director_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [obra, fecha, lugar || 'Sin especificar', capacidadNum, basePriceNum, adminId]
    );

    const show = showResult.rows[0];
    const showId = show.id;

    // Generar tickets
    const tickets = [];
    for (let i = 0; i < capacidadNum; i++) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateTicketCode();
        const existing = await query('SELECT id FROM tickets WHERE code = $1', [code]);
        isUnique = existing.rows.length === 0;
      }

      const qrCode = await generarQR(code);
      
      const ticketResult = await query(
        `INSERT INTO tickets (code, show_id, estado, qr_code, precio, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [code, showId, 'DISPONIBLE', qrCode, basePriceNum]
      );
      
      tickets.push(ticketResult.rows[0]);
    }

    res.status(201).json({
      show: {
        id: show.id,
        obra: show.titulo,
        fecha: show.fecha,
        lugar: show.lugar,
        capacidad: show.capacidad,
        base_price: show.precio_base
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

export async function eliminarShow(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el show existe
    const showResult = await query(
      'SELECT * FROM shows WHERE id = $1',
      [id]
    );
    
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Verificar permisos: debe ser el creador o SUPER
    const show = showResult.rows[0];
    if (req.user.role !== 'SUPER' && show.creado_por !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta obra' });
    }
    
    // Eliminar tickets asociados (por CASCADE debería hacerse automático)
    // Pero lo hacemos explícito para estar seguros
    await query('DELETE FROM tickets WHERE show_id = $1', [id]);
    
    // Eliminar el show
    await query('DELETE FROM shows WHERE id = $1', [id]);
    
    res.json({ 
      ok: true, 
      mensaje: 'Obra eliminada correctamente',
      obra: show.nombre 
    });
  } catch (error) {
    console.error('Error eliminando show:', error);
    res.status(500).json({ error: error.message });
  }
}
