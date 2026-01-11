#!/usr/bin/env node
/**
 * SCRIPT DE SEED - Crear datos de prueba
 * Funciones, obras, grupos y actores de prueba
 */

import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';

const pool = new Pool({ connectionString: DATABASE_URL });

async function seed() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  try {
    // 1. Crear usuario director (si no existe)
    console.log('👤 Creando usuario director...');
    const directorRes = await pool.query(
      `INSERT INTO users (cedula, name, email, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (cedula) DO UPDATE SET role = 'ACTOR'
       RETURNING cedula, name`,
      ['12345678', 'Director Test', 'director@test.local', '091234567', 'ACTOR']
    );
    const directorCedula = directorRes.rows[0].cedula;
    console.log(`   ✅ Director: ${directorRes.rows[0].name}\n`);

    // 2. Crear grupo de prueba
    console.log('📦 Creando grupo de prueba...');
    const grupoRes = await pool.query(
      `INSERT INTO grupos (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, nombre`,
      [
        'Grupo Baco Test',
        'Grupo de prueba para testing',
        directorCedula,
        'MARTES',
        '20:00',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'ACTIVO'
      ]
    );
    const grupoId = grupoRes.rows[0].id;
    console.log(`   ✅ Grupo: ${grupoRes.rows[0].nombre} (ID: ${grupoId})\n`);

    // 3. Crear obra de prueba
    console.log('📚 Creando obra de prueba...');
    const obraRes = await pool.query(
      `INSERT INTO obras (grupo_id, nombre, descripcion, autor, genero, duracion_aprox, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, nombre`,
      [
        grupoId,
        'Rescátate - Obra Test',
        'Obra de comedia social que reflexiona sobre la desigualdad',
        'Baco Collective',
        'Comedia',
        120,
        'LISTA'
      ]
    );
    const obraId = obraRes.rows[0].id;
    console.log(`   ✅ Obra: ${obraRes.rows[0].nombre} (ID: ${obraId})\n`);

    // 4. Crear funciones de prueba (próximas fechas)
    console.log('🎭 Creando funciones de prueba...');
    
    const fechas = [
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),  // +2 días
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // +7 días
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 días
      new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)  // +21 días
    ];

    const funciones = [];
    for (let i = 0; i < fechas.length; i++) {
      const fecha = fechas[i];
      const hora = `${20 + (i % 3)}:00:00`;
      
      const funcRes = await pool.query(
        `INSERT INTO funciones (
          obra_id, fecha, lugar, precio_base, 
          capacidad, estado, foto_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, fecha, precio_base`,
        [
          obraId,
          new Date(fecha.toDateString() + ' ' + hora),
          'Teatro La Candela - Sala Principal',
          500,
          80,
          'PROGRAMADA',
          '/images/logo-baco.svg'
        ]
      );
      
      const func = funcRes.rows[0];
      funciones.push(func);
      
      const fechaStr = new Date(func.fecha).toLocaleDateString('es-UY');
      console.log(`   ✅ Función ${i + 1}: ${fechaStr} - $${func.precio_base}`);
    }
    console.log('');

    // 5. Crear tickets de prueba (entradas disponibles)
    console.log('🎫 Creando tickets disponibles...');
    for (const func of funciones) {
      for (let i = 0; i < 80; i++) {
        const code = `TEST-${func.id}-${String(i + 1).padStart(3, '0')}`;
        await pool.query(
          `INSERT INTO tickets (code, funcion_id, estado, precio)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO NOTHING`,
          [code, func.id, 'DISPONIBLE', 500]
        );
      }
      console.log(`   ✅ 80 tickets para función ${func.id}`);
    }
    console.log('');

    // 5. Resumen
    console.log('✨ SEED COMPLETADO\n');
    console.log('Datos creados:');
    console.log(`  • 1 Usuario: "Director Test"`);
    console.log(`  • 1 Grupo: "Grupo Baco Test"`);
    console.log(`  • 1 Obra: "Rescátate - Obra Test"`);
    console.log(`  • 4 Funciones: +2, +7, +14, +21 días`);
    console.log(`  • 320 Tickets: 80 por función\n`);

    await pool.end();
    console.log('✅ Listo. Ahora puedes ejecutar el testing.\n');

  } catch (error) {
    console.error('❌ Error durante seed:', error.message);
    process.exit(1);
  }
}

seed();
