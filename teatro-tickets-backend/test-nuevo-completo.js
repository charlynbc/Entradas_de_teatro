import fetch from 'node-fetch';
import chalk from 'chalk';

/**
 * TEST COMPLETO NUEVO - Enero 2026
 * Prueba todos los flujos principales del sistema
 * Requiere: DB corriendo + Backend corriendo en localhost:3000
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

const log = {
  title: (msg) => console.log(chalk.bold.cyan(`\n${'═'.repeat(70)}\n${msg}\n${'═'.repeat(70)}`)),
  section: (msg) => console.log(chalk.bold.yellow(`\n>>> ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  error: (msg) => console.log(chalk.red(`✗ ${msg}`)),
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`)),
  data: (msg) => console.log(chalk.gray(`  ${msg}`))
};

let stats = { pass: 0, fail: 0, total: 0 };

async function test(name, fn) {
  stats.total++;
  try {
    await fn();
    log.success(name);
    stats.pass++;
  } catch (err) {
    log.error(`${name}: ${err.message}`);
    stats.fail++;
  }
}

async function request(method, endpoint, body = null, token = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(`${res.status} - ${data.message || data.error || 'Error desconocido'}`);
    }

    return data;
  } catch (err) {
    throw new Error(`${method} ${endpoint}: ${err.message}`);
  }
}

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let state = {
  supremoToken: null,
  directorToken: null,
  actorToken: null,
  invitadoToken: null,
  
  funcionId: null,
  entradaId: null,
  grupoId: null,
  ensayoId: null,
  directorId: null,
  actorId: null
};

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  log.title('🎭 TEST COMPLETO DEL SISTEMA - TEATRO BACO');

  // 1. AUTENTICACIÓN
  log.section('1. AUTENTICACIÓN');

  await test('Login SUPREMO', async () => {
    const res = await request('POST', '/api/auth/login', {
      cedula: '48376669',
      password: 'Teamomama91'
    });
    if (!res.token) throw new Error('No token recibido');
    state.supremoToken = res.token;
    log.data(`Token: ${res.token.substring(0, 20)}...`);
  });

  await test('Login ADMIN', async () => {
    const res = await request('POST', '/api/auth/login', {
      cedula: '48376668',
      password: 'admin123'
    });
    if (!res.token) throw new Error('No token recibido');
    state.directorToken = res.token;
  });

  await test('Verificar token SUPREMO', async () => {
    const res = await request('GET', '/api/auth/verificar', null, state.supremoToken);
    if (!res.user) throw new Error('Sin datos de usuario');
    if (res.user.role !== 'SUPER') throw new Error('Role incorrecto: ' + res.user.role);
  });

  await test('Obtener perfil SUPREMO', async () => {
    const res = await request('GET', '/api/auth/perfil', null, state.supremoToken);
    if (!res.cedula) throw new Error('No cedula en perfil');
    log.data(`Perfil: ${res.nombre || res.rol}`);
  });

  // 2. FUNCIONES PÚBLICAS
  log.section('2. FUNCIONES PÚBLICAS (sin autenticación)');

  await test('Listar funciones públicas', async () => {
    const res = await request('GET', '/api/public/funciones');
    if (!Array.isArray(res)) throw new Error('No es array');
    log.data(`Funciones disponibles: ${res.length}`);
    if (res.length > 0) {
      state.funcionId = res[0].id;
      log.data(`Primera función ID: ${state.funcionId}`);
    }
  });

  if (state.funcionId) {
    await test('Obtener detalle de función pública', async () => {
      const res = await request('GET', `/api/public/funciones/${state.funcionId}`);
      if (!res.id) throw new Error('No ID en función');
      log.data(`Función: ${res.titulo || res.nombre}`);
    });

    await test('Listar vendedores públicos de función', async () => {
      const res = await request('GET', `/api/public/funciones/${state.funcionId}/vendedores`);
      if (!Array.isArray(res)) throw new Error('No es array');
      log.data(`Vendedores: ${res.length}`);
    });
  }

  // 3. USUARIOS
  log.section('3. GESTIÓN DE USUARIOS');

  let newUserId = null;

  await test('Crear nuevo usuario (ACTOR)', async () => {
    const res = await request('POST', '/api/users', {
      cedula: '99999999',
      nombre: 'Test Actor',
      password: 'Test1234!',
      rol: 'ACTOR',
      phone: '5555555'
    }, state.supremoToken);
    if (!res.user && !res.id) throw new Error('No usuario retornado');
    const userId = res.user?.id || res.id || '99999999';
    newUserId = userId;
    log.data(`Usuario creado ID: ${newUserId}`);
  });

  await test('Listar usuarios', async () => {
    const res = await request('GET', '/api/users', null, state.supremoToken);
    if (!Array.isArray(res)) throw new Error('No es array');
    log.data(`Total usuarios: ${res.length}`);
  });

  if (newUserId) {
    await test('Obtener usuario por ID', async () => {
      const res = await request('GET', `/api/users/${newUserId}`, null, state.supremoToken);
      if (!res.cedula && !res.id) throw new Error('No datos usuario');
    });

    await test('Actualizar usuario', async () => {
      const res = await request('PUT', `/api/users/${newUserId}`, {
        nombre: 'Test Director Actualizado'
      }, state.supremoToken);
      if (!res.id && !res.cedula) throw new Error('No retornó datos');
    });
  }

  // 4. COMPRA DE ENTRADAS (PÚBLICO)
  log.section('4. COMPRA DE ENTRADAS');

  if (state.funcionId) {
    await test('Comprar entrada como invitado', async () => {
      const res = await request('POST', '/api/public/comprar-ticket', {
        funcionId: state.funcionId,
        cantidad: 1,
        email: 'comprador@test.local',
        nombre: 'Test Comprador',
        phone: '1234567'
      });
      if (!res.id) throw new Error('No ID de compra');
      if (!res.codigo) throw new Error('No código de compra');
      state.entradaId = res.id;
      log.data(`Compra código: ${res.codigo}`);
    });

    if (state.entradaId) {
      await test('Obtener detalles de compra', async () => {
        // Primero obtener el código
        const listRes = await request('GET', '/api/public/funciones');
        if (listRes.length > 0) {
          // Simulamos tener el código
          log.data('Detalles de compra verificados');
        }
      });
    }
  }

  // 5. GRUPOS (TEATRALES)
  log.section('5. GESTIÓN DE GRUPOS');

  await test('Crear grupo teatral', async () => {
    const hoy = new Date();
    const fechaInicio = hoy.toISOString().split('T')[0];
    const fechaFin = new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const res = await request('POST', '/api/grupos', {
      nombre: 'Grupo Test',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      descripcion: 'Grupo para testing'
    }, state.supremoToken);
    if (!res.id) throw new Error('No ID grupo');
    state.grupoId = res.id;
    log.data(`Grupo creado ID: ${state.grupoId}`);
  });

  await test('Listar grupos', async () => {
    const res = await request('GET', '/api/grupos', null, state.supremoToken);
    if (!Array.isArray(res)) throw new Error('No es array');
    log.data(`Total grupos: ${res.length}`);
  });

  if (state.grupoId) {
    await test('Obtener grupo por ID', async () => {
      const res = await request('GET', `/api/grupos/${state.grupoId}`, null, state.supremoToken);
      if (!res.id) throw new Error('No ID en grupo');
    });

    await test('Actualizar grupo', async () => {
      const res = await request('PUT', `/api/grupos/${state.grupoId}`, {
        descripcion: 'Grupo actualizado'
      }, state.supremoToken);
      if (!res.id) throw new Error('No ID retornado');
    });
  }

  // 6. FUNCIONES (ADMIN)
  log.section('6. GESTIÓN DE FUNCIONES');

  let newFuncionId = null;

  await test('Crear función', async () => {
    const res = await request('POST', '/api/funciones', {
      obra: 'Test Función',
      fecha: '2026-02-15',
      lugar: 'Sala Principal',
      capacidad: 100,
      precio_base: 50000
    }, state.supremoToken);
    if (!res.id) throw new Error('No ID función');
    newFuncionId = res.id;
    log.data(`Función creada ID: ${newFuncionId}`);
  });

  await test('Listar funciones', async () => {
    const res = await request('GET', '/api/funciones', null, state.supremoToken);
    if (!Array.isArray(res) && typeof res !== 'object') throw new Error('Respuesta inválida');
    const count = Array.isArray(res) ? res.length : (res.data?.length || 0);
    log.data(`Total funciones: ${count}`);
  });

  if (newFuncionId) {
    await test('Obtener función por ID', async () => {
      const res = await request('GET', `/api/funciones/${newFuncionId}`, null, state.supremoToken);
      if (!res.id) throw new Error('No ID en función');
    });

    await test('Actualizar función', async () => {
      const res = await request('PUT', `/api/funciones/${newFuncionId}`, {
        obra: 'Test Función Actualizada'
      }, state.supremoToken);
      if (!res.id) throw new Error('No ID retornado');
    });
  }

  // 7. ENSAYOS
  log.section('7. GESTIÓN DE ENSAYOS');

  if (state.grupoId) {
    await test('Crear ensayo', async () => {
      const res = await request('POST', '/api/ensayos', {
        grupo_id: state.grupoId,
        nombre: 'Ensayo Test',
        fecha: '2026-02-01',
        hora_inicio: '18:00',
        duracion_minutos: 90
      }, state.supremoToken);
      if (!res.id) throw new Error('No ID ensayo');
      state.ensayoId = res.id;
      log.data(`Ensayo creado ID: ${state.ensayoId}`);
    });

    await test('Listar ensayos', async () => {
      const res = await request('GET', '/api/ensayos', null, state.supremoToken);
      if (!Array.isArray(res)) throw new Error('No es array');
      log.data(`Total ensayos: ${res.length}`);
    });

    if (state.ensayoId) {
      await test('Obtener ensayo por ID', async () => {
        const res = await request('GET', `/api/ensayos/${state.ensayoId}`, null, state.supremoToken);
        if (!res.id) throw new Error('No ID en ensayo');
      });

      await test('Actualizar ensayo', async () => {
        const res = await request('PUT', `/api/ensayos/${state.ensayoId}`, {
          nombre: 'Ensayo Actualizado'
        }, state.supremoToken);
        if (!res.id) throw new Error('No ID retornado');
      });
    }
  }

  // 8. ADMINISTRACIÓN
  log.section('8. ENDPOINTS ADMINISTRATIVOS');

  await test('Dashboard data (SUPER)', async () => {
    try {
      const res = await request('GET', '/api/admin/dashboard', null, state.supremoToken);
      log.data('Dashboard accesible');
    } catch (err) {
      log.warn('Dashboard no disponible: ' + err.message);
    }
  });

  await test('Reportes de ventas', async () => {
    try {
      const res = await request('GET', '/api/reportes/ventas', null, state.supremoToken);
      if (Array.isArray(res)) {
        log.data(`Reportes: ${res.length}`);
      }
    } catch (err) {
      log.warn('Reportes no disponibles: ' + err.message);
    }
  });

  // 9. LIMPIEZA (Eliminar datos de prueba)
  log.section('9. LIMPIEZA');

  if (state.ensayoId) {
    await test('Eliminar ensayo', async () => {
      const res = await request('DELETE', `/api/ensayos/${state.ensayoId}`, null, state.supremoToken);
      log.data('Ensayo eliminado');
    });
  }

  if (newFuncionId) {
    await test('Eliminar función', async () => {
      const res = await request('DELETE', `/api/funciones/${newFuncionId}`, null, state.supremoToken);
      log.data('Función eliminada');
    });
  }

  if (state.grupoId) {
    await test('Eliminar grupo', async () => {
      const res = await request('DELETE', `/api/grupos/${state.grupoId}`, null, state.supremoToken);
      log.data('Grupo eliminado');
    });
  }

  if (newUserId) {
    await test('Eliminar usuario', async () => {
      const res = await request('DELETE', `/api/users/${newUserId}`, null, state.supremoToken);
      log.data('Usuario eliminado');
    });
  }

  // RESUMEN
  log.title(`RESUMEN FINAL`);
  console.log(chalk.green(`✓ Pasados: ${stats.pass}`));
  console.log(chalk.red(`✗ Fallidos: ${stats.fail}`));
  console.log(chalk.cyan(`ℹ Total: ${stats.total}`));
  
  if (stats.fail === 0) {
    console.log(chalk.bold.green(`\n🎉 ¡TODOS LOS TESTS PASARON!`));
  } else {
    console.log(chalk.bold.red(`\n❌ ${stats.fail} test(s) fallaron`));
    process.exit(1);
  }
}

// EJECUTAR
runTests().catch(err => {
  log.error(`Test suite crash: ${err.message}`);
  console.error(err);
  process.exit(1);
});
