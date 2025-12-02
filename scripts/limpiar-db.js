const mongoose = require('mongoose');
require('dotenv').config();

const Obra = require('../models/Obra');
const Entrada = require('../models/Entrada');
const Usuario = require('../models/Usuario');

async function limpiarBaseDatos() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro');
        console.log('🔌 Conectado a MongoDB');

        // Eliminar todas las obras
        const obrasEliminadas = await Obra.deleteMany({});
        console.log(`🗑️  Obras eliminadas: ${obrasEliminadas.deletedCount}`);

        // Eliminar todas las entradas
        const entradasEliminadas = await Entrada.deleteMany({});
        console.log(`🗑️  Entradas eliminadas: ${entradasEliminadas.deletedCount}`);

        // Eliminar todos los usuarios excepto el supremo
        const usuariosEliminados = await Usuario.deleteMany({ 
            email: { $ne: 'admin@bacoteatro.com' } 
        });
        console.log(`🗑️  Usuarios eliminados: ${usuariosEliminados.deletedCount}`);

        // Verificar que existe el usuario supremo
        let usuarioSupremo = await Usuario.findOne({ email: 'admin@bacoteatro.com' });
        
        if (!usuarioSupremo) {
            usuarioSupremo = new Usuario({
                nombre: 'Administrador',
                email: 'admin@bacoteatro.com',
                password: 'admin123',
                rol: 'supremo'
            });
            await usuarioSupremo.save();
            console.log('✅ Usuario supremo creado');
        } else {
            console.log('✅ Usuario supremo existente');
        }

        console.log('\n🎭 BASE DE DATOS VIRGEN:');
        console.log('   ✨ Sistema completamente limpio');
        console.log('   👤 Usuario supremo: admin@bacoteatro.com');
        console.log('   🔑 Password: admin123');
        console.log('   ⚠️  Cambiar contraseña en producción\n');

        await mongoose.connection.close();
        console.log('✅ Proceso completado');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

limpiarBaseDatos();
