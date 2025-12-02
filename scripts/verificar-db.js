const mongoose = require('mongoose');
require('dotenv').config();

const Obra = require('../models/Obra');
const Entrada = require('../models/Entrada');
const Usuario = require('../models/Usuario');

async function verificarBaseDatos() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro');
        console.log('🔌 Conectado a MongoDB\n');

        const totalObras = await Obra.countDocuments();
        const totalEntradas = await Entrada.countDocuments();
        const totalUsuarios = await Usuario.countDocuments();
        const usuarioSupremo = await Usuario.findOne({ email: 'admin@bacoteatro.com' });

        console.log('📊 ESTADO DE LA BASE DE DATOS:');
        console.log('================================');
        console.log(`🎬 Obras: ${totalObras}`);
        console.log(`🎫 Entradas: ${totalEntradas}`);
        console.log(`👥 Usuarios: ${totalUsuarios}`);
        console.log('\n👤 Usuario Supremo:');
        
        if (usuarioSupremo) {
            console.log(`   ✅ Existe`);
            console.log(`   📧 Email: ${usuarioSupremo.email}`);
            console.log(`   👤 Nombre: ${usuarioSupremo.nombre}`);
            console.log(`   🔐 Rol: ${usuarioSupremo.rol}`);
        } else {
            console.log(`   ❌ No existe - ERROR`);
        }

        const esVirgen = totalObras === 0 && totalEntradas === 0 && totalUsuarios === 1;
        console.log('\n🎭 Estado del sistema:');
        console.log(`   ${esVirgen ? '✨ VIRGEN (listo para usar)' : '⚠️  CON DATOS'}\n`);

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verificarBaseDatos();
