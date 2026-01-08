import fs from 'fs';
import path from 'path';
import pool from '../db/postgres.js';

async function run() {
  try {
    const fileArg = process.argv[2];
    if (!fileArg) {
      console.error('Uso: node scripts/apply-sql-file.js <ruta_sql>');
      process.exit(1);
    }
    const filePath = path.resolve(fileArg);
    const sql = fs.readFileSync(filePath, 'utf8');
    // Partir por ';' manteniendo bloques complejos simples (heurística)
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const client = await pool.connect();
    try {
      console.log('🔧 Aplicando SQL:', filePath);
      for (const stmt of statements) {
        try {
          if (!stmt) continue;
          await client.query(stmt);
        } catch (e) {
          // Mostrar el inicio del statement para depurar
          console.log('⚠️  Error en statement:', stmt.substring(0, 120));
          throw e;
        }
      }
      console.log('✅ Archivo SQL aplicado correctamente');
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('❌ Error aplicando SQL:', err.message);
    process.exit(1);
  }
}

run();
