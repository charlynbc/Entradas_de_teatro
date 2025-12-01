import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/postgres.js';
import { initSupremo } from './init-supremo.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import showsRoutes from './routes/shows.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import { readData } from './utils/dataStore.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Inicializar base de datos al arrancar
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL no está configurado. Usando valor por defecto para desarrollo local.');
      process.env.DATABASE_URL = 'postgresql://localhost:5432/teatro_tickets';
    }

    // Inicializar schema de base de datos
    await initializeDatabase();
    
    // Inicializar usuario supremo si no existe (sin bloquear el inicio)
    initSupremo().catch(err => {
      console.error('⚠️  Error inicializando usuario supremo (no crítico):', err.message);
    });
    
    // Rutas de la API
    app.get('/api', (req, res) => {
      res.json({
        ok: true,
        message: 'API Teatro Tickets - PostgreSQL',
        version: '3.0.0',
        docs: '/README'
      });
    });

    app.get('/health', async (req, res) => {
      try {
        const data = await readData();
        res.json({
          status: 'ok',
          storage: 'postgresql',
          database: process.env.DATABASE_URL ? 'connected' : 'not configured',
          totals: {
            users: data.users.length,
            shows: data.shows.length,
            tickets: data.tickets.length
          }
        });
      } catch (error) {
        console.error('Healthcheck error:', error);
        res.status(500).json({ 
          status: 'error', 
          message: error.message,
          storage: 'postgresql'
        });
      }
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', usersRoutes);
    app.use('/api/shows', showsRoutes);
    app.use('/api/tickets', ticketsRoutes);
    app.use('/api/reportes', reportesRoutes);

    // Servir frontend en producción
    app.use((req, res, next) => {
      const isApiRoute = req.path.startsWith('/api') || req.path.startsWith('/health');
      if (req.method !== 'GET' || isApiRoute) {
        return next();
      }
      return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    // Middleware para rutas no encontradas (debe ir antes de iniciar servidor)
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }
      next();
    });

    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      console.error('Error no controlado:', err);
      res.status(err.status || 500).json({ error: err.message || 'Error interno' });
    });

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 API disponible en: http://localhost:${PORT}/api`);
      console.log('🎭 Frontend servido desde /public');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
