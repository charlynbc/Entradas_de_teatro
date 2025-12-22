import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function initDB() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync('./teatro-tickets-backend/schema.sql', 'utf8');
    
    // Dividir por punto y coma y ejecutar cada statement
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await client.query(statement);
        }
      } catch (err) {
        // Ignorar errores de "ya existe"
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.log('⚠️  ', err.message);
        }
      }
    }
    
    console.log('✅ Schema aplicado correctamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
