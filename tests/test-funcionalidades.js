const mongoose = require('mongoose');
require('dotenv').config();

const Obra = require('../models/Obra');
const Entrada = require('../models/Entrada');
const Usuario = require('../models/Usuario');

console.log('🎭 ========================================');
console.log('🎭 TEST DE FUNCIONALIDADES');
console.log('🎭 ========================================\n');

let testsExitosos = 0;
let testsFallidos = 0;

async function test(nombre, fn) {
    try {
        await fn();
        console.log(`✅ ${nombre}`);
        testsExitosos++;
    } catch (error) {
        console.log(`❌ ${nombre}`);
        console.log(`   Error: ${error.message}`);
        testsFallidos++;
    }
}

async function ejecutarTests() {
    try {
        // Conectar a base de datos de test
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teatro_test');
        console.log('🔌 Conectado a base de datos de test\n');

        // Limpiar base de datos de test
        await Obra.deleteMany({});
        await Entrada.deleteMany({});
        await Usuario.deleteMany({});

        console.log('🧪 EJECUTANDO TESTS...\n');

        // ============================================
        // TESTS DE MODELOS
        // ============================================
        console.log('📝 Tests de Modelos\n');

        await test('Crear Usuario', async () => {
            const usuario = new Usuario({
                nombre: 'Test User',
                email: 'test@test.com',
                password: 'test123',
                rol: 'supremo'
            });
            await usuario.save();
            if (!usuario._id) throw new Error('Usuario no se guardó');
        });

        await test('Crear Obra', async () => {
            const obra = new Obra({
                nombre: 'Obra de Prueba',
                fecha: new Date('2024-12-31'),
                hora: '20:00',
                localidad: 'Platea',
                precio: 5000,
                entradasDisponibles: 100
            });
            await obra.save();
            if (!obra._id) throw new Error('Obra no se guardó');
        });

        await test('Crear Entrada', async () => {
            const obra = await Obra.findOne({ nombre: 'Obra de Prueba' });
            const entrada = new Entrada({
                obraId: obra._id,
                nombre: 'Cliente Test',
                email: 'cliente@test.com',
                cantidad: 2,
                total: 10000
            });
            await entrada.save();
            if (!entrada._id) throw new Error('Entrada no se guardó');
        });

        // ============================================
        // TESTS DE LÓGICA DE NEGOCIO
        // ============================================
        console.log('\n💼 Tests de Lógica de Negocio\n');

        await test('Reducir entradas disponibles', async () => {
            const obra = await Obra.findOne({ nombre: 'Obra de Prueba' });
            const disponiblesAntes = obra.entradasDisponibles;
            obra.entradasDisponibles -= 2;
            await obra.save();
            const obraActualizada = await Obra.findById(obra._id);
            if (obraActualizada.entradasDisponibles !== disponiblesAntes - 2) {
                throw new Error('No se actualizaron las entradas');
            }
        });

        await test('Verificar cálculo de total', async () => {
            const obra = await Obra.findOne({ nombre: 'Obra de Prueba' });
            const entrada = await Entrada.findOne({ email: 'cliente@test.com' });
            const totalEsperado = obra.precio * entrada.cantidad;
            if (entrada.total !== totalEsperado) {
                throw new Error(`Total incorrecto: esperado ${totalEsperado}, obtenido ${entrada.total}`);
            }
        });

        await test('Usuario supremo tiene rol correcto', async () => {
            const usuario = await Usuario.findOne({ email: 'test@test.com' });
            if (usuario.rol !== 'supremo') {
                throw new Error('Rol de usuario incorrecto');
            }
        });

        // ============================================
        // TESTS DE VALIDACIÓN
        // ============================================
        console.log('\n✔️  Tests de Validación\n');

        await test('No permitir obra sin nombre', async () => {
            try {
                const obra = new Obra({
                    fecha: new Date(),
                    hora: '20:00',
                    localidad: 'Platea',
                    precio: 5000
                });
                await obra.save();
                throw new Error('Debería haber fallado');
            } catch (error) {
                if (!error.message.includes('required')) {
                    throw new Error('Validación no funcionó correctamente');
                }
            }
        });

        await test('No permitir entrada sin email', async () => {
            try {
                const obra = await Obra.findOne();
                const entrada = new Entrada({
                    obraId: obra._id,
                    nombre: 'Test',
                    cantidad: 1,
                    total: 5000
                });
                await entrada.save();
                throw new Error('Debería haber fallado');
            } catch (error) {
                if (!error.message.includes('required')) {
                    throw new Error('Validación no funcionó correctamente');
                }
            }
        });

        await test('Email único para usuarios', async () => {
            try {
                const usuario = new Usuario({
                    nombre: 'Otro Usuario',
                    email: 'test@test.com',
                    password: 'pass123',
                    rol: 'admin'
                });
                await usuario.save();
                throw new Error('Debería haber fallado por email duplicado');
            } catch (error) {
                if (!error.message.includes('duplicate')) {
                    throw new Error('Validación de email único no funcionó');
                }
            }
        });

        // ============================================
        // TESTS DE QUERIES
        // ============================================
        console.log('\n🔍 Tests de Queries\n');

        await test('Buscar obras por fecha', async () => {
            const obras = await Obra.find({
                fecha: { $gte: new Date('2024-01-01') }
            });
            if (obras.length === 0) {
                throw new Error('No se encontraron obras');
            }
        });

        await test('Buscar entradas por email', async () => {
            const entradas = await Entrada.find({ email: 'cliente@test.com' });
            if (entradas.length !== 1) {
                throw new Error('No se encontró la entrada correcta');
            }
        });

        await test('Contar total de entradas', async () => {
            const total = await Entrada.countDocuments();
            if (total !== 1) {
                throw new Error(`Total incorrecto: esperado 1, obtenido ${total}`);
            }
        });

        // Limpiar
        await Obra.deleteMany({});
        await Entrada.deleteMany({});
        await Usuario.deleteMany({});

        // Cerrar conexión
        await mongoose.connection.close();

        // ============================================
        // RESUMEN
        // ============================================
        console.log('\n🎭 ========================================');
        console.log('🎭 RESUMEN DE TESTS');
        console.log('🎭 ========================================\n');
        console.log(`✅ Tests exitosos: ${testsExitosos}`);
        console.log(`❌ Tests fallidos: ${testsFallidos}`);
        console.log(`📊 Total: ${testsExitosos + testsFallidos}`);
        console.log(`📈 Porcentaje de éxito: ${((testsExitosos / (testsExitosos + testsFallidos)) * 100).toFixed(2)}%`);
        console.log('\n🎭 ========================================\n');

        if (testsFallidos === 0) {
            console.log('✅ ¡TODOS LOS TESTS PASARON! 🎉\n');
            process.exit(0);
        } else {
            console.log('❌ Algunos tests fallaron. Revisa los errores.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error fatal en tests:', error);
        process.exit(1);
    }
}

ejecutarTests();
