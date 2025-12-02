const mongoose = require('mongoose');
require('dotenv').config();

const Obra = require('../models/Obra');

async function limpiezaAutomatica() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const resultado = await Obra.deleteMany({
            fecha: { $lt: hoy }
        });

        const timestamp = new Date().toLocaleString('es-AR');
        
        if (resultado.deletedCount > 0) {
            console.log(`[${timestamp}] ✅ Limpieza automática: ${resultado.deletedCount} funciones pasadas eliminadas`);
        } else {
            console.log(`[${timestamp}] ✨ Limpieza automática: No hay funciones pasadas`);
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error(`[${new Date().toLocaleString('es-AR')}] ❌ Error en limpieza automática:`, error);
    }
}

// Ejecutar inmediatamente
limpiezaAutomatica();

// Ejecutar cada 6 horas (opcional, para mantener el proceso corriendo)
if (process.env.AUTO_CLEANUP_INTERVAL) {
    setInterval(limpiezaAutomatica, 6 * 60 * 60 * 1000); // Cada 6 horas
}
