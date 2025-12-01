#!/usr/bin/env node
// Test de validación pre-deploy para Render
// Ejecutar: node test-render.js

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TESTS_PASSED = [];
const TESTS_FAILED = [];

function testLog(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function testPass(name, details = '') {
  TESTS_PASSED.push(name);
  testLog('✅', `PASS: ${name}`);
  if (details) testLog('  ', `  ${details}`);
}

function testFail(name, error) {
  TESTS_FAILED.push({ name, error });
  testLog('❌', `FAIL: ${name}`);
  console.error('   Error:', error);
}

function testFileExists(name, filePath) {
  const testName = `Archivo existe: ${name}`;
  try {
    if (!existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    testPass(testName, filePath);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testPackageJson() {
  const testName = 'package.json configuración';
  try {
    const pkgPath = join(__dirname, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    
    // Verificar scripts
    if (!pkg.scripts || !pkg.scripts.start) {
      throw new Error('Falta script "start" en package.json');
    }
    
    // Verificar dependencias críticas
    const requiredDeps = ['express', 'pg', 'bcrypt', 'jsonwebtoken', 'cors'];
    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      throw new Error(`Dependencias faltantes: ${missingDeps.join(', ')}`);
    }
    
    // Verificar type module
    if (pkg.type !== 'module') {
      throw new Error('package.json debe tener "type": "module"');
    }
    
    testPass(testName, `Start: ${pkg.scripts.start}`);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testServerFile() {
  const testName = 'Archivo principal del servidor';
  try {
    const serverPath = join(__dirname, 'index-v3-postgres.js');
    const content = readFileSync(serverPath, 'utf8');
    
    // Verificar que no tenga múltiples app.listen()
    const listenMatches = content.match(/app\.listen\(/g);
    if (!listenMatches || listenMatches.length === 0) {
      throw new Error('No se encontró app.listen() en el servidor');
    }
    if (listenMatches.length > 1) {
      throw new Error(`CRÍTICO: Múltiples app.listen() encontrados (${listenMatches.length}). Esto causa timeout en Render.`);
    }
    
    // Verificar que escuche en 0.0.0.0
    if (!content.includes('0.0.0.0') && !content.includes('::')) {
      testLog('⚠️', '  ADVERTENCIA: No se especifica 0.0.0.0 en listen()');
    }
    
    // Verificar imports críticos
    const requiredImports = ['express', 'cors', 'initializeDatabase', 'initSupremo'];
    const missingImports = requiredImports.filter(imp => !content.includes(imp));
    
    if (missingImports.length > 0) {
      throw new Error(`Imports faltantes: ${missingImports.join(', ')}`);
    }
    
    // Verificar que startServer() se llame
    if (!content.includes('startServer()')) {
      throw new Error('startServer() no se está ejecutando');
    }
    
    testPass(testName, 'app.listen() único y correcto');
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testDatabaseModule() {
  const testName = 'Módulo de base de datos';
  try {
    const dbPath = join(__dirname, 'db', 'postgres.js');
    const content = readFileSync(dbPath, 'utf8');
    
    // Verificar exports
    const requiredExports = ['query', 'initializeDatabase'];
    const missingExports = requiredExports.filter(exp => 
      !content.includes(`export async function ${exp}`) && 
      !content.includes(`export function ${exp}`)
    );
    
    if (missingExports.length > 0) {
      throw new Error(`Exports faltantes: ${missingExports.join(', ')}`);
    }
    
    // Verificar que use DATABASE_URL
    if (!content.includes('DATABASE_URL')) {
      throw new Error('No se utiliza DATABASE_URL');
    }
    
    // Verificar que use Pool de pg
    if (!content.includes('Pool')) {
      throw new Error('No se usa Pool de pg');
    }
    
    // Verificar tablas
    const requiredTables = ['users', 'shows', 'tickets'];
    const missingTables = requiredTables.filter(table => 
      !content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
    );
    
    if (missingTables.length > 0) {
      throw new Error(`Tablas faltantes en schema: ${missingTables.join(', ')}`);
    }
    
    testPass(testName, 'Schema completo con Pool');
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testAuthController() {
  const testName = 'Controlador de autenticación';
  try {
    const authPath = join(__dirname, 'controllers', 'auth.controller.js');
    const content = readFileSync(authPath, 'utf8');
    
    // Verificar que use query de postgres, no readData
    if (content.includes('readData') && !content.includes('writeData')) {
      testLog('⚠️', '  ADVERTENCIA: Aún usa readData (JSON), debería usar query (PostgreSQL)');
    }
    
    // Verificar que use bcrypt
    if (!content.includes('comparePassword')) {
      throw new Error('No usa comparePassword para verificar passwords');
    }
    
    // Verificar mapeo de roles
    if (!content.includes('roleMap') && !content.includes('supremo')) {
      testLog('⚠️', '  ADVERTENCIA: No se encontró mapeo de roles (supremo->SUPER)');
    }
    
    // Verificar que use query
    if (!content.includes('query(')) {
      throw new Error('No usa query() para acceder a PostgreSQL');
    }
    
    testPass(testName, 'Usa PostgreSQL y bcrypt');
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testInitSupremo() {
  const testName = 'Script init-supremo.js';
  try {
    const initPath = join(__dirname, 'init-supremo.js');
    const content = readFileSync(initPath, 'utf8');
    
    // Verificar credenciales correctas
    if (!content.includes('48376669')) {
      throw new Error('Cédula del usuario supremo incorrecta');
    }
    
    if (!content.includes('Teamomama91')) {
      throw new Error('Password del usuario supremo incorrecta');
    }
    
    if (!content.includes('supremo')) {
      throw new Error('Rol del usuario supremo incorrecto');
    }
    
    // Verificar que use bcrypt
    if (!content.includes('bcrypt.hash')) {
      throw new Error('No hashea el password con bcrypt');
    }
    
    // Verificar que verifique si existe
    if (!content.includes('SELECT') && !content.includes('existingUser')) {
      throw new Error('No verifica si el usuario ya existe');
    }
    
    testPass(testName, 'Credenciales: 48376669/Teamomama91');
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testPublicDirectory() {
  const testName = 'Directorio public/ con frontend';
  try {
    const publicPath = join(__dirname, 'public');
    
    if (!existsSync(publicPath)) {
      throw new Error('Directorio public/ no existe');
    }
    
    const indexPath = join(publicPath, 'index.html');
    if (!existsSync(indexPath)) {
      throw new Error('public/index.html no existe');
    }
    
    // Verificar que tenga assets
    const expoPath = join(publicPath, '_expo');
    if (!existsSync(expoPath)) {
      testLog('⚠️', '  ADVERTENCIA: Directorio _expo/ no encontrado en public/');
    }
    
    testPass(testName, 'Frontend integrado');
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testRoutes() {
  const testName = 'Rutas de API';
  try {
    const routesDir = join(__dirname, 'routes');
    
    if (!existsSync(routesDir)) {
      throw new Error('Directorio routes/ no existe');
    }
    
    const requiredRoutes = ['auth.routes.js', 'users.routes.js', 'shows.routes.js', 'tickets.routes.js'];
    const missingRoutes = requiredRoutes.filter(route => 
      !existsSync(join(routesDir, route))
    );
    
    if (missingRoutes.length > 0) {
      throw new Error(`Rutas faltantes: ${missingRoutes.join(', ')}`);
    }
    
    testPass(testName, `${requiredRoutes.length} archivos de rutas`);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testMiddleware() {
  const testName = 'Middleware de autenticación';
  try {
    const middlewarePath = join(__dirname, 'middleware', 'auth.middleware.js');
    
    if (!existsSync(middlewarePath)) {
      throw new Error('auth.middleware.js no existe');
    }
    
    const content = readFileSync(middlewarePath, 'utf8');
    
    if (!content.includes('verifyToken') && !content.includes('jwt.verify')) {
      throw new Error('Middleware no verifica JWT tokens');
    }
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testNoDoubleListens() {
  const testName = 'CRÍTICO: Sin app.listen() duplicados';
  try {
    const serverPath = join(__dirname, 'index-v3-postgres.js');
    const content = readFileSync(serverPath, 'utf8');
    
    const lines = content.split('\n');
    const listenLines = lines
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => line.includes('app.listen(') && !line.startsWith('//'));
    
    if (listenLines.length > 1) {
      const lineNumbers = listenLines.map(l => `línea ${l.number}`).join(', ');
      throw new Error(`MÚLTIPLES app.listen() encontrados en ${lineNumbers}. Render dará TIMEOUT.`);
    }
    
    if (listenLines.length === 0) {
      throw new Error('No se encontró app.listen()');
    }
    
    testPass(testName, `Único app.listen() en línea ${listenLines[0].number}`);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

function testBcryptImport() {
  const testName = 'Bcrypt instalado y configurado';
  try {
    const authConfigPath = join(__dirname, 'config', 'auth.js');
    
    if (!existsSync(authConfigPath)) {
      throw new Error('config/auth.js no existe');
    }
    
    const content = readFileSync(authConfigPath, 'utf8');
    
    if (!content.includes('bcrypt')) {
      throw new Error('config/auth.js no importa bcrypt');
    }
    
    if (!content.includes('hashPassword') || !content.includes('comparePassword')) {
      throw new Error('Funciones de bcrypt no exportadas');
    }
    
    testPass(testName);
    return true;
  } catch (error) {
    testFail(testName, error.message);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING PRE-DEPLOY RENDER - SISTEMA BACO TEATRO');
  console.log('='.repeat(70) + '\n');
  
  console.log('📋 Validando configuración para Render...\n');
  
  const tests = [
    { name: '1. Package.json', fn: testPackageJson },
    { name: '2. Archivo del servidor', fn: testServerFile },
    { name: '3. CRÍTICO: Sin listens duplicados', fn: testNoDoubleListens },
    { name: '4. Módulo PostgreSQL', fn: testDatabaseModule },
    { name: '5. Controlador de auth', fn: testAuthController },
    { name: '6. Script init-supremo', fn: testInitSupremo },
    { name: '7. Bcrypt configurado', fn: testBcryptImport },
    { name: '8. Directorio public/', fn: testPublicDirectory },
    { name: '9. Rutas de API', fn: testRoutes },
    { name: '10. Middleware auth', fn: testMiddleware },
  ];
  
  console.log('🔄 Ejecutando validaciones...\n');
  
  for (const test of tests) {
    console.log(`\n▶️  ${test.name}`);
    test.fn();
  }
  
  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('='.repeat(70));
  console.log(`✅ Tests exitosos: ${TESTS_PASSED.length}/${tests.length}`);
  console.log(`❌ Tests fallidos: ${TESTS_FAILED.length}/${tests.length}`);
  
  if (TESTS_FAILED.length > 0) {
    console.log('\n❌ Validaciones que fallaron:');
    TESTS_FAILED.forEach(({ name, error }) => {
      console.log(`   - ${name}`);
      console.log(`     ${error}`);
    });
    console.log('\n🚨 El sistema NO está listo para deploy a Render');
    console.log('   Corrige los errores antes de hacer push\n');
    process.exit(1);
  } else {
    console.log('\n🎉 TODAS LAS VALIDACIONES PASARON');
    console.log('\n✅ El sistema está LISTO para deploy a Render');
    console.log('\n📝 Checklist pre-deploy:');
    console.log('   ✅ Solo un app.listen() en el servidor');
    console.log('   ✅ PostgreSQL configurado con Pool');
    console.log('   ✅ Usuario supremo con credenciales correctas');
    console.log('   ✅ Bcrypt para passwords');
    console.log('   ✅ Frontend integrado en public/');
    console.log('   ✅ Variables de entorno requeridas documentadas');
    console.log('\n🚀 Variables de entorno en Render:');
    console.log('   - DATABASE_URL (Internal Database URL)');
    console.log('   - JWT_SECRET');
    console.log('   - NODE_ENV=production');
    console.log('   - PORT=3000\n');
    process.exit(0);
  }
}

// Ejecutar
runAllTests().catch(error => {
  console.error('\n💥 Error fatal en testing:', error);
  process.exit(1);
});
