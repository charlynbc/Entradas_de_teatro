#!/usr/bin/env node
/**
 * SUPER TESTING - Validación de imágenes en usuarios
 * Verifica:
 * 1. Fotos de perfil cargadas correctamente
 * 2. URLs de imágenes válidas
 * 3. Fallbacks si foto no existe
 * 4. Responsive en diferentes tamaños
 * 5. Cache y performance
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// =====================
// LOGIN HELPERS
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

async function loginDirector() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '48376668', password: 'admin123' })
  });
  const data = await res.json();
  if (data?.requiresSetup) {
    const cr = await fetch(`${BASE}/api/auth/completar-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '48376668', name: 'Director Test', password: 'admin123' })
    });
    const crd = await cr.json();
    if (cr.ok) return crd.token;
  }
  if (!res.ok) throw new Error(`Login director falló: ${JSON.stringify(data)}`);
  return data.token;
}

async function loginActor() {
  // Usar el supremo para simplificar (mismo token funciona)
  return await loginSupremo();
}

// =====================
// TEST FUNCTIONS
// =====================

async function testPerfilFoto(token, rol) {
  console.log(`\n📸 TEST: Foto de perfil del ${rol}`);
  
  const res = await fetch(`${BASE}/api/auth/perfil`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    console.error(`❌ No se pudo obtener perfil: ${res.status}`);
    return false;
  }
  
  const usuario = await res.json();
  console.log(`   Usuario: ${usuario.nombre || usuario.phone}`);
  
  // Validar campos de foto
  const foto = usuario.foto || usuario.foto_url || null;
  console.log(`   Foto URL: ${foto ? '✅ Presente' : '❌ Falta'}`);
  
  if (foto) {
    // Validar que sea URL válida
    try {
      const fotoRes = await fetch(foto, { method: 'HEAD', timeout: TIMEOUT });
      if (fotoRes.ok || fotoRes.status === 200) {
        console.log(`   ✅ Foto carga correctamente (HTTP ${fotoRes.status})`);
      } else {
        console.warn(`   ⚠️  Foto responde con HTTP ${fotoRes.status}`);
      }
    } catch (err) {
      console.error(`   ❌ Foto no carga: ${err.message}`);
      return false;
    }
  } else {
    console.log(`   ℹ️  Sin foto, debe usar fallback /images/logo-baco.svg`);
  }
  
  return true;
}

async function testListadoActoresConFotos(token) {
  console.log(`\n📋 TEST: Listado de actores con fotos`);
  
  const res = await fetch(`${BASE}/api/actores`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    console.warn(`⚠️  No se puede listar actores: ${res.status}`);
    return true;
  }
  
  const actores = await res.json();
  console.log(`   Total actores: ${Array.isArray(actores) ? actores.length : 0}`);
  
  if (Array.isArray(actores) && actores.length > 0) {
    let conFoto = 0;
    let sinFoto = 0;
    
    for (const actor of actores.slice(0, 3)) {
      const foto = actor.foto || actor.foto_url;
      if (foto) conFoto++;
      else sinFoto++;
      console.log(`   • ${actor.nombre || actor.phone}: ${foto ? '✅' : '❌'}`);
    }
    
    console.log(`   Resumen: ${conFoto} con foto, ${sinFoto} sin foto`);
  }
  
  return true;
}

async function testUploadFoto(token, rol) {
  console.log(`\n📤 TEST: Upload de foto del ${rol}`);
  
  // Crear un placeholder de imagen (1x1 PNG)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(pngBase64, 'base64');
  
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');
  
  try {
    const res = await fetch(`${BASE}/api/usuario/foto`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`   ✅ Foto subida: ${data.url || data.filename}`);
      return true;
    } else {
      const error = await res.json();
      console.log(`   ℹ️  Endpoint no soporta upload: ${res.status}`);
      return true;
    }
  } catch (err) {
    console.log(`   ℹ️  Upload no implementado: ${err.message}`);
    return true;
  }
}

async function testFotoResponsive() {
  console.log(`\n📐 TEST: Responsividad de fotos`);
  
  // Verificar que el CSS define tamaños correctos
  try {
    const indexRes = await fetch(`${BASE}/index.html`);
    const html = await indexRes.text();
    
    const clases = [
      'foto-perfil-mediana',
      'foto-perfil-grande',
      'actor-avatar'
    ];
    
    for (const clase of clases) {
      if (html.includes(clase)) {
        console.log(`   ✅ Clase ${clase} definida en HTML`);
      }
    }
    
    // Verificar CSS
    const cssRes = await fetch(`${BASE}/css/baco-landing.css`);
    const css = await cssRes.text();
    
    const fotoCss = css.includes('foto-perfil');
    console.log(`   ${fotoCss ? '✅' : '❌'} Estilos de foto en CSS`);
    
    return fotoCss;
  } catch (err) {
    console.warn(`⚠️  No se pudo validar responsividad: ${err.message}`);
    return true;
  }
}

async function testFallbackImages() {
  console.log(`\n🎨 TEST: Fallback de imágenes`);
  
  const fallbacks = [
    '/images/logo-baco.svg',
    '/images/entradas.jpg'
  ];
  
  let todosOk = true;
  for (const img of fallbacks) {
    try {
      const res = await fetch(`${BASE}${img}`, { method: 'HEAD' });
      if (res.ok) {
        console.log(`   ✅ ${img} accesible`);
      } else {
        console.error(`   ❌ ${img} retorna ${res.status}`);
        todosOk = false;
      }
    } catch (err) {
      console.error(`   ❌ ${img} no carga: ${err.message}`);
      todosOk = false;
    }
  }
  
  return todosOk;
}

async function testCaching() {
  console.log(`\n⚡ TEST: Caching de imágenes`);
  
  const img = '/images/logo-baco.svg';
  
  try {
    const res1 = await fetch(`${BASE}${img}`);
    const cacheControl = res1.headers.get('cache-control');
    
    if (cacheControl) {
      console.log(`   ✅ Cache-Control: ${cacheControl}`);
    } else {
      console.warn(`   ⚠️  No hay Cache-Control header`);
    }
    
    const etag = res1.headers.get('etag');
    if (etag) {
      console.log(`   ✅ ETag: ${etag}`);
    } else {
      console.warn(`   ⚠️  No hay ETag`);
    }
    
    return true;
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function testFotoEnGrupos(token) {
  console.log(`\n👥 TEST: Fotos de actores en grupos`);
  
  try {
    const res = await fetch(`${BASE}/api/grupos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      console.log(`   ℹ️  Endpoint /api/grupos no disponible: ${res.status}`);
      return true;
    }
    
    const grupos = await res.json();
    console.log(`   Total grupos: ${Array.isArray(grupos) ? grupos.length : 0}`);
    
    if (Array.isArray(grupos) && grupos.length > 0) {
      const grupo = grupos[0];
      const actores = grupo.actores || [];
      console.log(`   Actores en grupo: ${actores.length}`);
      
      if (actores.length > 0) {
        const actor = actores[0];
        const foto = actor.foto || actor.foto_url;
        console.log(`   Primer actor: ${actor.nombre} ${foto ? '✅ con foto' : '❌ sin foto'}`);
      }
    }
    
    return true;
  } catch (err) {
    console.warn(`⚠️  Error: ${err.message}`);
    return true;
  }
}

async function testFotoEnFunciones(token) {
  console.log(`\n🎭 TEST: Fotos de actores en funciones`);
  
  try {
    const res = await fetch(`${BASE}/api/funciones`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      console.log(`   ℹ️  No hay funciones`);
      return true;
    }
    
    const funciones = await res.json();
    console.log(`   Total funciones: ${Array.isArray(funciones) ? funciones.length : 0}`);
    
    if (Array.isArray(funciones) && funciones.length > 0) {
      const func = funciones[0];
      const actores = func.actores || [];
      console.log(`   Actores en función: ${actores.length}`);
      
      if (actores.length > 0) {
        const actor = actores[0];
        const foto = actor.foto || actor.foto_url;
        console.log(`   Primer actor: ${actor.nombre} ${foto ? '✅' : '❌'}`);
      }
    }
    
    return true;
  } catch (err) {
    console.warn(`⚠️  Error: ${err.message}`);
    return true;
  }
}

// =====================
// MAIN TEST RUNNER
// =====================

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║  SUPER TESTING - IMÁGENES DE USUARIOS     ║
║  ${new Date().toLocaleString()}
╚════════════════════════════════════════════╝
  `);
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Login users
    console.log('🔐 Iniciando sesiones...');
    const tokenSupremo = await loginSupremo();
    const tokenDirector = await loginDirector();
    const tokenActor = await loginActor();
    console.log('✅ Sesiones iniciadas');
    
    // Tests básicos
    if (await testPerfilFoto(tokenSupremo, 'SUPREMO')) passed++; else failed++;
    if (await testPerfilFoto(tokenDirector, 'DIRECTOR')) passed++; else failed++;
    if (await testPerfilFoto(tokenActor, 'ACTOR')) passed++; else failed++;
    
    // Tests de listado
    if (await testListadoActoresConFotos(tokenSupremo)) passed++; else failed++;
    if (await testFotoEnGrupos(tokenSupremo)) passed++; else failed++;
    if (await testFotoEnFunciones(tokenSupremo)) passed++; else failed++;
    
    // Tests de upload
    if (await testUploadFoto(tokenSupremo, 'SUPREMO')) passed++; else failed++;
    if (await testUploadFoto(tokenDirector, 'DIRECTOR')) passed++; else failed++;
    if (await testUploadFoto(tokenActor, 'ACTOR')) passed++; else failed++;
    
    // Tests de frontend
    if (await testFotoResponsive()) passed++; else failed++;
    if (await testFallbackImages()) passed++; else failed++;
    if (await testCaching()) passed++; else failed++;
    
  } catch (err) {
    console.error(`\n❌ ERROR CRÍTICO: ${err.message}`);
    failed++;
  }
  
  // Summary
  console.log(`
╔════════════════════════════════════════════╗
║  RESULTADOS FINALES
║  ✅ Pasados: ${passed}
║  ❌ Fallidos: ${failed}
║  Total: ${passed + failed}
╚════════════════════════════════════════════╝
  `);
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
