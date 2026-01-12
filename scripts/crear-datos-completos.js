#!/usr/bin/env node
/**
 * Script para crear datos completos de prueba
 * Crea usuarios, grupos, obras, funciones y entradas para testing
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';
const pool = new Pool({ connectionString: DATABASE_URL });

async function crearDatosCompletos() {
  const client = await pool.connect();
  
  try {
    console.log('🎭 Creando datos completos de prueba...\n');
    
    await client.query('BEGIN');

    // 1. Crear usuarios si no existen
    console.log('👥 Creando usuarios...');
    const passwordHash = await bcrypt.hash('1234', 10);
    
    const usuarios = [
      { cedula: '11111111', name: 'Super Usuario', role: 'SUPER', phone: '+59899111111', email: 'super@baco.com' },
      { cedula: '22222222', name: 'Director Principal', role: 'ADMIN', phone: '+59899222222', email: 'director@baco.com' },
      { cedula: '33333333', name: 'Actor Vendedor 1', role: 'ACTOR', phone: '+59899333333', email: 'actor1@baco.com' },
      { cedula: '44444444', name: 'Actor Vendedor 2', role: 'ACTOR', phone: '+59899444444', email: 'actor2@baco.com' },
      { cedula: '55555555', name: 'Vendedor Externo', role: 'ACTOR', phone: '+59899555555', email: 'vendedor@baco.com' }
    ];

    for (const u of usuarios) {
      await client.query(`
        INSERT INTO users (cedula, name, role, password_hash, phone, email, active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (cedula) DO UPDATE 
        SET name = EXCLUDED.name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            active = true
      `, [u.cedula, u.name, u.role, passwordHash, u.phone, u.email]);
      console.log(`   ✅ ${u.name} (${u.role})`);
    }

    // 2. Crear grupo
    console.log('\n🎪 Creando grupo...');
    const grupoResult = await client.query(`
      INSERT INTO grupos (nombre, descripcion, director_cedula, estado, created_at)
      VALUES ('Grupo Baco Teatro', 'Grupo principal de teatro', '22222222', 'ACTIVO', NOW())
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    let grupoId;
    if (grupoResult.rows.length > 0) {
      grupoId = grupoResult.rows[0].id;
      console.log(`   ✅ Grupo creado con ID: ${grupoId}`);
    } else {
      const existente = await client.query(`SELECT id FROM grupos WHERE director_cedula = '22222222' LIMIT 1`);
      grupoId = existente.rows[0]?.id;
      console.log(`   ℹ️  Usando grupo existente ID: ${grupoId}`);
    }

    // Agregar miembros al grupo
    const miembros = ['33333333', '44444444', '55555555'];
    for (const cedula of miembros) {
      await client.query(`
        INSERT INTO grupo_miembros (grupo_id, user_cedula, rol_en_grupo, joined_at)
        VALUES ($1, $2, 'ACTOR', NOW())
        ON CONFLICT (grupo_id, user_cedula) DO NOTHING
      `, [grupoId, cedula]);
    }

    // 3. Crear obras
    console.log('\n🎭 Creando obras...');
    const obras = [
      { 
        nombre: 'Hamlet - Ensayo Abierto', 
        descripcion: 'Función de muestra - entrada libre', 
        es_profesional: false,
        duracion: 90
      },
      { 
        nombre: 'Romeo y Julieta', 
        descripcion: 'Obra profesional con boletería', 
        es_profesional: true,
        duracion: 120
      }
    ];

    const obraIds = [];
    for (const obra of obras) {
      const result = await client.query(`
        INSERT INTO obras (nombre, descripcion, grupo_id, director_cedula, estado, es_profesional, duracion_minutos, created_at)
        VALUES ($1, $2, $3, '22222222', 'EN_PRODUCCION', $4, $5, NOW())
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [obra.nombre, obra.descripcion, grupoId, obra.es_profesional, obra.duracion]);
      
      if (result.rows.length > 0) {
        obraIds.push(result.rows[0].id);
        console.log(`   ✅ ${obra.nombre} (${obra.es_profesional ? 'Profesional' : 'Muestra'})`);
      }
    }

    // 4. Crear funciones
    console.log('\n📅 Creando funciones...');
    
    // Función de hoy
    const hoy = new Date();
    hoy.setHours(20, 0, 0, 0);
    
    const funcionHoy = await client.query(`
      INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado, created_at)
      VALUES ($1, $2, 'Teatro La Candela - Sala Principal', 50, 300, 'PROGRAMADA', NOW())
      RETURNING id
    `, [obraIds[0], hoy]);
    
    const funcionHoyId = funcionHoy.rows[0].id;
    console.log(`   ✅ Función de hoy: ${hoy.toLocaleDateString()} - ID: ${funcionHoyId}`);

    // Función futura (en 7 días)
    const futura = new Date();
    futura.setDate(futura.getDate() + 7);
    futura.setHours(21, 0, 0, 0);
    
    const funcionFutura = await client.query(`
      INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado, created_at)
      VALUES ($1, $2, 'Teatro Victoria - Sala Grande', 80, 500, 'PROGRAMADA', NOW())
      RETURNING id
    `, [obraIds[1] || obraIds[0], futura]);
    
    const funcionFuturaId = funcionFutura.rows[0].id;
    console.log(`   ✅ Función futura: ${futura.toLocaleDateString()} - ID: ${funcionFuturaId}`);

    // 5. Crear entradas para ambas funciones
    console.log('\n🎫 Creando entradas...');
    
    const funciones = [
      { id: funcionHoyId, capacidad: 50, precio: 300, tipo: 'hoy' },
      { id: funcionFuturaId, capacidad: 80, precio: 500, tipo: 'futura' }
    ];

    for (const func of funciones) {
      // Crear entradas en entradas_v2
      for (let i = 1; i <= func.capacidad; i++) {
        const code = `E-${func.id}-${String(i).padStart(4, '0')}`;
        const qrToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        await client.query(`
          INSERT INTO entradas_v2 (code, funcion_id, estado, precio, qr_token, creador_cedula, created_at)
          VALUES ($1, $2, 'sin_asignar', $3, $4, '22222222', NOW())
          ON CONFLICT (code) DO NOTHING
        `, [code, func.id, func.precio, qrToken]);
      }
      console.log(`   ✅ ${func.capacidad} entradas para función ${func.tipo}`);

      // Asignar algunas entradas a vendedores
      const cantidadAsignar = Math.floor(func.capacidad / 3);
      await client.query(`
        UPDATE entradas_v2
        SET estado = 'asignada',
            actor_cedula = '33333333',
            updated_at = NOW()
        WHERE funcion_id = $1 
          AND estado = 'sin_asignar'
        ORDER BY code
        LIMIT $2
      `, [func.id, cantidadAsignar]);
      
      console.log(`   ↳ ${cantidadAsignar} asignadas a Actor Vendedor 1`);

      // Reservar algunas
      const cantidadReservar = Math.floor(cantidadAsignar / 2);
      await client.query(`
        UPDATE entradas_v2
        SET estado = 'reservada',
            reservante_nombre = 'Cliente Demo ' || id,
            reservante_telefono = '+59899' || LPAD(id::text, 6, '0'),
            reservada_at = NOW(),
            updated_at = NOW()
        WHERE funcion_id = $1 
          AND estado = 'asignada'
          AND actor_cedula = '33333333'
        ORDER BY code
        LIMIT $2
      `, [func.id, cantidadReservar]);
      
      console.log(`   ↳ ${cantidadReservar} reservadas con cliente`);
    }

    // 6. Estadísticas finales
    console.log('\n📊 Resumen de datos creados:');
    
    const statsUsuarios = await client.query('SELECT role, COUNT(*) as total FROM users GROUP BY role ORDER BY role');
    console.log('\n👥 Usuarios:');
    statsUsuarios.rows.forEach(r => console.log(`   ${r.role}: ${r.total}`));

    const statsFunciones = await client.query('SELECT COUNT(*) as total FROM funciones');
    console.log(`\n📅 Funciones: ${statsFunciones.rows[0].total}`);

    const statsEntradas = await client.query('SELECT estado, COUNT(*) as total FROM entradas_v2 GROUP BY estado ORDER BY estado');
    console.log('\n🎫 Entradas:');
    statsEntradas.rows.forEach(r => console.log(`   ${r.estado}: ${r.total}`));

    await client.query('COMMIT');
    
    console.log('\n✅ Datos completos creados exitosamente\n');
    console.log('🔐 Credenciales de acceso:');
    console.log('   Super Usuario: 11111111 / 1234');
    console.log('   Director:      22222222 / 1234');
    console.log('   Actor 1:       33333333 / 1234');
    console.log('   Actor 2:       44444444 / 1234');
    console.log('   Vendedor:      55555555 / 1234\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando datos:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
crearDatosCompletos();
