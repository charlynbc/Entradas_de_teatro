const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());

// ========== HELPERS ==========

function generateTicketCode() {
  return 'T-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function generarQR(code) {
  try {
    const url = `${BASE_URL}/validar?code=${code}`;
    const dataUrl = await QRCode.toDataURL(url);
    return dataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    return null;
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ========== INICIO DEL SERVIDOR ==========

app.get('/', (req, res) => {
  res.send('API Teatro Tickets OK - Sistema Baco v3.0 (PostgreSQL)');
});

// Test de conexión
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'ok', db: 'connected', timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ========== USUARIOS ==========

// Listar todos los usuarios activos
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT phone, name, role, created_at FROM users WHERE active = TRUE ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario (admin o vendedor)
app.post('/api/usuarios', async (req, res) => {
  const { phone, name, role, password } = req.body;
  
  if (!phone || !name || !role) {
    return res.status(400).json({ error: 'phone, name y role son obligatorios' });
  }
  
  if (!['ADMIN', 'VENDEDOR'].includes(role)) {
    return res.status(400).json({ error: 'role debe ser ADMIN o VENDEDOR' });
  }
  
  try {
    // Verificar si ya existe
    const exists = await db.query('SELECT phone FROM users WHERE phone = $1', [phone]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese teléfono' });
    }
    
    const passwordHash = password ? await hashPassword(password) : null;
    
    const result = await db.query(
      `INSERT INTO users (phone, name, role, password_hash) 
       VALUES ($1, $2, $3, $4) 
       RETURNING phone, name, role, created_at`,
      [phone, name, role, passwordHash]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone y password son obligatorios' });
  }
  
  try {
    const result = await db.query(
      'SELECT phone, name, role, password_hash FROM users WHERE phone = $1 AND active = TRUE',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    
    // Si no tiene password, es primera vez
    if (!user.password_hash) {
      return res.status(403).json({ 
        error: 'Primera vez', 
        message: 'Debes crear tu contraseña',
        phone: user.phone 
      });
    }
    
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Login exitoso
    res.json({
      phone: user.phone,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Establecer contraseña (primera vez)
app.post('/api/auth/set-password', async (req, res) => {
  const { phone, name, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone y password son obligatorios' });
  }
  
  try {
    const user = await db.query(
      'SELECT phone, name, password_hash FROM users WHERE phone = $1 AND active = TRUE',
      [phone]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (user.rows[0].password_hash) {
      return res.status(400).json({ error: 'El usuario ya tiene contraseña' });
    }
    
    const passwordHash = await hashPassword(password);
    const updateName = name || user.rows[0].name;
    
    const result = await db.query(
      'UPDATE users SET password_hash = $1, name = $2 WHERE phone = $3 RETURNING phone, name, role',
      [passwordHash, updateName, phone]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar vendedores
app.get('/api/vendedores', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT phone, name, created_at FROM users 
       WHERE role = 'VENDEDOR' AND active = TRUE 
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== FUNCIONES (SHOWS) ==========

// Crear función
app.post('/api/shows', async (req, res) => {
  const { obra, fecha, lugar, capacidad, base_price } = req.body;
  
  if (!obra || !fecha || !capacidad || !base_price) {
    return res.status(400).json({ error: 'obra, fecha, capacidad y base_price son obligatorios' });
  }
  
  try {
    const result = await db.query(
      `INSERT INTO shows (obra, fecha, lugar, capacidad, base_price)
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
    res.status(500).json({ error: error.message });
  }
});

// Listar funciones
app.get('/api/shows', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM shows ORDER BY fecha DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ASIGNACIÓN ADMIN → VENDEDOR ==========

app.post('/api/shows/:id/assign-tickets', async (req, res) => {
  const showId = parseInt(req.params.id);
  const { vendedor_phone, cantidad } = req.body;
  
  if (!vendedor_phone || !cantidad) {
    return res.status(400).json({ error: 'vendedor_phone y cantidad son obligatorios' });
  }
  
  try {
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
       SET estado = 'STOCK_VENDEDOR', vendedor_phone = $1 
       WHERE code = ANY($2::text[])`,
      [vendedor_phone, codes]
    );
    
    res.json({
      mensaje: `${codes.length} tickets asignados a ${vendedor.rows[0].name}`,
      vendedor: vendedor.rows[0],
      tickets: codes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MIS TICKETS (VENDEDOR) ==========

app.get('/api/vendedores/:phone/tickets', async (req, res) => {
  const { phone } = req.params;
  const { show_id } = req.query;
  
  try {
    let query = `
      SELECT t.*, s.obra, s.fecha, s.base_price
      FROM tickets t
      JOIN shows s ON s.id = t.show_id
      WHERE t.vendedor_phone = $1
    `;
    const params = [phone];
    
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
      vendedor_phone: phone,
      total: tickets.length,
      en_stock: enStock,
      reservadas,
      reportadas_vendidas: reportadas,
      pagadas,
      tickets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RESERVAR (VENDEDOR) ==========

app.post('/api/tickets/:code/reserve', async (req, res) => {
  const { code } = req.params;
  const { vendedor_phone, comprador_nombre, comprador_contacto } = req.body;
  
  if (!comprador_nombre) {
    return res.status(400).json({ error: 'comprador_nombre es obligatorio' });
  }
  
  try {
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedor_phone) {
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
    res.status(500).json({ error: error.message });
  }
});

// ========== REPORTAR VENTA (VENDEDOR) ==========

app.post('/api/tickets/:code/report-sold', async (req, res) => {
  const { code } = req.params;
  const { vendedor_phone, precio, medio_pago } = req.body;
  
  if (!precio || !medio_pago) {
    return res.status(400).json({ error: 'precio y medio_pago son obligatorios' });
  }
  
  try {
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedor_phone) {
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
           precio = $1,
           medio_pago = $2,
           reportada_at = NOW()
       WHERE code = $3
       RETURNING *`,
      [parseFloat(precio), medio_pago, code]
    );
    
    res.json({
      mensaje: 'Venta reportada. Ahora debes entregarle la plata al admin.',
      ticket: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TRANSFERIR TICKET (VENDEDOR) ==========

app.post('/api/tickets/:code/transfer', async (req, res) => {
  const { code } = req.params;
  const { vendedor_origen, vendedor_destino } = req.body;
  
  try {
    const ticket = await db.query('SELECT * FROM tickets WHERE code = $1', [code]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    
    const t = ticket.rows[0];
    
    if (t.vendedor_phone !== vendedor_origen) {
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
    res.status(500).json({ error: error.message });
  }
});

// ========== APROBAR PAGO (ADMIN) ==========

app.post('/api/tickets/:code/approve-payment', async (req, res) => {
  const { code } = req.params;
  
  try {
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
           pagado_at = NOW()
       WHERE code = $1
       RETURNING *`,
      [code]
    );
    
    res.json({
      mensaje: 'Pago aprobado. Ticket listo para usar.',
      ticket: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BUSCAR TICKETS (ADMIN) ==========

app.get('/api/tickets/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'query (q) es obligatorio' });
  }
  
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// ========== VALIDAR EN PUERTA (ADMIN) ==========

app.post('/api/tickets/:code/validate', async (req, res) => {
  const { code } = req.params;
  
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// ========== RESUMEN ADMIN POR FUNCIÓN ==========

app.get('/api/shows/:id/resumen-admin', async (req, res) => {
  const showId = parseInt(req.params.id);
  
  try {
    const result = await db.query(
      'SELECT * FROM v_resumen_show_admin WHERE id = $1',
      [showId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RESUMEN POR VENDEDOR Y FUNCIÓN ==========

app.get('/api/shows/:id/resumen-por-vendedor', async (req, res) => {
  const showId = parseInt(req.params.id);
  
  try {
    const result = await db.query(
      'SELECT * FROM v_resumen_vendedor_show WHERE show_id = $1 ORDER BY vendedor_nombre',
      [showId]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== VENDEDORES QUE DEBEN PLATA ==========

app.get('/api/shows/:id/deudores', async (req, res) => {
  const showId = parseInt(req.params.id);
  
  try {
    const result = await db.query(
      `SELECT * FROM v_resumen_vendedor_show 
       WHERE show_id = $1 AND monto_debe > 0 
       ORDER BY monto_debe DESC`,
      [showId]
    );
    
    res.json({
      show_id: showId,
      total_deuda: result.rows.reduce((sum, r) => sum + parseFloat(r.monto_debe), 0),
      vendedores_deudores: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== INICIO ==========

(async () => {
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  await db.initDB();
  
  app.listen(PORT, () => {
    console.log(`🎭 Servidor Baco Teatro v3.0 (PostgreSQL) en puerto ${PORT}`);
    console.log(`🔗 Base de datos: ${process.env.DATABASE_URL ? 'Render' : 'Local'}`);
  });
})();
