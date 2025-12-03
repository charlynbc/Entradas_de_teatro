import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Ejecutando migración: shows_cast...');
    
    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, 'migrations', '001_create_shows_cast.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Ejecutar la migración
    await pool.query(sql);
    
    console.log('✅ Migración ejecutada correctamente');
    console.log('✅ Tabla shows_cast creada');
    
    // Verificar que la tabla existe
    const checkResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'shows_cast'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Tabla shows_cast verificada');
    } else {
      console.error('❌ La tabla shows_cast no fue creada');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
