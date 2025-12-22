import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function aplicarMigraciones() {
  try {
    console.log('🔄 Aplicando migraciones...');

    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'migrations', '001_asistencias_ensayos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Aplicando migración: 001_asistencias_ensayos.sql');

    // Ejecutar migración
    await query(migrationSQL);

    console.log('✅ Migración aplicada exitosamente');

    // Verificar que las tablas y vistas fueron creadas
    const verificacion = await query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name = 'asistencias_ensayos' 
           OR table_name = 'v_resumen_asistencias_ensayo'
           OR table_name = 'v_historial_asistencias_miembro')
      ORDER BY table_name
    `);

    console.log('\n📊 Objetos creados:');
    verificacion.rows.forEach(row => {
      const tipo = row.table_type === 'BASE TABLE' ? '📋 Tabla' : '👁️  Vista';
      console.log(`  ${tipo}: ${row.table_name}`);
    });

    console.log('\n✅ Sistema de asistencias listo para usar');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error);
    process.exit(1);
  }
}

aplicarMigraciones();
