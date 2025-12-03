import 'dotenv/config';
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'https://baco-teatro-1jxj.onrender.com';

let token = null;

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
}

async function test() {
  console.log('🧪 TESTING: Sistema completo de gestión de obras\n');
  
  try {
    // 1. Login como SUPER
    console.log('1️⃣ Login como Super Usuario...');
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: '48376669', password: 'super123' })
    });
    token = loginRes.token;
    console.log(`✅ Login exitoso - Token: ${token.substring(0, 20)}...\n`);
    
    // 2. Crear un director
    console.log('2️⃣ Crear un director de prueba...');
    const timestamp = Date.now().toString().slice(-6);
    const directorData = {
      cedula: `111${timestamp}`,
      nombre: 'Director Prueba',
      password: 'dir123',
      rol: 'admin'
    };
    const directorRes = await api('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(directorData)
    });
    console.log(`✅ Director creado: ${directorRes.user.name}\n`);
    
    // 3. Login como director
    console.log('3️⃣ Login como Director...');
    const dirLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: directorData.cedula, password: 'dir123' })
    });
    token = dirLogin.token;
    console.log('✅ Login como director exitoso\n');
    
    // 4. Crear una obra
    console.log('4️⃣ Crear una obra...');
    const obraData = {
      obra: 'Hamlet - Test',
      fecha: new Date('2025-02-15').toISOString(),
      lugar: 'Teatro Principal',
      capacidad: 10,
      base_price: 50000
    };
    const obraRes = await api('/api/shows', {
      method: 'POST',
      body: JSON.stringify(obraData)
    });
    const showId = obraRes.show.id;
    console.log(`✅ Obra creada: ${obraRes.show.obra} (ID: ${showId})\n`);
    
    // 5. Editar la obra
    console.log('5️⃣ Editar la obra...');
    const updateData = {
      obra: 'Hamlet - Editado',
      base_price: 60000
    };
    const updateRes = await api(`/api/shows/${showId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    console.log(`✅ Obra editada: ${updateRes.obra.nombre || updateRes.obra.obra}\n`);
    
    // 6. Crear un vendedor
    console.log('6️⃣ Login como SUPER y crear vendedor...');
    const superLogin = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone: '48376669', password: 'super123' })
    });
    token = superLogin.token;
    
    const vendedorData = {
      cedula: `222${timestamp}`,
      nombre: 'Vendedor Prueba',
      password: 'ven123',
      rol: 'vendedor'
    };
    const vendedorRes = await api('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(vendedorData)
    });
    console.log(`✅ Vendedor creado: ${vendedorRes.user.name}\n`);
    
    // 7. Login como director de nuevo
    console.log('7️⃣ Login como Director de nuevo...');
    token = dirLogin.token;
    
    // 8. Agregar vendedor al elenco
    console.log('8️⃣ Agregar vendedor al elenco de la obra...');
    const castRes = await api(`/api/shows/${showId}/cast`, {
      method: 'POST',
      body: JSON.stringify({ cedula_vendedor: vendedorData.cedula })
    });
    console.log(`✅ ${castRes.vendedor.nombre} agregado al elenco\n`);
    
    // 9. Listar elenco
    console.log('9️⃣ Listar elenco de la obra...');
    const elencoRes = await api(`/api/shows/${showId}/cast`);
    console.log(`✅ Elenco: ${elencoRes.elenco.length} vendedor(es)`);
    elencoRes.elenco.forEach(v => {
      console.log(`   - ${v.name} (${v.cedula})`);
    });
    console.log('');
    
    // 10. Remover vendedor del elenco
    console.log('🔟 Remover vendedor del elenco...');
    const removeRes = await api(`/api/shows/${showId}/cast/${vendedorData.cedula}`, {
      method: 'DELETE'
    });
    console.log(`✅ ${removeRes.mensaje}\n`);
    
    // 11. Eliminar obra
    console.log('1️⃣1️⃣ Eliminar la obra...');
    const deleteRes = await api(`/api/shows/${showId}`, {
      method: 'DELETE'
    });
    console.log(`✅ ${deleteRes.mensaje}\n`);
    
    // 12. Limpiar - eliminar usuarios de prueba
    console.log('1️⃣2️⃣ Limpieza: eliminar usuarios de prueba...');
    token = superLogin.token;
    await api(`/api/usuarios/${directorData.cedula}`, { method: 'DELETE' });
    await api(`/api/usuarios/${vendedorData.cedula}`, { method: 'DELETE' });
    console.log('✅ Usuarios de prueba eliminados\n');
    
    console.log('✅✅✅ TODOS LOS TESTS PASARON EXITOSAMENTE ✅✅✅');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
