import fs from 'fs';
import pool from './db/postgres.js';

async function initDB() {
  try {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    const statements = schema.split(/;(?=\s*[A-Z])/);
    
    let count = 0;
    let skipped = 0;
    
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.length < 5) {
        skipped++;
        continue;
      }
      
      try {
        await pool.query(trimmed);
        count++;
      } catch (e) {
        if (!e.message.includes('already exists') && !e.message.includes('DUPLICATE')) {
          console.log('Warning:', e.message.substring(0, 80));
        }
        skipped++;
      }
    }
    
    console.log(`✅ Schema ejecutado: ${count} statements, ${skipped} omitidos`);
    
    // Verificar tablas
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    
    if (result.rows.length > 0) {
      console.log('📊 Tablas creadas:');
      result.rows.forEach(r => console.log(`   - ${r.table_name}`));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  process.exit(0);
}

initDB();
