import db from '../db.js';
import QRCode from 'qrcode';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function misTickets(req, res) {
  try {
    const vendedorPhone = req.user.phone;
    const { show_id } = req.query;
    
    let query = `
      SELECT t.*, s.obra, s.fecha, s.base_price
      FROM tickets t
      JOIN shows s ON s.id = t.show_id
      WHERE t.vendedor_phone = $1
    `;
    const params = [vendedorPhone];
    
    if (show_id) {
      query += ' AND t.show_id = $2';
      params.push(parseInt(show_id));
    }
    
    query += ' ORDER BY s.fecha, t.code';
    
    const result = await db.query(query, params);
    
    const tickets = result.rows;
    const enStock = tickets.filter(t => t.estado === 'STOCK_VENDEDOR').length;
    const reservadas = tickets.filter(t => t.estado === 'RESERVADO').length;
    const reportadas = tickets.filter(t => t.estado === 'REPORTADA_VENDIDA').length;
    const pagadas = tickets.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO').length;
    
    res.json({
      vendedor_phone: vendedorPhone,
      total: tickets.length,
      en_stock: enStock,
      reservadas,
      reportadas_vendidas: reportadas,
      pagadas,
      tickets
    });
  } catch (error) {
    console.error('Error obteniendo mis tickets:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function reservarTicket(req, res) {
  try {
    const { code } = req.params;
    const { comprador_nombre, comprador_contacto } = req.body;
    const vendedorPhone = req.user.phone;
    
    if (!comprador_nombre) {
      return res.status(400).json({ error: 'comprador_nombre es obligatorio' });
    }
    
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedorPhone) {
      return res.status(403).json({ error: 'Este ticket no está en tu stock' });
    }
    
    if (t.estado !== 'STOCK_VENDEDOR') {
      return res.status(400).json({ error: `No se puede reservar un ticket en estado ${t.estado}` });
    }
    
    const result = await db.query(
      `UPDATE tickets 
       SET estado = 'RESERVADO',
           comprador_nombre = $1,
           comprador_contacto = $2,
           reservado_at = NOW()
       WHERE code = $3
       RETURNING *`,
      [comprador_nombre, comprador_contacto || null, code]
    );
    
    res.json({
      mensaje: 'Ticket reservado exitosamente',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error reservando ticket:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function reportarVenta(req, res) {
  try {
    const { code } = req.params;
    const vendedorPhone = req.user.phone;
    
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedorPhone) {
      return res.status(403).json({ error: 'Este ticket no es tuyo' });
    }
    
    if (t.estado !== 'RESERVADO') {
      return res.status(400).json({ 
        error: `Solo se pueden reportar tickets RESERVADOS. Estado actual: ${t.estado}` 
      });
    }
    
    const result = await db.query(
      `UPDATE tickets 
       SET estado = 'REPORTADA_VENDIDA',
           reportada_por_vendedor = TRUE,
           reportada_at = NOW()
       WHERE code = $1
       RETURNING *`,
      [code]
    );
    
    res.json({
      mensaje: 'Venta reportada. Ahora debes entregarle la plata al admin.',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error reportando venta:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function aprobarPago(req, res) {
  try {
    const { code } = req.params;
    const { medio_pago, precio } = req.body;
    
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.estado !== 'REPORTADA_VENDIDA') {
      return res.status(400).json({
        error: `Solo se pueden aprobar tickets REPORTADA_VENDIDA. Estado: ${t.estado}`
      });
    }
    
    const result = await db.query(
      `UPDATE tickets 
       SET estado = 'PAGADO',
           aprobada_por_admin = TRUE,
           medio_pago = $1,
           precio = $2,
           pagado_at = NOW()
       WHERE code = $3
       RETURNING *`,
      [medio_pago, precio, code]
    );
    
    res.json({
      mensaje: 'Pago aprobado. Ticket listo para usar.',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error aprobando pago:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function generarQRTicket(req, res) {
  try {
    const { code } = req.params;
    
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    // Si ya tiene QR guardado, devolverlo
    if (t.qr_code) {
      return res.json({ code, qr: t.qr_code });
    }
    
    // Generar nuevo QR
    const url = `${BASE_URL}/validar/${code}`;
    const qr = await QRCode.toDataURL(url);
    
    // Guardar en DB
    await db.query('UPDATE tickets SET qr_code = $1 WHERE code = $2', [qr, code]);
    
    res.json({ code, qr });
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function validarTicket(req, res) {
  try {
    const { code } = req.params;
    
    const ticket = await db.query(
      `SELECT t.*, s.obra, s.fecha 
       FROM tickets t
       JOIN shows s ON s.id = t.show_id
       WHERE t.code = $1`,
      [code]
    );
    
    if (ticket.rows.length === 0) {
      return res.status(400).json({ valido: false, motivo: 'Ticket inexistente' });
    }
    
    const t = ticket.rows[0];
    
    if (t.estado === 'USADO') {
      return res.status(400).json({
        valido: false,
        motivo: 'Ticket ya fue usado',
        usado_at: t.usado_at
      });
    }
    
    if (t.estado === 'REPORTADA_VENDIDA') {
      return res.status(400).json({
        valido: false,
        motivo: 'Ticket reportado vendido pero aún no aprobado por admin. Apruébalo primero.',
        ticket: t
      });
    }
    
    if (t.estado !== 'PAGADO') {
      return res.status(400).json({
        valido: false,
        motivo: `Ticket en estado ${t.estado}. Solo se pueden validar tickets PAGADOS.`,
        ticket: t
      });
    }
    
    // Todo OK, marcar como usado
    const result = await db.query(
      `UPDATE tickets 
       SET estado = 'USADO', usado_at = NOW() 
       WHERE code = $1 
       RETURNING *`,
      [code]
    );
    
    res.json({
      valido: true,
      mensaje: `✅ Bienvenido ${t.comprador_nombre || 'al teatro'}!`,
      obra: t.obra,
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error validando ticket:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function buscarTickets(req, res) {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'query (q) es obligatorio' });
    }
    
    const result = await db.query(
      `SELECT t.*, s.obra, s.fecha, u.name AS vendedor_nombre
       FROM tickets t
       JOIN shows s ON s.id = t.show_id
       LEFT JOIN users u ON u.phone = t.vendedor_phone
       WHERE LOWER(t.code) LIKE LOWER($1)
          OR LOWER(t.comprador_nombre) LIKE LOWER($1)
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [`%${q}%`]
    );
    
    res.json({
      query: q,
      total: result.rows.length,
      tickets: result.rows
    });
  } catch (error) {
    console.error('Error buscando tickets:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function transferirTicket(req, res) {
  try {
    const { code } = req.params;
    const { vendedor_destino } = req.body;
    const vendedorOrigen = req.user.phone;
    
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedorOrigen) {
      return res.status(403).json({ error: 'No sos el propietario' });
    }
    
    if (t.estado !== 'STOCK_VENDEDOR') {
      return res.status(400).json({ 
        error: `Solo se pueden transferir tickets en STOCK_VENDEDOR. Estado: ${t.estado}` 
      });
    }
    
    // Verificar vendedor destino
    const destino = await db.query(
      `SELECT phone, name FROM users WHERE phone = $1 AND role = 'VENDEDOR' AND active = TRUE`,
      [vendedor_destino]
    );
    
    if (destino.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor destino no encontrado' });
    }
    
    await db.query(
      'UPDATE tickets SET vendedor_phone = $1 WHERE code = $2',
      [vendedor_destino, code]
    );
    
    res.json({
      mensaje: `Ticket transferido a ${destino.rows[0].name}`,
      vendedor_destino: destino.rows[0]
    });
  } catch (error) {
    console.error('Error transfiriendo ticket:', error);
    res.status(500).json({ error: error.message });
  }
}
