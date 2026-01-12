import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
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

// =============================================================================
// CONFIGURACIÓN INICIAL Y VALIDACIONES
// =============================================================================

// Validar NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';
if (!['development', 'production', 'test', 'staging'].includes(NODE_ENV)) {
  throw new Error(`NODE_ENV inválido: ${NODE_ENV}`);
}

// Validar que logger existe
if (!logger || typeof logger.info !== 'function') {
  throw new Error('Logger no configurado correctamente');
}

// Validar y parsear PORT
const PORT = (() => {
  const p = parseInt(process.env.PORT, 10);
  if (isNaN(p) || p < 1 || p > 65535) {
    const defaultPort = 3000;
    console.warn(`⚠️ PORT inválido: ${process.env.PORT}, usando ${defaultPort}`);
    return defaultPort;
  }
  return p;
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// Validar que PUBLIC_DIR existe
if (!existsSync(PUBLIC_DIR)) {
  logger.warn(`⚠️ PUBLIC_DIR no existe: ${PUBLIC_DIR}`);
}

// Control de rutas y servidor
let routesMounted = false;
let server = null;
let isShuttingDown = false;
const shutdownListeners = new Set();
const metrics = {
  startTime: Date.now(),
  requests: {
    total: 0,
    successful: 0,
    errors: 0,
    slowRequests: 0,
    by4xx: 0,
    by5xx: 0
  },
  lastRequestTime: null
};

// =============================================================================
// MIDDLEWARE: VALIDACIÓN DE CONTENT-TYPE Y NORMALIZACIÓN
// =============================================================================

// Normalizar paths (evitar ../)
app.use((req, res, next) => {
  const normalized = path.normalize(req.path).replace(/\.\./g, '');
  if (normalized !== req.path) {
    return res.status(400).json({ error: 'Path inválido' });
  }
  next();
});

// Validar Content-Type en POST/PUT/PATCH
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'].some(ct => contentType.includes(ct))) {
      // Permitir si es multipart o tiene content-type válido
      if (!req.path.startsWith('/api/upload') && contentType && !contentType.startsWith('multipart')) {
        return res.status(415).json({ error: 'Content-Type no soportado' });
      }
    }
  }
  next();
});

// =============================================================================
// MIDDLEWARE: REQUEST ID Y CORRELATION
// =============================================================================

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  req.startTime = Date.now();
  
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    
    // Actualizar métricas
    metrics.requests.total++;
    metrics.lastRequestTime = new Date().toISOString();
    
    if (statusCode >= 400) {
      metrics.requests.errors++;
      if (statusCode < 500) {
        metrics.requests.by4xx++;
      } else {
        metrics.requests.by5xx++;
      }
    } else {
      metrics.requests.successful++;
    }
    
    if (duration > 1000) {
      metrics.requests.slowRequests++;
    }

    // Log de request (solo si está habilitado o es lento)
    if (NODE_ENV === 'development' || process.env.LOG_REQUESTS === 'true' || duration > 1000) {
      logger.info(`[${req.id}] ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
    }

    return originalJson.call(this, data);
  };

  res.setHeader('X-Request-ID', req.id);
  next();
});

// =============================================================================
// CONFIGURACIÓN DE CORS
// =============================================================================

const buildAllowedOrigins = () => {
  const corsOriginsEnv = (process.env.CORS_ORIGINS || '').trim();
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();
  
  const origins = new Set();
  
  if (corsOriginsEnv) {
    corsOriginsEnv.split(',').forEach(origin => {
      const trimmed = origin.trim();
      if (trimmed && trimmed.startsWith('http')) origins.add(trimmed);
    });
  }
  
  if (frontendUrl && frontendUrl.startsWith('http')) {
    origins.add(frontendUrl);
  }
  
  if (origins.size === 0) {
    origins.add('http://localhost:3000');
  }
  
  return Object.freeze(Array.from(origins));
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const err = new Error('CORS: Origen no permitido');
    err.status = 403;
    return callback(err);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// =============================================================================
// MIDDLEWARES DE SEGURIDAD
// =============================================================================

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  } : false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' }
}));

// Compresión gzip
app.use(compression({
  level: NODE_ENV === 'production' ? 6 : 3,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting mejorado
const windowMs = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000));
const maxReqs = Math.max(1, Number(process.env.RATE_LIMIT_MAX || 200));
const apiLimiter = rateLimit({
  windowMs,
  max: maxReqs,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.id,
  skip: (req) => {
    // Skip health, status, metrics y GET a rutas públicas
    return req.path === '/health' || 
           req.path === '/api' || 
           req.path === '/metrics' ||
           (req.method === 'GET' && req.path.startsWith('/api/public'));
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

app.use('/api', apiLimiter);

// =============================================================================
// MIDDLEWARES DE PARSING
// =============================================================================

app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// =============================================================================
// MIDDLEWARES DE CACHE
// =============================================================================

const disableCacheIfDev = (req, res, next) => {
  if (NODE_ENV === 'development') {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  } else {
    // En producción, establecer cache defaults
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.set('Cache-Control', 'public, max-age=3600');
    }
  }
  next();
};

app.use(disableCacheIfDev);

// =============================================================================
// MIDDLEWARES DE ARCHIVOS ESTÁTICOS
// =============================================================================

app.use((req, res, next) => {
  const resourcePath = path.resolve(path.join(PUBLIC_DIR, req.path));
  if (!resourcePath.startsWith(PUBLIC_DIR)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
});

app.use(express.static(PUBLIC_DIR, { 
  maxAge: NODE_ENV === 'production' ? '1d' : '0',
  etag: false,
  fallthrough: true
}));

app.use('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts',
  express.static(path.join(PUBLIC_DIR, 'fonts'), { 
    maxAge: '30d',
    fallthrough: false
  })
);

// =============================================================================
// HELPER: ENVÍO SEGURO DE ARCHIVOS HTML
// =============================================================================

const sendHtmlFile = (filePath) => {
  const normalizedPath = path.resolve(filePath);
  
  if (!normalizedPath.startsWith(PUBLIC_DIR)) {
    return (req, res) => res.status(403).json({ error: 'Acceso denegado' });
  }

  const fileExists = existsSync(normalizedPath);

  return (req, res, next) => {
    if (!fileExists) {
      logger.warn(`Archivo no encontrado: ${normalizedPath}`);
      
      if (normalizedPath.endsWith('404.html')) {
        return res.status(404).json({ error: 'Página no encontrada' });
      }
      
      const notFoundPath = path.join(PUBLIC_DIR, '404.html');
      if (existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath, (err) => {
          if (err && !res.headersSent) {
            res.status(404).json({ error: 'Página no encontrada' });
          }
        });
      }
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(normalizedPath, { maxAge: '0' }, (err) => {
      if (err && !res.headersSent) {
        if (err.code === 'ENOENT') {
          res.status(404).json({ error: 'Página no encontrada' });
        } else if (err.code !== 'ERR_HTTP_REQUEST_TIMEOUT') {
          logger.error(`Error sirviendo archivo: ${err.message}`);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
      }
    });
  };
};

// =============================================================================
// MONTAJE DE RUTAS
// =============================================================================

function mountRoutes() {
  if (routesMounted) {
    logger.debug('Rutas ya montadas, omitiendo');
    return;
  }

  // =========================================================================
  // RUTAS DE DIAGNÓSTICO Y MÉTRICAS
  // =========================================================================
  
  app.get('/api', (req, res) => {
    res.json({ 
      ok: true, 
      name: 'Baco Teatro API', 
      version: '3.0.0',
      uptime: process.uptime(),
      environment: NODE_ENV
    });
  });

  app.get('/metrics', (req, res) => {
    const uptime = Date.now() - metrics.startTime;
    res.json({
      uptime: `${uptime}ms`,
      requests: metrics.requests,
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`
      },
      cpu: process.cpuUsage(),
      allowedOrigins: allowedOrigins,
      environment: NODE_ENV
    });
  });

  app.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
      let dataStats = {
        users: 0,
        funciones: 0,
        tickets: 0,
        grupos: 0,
        obras: 0
      };

      try {
        const data = await readData();
        dataStats = {
          users: data?.users?.length || 0,
          funciones: data?.funciones?.length || 0,
          tickets: data?.tickets?.length || 0,
          grupos: data?.grupos?.length || 0,
          obras: data?.obras?.length || 0
        };
      } catch (err) {
        logger.warn(`Error leyendo datos en healthcheck: ${err.message}`);
      }
      
      let dbConnected = false;
      let dbVersion = 'PostgreSQL (desconocida)';
      let dbResponseTime = 0;

      try {
        const dbStart = Date.now();
        const dbRes = await Promise.race([
          pool.query('SELECT version()'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('BD timeout')), 5000)
          )
        ]);
        dbResponseTime = Date.now() - dbStart;
        dbConnected = true;
        dbVersion = dbRes?.rows?.[0]?.version?.split(',')[0] || 'PostgreSQL';
      } catch (err) {
        logger.warn(`BD no disponible: ${err.message}`);
        dbConnected = false;
      }

      const responseTime = Date.now() - startTime;

      res.json({
        status: dbConnected ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        storage: 'postgresql',
        database: {
          connected: dbConnected,
          version: dbVersion,
          name: process.env.PGDATABASE || 'teatro',
          host: process.env.PGHOST || 'localhost',
          responseTime: `${dbResponseTime}ms`
        },
        data: dataStats,
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        version: '3.0'
      });
    } catch (error) {
      logger.error(`Healthcheck error: ${error.message}`);
      res.status(503).json({ 
        status: 'error', 
        message: error.message,
        storage: 'postgresql',
        database: { connected: false },
        uptime: process.uptime()
      });
    }
  });

  // =========================================================================
  // RUTAS DE API
  // =========================================================================

  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/funciones', funcionesRoutes);
  app.use('/api/shows', funcionesRoutes);
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
  app.use('/api/cuotas', cuotasRoutes);
  app.use('/api/gastos', gastosRoutes);
  app.use('/api/boleteria', boleteriaRoutes);
  app.use('/api/contabilidad', contabilidadRoutes);
  app.use('/api/pagos', pagosRoutes);
  app.use('/api/entradas-v2', entradasV2Routes);

  // =========================================================================
  // RUTAS DE PÁGINAS (SPA)
  // =========================================================================
  
  app.get('/login', sendHtmlFile(path.join(PUBLIC_DIR, 'pages/auth/login.html')));
  app.get('/admin-dashboard.html', sendHtmlFile(path.join(PUBLIC_DIR, 'pages/admin/admin-dashboard.html')));
  app.get('/404', sendHtmlFile(path.join(PUBLIC_DIR, '404.html')));

  // Catch-all para SPA (usando una función middleware sin ruta específica)
  app.use((req, res, next) => {
    // Solo manejar peticiones GET
    if (req.method !== 'GET') {
      return next();
    }
    
    const isApiRoute = req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics');
    
    if (isApiRoute) {
      return next();
    }

    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (!existsSync(indexPath)) {
      logger.warn('index.html no encontrado');
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(indexPath, { maxAge: '0' }, (err) => {
      if (err && !res.headersSent) {
        const notFoundPath = path.join(PUBLIC_DIR, '404.html');
        if (existsSync(notFoundPath)) {
          return res.status(404).sendFile(notFoundPath, (err2) => {
            if (err2 && !res.headersSent) {
              res.status(404).json({ error: 'Página no encontrada' });
            }
          });
        }
        res.status(404).json({ error: 'Página no encontrada' });
      }
    });
  });

  // =========================================================================
  // MANEJO DE RUTAS NO ENCONTRADAS EN API
  // =========================================================================
  
  app.use('/api', (req, res) => {
    res.status(404).json({ 
      error: 'Ruta API no encontrada',
      method: req.method,
      path: req.path
    });
  });

  // =========================================================================
  // MANEJO GLOBAL DE ERRORES
  // =========================================================================
  
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    logger.error(`Error [${req.id}]:`, {
      message: err.message,
      code: err.code,
      status: err.status,
      path: req.path,
      method: req.method
    });

    const statusCode = (
      err.status && 
      Number.isInteger(err.status) && 
      err.status >= 400 && 
      err.status < 600
    ) ? err.status : 500;

    const errorResponse = {
      error: err.message || 'Error interno del servidor',
      status: statusCode,
      requestId: req.id,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack?.split('\n'),
        code: err.code
      })
    };

    res.status(statusCode).json(errorResponse);
  });

  routesMounted = true;
  logger.info('✅ Rutas montadas correctamente');
}

// =============================================================================
// BOOTSTRAP - INICIALIZACIÓN DEL SISTEMA
// =============================================================================

async function startServer(options = {}) {
  const { listen = true } = options;
  
  try {
    logger.info('🚀 Iniciando Baco Teatro Server...');
    logger.info(`🌍 Entorno: ${NODE_ENV}`);
    
    validateEnvironment();
    validateOptionalEnvironment();
    logger.info('✅ Variables de entorno validadas');
    
    try {
      await initDatabase();
      logger.info('✅ Base de datos inicializada');
    } catch (err) {
      logger.error('❌ Error inicializando BD:', err.message);
      throw err;
    }
    
    try {
      await initSuperUser();
      logger.info('✅ Usuario SUPER inicializado');
    } catch (err) {
      logger.warn('⚠️ Error inicializando usuario SUPER:', err.message);
    }
    
    try {
      await initSeed();
      logger.info('✅ Seed aplicado');
    } catch (err) {
      logger.warn('⚠️ Error aplicando seed:', err.message);
    }
    
    mountRoutes();

    if (listen) {
      server = app.listen(PORT, '0.0.0.0', () => {
        logger.success(`🎭 Servidor corriendo en puerto ${PORT}`);
        logger.info(`📊 Health: http://localhost:${PORT}/health`);
        logger.info(`📈 Métricas: http://localhost:${PORT}/metrics`);
        logger.info(`🔌 API: http://localhost:${PORT}/api`);
      });

      // Configurar timeouts
      server.setTimeout(30000);
      server.keepAliveTimeout = 65000;
      server.headersTimeout = 66000;

      // Configurar graceful shutdown
      const gracefulShutdown = async (signal) => {
        if (isShuttingDown) {
          logger.warn('Shutdown ya en progreso...');
          return;
        }
        
        isShuttingDown = true;
        logger.info(`⏹️ Recibida señal ${signal}`);

        if (server) {
          server.close(async () => {
            logger.info('✅ Servidor HTTP cerrado');
            
            try {
              if (pool?.end) {
                await pool.end();
                logger.info('✅ Pool de BD cerrado');
              }
              
              for (const listener of shutdownListeners) {
                try {
                  await listener();
                } catch (err) {
                  logger.warn(`Error en listener: ${err.message}`);
                }
              }
              
              logger.success('✅ Shutdown completado');
              process.exit(0);
            } catch (err) {
              logger.error(`Error en shutdown: ${err.message}`);
              process.exit(1);
            }
          });

          setTimeout(() => {
            logger.error('❌ Forzando cierre');
            process.exit(1);
          }, 10000);
        }
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('uncaughtException', (err) => {
        logger.error(`Excepción no capturada: ${err.message}`);
        gracefulShutdown('uncaughtException');
      });
      process.on('unhandledRejection', (reason) => {
        logger.error(`Promesa rechazada:`, reason);
      });

      return server;
    }

    logger.info('Servidor inicializado en modo no-listen');
    return app;

  } catch (error) {
    logger.error(`❌ Error crítico: ${error.message}`);
    if (NODE_ENV === 'development') {
      logger.error('Stack:', error.stack);
    }
    process.exitCode = 1;
    throw error;
  }
}

// =============================================================================
// EJECUCIÓN
// =============================================================================

if (NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { app, startServer, shutdownListeners, metrics };
export default app;
