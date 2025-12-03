#!/usr/bin/env node

/**
 * Script para inicializar el super usuario en la base de datos de Render
 * Conecta directamente con la URL de PostgreSQL en Render
 */

import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// URL de la base de datos de Render
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a/teatro_tickets';

async function initSuperUsuario() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a la base de datos de Render...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Verificar si ya existe el super usuario
    const checkResult = await client.query(
      "SELECT * FROM users WHERE cedula = 'supremo@baco.com' OR rol = 'supremo'"
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Super usuario ya existe:');
      console.log('   Cédula:', checkResult.rows[0].cedula);
      console.log('   Nombre:', checkResult.rows[0].nombre);
      console.log('   Rol:', checkResult.rows[0].rol);
      console.log('\n   Password: super123');
      return;
    }

    // Crear super usuario
    const password = 'super123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `supremo_${uuidv4().substring(0, 8)}`;

    await client.query(
      `INSERT INTO users (id, cedula, nombre, password, rol, activo) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, 'supremo@baco.com', 'Super Baco', hashedPassword, 'supremo', true]
    );

    console.log('\n✅ Super usuario creado exitosamente:');
    console.log('   Cédula: supremo@baco.com');
    console.log('   Password: super123');
    console.log('   Rol: supremo');
    console.log('   ID:', userId);

    // Verificar estado de la base de datos
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
    const showsCount = await client.query('SELECT COUNT(*) as count FROM shows');
    const ticketsCount = await client.query('SELECT COUNT(*) as count FROM tickets');

    console.log('\n📊 Estado de la base de datos:');
    console.log('   Usuarios:', usersCount.rows[0].count);
    console.log('   Shows:', showsCount.rows[0].count);
    console.log('   Tickets:', ticketsCount.rows[0].count);
    console.log('\n🎭 Base de datos lista para usar!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Ejecutar
initSuperUsuario().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
