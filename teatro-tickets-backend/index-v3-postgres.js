import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/postgres.js';
import { initSupremo } from './init-supremo.js';
import { seedMinimo } from './seed-minimo-init.js';
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
import { readData } from './utils/dataStore.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

// Middlewares
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Servir fuentes desde /fonts para evitar problemas con node_modules
app.use('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts', 
  express.static(path.join(PUBLIC_DIR, 'fonts'))
);

// Deshabilitar caché en desarrollo
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

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
    
    // Inicializar usuario supremo y datos mínimos (sin bloquear el inicio)
    initSupremo().catch(err => {
      console.error('⚠️  Error inicializando usuario supremo (no crítico):', err.message);
    });
    seedMinimo().catch(err => {
      console.error('⚠️  Error aplicando seed mínimo (no crítico):', err.message);
    });
    
    // Rutas de la API
    app.get('/api', (req, res) => {
      res.json({ ok: true, name: 'Baco Teatro API', version: '3.0.0' });
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
            funciones: data.funciones.length,
            // Alias de compatibilidad: "shows" ya no es entidad, equivale a funciones
            shows: data.funciones.length,
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
    app.use('/api/usuarios', usuariosRoutes); // Nuevo modelo BACO
    app.use('/api/users', usersRoutes); // Alias para compatibilidad con frontend antiguo
    app.use('/api/funciones', funcionesRoutes);
    app.use('/api/shows', funcionesRoutes); // Alias para compatibilidad con frontend antiguo
    app.use('/public', publicRoutes);
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

    // Middleware para rutas API no encontradas
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
