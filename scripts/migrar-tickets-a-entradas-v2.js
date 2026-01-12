#!/usr/bin/env node
/**
 * Script de migración: tickets → entradas_v2
 * Migra todos los tickets legacy a la nueva tabla entradas_v2
 * Mantiene la compatibilidad y sincronización entre ambas tablas
 */

import { Pool } from 'pg';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';
const pool = new Pool({ connectionString: DATABASE_URL });

async function migrarTicketsAEntradasV2() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración de tickets a entradas_v2...\n');
    
    await client.query('BEGIN');

    // 1. Verificar que ambas tablas existan
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tickets', 'entradas_v2')
    `);
    
    const existingTables = checkTables.rows.map(r => r.table_name);
    console.log('✅ Tablas encontradas:', existingTables.join(', '));
    
    if (!existingTables.includes('tickets')) {
      console.log('⚠️  Tabla tickets no existe, nada que migrar');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Crear tabla entradas_v2 si no existe
    if (!existingTables.includes('entradas_v2')) {
      console.log('📦 Creando tabla entradas_v2...');
      await client.query(`
        CREATE TABLE entradas_v2 (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          funcion_id INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
          estado VARCHAR(20) NOT NULL DEFAULT 'sin_asignar',
          actor_cedula VARCHAR(20) REFERENCES users(cedula) ON DELETE SET NULL,
          creador_cedula VARCHAR(20) REFERENCES users(cedula) ON DELETE SET NULL,
          reservante_nombre VARCHAR(150),
          reservante_telefono VARCHAR(150),
          precio NUMERIC(10,2),
          qr_token TEXT,
          reservada_at TIMESTAMP,
          pagada_at TIMESTAMP,
          utilizada_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX idx_entradas_v2_funcion ON entradas_v2(funcion_id);
        CREATE INDEX idx_entradas_v2_actor ON entradas_v2(actor_cedula);
        CREATE INDEX idx_entradas_v2_estado ON entradas_v2(estado);
      `);
      console.log('✅ Tabla entradas_v2 creada\n');
    }

    // 3. Contar tickets a migrar
    const countResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM tickets t
      WHERE NOT EXISTS (
        SELECT 1 FROM entradas_v2 e2 WHERE e2.code = t.code
      )
    `);
    
    const totalTickets = parseInt(countResult.rows[0].total);
    console.log(`📊 Tickets a migrar: ${totalTickets}\n`);
    
    if (totalTickets === 0) {
      console.log('✅ No hay tickets nuevos para migrar');
      await client.query('COMMIT');
      return;
    }

    // 4. Migrar tickets
    console.log('🔄 Migrando tickets...');
    
    const migracion = await client.query(`
      INSERT INTO entradas_v2 (
        code, 
        funcion_id, 
        estado, 
        actor_cedula, 
        reservante_nombre, 
        reservante_telefono, 
        precio,
        qr_token,
        reservada_at,
        pagada_at,
        utilizada_at,
        created_at,
        updated_at
      )
      SELECT 
        t.code,
        t.funcion_id,
        CASE t.estado
          WHEN 'DISPONIBLE' THEN 'sin_asignar'
          WHEN 'STOCK_ACTOR' THEN 'asignada'
          WHEN 'STOCK_VENDEDOR' THEN 'asignada'
          WHEN 'RESERVADO' THEN 'reservada'
          WHEN 'REPORTADA_VENDIDA' THEN 'pronta'
          WHEN 'PAGADO' THEN 'pagada'
          WHEN 'USADO' THEN 'utilizada'
          WHEN 'ANULADO' THEN 'sin_asignar'
          ELSE 'sin_asignar'
        END as estado_nuevo,
        (SELECT cedula FROM users WHERE phone = t.vendedor_phone LIMIT 1) as actor_cedula,
        t.comprador_nombre,
        t.comprador_contacto,
        t.precio,
        t.qr_code,
        t.reservado_at,
        t.pagado_at,
        t.usado_at,
        t.created_at,
        COALESCE(t.pagado_at, t.reportada_at, t.reservado_at, t.created_at) as updated_at
      FROM tickets t
      WHERE NOT EXISTS (
        SELECT 1 FROM entradas_v2 e2 WHERE e2.code = t.code
      )
      RETURNING code, estado
    `);

    console.log(`✅ Migrados ${migracion.rows.length} tickets\n`);

    // 5. Crear tabla de logs si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS entradas_v2_logs (
        id SERIAL PRIMARY KEY,
        entrada_id INT REFERENCES entradas_v2(id) ON DELETE CASCADE,
        estado_anterior VARCHAR(20),
        estado_nuevo VARCHAR(20),
        accion VARCHAR(50),
        detalle TEXT,
        ejecutado_por VARCHAR(20),
        actor_cedula VARCHAR(20),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_entradas_v2_logs_entrada ON entradas_v2_logs(entrada_id);
    `);

    // 6. Estadísticas finales
    const stats = await client.query(`
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM entradas_v2
      GROUP BY estado
      ORDER BY estado
    `);

    console.log('📊 Estadísticas de entradas_v2:');
    stats.rows.forEach(row => {
      console.log(`   ${row.estado}: ${row.cantidad}`);
    });

    await client.query('COMMIT');
    
    console.log('\n✅ Migración completada exitosamente');
    console.log('\n💡 Recomendación: Usa entradas_v2 para nuevas funciones');
    console.log('   La tabla tickets se mantiene para compatibilidad legacy\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
migrarTicketsAEntradasV2();
