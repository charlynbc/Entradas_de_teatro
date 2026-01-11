import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readData } from './utils/dataStore.js';
import { logger } from './utils/logger.js';
import { validateEnvironment, validateOptionalEnvironment } from './utils/envValidator.js';
import { initDatabase } from './bootstrap/database.js';
import { initSuperUser } from './bootstrap/superUser.js';
import { initSeed } from './bootstrap/seed.js';
import pool from './db/postgres.js';

// Routes imports
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import funcionesRoutes from './routes/funciones.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import reportesObrasRoutes from './routes/reportes-obras.routes.js';
import ensayosRoutes from './routes/ensayos.routes.js';
import adminRoutes from './routes/admin.routes.js';
import gruposRoutes from './routes/grupos.routes.js';
import obrasRoutes from './routes/obras.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import publicRoutes from './routes/public.routes.js';
import auditoriaReportesRoutes from './routes/auditoria-reportes.routes.js';
import cuotasRoutes from './routes/cuotas.routes.js';
import gastosRoutes from './routes/gastos.routes.js';
import boleteriaRoutes from './routes/boleteria.routes.js';
import contabilidadRoutes from './routes/contabilidad.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import entradasV2Routes from './routes/entradasV2.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

// =============================================================================
// MIDDLEWARES (orden correcto: seguridad → parsing → estáticos → rutas)
// =============================================================================

// 1. CORS - Seguridad
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 2. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Deshabilitar caché en desarrollo
const disableCacheIfDev = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
};
app.use(disableCacheIfDev);

// 4. Archivos estáticos
app.use(express.static(PUBLIC_DIR));

// Servir fuentes desde /fonts para evitar problemas con node_modules
app.use('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts', 
  express.static(path.join(PUBLIC_DIR, 'fonts'))
);

// =============================================================================
// BOOTSTRAP - Inicialización del sistema
// =============================================================================
// =============================================================================
// BOOTSTRAP - Inicialización del sistema
// =============================================================================

async function startServer() {
  try {
    logger.info('🚀 Iniciando Baco Teatro Server...');
    
    // 1. Validar variables de entorno
    validateEnvironment();
    validateOptionalEnvironment();
    
    // 2. Inicializar base de datos (crítico)
    await initDatabase();
    
    // 3. Inicializar usuario SUPER (no crítico)
    await initSuperUser();
    
    // 4. Aplicar seed mínimo (no crítico)
    await initSeed();
    
    // ==========================================================================
    // RUTAS DE LA API
    // ==========================================================================
    
    // Health check y status
    app.get('/api', (req, res) => {
      res.json({ ok: true, name: 'Baco Teatro API', version: '3.0.0' });
    });

    app.get('/health', async (req, res) => {
      try {
        const data = await readData();
        
        // Verificar conexión a BD
        let dbConnected = false;
        let dbVersion = null;
        try {
          const dbRes = await pool.query('SELECT version()');
          dbConnected = true;
          dbVersion = dbRes.rows[0]?.version?.split(',')[0] || 'PostgreSQL';
        } catch (err) {
          logger.warn('BD no conectada:', err.message);
        }

        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          storage: 'postgresql',
          database: {
            connected: dbConnected,
            version: dbVersion,
            name: process.env.PGDATABASE || 'teatro',
            host: process.env.PGHOST || 'localhost'
          },
          totals: {
            users: data.users.length,
            funciones: data.funciones.length,
            shows: data.funciones.length, // Alias de compatibilidad
            tickets: data.tickets.length,
            grupos: data.grupos?.length || 0,
            obras: data.obras?.length || 0
          },
          uptime: process.uptime(),
          version: '3.0'
        });
      } catch (error) {
        logger.error('Healthcheck error:', error.message);
        res.status(500).json({ 
          status: 'error', 
          message: error.message,
          storage: 'postgresql',
          database: {
            connected: false
          }
        });
      }
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', usuariosRoutes); // Nuevo modelo BACO
    app.use('/api/users', usersRoutes); // Alias para compatibilidad con frontend antiguo
    app.use('/api/funciones', funcionesRoutes);
    app.use('/api/shows', funcionesRoutes); // Alias para compatibilidad con frontend antiguo
    app.use('/api/public', publicRoutes);
    app.use('/api/tickets', ticketsRoutes);
    app.use('/api/reportes', reportesRoutes);
    app.use('/api/auditoria', auditoriaReportesRoutes);
    app.use('/api/reportes-obras', reportesObrasRoutes);
    app.use('/api/ensayos', ensayosRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/grupos', gruposRoutes);
    app.use('/api/obras', obrasRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/cuotas', cuotasRoutes); // Nuevo: Sistema de cuotas
    app.use('/api/gastos', gastosRoutes); // Nuevo: Gastos por función
    app.use('/api/boleteria', boleteriaRoutes);
    app.use('/api/contabilidad', contabilidadRoutes);
    app.use('/api/pagos', pagosRoutes);
    app.use('/api/entradas-v2', entradasV2Routes);

    // ==========================================================================
    // RUTAS DE PÁGINAS (SPA + redirects)
    // ==========================================================================
    
    // Rutas específicas para páginas (nueva estructura)
    app.get('/login', (req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, 'pages/auth/login.html'));
    });
    
    app.get('/admin-dashboard.html', (req, res) => {
      res.sendFile(path.join(PUBLIC_DIR, 'pages/admin/admin-dashboard.html'));
    });

    // Ruta explícita para pantalla 404 teatral
    app.get('/404', (req, res) => {
      return res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
    });

    // Servir frontend en producción (SPA) y caer en 404 teatral si no hay index
    app.use((req, res, next) => {
      const isApiRoute = req.path.startsWith('/api') || req.path.startsWith('/health');
      if (req.method !== 'GET' || isApiRoute) {
        return next();
      }
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      return res.sendFile(indexPath, (err) => {
        if (err) {
          return res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
        }
      });
    });

    // ==========================================================================
    // MANEJO DE ERRORES
    // ==========================================================================
    
    // Middleware para rutas API no encontradas
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }
      next();
    });

    // Middleware de manejo de errores global
    app.use((err, req, res, next) => {
      logger.error('Error no controlado:', err);
      
      // En desarrollo mostramos stack trace, en producción solo mensaje
      const errorResponse = {
        error: err.message || 'Error interno del servidor'
      };
      
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err;
      }
      
      res.status(err.status || 500).json(errorResponse);
    });

    // ==========================================================================
    // INICIAR SERVIDOR
    // ==========================================================================
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.success(`Servidor corriendo en puerto ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 API disponible en: http://localhost:${PORT}/api`);
      logger.info('🎭 Frontend servido desde /public');
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Error crítico al iniciar servidor:', error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.error('Stack trace:', error.stack);
    }
    // Usar exitCode en lugar de exit() para cleanup más limpio
    process.exitCode = 1;
  }
}

// =============================================================================
// EJECUTAR SERVIDOR
// =============================================================================

startServer();

export default app;
