#!/usr/bin/env node
/**
 * Crear tabla entradas_v2 si no existe
 */
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function crearTablaEntradasV2() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando tabla entradas_v2...');
    
    // Verificar si existe
    const check = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'entradas_v2'
      )
    `);
    
    if (check.rows[0].exists) {
      console.log('✅ La tabla entradas_v2 ya existe');
      return;
    }
    
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
      CREATE INDEX idx_entradas_v2_code ON entradas_v2(code);
    `);
    
    console.log('✅ Tabla entradas_v2 creada exitosamente');
    console.log('✅ Índices creados');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

crearTablaEntradasV2();
