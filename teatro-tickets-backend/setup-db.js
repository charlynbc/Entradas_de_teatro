#!/usr/bin/env node

import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function initDatabase() {
  try {
    console.log('📁 Leyendo schema.sql...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    console.log('🔧 Aplicando schema a la base de datos...\n');
    
    // Ejecutar todo el schema de una vez
    await pool.query(schema);
    
    console.log('✅ Schema aplicado exitosamente');
    console.log('✅ Tablas creadas: users, shows, tickets, actos, obras, ensayos, grupos, etc.');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initDatabase();
