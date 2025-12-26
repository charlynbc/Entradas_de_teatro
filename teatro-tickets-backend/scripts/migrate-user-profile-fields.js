import { query } from '../db/postgres.js';

async function migrateUserProfileFields() {
  console.log('🚀 Migración: Agregando campos de perfil a la tabla users');
  
  try {
    // Agregar columnas si no existen
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
      ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
      ADD COLUMN IF NOT EXISTS foto_url TEXT;
    `);
    
    console.log('✅ Columnas agregadas exitosamente');
    console.log('   - email: VARCHAR(100)');
    console.log('   - telefono: VARCHAR(20)');
    console.log('   - fecha_nacimiento: DATE');
    console.log('   - foto_url: TEXT');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
    process.exit(1);
  }
}

migrateUserProfileFields();
