```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS mejorada para Codespaces
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como curl, Postman, etc)
        if (!origin) return callback(null, true);
        
        // Permitir localhost y github.dev
        if (origin.includes('localhost') || origin.includes('github.dev')) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Puerto y host
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Datos de ejemplo (normalmente vendrían de una base de datos)
let eventos = [
    { id: 1, nombre: 'Concierto', fecha: '2023-12-10', precio: 50, entradasDisponibles: 100 },
    { id: 2, nombre: 'Obra de Teatro', fecha: '2023-12-15', precio: 30, entradasDisponibles: 50 },
];

let entradas = [];

// Middleware de autenticación simplificado (solo para demostración)
const autenticarUsuario = (req, res, next) => {
    // Por ahora, permitir todas las peticiones GET sin autenticación
    if (req.method === 'GET') {
        req.usuario = { id: 'anonimo', nombre: 'Usuario Anónimo' };
        return next();
    }
    
    // Para POST, verificar si hay un usuario en el body
    if (req.body && req.body.usuario) {
        req.usuario = { id: req.body.usuario, nombre: req.body.usuario };
        return next();
    }
    
    // Si no hay usuario, usar uno por defecto
    req.usuario = { id: 'usuario-demo', nombre: 'Usuario Demo' };
    next();
};

// Middleware de autenticación
app.use(autenticarUsuario);

// Rutas
app.get('/', (req, res) => {
    res.send('API funcionando');
});

// Rutas de la API
app.get('/api/eventos', (req, res) => {
    res.json(eventos);
});

app.post('/api/entradas', (req, res) => {
    const { eventoId, cantidad, usuario } = req.body;
    
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) {
        return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    if (evento.entradasDisponibles < cantidad) {
        return res.status(400).json({ error: 'No hay suficientes entradas disponibles' });
    }
    
    const entrada = {
        id: entradas.length + 1,
        eventoId,
        nombreEvento: evento.nombre,
        cantidad,
        usuario: usuario || req.usuario.id,
        fecha: new Date().toISOString(),
        total: evento.precio * cantidad
    };
    
    entradas.push(entrada);
    evento.entradasDisponibles -= cantidad;
    
    res.status(201).json(entrada);
});

app.get('/api/entradas', (req, res) => {
    // Devolver todas las entradas (en producción filtrarías por usuario)
    res.json(entradas);
});

// Iniciar el servidor
app.listen(PORT, HOST, () => {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
```