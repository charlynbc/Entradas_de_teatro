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
let usuarios = [
    { id: 1, usuario: 'supremo', contrasena: 'supremo123', nombre: 'Super Usuario', rol: 'supremo', email: 'supremo@teatro.com' },
    { id: 2, usuario: 'director', contrasena: 'director123', nombre: 'Director Teatral', rol: 'director', email: 'director@teatro.com' },
    { id: 3, usuario: 'vendedor', contrasena: 'vendedor123', nombre: 'Vendedor', rol: 'vendedor', email: 'vendedor@teatro.com' },
    { id: 4, usuario: 'invitado', contrasena: 'invitado123', nombre: 'Invitado', rol: 'invitado', email: 'invitado@teatro.com' }
];

let obras = [
    { _id: '1', nombre: 'Hamlet', director: 'Shakespeare Company', descripcion: 'Clásico de Shakespeare', createdAt: new Date() },
    { _id: '2', nombre: 'La Casa de Bernarda Alba', director: 'García Lorca', descripcion: 'Drama español', createdAt: new Date() }
];

let funciones = [
    { _id: '1', obra: { _id: '1', nombre: 'Hamlet' }, fecha: '2024-01-15', hora: '20:00', capacidad: 100, entradas_vendidas: 25 },
    { _id: '2', obra: { _id: '2', nombre: 'La Casa de Bernarda Alba' }, fecha: '2024-01-20', hora: '19:00', capacidad: 80, entradas_vendidas: 15 }
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

// Rutas de Autenticación
app.post('/api/login', (req, res) => {
    const { usuario, contrasena } = req.body;
    
    const user = usuarios.find(u => u.usuario === usuario && u.contrasena === contrasena);
    
    if (!user) {
        return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }
    
    // En producción, usar JWT real
    const token = 'token_' + user.id + '_' + Date.now();
    
    res.json({
        token,
        usuario: {
            id: user.id,
            usuario: user.usuario,
            nombre: user.nombre,
            rol: user.rol,
            email: user.email
        }
    });
});

// Rutas de Obras
app.get('/api/obras', (req, res) => {
    res.json(obras);
});

app.get('/api/obras/:id', (req, res) => {
    const obra = obras.find(o => o._id === req.params.id);
    if (!obra) {
        return res.status(404).json({ error: 'Obra no encontrada' });
    }
    res.json(obra);
});

// Rutas de Funciones
app.get('/api/funciones', (req, res) => {
    res.json(funciones);
});

app.get('/api/funciones/:id', (req, res) => {
    const funcion = funciones.find(f => f._id === req.params.id);
    if (!funcion) {
        return res.status(404).json({ error: 'Función no encontrada' });
    }
    res.json(funcion);
});

// Rutas de Usuarios
app.get('/api/usuarios', (req, res) => {
    // No devolver contraseñas
    res.json(usuarios.map(u => ({
        id: u.id,
        usuario: u.usuario,
        nombre: u.nombre,
        rol: u.rol,
        email: u.email
    })));
});

// Rutas de Entradas
app.get('/api/entradas', (req, res) => {
    res.json(entradas);
});

app.post('/api/entradas', (req, res) => {
    const { funcionId, nombre_completo, cantidad } = req.body;
    
    const funcion = funciones.find(f => f._id === funcionId);
    if (!funcion) {
        return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    const entrada = {
        _id: String(entradas.length + 1),
        numero: entradas.length + 1,
        nombre_completo,
        cantidad: cantidad || 1,
        funcion: funcion,
        fecha_compra: new Date().toISOString()
    };
    
    entradas.push(entrada);
    funcion.entradas_vendidas = (funcion.entradas_vendidas || 0) + (cantidad || 1);
    
    res.status(201).json(entrada);
});

// Iniciar el servidor
app.listen(PORT, HOST, () => {
    console.log('Servidor corriendo en http://' + HOST + ':' + PORT);
});
