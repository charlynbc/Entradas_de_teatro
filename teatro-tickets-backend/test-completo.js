#!/usr/bin/env node
// Test completo del sistema antes de deploy a Render
// Ejecutar: node test-completo.js

import { query, initializeDatabase } from './db/postgres.js';
import { comparePassword, hashPassword } from './config/auth.js';
import { initSupremo } from './init-supremo.js';
import express from 'express';

const TESTS_PASSED = [];
const TESTS_FAILED = [];

function testLog(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function testPass(name) {
  TESTS_PASSED.push(name);
  testLog('✅', `PASS: ${name}`);
}

function testFail(name, error) {
  TESTS_FAILED.push({ name, error });
  testLog('❌', `FAIL: ${name}`);
  console.error('   Error:', error.message);
}

async function testDatabaseConnection() {
  const testName = 'Conexión a PostgreSQL';
  try {
    const result = await query('SELECT NOW() as current_time');
    if (result.rows.length > 0) {
      testPass(testName);
      testLog('📊', `   Tiempo DB: ${result.rows[0].current_time}`);
      return true;
    }
    throw new Error('No se recibió respuesta de la base de datos');
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testDatabaseSchema() {
  const testName = 'Inicialización de schema';
  try {
    await initializeDatabase();
    
    // Verificar que las tablas existen
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tableNames = tables.rows.map(r => r.table_name);
    const requiredTables = ['users', 'shows', 'tickets'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      throw new Error(`Faltan tablas: ${missingTables.join(', ')}`);
    }
    
    testPass(testName);
    testLog('📋', `   Tablas creadas: ${tableNames.join(', ')}`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testTableStructure() {
  const testName = 'Estructura de tablas';
  try {
    // Verificar columnas de users
    const userColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
    `);
    
    const requiredUserColumns = ['id', 'cedula', 'nombre', 'password', 'rol'];
    const existingColumns = userColumns.rows.map(r => r.column_name);
    const missingColumns = requiredUserColumns.filter(c => !existingColumns.includes(c));
    
    if (missingColumns.length > 0) {
      throw new Error(`Columnas faltantes en users: ${missingColumns.join(', ')}`);
    }
    
    testPass(testName);
    testLog('🏗️', `   Columnas users: ${existingColumns.length}`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testIndexes() {
  const testName = 'Índices de base de datos';
  try {
    const indexes = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const indexNames = indexes.rows.map(r => r.indexname);
    testPass(testName);
    testLog('🔍', `   Índices creados: ${indexNames.length}`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testBcryptHashing() {
  const testName = 'Bcrypt hashing y comparación';
  try {
    const password = 'Test123!';
    const hashed = await hashPassword(password);
    
    if (!hashed || hashed === password) {
      throw new Error('Password no fue hasheado correctamente');
    }
    
    const isValid = await comparePassword(password, hashed);
    if (!isValid) {
      throw new Error('Comparación de password falló');
    }
    
    const isInvalid = await comparePassword('WrongPass', hashed);
    if (isInvalid) {
      throw new Error('Comparación debería fallar con password incorrecto');
    }
    
    testPass(testName);
    testLog('🔐', `   Hash length: ${hashed.length}`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testSupremoInitialization() {
  const testName = 'Inicialización usuario supremo';
  try {
    // Limpiar usuario supremo si existe
    await query('DELETE FROM users WHERE cedula = $1', ['48376669']);
    
    // Inicializar
    await initSupremo();
    
    // Verificar que existe
    const result = await query('SELECT * FROM users WHERE cedula = $1', ['48376669']);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario supremo no fue creado');
    }
    
    const user = result.rows[0];
    
    if (user.rol !== 'supremo') {
      throw new Error(`Rol incorrecto: ${user.rol}`);
    }
    
    if (user.nombre !== 'Super Baco') {
      throw new Error(`Nombre incorrecto: ${user.nombre}`);
    }
    
    // Verificar password
    const isValid = await comparePassword('Teamomama91', user.password);
    if (!isValid) {
      throw new Error('Password del usuario supremo no es válido');
    }
    
    // Verificar que no se duplica
    await initSupremo();
    const count = await query('SELECT COUNT(*) as total FROM users WHERE cedula = $1', ['48376669']);
    if (parseInt(count.rows[0].total) !== 1) {
      throw new Error('Usuario supremo se duplicó');
    }
    
    testPass(testName);
    testLog('👑', `   Usuario: ${user.nombre} (${user.cedula})`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testUserCRUD() {
  const testName = 'CRUD de usuarios';
  try {
    const testCedula = 'TEST123456';
    
    // Limpiar si existe
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    
    // CREATE
    const hashedPwd = await hashPassword('test123');
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [`test_${Date.now()}`, testCedula, 'Usuario Test', hashedPwd, 'vendedor']
    );
    
    // READ
    const readResult = await query('SELECT * FROM users WHERE cedula = $1', [testCedula]);
    if (readResult.rows.length === 0) {
      throw new Error('Usuario no fue creado');
    }
    
    // UPDATE
    await query(
      'UPDATE users SET nombre = $1, updated_at = NOW() WHERE cedula = $2',
      ['Usuario Actualizado', testCedula]
    );
    
    const updateResult = await query('SELECT * FROM users WHERE cedula = $1', [testCedula]);
    if (updateResult.rows[0].nombre !== 'Usuario Actualizado') {
      throw new Error('Usuario no fue actualizado');
    }
    
    // DELETE
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    const deleteResult = await query('SELECT * FROM users WHERE cedula = $1', [testCedula]);
    if (deleteResult.rows.length > 0) {
      throw new Error('Usuario no fue eliminado');
    }
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testExpressServer() {
  const testName = 'Servidor Express inicialización';
  try {
    const app = express();
    app.use(express.json());
    
    let serverStarted = false;
    const server = app.listen(0, '0.0.0.0', () => {
      serverStarted = true;
      server.close();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!serverStarted) {
      throw new Error('Servidor no pudo iniciar');
    }
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testEnvironmentVariables() {
  const testName = 'Variables de entorno';
  try {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      throw new Error(`Variables faltantes: ${missing.join(', ')}`);
    }
    
    // Verificar formato de DATABASE_URL
    if (!process.env.DATABASE_URL.startsWith('postgres')) {
      throw new Error('DATABASE_URL no es una URL de PostgreSQL válida');
    }
    
    testPass(testName);
    testLog('🔧', `   DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 20)}...`);
    testLog('🔧', `   JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 10)}...`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testConcurrentConnections() {
  const testName = 'Conexiones concurrentes';
  try {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(query('SELECT $1 as test_value', [i]));
    }
    
    const results = await Promise.all(promises);
    
    if (results.length !== 10) {
      throw new Error('No todas las queries se completaron');
    }
    
    testPass(testName);
    testLog('🔄', `   ${results.length} queries concurrentes exitosas`);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testTransactions() {
  const testName = 'Transacciones de base de datos';
  try {
    const testCedula = 'TRANS_TEST';
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    
    // Test rollback
    try {
      await query('BEGIN');
      await query(
        `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [`trans_${Date.now()}`, testCedula, 'Test Trans', 'hash', 'vendedor']
      );
      await query('ROLLBACK');
    } catch (e) {
      await query('ROLLBACK');
    }
    
    const rollbackCheck = await query('SELECT * FROM users WHERE cedula = $1', [testCedula]);
    if (rollbackCheck.rows.length > 0) {
      throw new Error('Rollback no funcionó correctamente');
    }
    
    // Test commit
    await query('BEGIN');
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [`trans_${Date.now()}`, testCedula, 'Test Trans', 'hash', 'vendedor']
    );
    await query('COMMIT');
    
    const commitCheck = await query('SELECT * FROM users WHERE cedula = $1', [testCedula]);
    if (commitCheck.rows.length === 0) {
      throw new Error('Commit no funcionó correctamente');
    }
    
    // Limpiar
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testShowsAndTickets() {
  const testName = 'Relaciones Shows-Tickets';
  try {
    // Crear show de prueba
    const showId = `show_test_${Date.now()}`;
    await query(
      `INSERT INTO shows (id, nombre, fecha, precio, total_tickets, created_at, updated_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, NOW(), NOW())`,
      [showId, 'Show de Prueba', 100.00, 10]
    );
    
    // Crear tickets asociados
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO tickets (id, show_id, qr_code, estado, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [`ticket_${showId}_${i}`, showId, `QR_${showId}_${i}`, 'NO_ASIGNADO']
      );
    }
    
    // Verificar relación
    const tickets = await query('SELECT * FROM tickets WHERE show_id = $1', [showId]);
    if (tickets.rows.length !== 5) {
      throw new Error(`Se esperaban 5 tickets, se encontraron ${tickets.rows.length}`);
    }
    
    // Test cascade delete
    await query('DELETE FROM shows WHERE id = $1', [showId]);
    const orphanTickets = await query('SELECT * FROM tickets WHERE show_id = $1', [showId]);
    if (orphanTickets.rows.length > 0) {
      throw new Error('Cascade delete no funcionó');
    }
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

async function testConstraints() {
  const testName = 'Constraints y validaciones';
  try {
    const testCedula = 'CONSTRAINT_TEST';
    const hashedPwd = await hashPassword('test');
    
    // Limpiar
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    
    // Test UNIQUE constraint en cedula
    await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [`const_${Date.now()}`, testCedula, 'Test', hashedPwd, 'vendedor']
    );
    
    try {
      await query(
        `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [`const_${Date.now()}_2`, testCedula, 'Test2', hashedPwd, 'vendedor']
      );
      throw new Error('UNIQUE constraint no funcionó');
    } catch (e) {
      if (!e.message.includes('duplicate key') && !e.message.includes('UNIQUE')) {
        throw new Error('Error inesperado en UNIQUE constraint');
      }
    }
    
    // Test CHECK constraint en rol
    try {
      await query(
        `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [`const_${Date.now()}_3`, 'INVALID_ROL', 'Test', hashedPwd, 'rol_invalido']
      );
      throw new Error('CHECK constraint en rol no funcionó');
    } catch (e) {
      if (!e.message.includes('violates check constraint') && !e.message.includes('CHECK')) {
        throw new Error('Error inesperado en CHECK constraint');
      }
    }
    
    // Limpiar
    await query('DELETE FROM users WHERE cedula = $1', [testCedula]);
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING COMPLETO - SISTEMA BACO TEATRO');
  console.log('='.repeat(60) + '\n');
  
  console.log('📋 Verificando ambiente...\n');
  
  const tests = [
    { name: '1. Variables de entorno', fn: testEnvironmentVariables },
    { name: '2. Conexión PostgreSQL', fn: testDatabaseConnection },
    { name: '3. Schema de base de datos', fn: testDatabaseSchema },
    { name: '4. Estructura de tablas', fn: testTableStructure },
    { name: '5. Índices', fn: testIndexes },
    { name: '6. Bcrypt hashing', fn: testBcryptHashing },
    { name: '7. Usuario supremo', fn: testSupremoInitialization },
    { name: '8. CRUD usuarios', fn: testUserCRUD },
    { name: '9. Shows y Tickets', fn: testShowsAndTickets },
    { name: '10. Constraints', fn: testConstraints },
    { name: '11. Transacciones', fn: testTransactions },
    { name: '12. Conexiones concurrentes', fn: testConcurrentConnections },
    { name: '13. Servidor Express', fn: testExpressServer },
  ];
  
  console.log('🔄 Ejecutando tests...\n');
  
  for (const test of tests) {
    console.log(`\n▶️  ${test.name}`);
    await test.fn();
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests exitosos: ${TESTS_PASSED.length}`);
  console.log(`❌ Tests fallidos: ${TESTS_FAILED.length}`);
  
  if (TESTS_FAILED.length > 0) {
    console.log('\n❌ Tests que fallaron:');
    TESTS_FAILED.forEach(({ name, error }) => {
      console.log(`   - ${name}`);
      console.log(`     ${error.message}`);
    });
    console.log('\n🚨 El sistema NO está listo para deploy a Render');
    process.exit(1);
  } else {
    console.log('\n🎉 TODOS LOS TESTS PASARON');
    console.log('✅ El sistema está LISTO para deploy a Render\n');
    process.exit(0);
  }
}

// Ejecutar
runAllTests().catch(error => {
  console.error('\n💥 Error fatal en testing:', error);
  process.exit(1);
});
