const mongoose = require('mongoose');
require('dotenv').config();

const Obra = require('../models/Obra');

async function limpiarFuncionesPasadas() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro');
        console.log('🔌 Conectado a MongoDB\n');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Encontrar funciones pasadas
        const funcionesPasadas = await Obra.find({
            fecha: { $lt: hoy }
        });

        console.log(`📊 Funciones pasadas encontradas: ${funcionesPasadas.length}`);

        if (funcionesPasadas.length > 0) {
            console.log('\n🗑️  Funciones a eliminar:\n');
            funcionesPasadas.forEach(obra => {
                console.log(`   • ${obra.nombre} - ${new Date(obra.fecha).toLocaleDateString('es-AR')}`);
            });

            // Eliminar funciones pasadas
            const resultado = await Obra.deleteMany({
                fecha: { $lt: hoy }
            });

            console.log(`\n✅ ${resultado.deletedCount} funciones eliminadas`);
        } else {
            console.log('\n✨ No hay funciones pasadas para eliminar');
        }

        await mongoose.connection.close();
        console.log('\n✅ Proceso completado');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

limpiarFuncionesPasadas();
