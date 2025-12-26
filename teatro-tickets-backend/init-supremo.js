// Script para inicializar usuario supremo automáticamente
// Se ejecuta al iniciar el servidor

import { query } from './db/postgres.js';
import bcrypt from 'bcrypt';

export async function initSupremo() {
  try {
    console.log('🔍 Verificando usuario supremo...');
    
    const cedula = '48376669';
    const nombre = 'Super Baco';
    const password = 'Teamomama91';
    const rol = 'supremo';

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT * FROM users WHERE cedula = $1',
      [cedula]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ Usuario supremo ya existe (cédula: ' + cedula + ')');
      return;
    }

    console.log('📝 Creando usuario supremo...');

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario supremo (usando estructura correcta de schema.sql)
    await query(
      `INSERT INTO users (cedula, name, role, password_hash, phone, created_at, active) 
       VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)`,
      [cedula, nombre, 'SUPER', hashedPassword, cedula]
    );

    console.log('✅ Usuario supremo creado exitosamente!');
    console.log('   Cédula: ' + cedula);
    console.log('   Rol: ' + rol);

    // Crear usuarios base para pruebas (director y vendedor)
    console.log('🔍 Verificando usuarios base (director y vendedor)...');
    const baseUsers = [
      { cedula: '48376668', nombre: 'Admin Sistema', rol: 'ADMIN', password: 'admin123' },
      { cedula: '48376667', nombre: 'Vendedor Base', rol: 'VENDEDOR', password: 'admin123' }
    ];
    for (const u of baseUsers) {
      const exists = await query('SELECT 1 FROM users WHERE cedula = $1', [u.cedula]);
      if (exists.rows.length === 0) {
        const hashed = await bcrypt.hash(u.password, 10);
        await query(
          `INSERT INTO users (cedula, name, role, password_hash, phone, created_at, active)
           VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)`,
          [u.cedula, u.nombre, u.rol, hashed, u.cedula]
        );
        console.log(`✅ Usuario ${u.rol} creado: ${u.cedula}`);
      } else {
        console.log(`ℹ️ Usuario ${u.rol} ya existe: ${u.cedula}`);
      }
    }
  } catch (error) {
    console.error('❌ Error inicializando usuario supremo:', error.message);
    console.error('   Stack:', error.stack);
    throw error; // Re-lanzar para que el llamador lo maneje
  }
}
