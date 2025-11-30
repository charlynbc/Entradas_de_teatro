import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/api', (req, res) => {
  res.json({
    ok: true,
    message: 'API Teatro Tickets - modo JSON',
    docs: '/README'
  });
});

app.get('/health', async (req, res) => {
  try {
    const data = await readData();
    res.json({
      status: 'ok',
      storage: 'json-file',
      totals: {
        users: data.users.length,
        shows: data.shows.length,
        tickets: data.tickets.length
      }
    });
  } catch (error) {
    console.error('Healthcheck error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/reportes', reportesRoutes);

app.use((req, res, next) => {
  const isApiRoute = req.path.startsWith('/api') || req.path.startsWith('/health');
  if (req.method !== 'GET' || isApiRoute) {
    return next();
  }
  return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`🎭 API Teatro Tickets escuchando en http://localhost:${PORT}`);
});

export default app;
