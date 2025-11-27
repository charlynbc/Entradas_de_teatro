const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());

// Base de datos en memoria
let shows = [];
let tickets = new Map();
let usuarios = [];
let showIdCounter = 1;
let usuarioIdCounter = 1;

// Crear admins por defecto
usuarios.push(
  { id: 1, nombre: 'Admin 1', email: 'admin1@baco.com', rol: 'ADMIN', activo: true },
  { id: 2, nombre: 'Admin 2', email: 'admin2@baco.com', rol: 'ADMIN', activo: true },
  { id: 3, nombre: 'Admin 3', email: 'admin3@baco.com', rol: 'ADMIN', activo: true }
);
usuarioIdCounter = 4;

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

app.get('/', (req, res) => {
  res.send('API Teatro Tickets OK - Sistema Baco v2.0');
});

// USUARIOS
app.get('/api/usuarios', (req, res) => {
  res.json(usuarios.filter(u => u.activo));
});

app.get('/api/vendedores', (req, res) => {
  res.json(usuarios.filter(u => u.rol === 'VENDEDOR' && u.activo));
});

app.post('/api/vendedores', (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'nombre y email son obligatorios' });
  }
  const vendedor = {
    id: usuarioIdCounter++,
    nombre,
    email,
    rol: 'VENDEDOR',
    activo: true,
    createdAt: new Date().toISOString()
  };
  usuarios.push(vendedor);
  res.status(201).json(vendedor);
});

app.put('/api/vendedores/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, email } = req.body;
  const vendedor = usuarios.find(u => u.id === id && u.rol === 'VENDEDOR');
  if (!vendedor) {
    return res.status(404).json({ error: 'Vendedor no encontrado' });
  }
  if (nombre) vendedor.nombre = nombre;
  if (email) vendedor.email = email;
  res.json(vendedor);
});

app.delete('/api/vendedores/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const vendedor = usuarios.find(u => u.id === id && u.rol === 'VENDEDOR');
  if (!vendedor) {
    return res.status(404).json({ error: 'Vendedor no encontrado' });
  }
  vendedor.activo = false;
  res.json({ mensaje: 'Vendedor desactivado', vendedor });
});

// FUNCIONES
app.post('/api/shows', async (req, res) => {
  const { obra, fecha, capacidad } = req.body;
  if (!obra || !fecha || !capacidad) {
    return res.status(400).json({ error: 'obra, fecha y capacidad son obligatorios' });
  }
  const show = {
    id: showIdCounter++,
    obra,
    fecha,
    capacidad,
    createdAt: new Date().toISOString()
  };
  shows.push(show);

  // Generar tickets automáticamente
  const generated = [];
  for (let i = 0; i < capacidad; i++) {
    let code;
    do {
      code = generateTicketCode();
    } while (tickets.has(code));
    const qrCode = await generarQR(code);
    const ticket = {
      code,
      showId: show.id,
      estado: 'DISPONIBLE',
      qrCode,
      propietarioId: null,
      vendedorId: null,
      nombreComprador: null,
      emailComprador: null,
      createdAt: new Date().toISOString(),
      reservadoAt: null,
      pagadoAt: null,
      usadoAt: null
    };
    tickets.set(code, ticket);
    generated.push(ticket);
  }

  res.status(201).json({ 
    show, 
    ticketsGenerados: generated.length,
    mensaje: `Función creada con ${generated.length} tickets disponibles`
  });
});

app.get('/api/shows', (req, res) => {
  res.json(shows);
});

app.post('/api/shows/:id/generate-tickets', async (req, res) => {
  const showId = parseInt(req.params.id, 10);
  const { cantidad } = req.body;
  const show = shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ error: 'Función no encontrada' });
  }
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
  }
  const generated = [];
  for (let i = 0; i < cantidad; i++) {
    let code;
    do {
      code = generateTicketCode();
    } while (tickets.has(code));
    const qrCode = await generarQR(code);
    const ticket = {
      code,
      showId,
      estado: 'DISPONIBLE',
      qrCode,
      propietarioId: null,
      vendedorId: null,
      compradorNombre: null,
      compradorContacto: null,
      medioPago: null,
      monto: null,
      createdAt: new Date().toISOString(),
      reservadoAt: null,
      pagadoAt: null,
      usadoAt: null
    };
    tickets.set(code, ticket);
    generated.push(ticket);
  }
  res.status(201).json({
    showId,
    cantidad: generated.length,
    tickets: generated
  });
});

// ASIGNACIÓN (ADMIN -> VENDEDOR)
app.post('/api/shows/:id/assign-tickets', (req, res) => {
  const showId = parseInt(req.params.id, 10);
  const { vendedorId, cantidad } = req.body;
  const show = shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ error: 'Función no encontrada' });
  }
  const vendedor = usuarios.find(u => u.id === vendedorId && u.rol === 'VENDEDOR' && u.activo);
  if (!vendedor) {
    return res.status(404).json({ error: 'Vendedor no encontrado' });
  }
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
  }
  const ticketsDisponibles = Array.from(tickets.values())
    .filter(t => t.showId === showId && t.estado === 'DISPONIBLE')
    .slice(0, cantidad);
  if (ticketsDisponibles.length < cantidad) {
    return res.status(400).json({ 
      error: `Solo hay ${ticketsDisponibles.length} tickets disponibles` 
    });
  }
  const asignados = [];
  ticketsDisponibles.forEach(ticket => {
    ticket.estado = 'STOCK_VENDEDOR';
    ticket.propietarioId = vendedorId;
    tickets.set(ticket.code, ticket);
    asignados.push(ticket);
  });
  res.json({
    mensaje: `${asignados.length} tickets asignados a ${vendedor.nombre}`,
    vendedor: { id: vendedor.id, nombre: vendedor.nombre },
    tickets: asignados
  });
});

// MIS TICKETS (VENDEDOR)
app.get('/api/vendedores/:id/tickets', (req, res) => {
  const vendedorId = parseInt(req.params.id, 10);
  const { showId } = req.query;
  const vendedor = usuarios.find(u => u.id === vendedorId && u.rol === 'VENDEDOR');
  if (!vendedor) {
    return res.status(404).json({ error: 'Vendedor no encontrado' });
  }
  let misTickets = Array.from(tickets.values())
    .filter(t => t.propietarioId === vendedorId);
  if (showId) {
    misTickets = misTickets.filter(t => t.showId === parseInt(showId, 10));
  }
  res.json({
    vendedorId,
    vendedorNombre: vendedor.nombre,
    total: misTickets.length,
    enStock: misTickets.filter(t => t.estado === 'STOCK_VENDEDOR').length,
    reservados: misTickets.filter(t => t.estado === 'RESERVADO').length,
    tickets: misTickets
  });
});

// RESERVAR (VENDEDOR)
app.post('/api/tickets/:code/reserve', (req, res) => {
  const { code } = req.params;
  const { vendedorId, compradorNombre, compradorContacto } = req.body;
  const ticket = tickets.get(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }
  if (ticket.propietarioId !== vendedorId) {
    return res.status(403).json({ error: 'Este ticket no está en tu stock' });
  }
  if (ticket.estado !== 'STOCK_VENDEDOR') {
    return res.status(400).json({ error: `No se puede reservar un ticket en estado ${ticket.estado}` });
  }
  if (!compradorNombre) {
    return res.status(400).json({ error: 'El nombre del comprador es obligatorio' });
  }
  ticket.estado = 'RESERVADO';
  ticket.vendedorId = vendedorId;
  ticket.compradorNombre = compradorNombre;
  ticket.compradorContacto = compradorContacto || null;
  ticket.reservadoAt = new Date().toISOString();
  tickets.set(code, ticket);
  res.json({
    mensaje: 'Ticket reservado exitosamente',
    ticket
  });
});

// TRANSFERIR (VENDEDOR)
app.post('/api/tickets/:code/transfer', (req, res) => {
  const { code } = req.params;
  const { vendedorOrigenId, vendedorDestinoId } = req.body;
  const ticket = tickets.get(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }
  if (ticket.propietarioId !== vendedorOrigenId) {
    return res.status(403).json({ error: 'No sos el propietario de este ticket' });
  }
  if (ticket.estado === 'RESERVADO') {
    return res.status(400).json({ error: 'No se pueden transferir tickets ya reservados' });
  }
  if (ticket.estado !== 'STOCK_VENDEDOR') {
    return res.status(400).json({ error: `No se puede transferir un ticket en estado ${ticket.estado}` });
  }
  const vendedorDestino = usuarios.find(u => u.id === vendedorDestinoId && u.rol === 'VENDEDOR' && u.activo);
  if (!vendedorDestino) {
    return res.status(404).json({ error: 'Vendedor destino no encontrado' });
  }
  ticket.propietarioId = vendedorDestinoId;
  tickets.set(code, ticket);
  res.json({
    mensaje: `Ticket transferido a ${vendedorDestino.nombre}`,
    ticket
  });
});

// MARCAR PAGADO (ADMIN)
app.post('/api/tickets/:code/mark-paid', (req, res) => {
  const { code } = req.params;
  const { medioPago, monto } = req.body;
  const ticket = tickets.get(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }
  if (ticket.estado !== 'RESERVADO') {
    return res.status(400).json({ error: `Solo se pueden marcar como pagados los tickets RESERVADOS. Estado actual: ${ticket.estado}` });
  }
  if (!medioPago || !monto) {
    return res.status(400).json({ error: 'medioPago y monto son obligatorios' });
  }
  ticket.estado = 'PAGADO';
  ticket.medioPago = medioPago;
  ticket.monto = parseFloat(monto);
  ticket.pagadoAt = new Date().toISOString();
  tickets.set(code, ticket);
  res.json({
    mensaje: 'Ticket marcado como PAGADO',
    ticket
  });
});

// BUSCAR (ADMIN)
app.get('/api/tickets/search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query es obligatorio' });
  }
  const resultados = Array.from(tickets.values()).filter(t => 
    t.code.toLowerCase().includes(query.toLowerCase()) ||
    (t.compradorNombre && t.compradorNombre.toLowerCase().includes(query.toLowerCase()))
  );
  res.json({
    query,
    total: resultados.length,
    tickets: resultados
  });
});

// VALIDAR (ADMIN)
app.post('/api/tickets/:code/validate', (req, res) => {
  const { code } = req.params;
  const ticket = tickets.get(code);
  if (!ticket) {
    return res.status(400).json({ valido: false, motivo: 'Ticket inexistente' });
  }
  if (ticket.estado === 'USADO') {
    return res.status(400).json({ valido: false, motivo: 'Ticket ya fue usado' });
  }
  if (ticket.estado === 'RESERVADO') {
    return res.status(400).json({ 
      valido: false, 
      motivo: 'Ticket reservado pero no cobrado. Hablar con admin.',
      ticket 
    });
  }
  if (ticket.estado === 'STOCK_VENDEDOR' || ticket.estado === 'DISPONIBLE') {
    return res.status(400).json({ valido: false, motivo: 'Ticket nunca fue vendido' });
  }
  if (ticket.estado !== 'PAGADO') {
    return res.status(400).json({ valido: false, motivo: `Estado inválido: ${ticket.estado}` });
  }
  ticket.estado = 'USADO';
  ticket.usadoAt = new Date().toISOString();
  tickets.set(code, ticket);
  res.json({
    valido: true,
    mensaje: `✅ Bienvenido ${ticket.compradorNombre || 'al teatro'}!`,
    ticket
  });
});

app.get('/api/tickets/:code', (req, res) => {
  const { code } = req.params;
  const ticket = tickets.get(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }
  res.json(ticket);
});

app.get('/api/shows/:id/tickets', (req, res) => {
  const showId = parseInt(req.params.id, 10);
  const show = shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ error: 'Función no encontrada' });
  }
  const ticketsDeShow = Array.from(tickets.values()).filter(t => t.showId === showId);
  res.json(ticketsDeShow);
});

// REPORTES
app.get('/api/shows/:id/stats', (req, res) => {
  const showId = parseInt(req.params.id, 10);
  const show = shows.find(s => s.id === showId);
  if (!show) {
    return res.status(404).json({ error: 'Función no encontrada' });
  }
  const ticketsDeShow = Array.from(tickets.values()).filter(t => t.showId === showId);
  const stats = {
    showId,
    obra: show.obra,
    fecha: show.fecha,
    capacidad: show.capacidad,
    totalGenerados: ticketsDeShow.length,
    disponibles: ticketsDeShow.filter(t => t.estado === 'DISPONIBLE').length,
    enStockVendedor: ticketsDeShow.filter(t => t.estado === 'STOCK_VENDEDOR').length,
    reservados: ticketsDeShow.filter(t => t.estado === 'RESERVADO').length,
    pagados: ticketsDeShow.filter(t => t.estado === 'PAGADO').length,
    usados: ticketsDeShow.filter(t => t.estado === 'USADO').length,
    montoRecaudado: ticketsDeShow
      .filter(t => t.estado === 'PAGADO' || t.estado === 'USADO')
      .reduce((sum, t) => sum + (t.monto || 0), 0),
    porcentajeVendido: show.capacidad > 0 
      ? ((ticketsDeShow.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO').length / show.capacidad) * 100).toFixed(2) 
      : 0
  };
  res.json(stats);
});

app.get('/api/reportes/ventas', (req, res) => {
  const { showId } = req.query;
  let ticketsToAnalyze = Array.from(tickets.values())
    .filter(t => t.estado === 'RESERVADO' || t.estado === 'PAGADO' || t.estado === 'USADO');
  if (showId) {
    ticketsToAnalyze = ticketsToAnalyze.filter(t => t.showId === parseInt(showId, 10));
  }
  const ventasPorVendedor = {};
  ticketsToAnalyze.forEach(ticket => {
    const vendedorId = ticket.vendedorId;
    if (!vendedorId) return;
    const vendedor = usuarios.find(u => u.id === vendedorId);
    if (!vendedor) return;
    if (!ventasPorVendedor[vendedorId]) {
      ventasPorVendedor[vendedorId] = {
        vendedorId,
        vendedorNombre: vendedor.nombre,
        cantidadReservada: 0,
        cantidadVendida: 0,
        montoTotal: 0,
        tickets: []
      };
    }
    if (ticket.estado === 'RESERVADO') {
      ventasPorVendedor[vendedorId].cantidadReservada++;
    } else if (ticket.estado === 'PAGADO' || ticket.estado === 'USADO') {
      ventasPorVendedor[vendedorId].cantidadVendida++;
      ventasPorVendedor[vendedorId].montoTotal += ticket.monto || 0;
    }
    ventasPorVendedor[vendedorId].tickets.push({
      code: ticket.code,
      estado: ticket.estado,
      compradorNombre: ticket.compradorNombre,
      medioPago: ticket.medioPago,
      monto: ticket.monto,
      reservadoAt: ticket.reservadoAt,
      pagadoAt: ticket.pagadoAt
    });
  });
  const resultado = Object.values(ventasPorVendedor);
  res.json({
    showId: showId ? parseInt(showId, 10) : null,
    totalReservados: ticketsToAnalyze.filter(t => t.estado === 'RESERVADO').length,
    totalVendidos: ticketsToAnalyze.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO').length,
    montoTotal: ticketsToAnalyze.reduce((sum, t) => sum + (t.monto || 0), 0),
    vendedores: resultado
  });
});

app.listen(PORT, () => {
  console.log(`🎭 Servidor Baco Teatro escuchando en puerto ${PORT}`);
  console.log(`📊 ${usuarios.filter(u => u.rol === 'ADMIN').length} admins y ${usuarios.filter(u => u.rol === 'VENDEDOR').length} vendedores registrados`);
});
