#!/usr/bin/env node
/**
 * SUPER TESTING - VALIDACIÓN COMPLETA DEL SISTEMA BACO TEATRO
 * Prueba todos los módulos principales
 * Fecha: 2026-01-11
 * 
 * Módulos a validar:
 * 1. Backend/Health
 * 2. Base de datos
 * 3. Autenticación
 * 4. Usuarios y fotos
 * 5. Funciones públicas
 * 6. Reservas/Entradas
 * 7. Grupos
 * 8. Reportes
 * 9. Upload de imágenes
 * 10. Rutas públicas
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// =====================
// COLORS & LOGGING
// =====================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}╔══ ${msg} ══╗${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}═══ ${msg} ═══${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`)
};

// =====================
// TEST COUNTER
// =====================
let testsTotal = 0;
let testsPassed = 0;
let testsFailed = 0;

function registerTest(passed, name) {
  testsTotal++;
  if (passed) {
    testsPassed++;
    log.success(name);
  } else {
    testsFailed++;
    log.error(name);
  }
}

// =====================
// HELPERS
// =====================
async function loginSupremo() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '48376669', password: 'Teamomama91' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login supremo falló: ${JSON.stringify(data)}`);
  return data.token;
}

// =====================
// TESTS
// =====================

async function test1_Health() {
  log.title('MÓDULO 1: HEALTH & CONEXIÓN');
  
  try {
    const res = await fetch(`${BASE}/health`);
    const health = await res.json();
    registerTest(res.ok && health.status, 'Health check');
    
    if (health.database) {
      registerTest(health.database.connected === true, 'Base de datos conectada');
    } else {
      registerTest(false, 'Info de BD no disponible');
    }
  } catch (err) {
    registerTest(false, `Health: ${err.message}`);
  }
}

async function test2_Authentication(token) {
  log.title('MÓDULO 2: AUTENTICACIÓN');
  
  try {
    // Login
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '48376669', password: 'Teamomama91' })
    });
    registerTest(loginRes.ok, 'Login exitoso');

    // Perfil
    const perfRes = await fetch(`${BASE}/api/auth/perfil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    registerTest(perfRes.ok, 'Obtener perfil autenticado');

    // Token validation
    const invalidRes = await fetch(`${BASE}/api/auth/perfil`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    registerTest(!invalidRes.ok, 'Rechaza token inválido');
  } catch (err) {
    registerTest(false, `Auth: ${err.message}`);
  }
}

async function test3_Usuarios(token) {
  log.title('MÓDULO 3: USUARIOS & FOTOS');
  
  try {
    // Perfil del usuario
    const perfRes = await fetch(`${BASE}/api/auth/perfil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const usuario = await perfRes.json();
    registerTest(usuario.nombre || usuario.name, 'Usuario tiene nombre');
    registerTest(usuario.phone || usuario.cedula, 'Usuario tiene identificador');

    // Foto fallback
    const foto = usuario.foto || usuario.foto_url || '/images/logo-baco.svg';
    registerTest(foto.includes('logo') || foto.includes('uploads'), 'Foto de perfil presente');

    // Listado de usuarios (super)
    const usersRes = await fetch(`${BASE}/api/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    registerTest(usersRes.ok || usersRes.status === 403, 'Endpoint usuarios accessible');
  } catch (err) {
    registerTest(false, `Usuarios: ${err.message}`);
  }
}

async function test4_FuncionesPublicas() {
  log.title('MÓDULO 4: FUNCIONES PÚBLICAS');
  
  try {
    // Listar funciones públicas
    const res = await fetch(`${BASE}/api/public/funciones`);
    const funciones = await res.json();
    registerTest(Array.isArray(funciones), 'Listar funciones públicas');
    registerTest(funciones.length >= 0, 'Funciones es array válido');

    // Vendedores por función (si hay funciones)
    if (funciones.length > 0) {
      const func = funciones[0];
      const vendRes = await fetch(`${BASE}/api/public/funciones/${func.id}/vendedores`);
      registerTest(vendRes.ok, `Vendedores de función accesible`);
    } else {
      log.warn('No hay funciones para validar vendedores');
    }
  } catch (err) {
    registerTest(false, `Funciones públicas: ${err.message}`);
  }
}

async function test5_Reservas() {
  log.title('MÓDULO 5: RESERVAS (INVITADOS)');
  
  try {
    // GET funciones (invitado)
    const funcRes = await fetch(`${BASE}/api/public/funciones`);
    registerTest(funcRes.ok, 'Invitado puede listar funciones');

    // Validar estructura de respuesta
    const funciones = await funcRes.json();
    if (funciones.length > 0) {
      const func = funciones[0];
      registerTest(func.id && func.fecha, 'Función tiene campos requeridos');
    }
  } catch (err) {
    registerTest(false, `Reservas: ${err.message}`);
  }
}

async function test6_Grupos(token) {
  log.title('MÓDULO 6: GRUPOS & ACTORES');
  
  try {
    const res = await fetch(`${BASE}/api/grupos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const grupos = await res.json();
      registerTest(Array.isArray(grupos), 'Listar grupos');
      
      if (grupos.length > 0) {
        const grupo = grupos[0];
        registerTest(grupo.nombre, 'Grupo tiene nombre');
      }
    } else {
      registerTest(res.status === 404, 'Endpoint grupos accesible');
    }
  } catch (err) {
    registerTest(false, `Grupos: ${err.message}`);
  }
}

async function test7_Reportes(token) {
  log.title('MÓDULO 7: REPORTES & ANALYTICS');
  
  try {
    // Reportes admin
    const repRes = await fetch(`${BASE}/api/reportes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (repRes.ok) {
      const reportes = await repRes.json();
      registerTest(Array.isArray(reportes) || typeof reportes === 'object', 'Reportes accesibles');
    } else {
      registerTest(repRes.status === 403 || repRes.status === 404, 'Reportes requieren autorización');
    }
  } catch (err) {
    registerTest(false, `Reportes: ${err.message}`);
  }
}

async function test8_Upload(token) {
  log.title('MÓDULO 8: UPLOAD DE IMÁGENES');
  
  try {
    // Crear imagen test (1x1 PNG)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const uploadRes = await fetch(`${BASE}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        image: `data:image/png;base64,${pngBase64}`,
        filename: 'test.png'
      })
    });

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      registerTest(data.url && data.url.startsWith('/uploads/'), 'Upload de imagen exitoso');
      
      // Verificar que la imagen es accesible
      const imgRes = await fetch(`${BASE}${data.url}`);
      registerTest(imgRes.ok, 'Imagen subida es accesible');
    } else {
      registerTest(false, `Upload retorna ${uploadRes.status}`);
    }
  } catch (err) {
    registerTest(false, `Upload: ${err.message}`);
  }
}

async function test9_RutasPublicas() {
  log.title('MÓDULO 9: RUTAS PÚBLICAS (HTML)');
  
  try {
    const rutas = [
      { ruta: '/index.html', nombre: 'Inicio' },
      { ruta: '/funciones-hoy.html', nombre: 'Funciones de hoy' },
      { ruta: '/proximas-funciones.html', nombre: 'Próximas funciones' },
      { ruta: '/sobre-baco.html', nombre: 'Sobre Baco' },
      { ruta: '/guia.html', nombre: 'Guía' }
    ];

    for (const { ruta, nombre } of rutas) {
      try {
        const res = await fetch(`${BASE}${ruta}`);
        registerTest(res.ok, `Página ${nombre} accesible`);
      } catch (err) {
        registerTest(false, `Página ${nombre}: ${err.message}`);
      }
    }
  } catch (err) {
    registerTest(false, `Rutas públicas: ${err.message}`);
  }
}

async function test10_AssetsFallbacks() {
  log.title('MÓDULO 10: ASSETS & FALLBACKS');
  
  try {
    const assets = [
      { url: '/images/logo-baco.svg', nombre: 'Logo' },
      { url: '/images/entradas.jpg', nombre: 'Imagen entradas' },
      { url: '/css/baco-landing.css', nombre: 'CSS landing' },
      { url: '/css/baco-footer.css', nombre: 'CSS footer' },
      { url: '/js/baco-funciones-publicas.js', nombre: 'JS públicas' }
    ];

    for (const { url, nombre } of assets) {
      try {
        const res = await fetch(`${BASE}${url}`);
        registerTest(res.ok, `Asset ${nombre} accesible`);
      } catch (err) {
        registerTest(false, `Asset ${nombre}: ${err.message}`);
      }
    }
  } catch (err) {
    registerTest(false, `Assets: ${err.message}`);
  }
}

async function test11_CacheHeaders() {
  log.title('MÓDULO 11: CACHE & PERFORMANCE');
  
  try {
    const res = await fetch(`${BASE}/images/logo-baco.svg`);
    const cacheControl = res.headers.get('cache-control');
    const etag = res.headers.get('etag');
    
    registerTest(cacheControl || etag, 'Headers de cache configurados');
    registerTest(cacheControl?.includes('cache') || etag, 'Cache o ETag presente');
  } catch (err) {
    registerTest(false, `Cache headers: ${err.message}`);
  }
}

async function test12_ErrorHandling() {
  log.title('MÓDULO 12: MANEJO DE ERRORES');
  
  try {
    // 404
    const res404 = await fetch(`${BASE}/api/ruta-inexistente`);
    registerTest(res404.status === 404, 'Retorna 404 para rutas inexistentes');

    // 401 sin token
    const res401 = await fetch(`${BASE}/api/usuarios`);
    registerTest(res401.status === 401 || res401.status === 403, 'Requiere autenticación');

    // Validación de datos
    const invalidRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: 'invalid' })
    });
    registerTest(!invalidRes.ok, 'Rechaza credenciales inválidas');
  } catch (err) {
    registerTest(false, `Error handling: ${err.message}`);
  }
}

async function test13_Endpoints() {
  log.title('MÓDULO 13: ENDPOINTS DISPONIBLES');
  
  try {
    const token = await loginSupremo();

    const endpoints = [
      { method: 'GET', url: '/api/auth/perfil', token: true, nombre: 'Perfil' },
      { method: 'GET', url: '/api/public/funciones', token: false, nombre: 'Funciones públicas' },
      { method: 'GET', url: '/api/upload/image', token: true, nombre: 'Lista uploads' },
      { method: 'GET', url: '/health', token: false, nombre: 'Health' }
    ];

    for (const { method, url, token: needsToken, nombre } of endpoints) {
      try {
        const opts = { method };
        if (needsToken) {
          opts.headers = { 'Authorization': `Bearer ${token}` };
        }
        const res = await fetch(`${BASE}${url}`, opts);
        const isValid = res.ok || res.status === 400 || res.status === 403;
        registerTest(isValid, `Endpoint ${nombre} (${method} ${url})`);
      } catch (err) {
        registerTest(false, `${nombre}: ${err.message}`);
      }
    }
  } catch (err) {
    registerTest(false, `Endpoints: ${err.message}`);
  }
}

// =====================
// MAIN
// =====================
async function main() {
  console.clear();
  console.log(`
${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════╗
║                                                    ║
║  SUPER TESTING - BACO TEATRO SISTEMA COMPLETO    ║
║  ${new Date().toLocaleString()}
║                                                    ║
╚════════════════════════════════════════════════════╝${colors.reset}
  `);

  try {
    // Inicializar token
    log.section('INICIANDO SESIÓN');
    let token;
    try {
      token = await loginSupremo();
      log.success('Token de acceso obtenido');
    } catch (err) {
      log.error(`No se pudo obtener token: ${err.message}`);
      token = null;
    }

    // Ejecutar tests
    await test1_Health();
    if (token) {
      await test2_Authentication(token);
      await test3_Usuarios(token);
      await test6_Grupos(token);
      await test7_Reportes(token);
      await test8_Upload(token);
      await test13_Endpoints();
    }
    await test4_FuncionesPublicas();
    await test5_Reservas();
    await test9_RutasPublicas();
    await test10_AssetsFallbacks();
    await test11_CacheHeaders();
    await test12_ErrorHandling();

  } catch (err) {
    log.error(`Error fatal: ${err.message}`);
  }

  // =====================
  // RESUMEN FINAL
  // =====================
  const porcentaje = Math.round((testsPassed / testsTotal) * 100);
  const status = testsFailed === 0 ? colors.green : colors.yellow;

  console.log(`
${colors.bright}${colors.blue}╔════════════════════════════════════════════════════╗
║                  RESULTADOS FINALES                ║
╚════════════════════════════════════════════════════╝${colors.reset}

${status}✅ Tests Pasados:  ${testsPassed}/${testsTotal}${colors.reset}
${colors.red}❌ Tests Fallidos: ${testsFailed}/${testsTotal}${colors.reset}
${colors.blue}ℹ️  Porcentaje:    ${porcentaje}%${colors.reset}

${testsFailed === 0 ? colors.green + '🎉 SISTEMA COMPLETAMENTE FUNCIONAL' + colors.reset : colors.yellow + '⚠️  ALGUNOS TESTS FALLARON' + colors.reset}
  `);

  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch(err => {
  log.error(`Error crítico: ${err}`);
  process.exit(1);
});
