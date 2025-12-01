// Script para crear el primer usuario supremo
// Ejecutar con: node create-admin.js

import { query } from './db/postgres.js';
import bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    const cedula = '48376669';
    const nombre = 'Super Baco';
    const password = 'Teamomama91';
    const rol = 'supremo';

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar ID único
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Insertar usuario
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (cedula) DO UPDATE SET 
       password = EXCLUDED.password,
       updated_at = NOW()`,
      [id, cedula, nombre, hashedPassword, rol]
    );

    console.log('✅ Usuario supremo creado/actualizado exitosamente!');
    console.log('Credenciales:');
    console.log('  Cédula:', cedula);
    console.log('  Password:', password);
    console.log('  Rol:', rol);
    console.log('\n🚀 Puedes hacer login en: https://baco-teatro-1jxj.onrender.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    process.exit(1);
  }
}

createAdmin();
