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
    
    // Generar ID único
    const id = `supremo_${Date.now()}`;

    // Insertar usuario supremo
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, cedula, nombre, hashedPassword, rol]
    );

    console.log('✅ Usuario supremo creado exitosamente!');
    console.log('   Cédula: ' + cedula);
    console.log('   Rol: ' + rol);

    // Crear usuarios base para pruebas (director y vendedor)
    console.log('🔍 Verificando usuarios base (director y vendedor)...');
    const baseUsers = [
      { cedula: '48376668', nombre: 'Admin Sistema', rol: 'admin', password: 'admin123' },
      { cedula: '48376667', nombre: 'Vendedor Base', rol: 'vendedor', password: 'admin123' }
    ];
    for (const u of baseUsers) {
      const exists = await query('SELECT 1 FROM users WHERE cedula = $1', [u.cedula]);
      if (exists.rows.length === 0) {
        const id = `${u.rol}_${Date.now()}_${u.cedula}`;
        const hashed = await bcrypt.hash(u.password, 10);
        await query(
          `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [id, u.cedula, u.nombre, hashed, u.rol]
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
