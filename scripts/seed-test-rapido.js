#!/usr/bin/env node
/**
 * Script rápido para insertar datos de prueba
 */

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Crear un grupo de prueba
    console.log('📌 Creando grupo de prueba...');
    const grupoRes = await client.query(`
      INSERT INTO grupos (nombre, director_cedula, horario_fijo)
      VALUES ('Los Titanes del Teatro', '48376669', 'Lunes 19:00')
      RETURNING id
    `);
    const grupoId = grupoRes.rows[0].id;
    console.log(`✅ Grupo creado: ID ${grupoId}`);
    
    // 2. Crear una obra
    console.log('📌 Creando obra de prueba...');
    const obraRes = await client.query(`
      INSERT INTO obras (titulo, grupo_id, duracion_minutos, descripcion)
      VALUES (
        'La Vida es Sueño',
        $1,
        120,
        'Una obra clásica del teatro barroco español'
      )
      RETURNING id
    `, [grupoId]);
    const obraId = obraRes.rows[0].id;
    console.log(`✅ Obra creada: ID ${obraId}`);
    
    // 3. Crear funciones (una para hoy, otras para el futuro)
    console.log('📌 Creando funciones...');
    
    const hoy = new Date();
    hoy.setHours(20, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    const pasadoManana = new Date(hoy);
    pasadoManana.setDate(pasadoManana.getDate() + 2);
    
    // Función de HOY
    await client.query(`
      INSERT INTO funciones (
        obra_id,
        fecha_hora,
        ubicacion,
        tipo,
        capacidad,
        precio
      ) VALUES (
        $1,
        $2,
        'Teatro El Galpón - Sala Principal',
        'normal',
        150,
        300
      )
    `, [obraId, hoy]);
    console.log('✅ Función de HOY creada');
    
    // Función de MAÑANA
    await client.query(`
      INSERT INTO funciones (
        obra_id,
        fecha_hora,
        ubicacion,
        tipo,
        capacidad,
        precio
      ) VALUES (
        $1,
        $2,
        'Teatro El Galpón - Sala Principal',
        'normal',
        150,
        300
      )
    `, [obraId, manana]);
    console.log('✅ Función de MAÑANA creada');
    
    // Función PROFESIONAL (pasado mañana)
    await client.query(`
      INSERT INTO funciones (
        obra_id,
        fecha_hora,
        ubicacion,
        tipo,
        capacidad,
        precio
      ) VALUES (
        $1,
        $2,
        'Teatro Victoria - Sala Profesionales',
        'profesional',
        80,
        500
      )
    `, [obraId, pasadoManana]);
    console.log('✅ Función PROFESIONAL creada');
    
    await client.query('COMMIT');
    console.log('\n🎉 Datos de prueba creados exitosamente!');
    
    // Verificar
    const verificar = await client.query(`
      SELECT 
        f.id,
        o.titulo,
        f.fecha_hora,
        f.tipo,
        g.nombre as grupo
      FROM funciones f
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      ORDER BY f.fecha_hora
    `);
    
    console.log('\n📋 Funciones creadas:');
    verificar.rows.forEach(row => {
      console.log(`  - ${row.titulo} (${row.tipo}) - ${row.fecha_hora} - ${row.grupo}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
