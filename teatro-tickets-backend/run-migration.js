import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(migrationFile) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`🚀 Ejecutando migración: ${migrationFile}...`);
    
    // Leer el archivo SQL
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Ejecutar la migración
    await pool.query(sql);
    
    console.log(`✅ Migración ${migrationFile} ejecutada correctamente`);
    
  } catch (error) {
    console.error(`❌ Error ejecutando migración ${migrationFile}:`, error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar la migración especificada o la última
const migrationFile = process.argv[2] || '002_obras_y_funciones.sql';
runMigration(migrationFile);
