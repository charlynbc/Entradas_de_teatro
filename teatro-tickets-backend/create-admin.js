// Script para crear el primer usuario supremo
// Ejecutar con: node create-admin.js

import { query } from './db/postgres.js';
import bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    const cedula = 'admin';
    const nombre = 'Administrador Principal';
    const password = 'Admin123!';
    const rol = 'supremo';

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar ID único
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Insertar usuario
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (cedula) DO NOTHING`,
      [id, cedula, nombre, hashedPassword, rol]
    );

    console.log('✅ Usuario supremo creado exitosamente!');
    console.log('Credenciales:');
    console.log('  Cédula:', cedula);
    console.log('  Password:', password);
    console.log('\nPuedes hacer login en: https://tu-frontend/');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    process.exit(1);
  }
}

createAdmin();
