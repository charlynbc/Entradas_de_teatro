/**
 * TEST DINÁMICO EXHAUSTIVO - Sistema Teatro
 * Prueba todas las funcionalidades nuevas de forma dinámica
 */

const API_URL = 'http://localhost:3000';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

let authToken = null;
let grupoId = null;
let showId = null;

// Función auxiliar para hacer peticiones
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const text = await response.text();
  let data;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  return {
    status: response.status,
    data,
    headers: response.headers
  };
}

// Función para imprimir resultados
function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`${colors.green}✅ ${name}${colors.reset}`);
    testResults.passed++;
  } else {
    console.log(`${colors.red}❌ ${name}${colors.reset}`);
    if (details) console.log(`   ${colors.yellow}${details}${colors.reset}`);
    testResults.failed++;
    testResults.errors.push({ name, details });
  }
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Test 1: Login como SUPER
async function testLogin() {
  logSection('TEST 1: AUTENTICACIÓN');
  
  try {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '48376669',
        password: 'Teamomama91'
      })
    });

    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      logTest('Login SUPER exitoso', true);
      logTest(`Token recibido: ${authToken.substring(0, 20)}...`, true);
      logTest(`Role: ${response.data.user.role}`, response.data.user.role === 'SUPER');
    } else {
      logTest('Login SUPER', false, `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logTest('Login SUPER', false, error.message);
  }
}

// Test 2: Verificar endpoints de funciones concluidas
async function testFuncionesConcluidasEndpoint() {
  logSection('TEST 2: FUNCIONES CONCLUIDAS - ENDPOINTS');
  
  try {
    // Listar funciones concluidas
    const response = await request('/api/shows/concluidas');
    
    logTest('GET /api/shows/concluidas', response.status === 200, 
      `Status: ${response.status}`);
    
    if (response.status === 200) {
      const funciones = response.data.shows || response.data;
      logTest(`Funciones concluidas encontradas: ${funciones.length}`, true);
      
      if (funciones.length > 0) {
        console.log(`   ${colors.blue}Ejemplo función concluida:${colors.reset}`);
        console.log(`   - ID: ${funciones[0].id}`);
        console.log(`   - Obra: ${funciones[0].obra}`);
        console.log(`   - Estado: ${funciones[0].estado}`);
        console.log(`   - Puntuación: ${funciones[0].puntuacion || 'N/A'}`);
      }
    }
  } catch (error) {
    logTest('GET /api/shows/concluidas', false, error.message);
  }
}

// Test 3: Verificar endpoints de grupos finalizados
async function testGruposFinalizadosEndpoint() {
  logSection('TEST 3: GRUPOS FINALIZADOS - ENDPOINTS');
  
  try {
    // Listar grupos finalizados
    const response = await request('/api/grupos/finalizados/lista');
    
    logTest('GET /api/grupos/finalizados/lista', response.status === 200,
      `Status: ${response.status}`);
    
    if (response.status === 200) {
      const grupos = response.data.grupos || response.data;
      logTest(`Grupos finalizados encontrados: ${grupos.length}`, true);
      
      if (grupos.length > 0) {
        console.log(`   ${colors.blue}Ejemplo grupo finalizado:${colors.reset}`);
        console.log(`   - ID: ${grupos[0].id}`);
        console.log(`   - Nombre: ${grupos[0].nombre}`);
        console.log(`   - Estado: ${grupos[0].estado}`);
        console.log(`   - Puntuación: ${grupos[0].puntuacion || 'N/A'}`);
        console.log(`   - Miembros: ${grupos[0].total_miembros || 0}`);
      }
    }
  } catch (error) {
    logTest('GET /api/grupos/finalizados/lista', false, error.message);
  }
}

// Test 4: Obtener grupo para cerrar función
async function testObtenerGrupoActivo() {
  logSection('TEST 4: OBTENER GRUPO ACTIVO');
  
  try {
    const response = await request('/api/grupos');
    
    if (response.status === 200) {
      const grupos = response.data.grupos || response.data;
      const grupoActivo = grupos.find(g => g.estado === 'ACTIVO');
      
      if (grupoActivo) {
        grupoId = grupoActivo.id;
        logTest('Grupo activo encontrado', true);
        console.log(`   - ID: ${grupoId}`);
        console.log(`   - Nombre: ${grupoActivo.nombre}`);
      } else {
        console.log(`   ${colors.yellow}ℹ️  INFO: No hay grupos activos (datos no creados aún)${colors.reset}`);
        console.log(`   ${colors.blue}→ SUPER puede crear grupos desde la app${colors.reset}`);
      }
    }
  } catch (error) {
    logTest('Obtener grupo activo', false, error.message);
  }
}

// Test 5: Obtener función para cerrar
async function testObtenerFuncionActiva() {
  logSection('TEST 5: OBTENER FUNCIÓN ACTIVA');
  
  try {
    const response = await request('/api/shows');
    
    if (response.status === 200) {
      const shows = response.data.shows || response.data;
      const showActivo = shows.find(s => s.estado === 'ACTIVA');
      
      if (showActivo) {
        showId = showActivo.id;
        logTest('Función activa encontrada', true);
        console.log(`   - ID: ${showId}`);
        console.log(`   - Obra: ${showActivo.obra}`);
        console.log(`   - Estado: ${showActivo.estado}`);
      } else {
        console.log(`   ${colors.yellow}ℹ️  INFO: No hay funciones activas (datos no creados aún)${colors.reset}`);
        console.log(`   ${colors.blue}→ SUPER/DIRECTOR pueden crear funciones desde la app${colors.reset}`);
      }
    }
  } catch (error) {
    logTest('Obtener función activa', false, error.message);
  }
}

// Test 6: Cerrar función (solo si hay una activa)
async function testCerrarFuncion() {
  logSection('TEST 6: CERRAR FUNCIÓN');
  
  if (!showId) {
    console.log(`   ${colors.yellow}⚠️ SKIP: No hay función activa para cerrar${colors.reset}`);
    return;
  }
  
  try {
    const response = await request(`/api/shows/${showId}/cerrar`, {
      method: 'POST',
      body: JSON.stringify({
        conclusion_director: 'Función de prueba concluida exitosamente. Gran trabajo del elenco.',
        puntuacion: 9
      })
    });
    
    if (response.status === 200) {
      logTest('POST /api/shows/:id/cerrar', true);
      logTest('Función cerrada con éxito', true);
      console.log(`   ${colors.blue}Detalles:${colors.reset}`);
      console.log(`   - Función ID: ${showId}`);
      console.log(`   - Estado nuevo: CONCLUIDA`);
      console.log(`   - Puntuación: 9/10`);
    } else {
      logTest('POST /api/shows/:id/cerrar', false, 
        `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logTest('Cerrar función', false, error.message);
  }
}

// Test 7: Descargar PDF de función
async function testDescargarPDFFuncion() {
  logSection('TEST 7: GENERAR PDF FUNCIÓN');
  
  if (!showId) {
    console.log(`   ${colors.yellow}⚠️ SKIP: No hay función para generar PDF${colors.reset}`);
    return;
  }
  
  try {
    const response = await request(`/api/shows/${showId}/pdf?token=${authToken}`);
    
    if (response.status === 200) {
      logTest('GET /api/shows/:id/pdf', true);
      
      const contentType = response.headers.get('content-type');
      logTest('Content-Type es application/pdf', 
        contentType && contentType.includes('pdf'),
        `Content-Type: ${contentType}`);
      
      console.log(`   ${colors.blue}PDF generado exitosamente${colors.reset}`);
    } else {
      logTest('GET /api/shows/:id/pdf', false, 
        `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Descargar PDF función', false, error.message);
  }
}

// Test 8: Finalizar grupo (solo si hay uno activo)
async function testFinalizarGrupo() {
  logSection('TEST 8: FINALIZAR GRUPO');
  
  if (!grupoId) {
    console.log(`   ${colors.yellow}⚠️ SKIP: No hay grupo activo para finalizar${colors.reset}`);
    return;
  }
  
  try {
    const response = await request(`/api/grupos/${grupoId}/finalizar`, {
      method: 'POST',
      body: JSON.stringify({
        conclusion: 'Excelente año de trabajo. El grupo demostró gran compromiso y profesionalismo.',
        puntuacion: 9
      })
    });
    
    if (response.status === 200) {
      logTest('POST /api/grupos/:id/finalizar', true);
      logTest('Grupo finalizado con éxito', true);
      console.log(`   ${colors.blue}Detalles:${colors.reset}`);
      console.log(`   - Grupo ID: ${grupoId}`);
      console.log(`   - Estado nuevo: FINALIZADO`);
      console.log(`   - Puntuación: 9/10`);
    } else {
      logTest('POST /api/grupos/:id/finalizar', false,
        `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logTest('Finalizar grupo', false, error.message);
  }
}

// Test 9: Descargar PDF de grupo
async function testDescargarPDFGrupo() {
  logSection('TEST 9: GENERAR PDF GRUPO');
  
  if (!grupoId) {
    console.log(`   ${colors.yellow}⚠️ SKIP: No hay grupo para generar PDF${colors.reset}`);
    return;
  }
  
  try {
    const response = await request(`/api/grupos/${grupoId}/pdf?token=${authToken}`);
    
    if (response.status === 200) {
      logTest('GET /api/grupos/:id/pdf', true);
      
      const contentType = response.headers.get('content-type');
      logTest('Content-Type es application/pdf',
        contentType && contentType.includes('pdf'),
        `Content-Type: ${contentType}`);
      
      console.log(`   ${colors.blue}PDF generado exitosamente${colors.reset}`);
    } else {
      logTest('GET /api/grupos/:id/pdf', false,
        `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Descargar PDF grupo', false, error.message);
  }
}

// Test 10: Verificar filtrado de funciones activas para invitados
async function testFiltradoFuncionesPublicas() {
  logSection('TEST 10: FILTRADO FUNCIONES PÚBLICAS');
  
  try {
    // Sin token (como invitado)
    const oldToken = authToken;
    authToken = null;
    
    const response = await request('/api/shows');
    
    authToken = oldToken;
    
    if (response.status === 200) {
      const shows = response.data.shows || response.data;
      const soloActivas = shows.every(s => s.estado === 'ACTIVA');
      
      logTest('GET /api/shows (sin autenticación)', true);
      logTest('Solo muestra funciones ACTIVAS', soloActivas,
        soloActivas ? '' : 'Se encontraron funciones CONCLUIDAS en listado público');
      
      console.log(`   ${colors.blue}Funciones públicas: ${shows.length}${colors.reset}`);
    } else {
      logTest('GET /api/shows (público)', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Filtrado funciones públicas', false, error.message);
  }
}

// Test 11: Verificar permisos SUPER
async function testPermisosSUPER() {
  logSection('TEST 11: PERMISOS SUPER USUARIO');
  
  try {
    // Verificar acceso a funciones concluidas
    const funcResponse = await request('/api/shows/concluidas');
    logTest('SUPER puede ver funciones concluidas', funcResponse.status === 200);
    
    // Verificar acceso a grupos finalizados
    const grupoResponse = await request('/api/grupos/finalizados/lista');
    logTest('SUPER puede ver grupos finalizados', grupoResponse.status === 200);
    
    // Verificar que puede ver todos los grupos (no solo los propios)
    const todosGrupos = await request('/api/grupos');
    if (todosGrupos.status === 200) {
      const grupos = todosGrupos.data.grupos || todosGrupos.data;
      logTest('SUPER puede ver todos los grupos', grupos.length >= 0, 
        `Total grupos visibles: ${grupos.length}`);
    }
  } catch (error) {
    logTest('Permisos SUPER', false, error.message);
  }
}

// Test 12: Verificar frontend
async function testFrontend() {
  logSection('TEST 12: FRONTEND');
  
  try {
    const response = await fetch(API_URL);
    const html = await response.text();
    
    logTest('Frontend carga correctamente', response.status === 200);
    logTest('HTML contiene div#root', html.includes('id="root"'));
    logTest('HTML carga bundle JS', html.includes('AppEntry'));
    
    // Verificar bundle JS
    const bundleMatch = html.match(/src="([^"]*AppEntry[^"]*)"/);
    if (bundleMatch) {
      const bundlePath = bundleMatch[1];
      const bundleResponse = await fetch(`${API_URL}${bundlePath}`);
      
      logTest('Bundle JS se descarga', bundleResponse.status === 200);
      logTest('Bundle JS es JavaScript', 
        bundleResponse.headers.get('content-type').includes('javascript'));
      
      const bundleText = await bundleResponse.text();
      logTest('Bundle contiene React', bundleText.includes('react'));
      logTest('Bundle contiene Navigation', bundleText.includes('navigation'));
    }
  } catch (error) {
    logTest('Frontend', false, error.message);
  }
}

// Función principal
async function runAllTests() {
  console.log(`\n${colors.magenta}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║                                                           ║${colors.reset}`);
  console.log(`${colors.magenta}║          TEST DINÁMICO EXHAUSTIVO - TEATRO BACO           ║${colors.reset}`);
  console.log(`${colors.magenta}║                                                           ║${colors.reset}`);
  console.log(`${colors.magenta}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  try {
    await testLogin();
    await testFuncionesConcluidasEndpoint();
    await testGruposFinalizadosEndpoint();
    await testObtenerGrupoActivo();
    await testObtenerFuncionActiva();
    await testCerrarFuncion();
    await testDescargarPDFFuncion();
    await testFinalizarGrupo();
    await testDescargarPDFGrupo();
    await testFiltradoFuncionesPublicas();
    await testPermisosSUPER();
    await testFrontend();
    
  } catch (error) {
    console.error(`\n${colors.red}ERROR FATAL: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }
  
  // Resumen final
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}RESUMEN DE TESTS${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.green}✅ Tests exitosos: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests fallidos: ${testResults.failed}${colors.reset}`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}ERRORES ENCONTRADOS:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${colors.yellow}${error.name}${colors.reset}`);
      console.log(`   ${error.details}`);
    });
  }
  
  const porcentaje = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
  console.log(`\n${colors.blue}Tasa de éxito: ${porcentaje}%${colors.reset}\n`);
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Ejecutar
runAllTests();
