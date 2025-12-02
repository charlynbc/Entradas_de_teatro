const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Modelos
const Obra = require('./models/Obra');
const Entrada = require('./models/Entrada');
const Usuario = require('./models/Usuario');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro')
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Inicializar base de datos VIRGEN - solo usuario supremo
async function inicializarBaseDatos() {
    try {
        // Verificar si ya existe el usuario supremo
        const usuarioExistente = await Usuario.findOne({ email: 'admin@bacoteatro.com' });
        
        if (!usuarioExistente) {
            // Crear solo el usuario supremo
            const usuarioSupremo = new Usuario({
                nombre: 'Administrador',
                email: 'admin@bacoteatro.com',
                password: 'admin123', // Cambiar en producción
                rol: 'supremo'
            });
            
            await usuarioSupremo.save();
            console.log('✅ Usuario supremo creado exitosamente');
            console.log('📧 Email: admin@bacoteatro.com');
            console.log('🔑 Password: admin123');
            console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');
        } else {
            console.log('✅ Usuario supremo ya existe');
        }

        // Verificar que no haya otros datos
        const totalObras = await Obra.countDocuments();
        const totalEntradas = await Entrada.countDocuments();
        
        console.log('\n📊 Estado de la base de datos:');
        console.log(`   Obras: ${totalObras}`);
        console.log(`   Entradas: ${totalEntradas}`);
        console.log(`   Sistema: ${totalObras === 0 && totalEntradas === 0 ? 'VIRGEN ✨' : '⚠️  CON DATOS'}`);
        
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
    }
}

// Función para limpiar funciones pasadas automáticamente
async function limpiarFuncionesPasadas() {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const resultado = await Obra.deleteMany({
            fecha: { $lt: hoy }
        });

        if (resultado.deletedCount > 0) {
            console.log(`🗑️  Limpieza automática: ${resultado.deletedCount} funciones pasadas eliminadas`);
        }
    } catch (error) {
        console.error('❌ Error en limpieza automática:', error);
    }
}

// Llamar a la inicialización cuando se conecta la base de datos
mongoose.connection.once('open', () => {
    inicializarBaseDatos();
    limpiarFuncionesPasadas(); // Limpiar al iniciar
    
    // Ejecutar limpieza cada 24 horas
    setInterval(limpiarFuncionesPasadas, 24 * 60 * 60 * 1000);
});

// ============================================
// RUTAS DE API
// ============================================

// Obtener todas las obras (SOLO obras futuras o del día actual)
app.get('/api/obras', async (req, res) => {
    try {
        // Obtener fecha actual a las 00:00 para comparar
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Solo obtener obras cuya fecha sea hoy o en el futuro
        const obras = await Obra.find({
            fecha: { $gte: hoy }
        }).sort({ fecha: 1, hora: 1 });
        
        res.json(obras);
    } catch (error) {
        console.error('Error al obtener obras:', error);
        res.status(500).json({ error: 'Error al obtener obras' });
    }
});

// Crear nueva obra (requiere autenticación - implementar después)
app.post('/api/obras', async (req, res) => {
    try {
        const nuevaObra = new Obra(req.body);
        await nuevaObra.save();
        res.status(201).json(nuevaObra);
    } catch (error) {
        console.error('Error al crear obra:', error);
        res.status(500).json({ error: 'Error al crear obra' });
    }
});

// Comprar entrada
app.post('/api/comprar', async (req, res) => {
    try {
        const { obraId, nombre, email, cantidad } = req.body;

        const obra = await Obra.findById(obraId);
        if (!obra) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        if (obra.entradasDisponibles < cantidad) {
            return res.status(400).json({ error: 'No hay suficientes entradas disponibles' });
        }

        const entrada = new Entrada({
            obraId,
            nombre,
            email,
            cantidad,
            total: obra.precio * cantidad
        });

        await entrada.save();

        obra.entradasDisponibles -= cantidad;
        await obra.save();

        res.json({ entrada });
    } catch (error) {
        console.error('Error al comprar entrada:', error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
});

// Obtener entradas de un usuario
app.get('/api/mis-entradas/:email', async (req, res) => {
    try {
        const entradas = await Entrada.find({ email: req.params.email });
        const entradasConObras = await Promise.all(
            entradas.map(async (entrada) => {
                const obra = await Obra.findById(entrada.obraId);
                return {
                    ...entrada.toObject(),
                    obra
                };
            })
        );
        res.json(entradasConObras);
    } catch (error) {
        console.error('Error al obtener entradas:', error);
        res.status(500).json({ error: 'Error al obtener entradas' });
    }
});

// API endpoint para eventos
app.get('/api/eventos', (req, res) => {
    const eventos = [
        {
            id: 1,
            titulo: 'Hamlet',
            fecha: '2024-02-15',
            hora: '20:00',
            precio: '$5000',
            descripcion: 'La clásica obra de William Shakespeare'
        },
        {
            id: 2,
            titulo: 'La Casa de Bernarda Alba',
            fecha: '2024-02-20',
            hora: '21:00',
            precio: '$4500',
            descripcion: 'Drama de Federico García Lorca'
        },
        {
            id: 3,
            titulo: 'Esperando a Godot',
            fecha: '2024-02-25',
            hora: '19:30',
            precio: '$4000',
            descripcion: 'Obra maestra de Samuel Beckett'
        }
    ];
    res.json(eventos);
});

// ============================================
// RUTAS DE PÁGINAS
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contacto.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contacto.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🎭 ========================================`);
    console.log(`🎭 BACO TEATRO - Servidor iniciado`);
    console.log(`🎭 ========================================`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Sirviendo desde: ${path.join(__dirname, 'public')}`);
    console.log(`🎭 ========================================\n`);
});