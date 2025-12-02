import fetch from 'node-fetch';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'https://baco-teatro-1jxj.onrender.com';
const RENDER_URL = 'https://baco-teatro-1jxj.onrender.com';

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

let authToken = null;
let authTokenDirector = null;
let authTokenActor = null;
let createdShowId = null;
let createdTicketId = null;
let createdActorId = null;
let createdDirectorId = null;
let createdEnsayoId = null;

const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  section: (msg) => console.log(chalk.cyan.bold(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`))
};

async function makeRequest(method, endpoint, body = null, token = null, useRender = false) {
  const url = (useRender ? RENDER_URL : API_URL) + endpoint;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

function test(name, condition, details = '') {
  testResults.total++;
  const result = {
    name,
    passed: condition,
    details
  };
  testResults.details.push(result);

  if (condition) {
    testResults.passed++;
    log.success(`${name}`);
  } else {
    testResults.failed++;
    log.error(`${name} - ${details}`);
  }
  return condition;
}

async function testHealthCheck() {
  log.section('TEST 1: Health Check');
  
  const local = await makeRequest('GET', '/health');
  test('Health check local responde', local.ok, `Status: ${local.status}`);
  
  if (local.ok) {
    test('Health check tiene status ok', local.data.status === 'ok');
    test('Health check indica PostgreSQL', local.data.storage === 'postgresql');
    log.info(`  - Usuarios: ${local.data.totals?.users || 0}`);
    log.info(`  - Shows: ${local.data.totals?.shows || 0}`);
    log.info(`  - Tickets: ${local.data.totals?.tickets || 0}`);
  }

  log.info('Probando Render...');
  const render = await makeRequest('GET', '/health', null, null, true);
  test('Health check Render responde', render.ok, `Status: ${render.status}`);
  
  if (render.ok) {
    test('Render conectado a PostgreSQL', render.data.database === 'connected');
  }
}

async function testAuth() {
  log.section('TEST 2: Autenticación');

  // Login como supremo
  const loginSupremo = await makeRequest('POST', '/api/auth/login', {
    phone: '48376669',
    password: 'Teamomama91'
  });
  
  test('Login supremo exitoso', loginSupremo.ok && loginSupremo.data.token, `Status: ${loginSupremo.status}`);
  
  if (loginSupremo.ok) {
    authToken = loginSupremo.data.token;
    test('Token generado', !!authToken);
    test('Usuario supremo tiene rol SUPER', loginSupremo.data.user.role === 'SUPER');
    log.info(`  - Usuario: ${loginSupremo.data.user.name}`);
    log.info(`  - Rol: ${loginSupremo.data.user.role}`);
  }

  // Login inválido
  const loginInvalido = await makeRequest('POST', '/api/auth/login', {
    phone: '99999999',
    password: 'wrongpass'
  });
  test('Login inválido rechazado', !loginInvalido.ok, `Status: ${loginInvalido.status}`);

  // Sin token
  const sinToken = await makeRequest('GET', '/api/shows');
  test('Endpoint protegido sin token rechaza', !sinToken.ok, `Status: ${sinToken.status}`);
}

async function testUsers() {
  log.section('TEST 3: Gestión de Usuarios');

  // Crear director
  const createDirector = await makeRequest('POST', '/api/auth/register', {
    cedula: `DIR${Date.now()}`,
    nombre: 'Director Test',
    password: 'test123',
    rol: 'admin'
  }, authToken);

  test('Crear director exitoso', createDirector.ok, `Status: ${createDirector.status}`);
  
  if (createDirector.ok) {
    createdDirectorId = createDirector.data.user.id;
    log.info(`  - Director ID: ${createdDirectorId}`);

    // Login como director
    const loginDir = await makeRequest('POST', '/api/auth/login', {
      phone: createDirector.data.user.phone,
      password: 'test123'
    });
    
    if (loginDir.ok) {
      authTokenDirector = loginDir.data.token;
      test('Director puede hacer login', true);
    }
  }

  // Crear actor/vendedor
  const createActor = await makeRequest('POST', '/api/auth/register', {
    cedula: `ACT${Date.now()}`,
    nombre: 'Actor Test',
    password: 'test123',
    rol: 'vendedor'
  }, authToken);

  test('Crear actor exitoso', createActor.ok, `Status: ${createActor.status}`);
  
  if (createActor.ok) {
    createdActorId = createActor.data.user.id;
    log.info(`  - Actor ID: ${createdActorId}`);

    // Login como actor
    const loginActor = await makeRequest('POST', '/api/auth/login', {
      phone: createActor.data.user.phone,
      password: 'test123'
    });
    
    if (loginActor.ok) {
      authTokenActor = loginActor.data.token;
      test('Actor puede hacer login', true);
    }
  }

  // Listar miembros
  const miembros = await makeRequest('GET', '/api/usuarios/miembros', null, authTokenDirector);
  test('Listar miembros funciona', miembros.ok, `Status: ${miembros.status}`);
  
  if (miembros.ok) {
    const hayDirectores = miembros.data.some(m => m.rol === 'admin');
    const hayActores = miembros.data.some(m => m.rol === 'vendedor');
    const noHaySupremo = !miembros.data.some(m => m.rol === 'supremo');
    
    test('Lista incluye directores', hayDirectores);
    test('Lista incluye actores', hayActores);
    test('Lista oculta usuario supremo', noHaySupremo);
    log.info(`  - Total miembros: ${miembros.data.length}`);
  }

  // Listar vendedores
  const vendedores = await makeRequest('GET', '/api/usuarios/vendedores', null, authToken);
  test('Listar vendedores funciona', vendedores.ok, `Status: ${vendedores.status}`);
}

async function testShows() {
  log.section('TEST 4: Gestión de Shows/Funciones');

  // Crear show como director
  const createShow = await makeRequest('POST', '/api/shows', {
    obra: 'Obra Test',
    fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    precio: 500,
    cantidad: 50,
    lugar: 'Teatro Test'
  }, authTokenDirector);

  test('Director puede crear show', createShow.ok, `Status: ${createShow.status}`);
  
  if (createShow.ok) {
    createdShowId = createShow.data.id;
    log.info(`  - Show ID: ${createdShowId}`);
    log.info(`  - Obra: ${createShow.data.nombre}`);
    log.info(`  - Tickets generados: ${createShow.data.total_tickets || 0}`);
  }

  // Actor no puede crear show
  const actorCreateShow = await makeRequest('POST', '/api/shows', {
    obra: 'Obra Invalid',
    fecha: new Date().toISOString(),
    precio: 300,
    cantidad: 20
  }, authTokenActor);

  test('Actor no puede crear show', !actorCreateShow.ok, 'Debe requerir rol ADMIN/SUPER');

  // Listar shows
  const listShows = await makeRequest('GET', '/api/shows', null, authToken);
  test('Listar shows funciona', listShows.ok, `Status: ${listShows.status}`);
  
  if (listShows.ok && listShows.data.length > 0) {
    log.info(`  - Total shows: ${listShows.data.length}`);
  }

  // Shows públicos (sin auth)
  const publicShows = await makeRequest('GET', '/api/shows/public');
  test('Shows públicos accesibles sin auth', publicShows.ok);

  // Detalle de show
  if (createdShowId) {
    const showDetail = await makeRequest('GET', `/api/shows/${createdShowId}`, null, authToken);
    test('Obtener detalle de show', showDetail.ok);
    
    if (showDetail.ok) {
      test('Detalle incluye tickets', Array.isArray(showDetail.data.tickets));
      log.info(`  - Tickets en show: ${showDetail.data.tickets?.length || 0}`);
    }
  }
}

async function testTickets() {
  log.section('TEST 5: Gestión de Tickets');

  if (!createdShowId || !createdActorId) {
    log.warn('Saltando tests de tickets: falta show o actor');
    return;
  }

  // Obtener tickets del show
  const tickets = await makeRequest('GET', `/api/shows/${createdShowId}`, null, authTokenDirector);
  
  if (tickets.ok && tickets.data.tickets?.length > 0) {
    createdTicketId = tickets.data.tickets[0].id;
    log.info(`  - Ticket ID: ${createdTicketId}`);

    // Asignar ticket a actor
    const assignTicket = await makeRequest('POST', '/api/tickets/asignar', {
      ticketIds: [createdTicketId],
      vendedorId: createdActorId
    }, authTokenDirector);

    test('Director asigna ticket a actor', assignTicket.ok, `Status: ${assignTicket.status}`);

    // Actualizar estado de ticket
    const updateTicket = await makeRequest('PUT', `/api/tickets/${createdTicketId}`, {
      estado: 'VENDIDA_PAGADA',
      comprador_nombre: 'Cliente Test',
      comprador_telefono: '099123456'
    }, authTokenActor);

    test('Actor actualiza estado de ticket', updateTicket.ok, `Status: ${updateTicket.status}`);

    // Stock del actor
    const actorStock = await makeRequest('GET', '/api/tickets/stock', null, authTokenActor);
    test('Actor puede ver su stock', actorStock.ok, `Status: ${actorStock.status}`);
    
    if (actorStock.ok) {
      log.info(`  - Shows en stock: ${actorStock.data.length}`);
    }

    // Historial del actor
    const actorHistory = await makeRequest('GET', '/api/reportes/vendedor', null, authTokenActor);
    test('Actor puede ver su historial', actorHistory.ok);

    // Transferir tickets
    const transfer = await makeRequest('POST', '/api/tickets/transferir', {
      ticketIds: [createdTicketId],
      targetVendedorId: createdDirectorId
    }, authTokenActor);

    test('Actor puede transferir tickets', transfer.ok || transfer.status === 400, 'Puede fallar si ya fue vendido');
  }

  // Dashboard del director
  const directorDash = await makeRequest('GET', '/api/reportes/director', null, authTokenDirector);
  test('Director puede ver dashboard', directorDash.ok);
  
  if (directorDash.ok) {
    log.info(`  - Funciones: ${directorDash.data.functions?.length || 0}`);
    log.info(`  - Actores: ${directorDash.data.actors?.length || 0}`);
  }
}

async function testEnsayos() {
  log.section('TEST 6: Gestión de Ensayos');

  if (!authTokenDirector || !createdActorId) {
    log.warn('Saltando tests de ensayos: falta director o actor');
    return;
  }

  // Crear ensayo como director
  const createEnsayo = await makeRequest('POST', '/api/ensayos', {
    titulo: 'Ensayo General Test',
    fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    lugar: 'Sala de Ensayo',
    descripcion: 'Ensayo completo de la obra',
    actores: [createdActorId]
  }, authTokenDirector);

  test('Director puede crear ensayo', createEnsayo.ok, `Status: ${createEnsayo.status}`);
  
  if (createEnsayo.ok) {
    createdEnsayoId = createEnsayo.data.id;
    log.info(`  - Ensayo ID: ${createdEnsayoId}`);
    log.info(`  - Título: ${createEnsayo.data.titulo}`);
  }

  // Actor no puede crear ensayo
  const actorCreateEnsayo = await makeRequest('POST', '/api/ensayos', {
    titulo: 'Ensayo Invalid',
    fecha: new Date().toISOString(),
    lugar: 'Test'
  }, authTokenActor);

  test('Actor no puede crear ensayo', !actorCreateEnsayo.ok, 'Debe requerir rol ADMIN/SUPER');

  // Listar ensayos como director
  const listEnsayosDir = await makeRequest('GET', '/api/ensayos', null, authTokenDirector);
  test('Director puede listar ensayos', listEnsayosDir.ok);
  
  if (listEnsayosDir.ok) {
    log.info(`  - Ensayos del director: ${listEnsayosDir.data.length}`);
  }

  // Listar ensayos como actor
  const listEnsayosActor = await makeRequest('GET', '/api/ensayos', null, authTokenActor);
  test('Actor puede ver sus ensayos', listEnsayosActor.ok);
  
  if (listEnsayosActor.ok) {
    const suEnsayo = listEnsayosActor.data.find(e => e.id === createdEnsayoId);
    test('Actor ve ensayo donde está asignado', !!suEnsayo);
    log.info(`  - Ensayos del actor: ${listEnsayosActor.data.length}`);
  }

  // Obtener detalle de ensayo
  if (createdEnsayoId) {
    const ensayoDetail = await makeRequest('GET', `/api/ensayos/${createdEnsayoId}`, null, authTokenDirector);
    test('Obtener detalle de ensayo', ensayoDetail.ok);
    
    if (ensayoDetail.ok) {
      test('Detalle incluye actores', Array.isArray(ensayoDetail.data.actores));
      log.info(`  - Actores en ensayo: ${ensayoDetail.data.actores?.length || 0}`);
    }

    // Actualizar ensayo
    const updateEnsayo = await makeRequest('PUT', `/api/ensayos/${createdEnsayoId}`, {
      titulo: 'Ensayo General Test Actualizado',
      fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      lugar: 'Sala de Ensayo 2',
      descripcion: 'Actualizado',
      actores: [createdActorId]
    }, authTokenDirector);

    test('Director puede actualizar ensayo', updateEnsayo.ok);

    // Actor no puede actualizar ensayo
    const actorUpdateEnsayo = await makeRequest('PUT', `/api/ensayos/${createdEnsayoId}`, {
      titulo: 'Invalid'
    }, authTokenActor);

    test('Actor no puede actualizar ensayo', !actorUpdateEnsayo.ok);
  }
}

async function testReportes() {
  log.section('TEST 7: Sistema de Reportes');

  if (!createdShowId) {
    log.warn('Saltando tests de reportes: falta show');
    return;
  }

  // Generar reporte de obra
  const generateReport = await makeRequest('POST', `/api/reportes-obras/generar/${createdShowId}`, null, authTokenDirector);
  test('Director puede generar reporte de obra', generateReport.ok || generateReport.status === 400, `Status: ${generateReport.status}`);

  // Listar reportes como director
  const listReports = await makeRequest('GET', '/api/reportes-obras', null, authTokenDirector);
  test('Director puede listar reportes', listReports.ok);
  
  if (listReports.ok && listReports.data.reportes?.length > 0) {
    log.info(`  - Reportes generados: ${listReports.data.reportes.length}`);
    
    const reporteId = listReports.data.reportes[0].id;
    
    // Obtener detalle de reporte
    const reportDetail = await makeRequest('GET', `/api/reportes-obras/${reporteId}`, null, authTokenDirector);
    test('Obtener detalle de reporte', reportDetail.ok);
    
    if (reportDetail.ok) {
      test('Reporte incluye datos de vendedores', !!reportDetail.data.reporte.datos_vendedores);
      test('Reporte incluye datos de ventas', !!reportDetail.data.reporte.datos_ventas);
      log.info(`  - Tickets vendidos: ${reportDetail.data.reporte.tickets_vendidos}`);
      log.info(`  - Ingresos totales: $${reportDetail.data.reporte.ingresos_totales}`);
    }
  }

  // Dashboard del super
  const superDash = await makeRequest('GET', '/api/reportes/super', null, authToken);
  test('Super puede ver dashboard global', superDash.ok);
  
  if (superDash.ok) {
    log.info(`  - Producciones activas: ${superDash.data.totals?.productions || 0}`);
    log.info(`  - Total funciones: ${superDash.data.totals?.functions || 0}`);
    log.info(`  - Total tickets: ${superDash.data.totals?.tickets || 0}`);
  }
}

async function testPermissions() {
  log.section('TEST 8: Verificación de Permisos');

  // Actor no puede eliminar usuarios
  if (createdActorId) {
    const actorDelete = await makeRequest('DELETE', `/api/usuarios/${createdActorId}`, null, authTokenActor);
    test('Actor no puede eliminar usuarios', !actorDelete.ok, 'Debe requerir rol ADMIN/SUPER');
  }

  // Actor no puede crear directores
  const actorCreateDir = await makeRequest('POST', '/api/auth/register', {
    cedula: 'TESTINVALID',
    nombre: 'Invalid',
    password: 'test',
    rol: 'admin'
  }, authTokenActor);
  test('Actor no puede crear directores', !actorCreateDir.ok);

  // Director puede eliminar sus propias obras
  if (createdShowId) {
    const dirDeleteShow = await makeRequest('DELETE', `/api/shows/${createdShowId}`, null, authTokenDirector);
    test('Director puede eliminar sus propias obras', dirDeleteShow.ok, `Status: ${dirDeleteShow.status}`);
  }

  // Super puede eliminar cualquier usuario
  if (createdDirectorId) {
    const superDelete = await makeRequest('DELETE', `/api/usuarios/${createdDirectorId}`, null, authToken);
    test('Super puede eliminar cualquier usuario', superDelete.ok, `Status: ${superDelete.status}`);
  }

  if (createdActorId) {
    const superDeleteActor = await makeRequest('DELETE', `/api/usuarios/${createdActorId}`, null, authToken);
    test('Super puede eliminar actores', superDeleteActor.ok);
  }

  // Eliminar ensayo
  if (createdEnsayoId) {
    const deleteEnsayo = await makeRequest('DELETE', `/api/ensayos/${createdEnsayoId}`, null, authToken);
    test('Super puede eliminar ensayos', deleteEnsayo.ok);
  }
}

async function testRender() {
  log.section('TEST 9: Verificación de Render');

  log.info('Probando endpoints en producción...');

  // Health check
  const health = await makeRequest('GET', '/health', null, null, true);
  test('Render: Health check responde', health.ok);

  // API info
  const apiInfo = await makeRequest('GET', '/api', null, null, true);
  test('Render: API info responde', apiInfo.ok);
  
  if (apiInfo.ok) {
    test('Render: Version correcta', apiInfo.data.version === '3.0.0');
    log.info(`  - Message: ${apiInfo.data.message}`);
  }

  // Frontend
  const frontend = await makeRequest('GET', '/', null, null, true);
  test('Render: Frontend cargando', frontend.ok || frontend.status === 200);

  // Login en producción
  const loginProd = await makeRequest('POST', '/api/auth/login', {
    phone: '48376669',
    password: 'Teamomama91'
  }, null, true);
  test('Render: Login funciona', loginProd.ok);

  if (loginProd.ok) {
    const tokenProd = loginProd.data.token;
    
    // Shows públicos en producción
    const showsProd = await makeRequest('GET', '/api/shows/public', null, null, true);
    test('Render: Shows públicos accesibles', showsProd.ok);
    
    // Dashboard en producción
    const dashProd = await makeRequest('GET', '/api/reportes/super', null, tokenProd, true);
    test('Render: Dashboard funciona', dashProd.ok);
  }
}

async function testDatabase() {
  log.section('TEST 10: Integridad de Base de Datos');

  // Verificar que supremo existe
  const loginSupremo = await makeRequest('POST', '/api/auth/login', {
    phone: '48376669',
    password: 'Teamomama91'
  });
  test('Usuario supremo existe en DB', loginSupremo.ok);

  // Verificar tablas creadas
  const health = await makeRequest('GET', '/health', null, authToken);
  test('Base de datos accesible', health.ok);

  // Verificar que puede leer todas las tablas principales
  const shows = await makeRequest('GET', '/api/shows', null, authToken);
  test('Tabla shows accesible', shows.ok);

  const usuarios = await makeRequest('GET', '/api/usuarios/miembros', null, authToken);
  test('Tabla users accesible', usuarios.ok);

  const ensayos = await makeRequest('GET', '/api/ensayos', null, authToken);
  test('Tabla ensayos_generales accesible', ensayos.ok);

  const reportes = await makeRequest('GET', '/api/reportes-obras', null, authToken);
  test('Tabla reportes_obras accesible', reportes.ok);
}

function printResults() {
  log.section('RESULTADOS FINALES');

  console.log(chalk.bold('\nResumen:'));
  console.log(chalk.green(`  ✓ Pasados: ${testResults.passed}/${testResults.total}`));
  console.log(chalk.red(`  ✗ Fallidos: ${testResults.failed}/${testResults.total}`));
  
  const percentage = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(chalk.blue(`  📊 Porcentaje: ${percentage}%`));

  if (testResults.failed > 0) {
    console.log(chalk.red.bold('\n❌ Tests fallidos:'));
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(chalk.red(`  • ${t.name}`));
        if (t.details) console.log(chalk.gray(`    ${t.details}`));
      });
  }

  if (testResults.passed === testResults.total) {
    console.log(chalk.green.bold('\n🎉 ¡TODOS LOS TESTS PASARON! 🎉'));
    console.log(chalk.green('Sistema completamente funcional ✓'));
  } else if (percentage >= 80) {
    console.log(chalk.yellow.bold('\n⚠️  Sistema funcional con advertencias'));
  } else {
    console.log(chalk.red.bold('\n❌ Sistema requiere correcciones'));
  }
}

async function runAllTests() {
  console.log(chalk.cyan.bold('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('  🧪 TESTING COMPLETO - SISTEMA BACO TEATRO'));
  console.log(chalk.cyan.bold('='.repeat(60)));
  
  log.info(`API Local: ${API_URL}`);
  log.info(`API Render: ${RENDER_URL}`);
  log.info(`Fecha: ${new Date().toLocaleString('es-ES')}\n`);

  try {
    await testHealthCheck();
    await testAuth();
    await testUsers();
    await testShows();
    await testTickets();
    await testEnsayos();
    await testReportes();
    await testPermissions();
    await testDatabase();
    await testRender();
  } catch (error) {
    log.error(`Error crítico en tests: ${error.message}`);
    console.error(error);
  }

  printResults();
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests();
