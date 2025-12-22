import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function aplicarSchema() {
  try {
    console.log('🔄 Aplicando schema de base de datos...');

    // Leer schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Ejecutando schema.sql...');

    // Ejecutar schema
    await query(schema);

    console.log('✅ Schema aplicado exitosamente');

    // Verificar tablas creadas
    const verificacion = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tablas creadas:');
    verificacion.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n✅ Base de datos lista para usar');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aplicando schema:', error);
    process.exit(1);
  }
}

aplicarSchema();
