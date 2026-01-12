/**
 * Script para crear funciones de demostración
 * Ejecutar: node scripts/seed-funciones-demo.js
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';

async function seedFuncionesDemos() {
    const client = new Client({ connectionString: DATABASE_URL });
    
    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos');

        // Crear grupo de demostración
        const grupoResult = await client.query(`
            INSERT INTO grupos (nombre, director_cedula, dia_semana, horario, created_at)
            VALUES ('Elenco BACO Demo', '48376669', 'Lunes', '19:00', NOW())
            ON CONFLICT DO NOTHING
            RETURNING id
        `);
        
        let grupoId;
        if (grupoResult.rows.length > 0) {
            grupoId = grupoResult.rows[0].id;
            console.log(`✅ Grupo creado: ID ${grupoId}`);
        } else {
            const existingGrupo = await client.query('SELECT id FROM grupos LIMIT 1');
            grupoId = existingGrupo.rows[0].id;
            console.log(`ℹ️  Usando grupo existente: ID ${grupoId}`);
        }

        // Crear obra de demostración
        const obraResult = await client.query(`
            INSERT INTO obras (nombre, descripcion, grupo_id, created_at)
            VALUES (
                'Hamlet - La Venganza',
                'Una adaptación moderna de la tragedia de Shakespeare. Un príncipe atormentado busca venganza contra su tío asesino.',
                $1,
                NOW()
            )
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [grupoId]);

        let obraId;
        if (obraResult.rows.length > 0) {
            obraId = obraResult.rows[0].id;
            console.log(`✅ Obra creada: ID ${obraId}`);
        } else {
            const existingObra = await client.query('SELECT id FROM obras WHERE grupo_id = $1 LIMIT 1', [grupoId]);
            if (existingObra.rows.length > 0) {
                obraId = existingObra.rows[0].id;
                console.log(`ℹ️  Usando obra existente: ID ${obraId}`);
            } else {
                throw new Error('No se pudo crear ni encontrar una obra');
            }
        }

        // Crear funciones de demostración
        const funciones = [
            {
                fecha: new Date(), // Hoy
                hora: '20:00',
                lugar: 'Teatro Solís',
                precio: 500,
                descripcion: 'Función especial de estreno'
            },
            {
                fecha: new Date(Date.now() + 86400000), // Mañana
                hora: '19:30',
                lugar: 'Teatro Solís',
                precio: 450,
                descripcion: 'Segunda función'
            },
            {
                fecha: new Date(Date.now() + 86400000 * 3), // En 3 días
                hora: '21:00',
                lugar: 'Teatro Victoria',
                precio: 600,
                descripcion: 'Función de gala'
            },
            {
                fecha: new Date(Date.now() + 86400000 * 7), // En 1 semana
                hora: '20:30',
                lugar: 'Teatro El Galpón',
                precio: 500,
                descripcion: 'Función especial'
            }
        ];

        for (const func of funciones) {
            const funcionResult = await client.query(`
                INSERT INTO funciones (
                    obra_id,
                    fecha,
                    lugar,
                    precio_base,
                    estado,
                    created_at
                )
                VALUES ($1, $2, $3, $4, 'PROGRAMADA', NOW())
                RETURNING id
            `, [obraId, func.fecha, func.lugar, func.precio]);

            const funcionId = funcionResult.rows[0].id;
            console.log(`✅ Función creada: ID ${funcionId} - ${func.fecha.toLocaleDateString('es-UY')} ${func.hora}`);

            // Crear tickets disponibles para la función
            const ticketPromises = [];
            for (let i = 1; i <= 50; i++) {
                ticketPromises.push(
                    client.query(`
                        INSERT INTO tickets (
                            funcion_id,
                            numero,
                            estado,
                            created_at
                        )
                        VALUES ($1, $2, 'DISPONIBLE', NOW())
                    `, [funcionId, i])
                );
            }
            await Promise.all(ticketPromises);
            console.log(`   ↳ 50 entradas creadas para la función ${funcionId}`);
        }

        console.log('\n🎭 ¡Funciones de demostración creadas exitosamente!');
        console.log('   Podés verlas en:');
        console.log('   - http://localhost:3000/funciones-hoy.html');
        console.log('   - http://localhost:3000/proximas-funciones.html');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seedFuncionesDemos();
