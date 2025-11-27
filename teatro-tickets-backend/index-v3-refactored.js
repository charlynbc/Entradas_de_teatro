import express from 'express';
import cors from 'cors';
import db from './db.js';

// Rutas
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import showsRoutes from './routes/shows.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import reportesRoutes from './routes/reportes.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    api: 'Sistema Baco Teatro v3.0',
    status: 'OK',
    version: '3.0.0',
    features: [
      'PostgreSQL',
      'JWT Auth',
      'Control financiero',
      'QR descargables',
      '6 estados de ticket'
    ]
  });
});

app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      db: 'connected', 
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      db: 'disconnected',
      message: error.message 
    });
  }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta pública para validación de QR (sin autenticación, para el día de la función)
app.get('/validar/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const ticket = await db.query(
      `SELECT t.*, s.obra, s.fecha, s.lugar
       FROM tickets t
       JOIN shows s ON s.id = t.show_id
       WHERE t.code = $1`,
      [code]
    );
    
    if (ticket.rows.length === 0) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ticket no válido</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 400px;
                margin: 0 auto;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .error { color: #C84A1B; font-size: 48px; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌</div>
              <h1>Ticket no válido</h1>
              <p>Este código no corresponde a ningún ticket.</p>
            </div>
          </body>
        </html>
      `);
    }
    
    const t = ticket.rows[0];
    
    let mensaje = '';
    let icono = '';
    let color = '';
    
    if (t.estado === 'USADO') {
      icono = '⚠️';
      color = '#ff9800';
      mensaje = `Este ticket ya fue usado el ${new Date(t.usado_at).toLocaleString('es-AR')}`;
    } else if (t.estado === 'PAGADO') {
      icono = '✅';
      color = '#4caf50';
      mensaje = `Ticket válido para ${t.comprador_nombre || 'entrada al teatro'}`;
    } else {
      icono = '❌';
      color = '#C84A1B';
      mensaje = `Ticket en estado ${t.estado}. No se puede ingresar.`;
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Validación de Ticket</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: ${color}; margin: 20px 0; }
            .info { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0;
              text-align: left;
            }
            .info p { margin: 5px 0; color: #666; }
            .code { 
              font-family: monospace; 
              font-size: 20px; 
              font-weight: bold;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${icono}</div>
            <h1>${mensaje}</h1>
            <div class="info">
              <p><strong>Código:</strong> <span class="code">${t.code}</span></p>
              <p><strong>Obra:</strong> ${t.obra}</p>
              <p><strong>Fecha:</strong> ${new Date(t.fecha).toLocaleString('es-AR')}</p>
              ${t.lugar ? `<p><strong>Lugar:</strong> ${t.lugar}</p>` : ''}
              ${t.comprador_nombre ? `<p><strong>Comprador:</strong> ${t.comprador_nombre}</p>` : ''}
              <p><strong>Estado:</strong> ${t.estado}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error validando ticket:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
(async () => {
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  await db.initDB();
  
  app.listen(PORT, () => {
    console.log(`🎭 Sistema Baco Teatro v3.0 corriendo en puerto ${PORT}`);
    console.log(`🔗 Base de datos: ${process.env.DATABASE_URL ? 'Render (PostgreSQL)' : 'Local (PostgreSQL)'}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Configurado' : 'Usando default (cambiar en producción)'}`);
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/completar-registro`);
    console.log(`   GET  /api/auth/verificar`);
    console.log(`   \n   POST /api/users`);
    console.log(`   GET  /api/users`);
    console.log(`   GET  /api/users/vendedores`);
    console.log(`   \n   POST /api/shows`);
    console.log(`   GET  /api/shows`);
    console.log(`   POST /api/shows/:id/assign-tickets`);
    console.log(`   \n   GET  /api/tickets/mis-tickets`);
    console.log(`   POST /api/tickets/:code/reserve`);
    console.log(`   POST /api/tickets/:code/report-sold`);
    console.log(`   POST /api/tickets/:code/approve-payment`);
    console.log(`   GET  /api/tickets/:code/qr`);
    console.log(`   POST /api/tickets/:code/validate`);
    console.log(`   GET  /api/tickets/search?q=...`);
    console.log(`   \n   GET  /api/reportes/shows/:id/resumen-admin`);
    console.log(`   GET  /api/reportes/shows/:id/deudores`);
    console.log(`   GET  /api/reportes/shows/:id/resumen-por-vendedor`);
  });
})();
