/**
 * Test Suite: Super Usuario
 * Verifica todas las funcionalidades del módulo Super Usuario
 * Fecha: 09-01-2026
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
let authToken = '';
let superUser = null;

// 🎨 Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function success(msg) { console.log(`${colors.green}✅ ${msg}${colors.reset}`); }
function error(msg) { console.log(`${colors.red}❌ ${msg}${colors.reset}`); }
function info(msg) { console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`); }
function section(title) {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bright + `  ${title}` + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

// 🔐 Autenticación
async function autenticar() {
  section('🔐 AUTENTICACIÓN SUPER USUARIO');
    
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: process.env.SUPER_CEDULA || '99999999',
        password: process.env.SUPER_PASSWORD || 'supremo123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    authToken = data.token;
    superUser = data.user;

    if (superUser.role !== 'SUPER') {
      throw new Error(`El usuario no es SUPER (role: ${superUser.role})`);
    }

    success(`Autenticado como: ${superUser.nombre || superUser.name}`);
    return true;
  } catch (err) {
    error(`Error de autenticación: ${err.message}`);
    return false;
  }
}

// 👥 Test: Gestión de Usuarios
async function testUsuarios() {
  section('👥 TEST: GESTIÓN DE USUARIOS');
    
  try {
    info('Listando usuarios...');
    const usersRes = await fetch(`${API_BASE}/api/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
        
    if (!usersRes.ok) throw new Error(`HTTP ${usersRes.status}`);
        
    const users = await usersRes.json();
    success(`Total usuarios: ${users.length}`);
        
    const porRol = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
        
    Object.entries(porRol).forEach(([role, count]) => {
      info(`  • ${role}: ${count}`);
    });

    if (users.length > 0) {
      const user = users[0];
      const detailRes = await fetch(`${API_BASE}/api/users/${user.cedula}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
            
      if (!detailRes.ok) throw new Error('No puede ver detalles');
      success('Puede ver detalles de usuarios ✓');
    }

    return true;
  } catch (err) {
    error(`Error en usuarios: ${err.message}`);
    return false;
  }
}

// 🎭 Test: Gestión de Grupos
async function testGrupos() {
  section('🎭 TEST: GESTIÓN DE GRUPOS');
    
  try {
    info('Listando grupos...');
    const gruposRes = await fetch(`${API_BASE}/api/grupos`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
        
    if (!gruposRes.ok) throw new Error(`HTTP ${gruposRes.status}`);
        
    const grupos = await gruposRes.json();
    success(`Total grupos: ${grupos.length}`);
        
    const activos = grupos.filter(g => !g.suspendido);
    info(`  • Activos: ${activos.length}`);

    return true;
  } catch (err) {
    error(`Error en grupos: ${err.message}`);
    return false;
  }
}

// 📅 Test: Gestión de Funciones
async function testFunciones() {
  section('📅 TEST: GESTIÓN DE FUNCIONES');
    
  try {
    info('Listando funciones públicas...');
    const publicRes = await fetch(`${API_BASE}/api/public/funciones`);
        
    if (!publicRes.ok) throw new Error(`HTTP ${publicRes.status}`);
        
    const funciones = await publicRes.json();
    success(`Funciones públicas: ${funciones.length}`);

    return true;
  } catch (err) {
    error(`Error en funciones: ${err.message}`);
    return false;
  }
}

// 🚀 Ejecutar tests
async function ejecutarTests() {
  console.log(colors.magenta + colors.bright);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         👑 TEST SUITE: SUPER USUARIO                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const authOk = await autenticar();
  if (!authOk) {
    error('Tests abortados: No se pudo autenticar');
    process.exit(1);
  }

  const results = {
    usuarios: await testUsuarios(),
    grupos: await testGrupos(),
    funciones: await testFunciones()
  };

  section('📊 RESUMEN');
    
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r === true).length;
    
  console.log(`Total: ${total} | Pasados: ${passed} | Fallidos: ${total - passed}`);

  if (passed === total) {
    console.log('\n' + colors.green + colors.bright + '🎉 ¡TODOS LOS TESTS PASARON!' + colors.reset + '\n');
    process.exit(0);
  } else {
    console.log('\n' + colors.red + '⚠️  ALGUNOS TESTS FALLARON' + colors.reset + '\n');
    process.exit(1);
  }
}

ejecutarTests().catch(err => {
  error(`Error fatal: ${err.message}`);
  process.exit(1);
});
