import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, query } from './db/postgres.js';
import { initSupremo } from './init-supremo.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import obrasRoutes from './routes/obras.routes.js';
import funcionesRoutes from './routes/funciones.routes.js';
import entradasRoutes from './routes/entradas.routes.js';
import elencoRoutes from './routes/cast.routes.js';
import showsRoutes from './routes/shows.routes.js'; // Mantener por compatibilidad
import ticketsRoutes from './routes/tickets.routes.js'; // Mantener por compatibilidad
import reportesRoutes from './routes/reportes.routes.js';
import reportesObrasRoutes from './routes/reportes-obras.routes.js';
import ensayosRoutes from './routes/ensayos.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Middlewares
app.use(cors());
app.use(express.json());

// Servir fuentes desde /fonts para evitar problemas con node_modules
app.use('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts', 
  express.static(path.join(PUBLIC_DIR, 'fonts'))
);

app.use(express.static(PUBLIC_DIR));

// Inicializar base de datos al arrancar
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL no está configurado. Configura la variable de entorno en Render.');
    }
    
    console.log('✅ DATABASE_URL detectado:', process.env.DATABASE_URL.substring(0, 30) + '...');
    
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
        // Consultar totales de la nueva estructura
        const obrasResult = await query('SELECT COUNT(*) FROM obras');
        const funcionesResult = await query('SELECT COUNT(*) FROM funciones');
        const entradasResult = await query('SELECT COUNT(*) FROM entradas');
        const usersResult = await query('SELECT COUNT(*) FROM users');
        
        res.json({
          status: 'ok',
          storage: 'postgresql',
          database: process.env.DATABASE_URL ? 'connected' : 'not configured',
          totals: {
            users: parseInt(usersResult.rows[0].count),
            obras: parseInt(obrasResult.rows[0].count),
            funciones: parseInt(funcionesResult.rows[0].count),
            entradas: parseInt(entradasResult.rows[0].count)
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
    
    // Nuevas rutas con estructura Obras → Funciones → Entradas
    app.use('/api/obras', obrasRoutes);
    app.use('/api/obras', elencoRoutes);  // /api/obras/:id/elenco
    app.use('/api/funciones', funcionesRoutes);
    app.use('/api/entradas', entradasRoutes);
    
    // Rutas legacy (mantener por compatibilidad)
    app.use('/api/shows', showsRoutes);
    app.use('/api/tickets', ticketsRoutes);
    
    app.use('/api/reportes', reportesRoutes);
    app.use('/api/reportes-obras', reportesObrasRoutes);
    app.use('/api/ensayos', ensayosRoutes);
    app.use('/api/admin', adminRoutes);

    // Servir frontend en producción
    app.use((req, res, next) => {
      const isApiRoute = req.path.startsWith('/api') || req.path.startsWith('/health');
      if (req.method !== 'GET' || isApiRoute) {
        return next();
      }
      return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
    });

    // Middleware para rutas no encontradas
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
