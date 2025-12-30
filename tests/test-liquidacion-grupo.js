const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function login(cedula, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: cedula, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login ${cedula} falló: ${JSON.stringify(data)}`);
  return data.token;
}

async function main() {
  console.log('▶ Test LIQUIDACIÓN GRUPO: inicio');

  const tokenDirector = await login('48376668', 'admin123');
  const tokenActor = await login('48376667', 'admin123');

  // 1) Crear grupo (director)
  const hoy = new Date();
  const fechaInicio = hoy.toISOString().slice(0, 10);
  const fechaFin = new Date(hoy.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const grupoRes = await fetch(`${BASE}/api/grupos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({
      nombre: `Grupo Liquidación ${Date.now()}`,
      descripcion: 'Grupo de prueba para liquidación',
      dia_semana: 'Lunes',
      hora_inicio: '19:00:00',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      obra_a_realizar: 'Obra Liquidación'
    })
  });
  const grupoData = await grupoRes.json();
  if (!grupoRes.ok) throw new Error(`Crear grupo falló: ${JSON.stringify(grupoData)}`);
  const grupoId = grupoData.grupo?.id;
  if (!grupoId) throw new Error('No se recibió grupo.id');

  // 2) Crear obra (director)
  const obraRes = await fetch(`${BASE}/api/obras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({
      grupo_id: grupoId,
      nombre: `Obra ${Date.now()}`,
      descripcion: 'Obra de prueba'
    })
  });
  const obraData = await obraRes.json();
  if (!obraRes.ok) throw new Error(`Crear obra falló: ${JSON.stringify(obraData)}`);
  const obraId = obraData?.id;
  if (!obraId) throw new Error('No se recibió obra.id');

  // 3) Crear función con capacidad chica (director)
  const fechaFuncion = new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const funcionRes = await fetch(`${BASE}/api/funciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({
      obra_id: obraId,
      fecha: fechaFuncion,
      lugar: 'Sala Test',
      capacidad: 3,
      precio_base: 200
    })
  });
  const funcionData = await funcionRes.json();
  if (!funcionRes.ok) throw new Error(`Crear función falló: ${JSON.stringify(funcionData)}`);
  const funcionId = funcionData?.funcion?.id || funcionData?.id;
  if (!funcionId) throw new Error('No se recibió funcion.id');

  // 4) Asignar 2 tickets al actor (director/admin)
  const asignarRes = await fetch(`${BASE}/api/tickets/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({ cantidad: 2, funcion_id: funcionId, actor_cedula: '48376667' })
  });
  const asignarData = await asignarRes.json();
  if (!asignarRes.ok) throw new Error(`Asignar tickets falló: ${JSON.stringify(asignarData)}`);

  // 5) Actor: listar stock y reportar venta de 2 tickets
  const stockRes = await fetch(`${BASE}/api/tickets/stock?showId=${funcionId}`, {
    headers: { 'Authorization': `Bearer ${tokenActor}` }
  });
  const stockData = await stockRes.json();
  if (!stockRes.ok) throw new Error(`Stock actor falló: ${JSON.stringify(stockData)}`);

  const codes = (Array.isArray(stockData) ? stockData : (stockData?.tickets || stockData || [])).map(t => t.code || t.id).filter(Boolean);
  if (codes.length < 2) throw new Error(`Stock insuficiente: ${codes.length}`);

  for (const code of codes.slice(0, 2)) {
    const repRes = await fetch(`${BASE}/api/tickets/estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActor}` },
      body: JSON.stringify({ ticketId: code, estado: 'REPORTADA_VENDIDA', comprador_nombre: 'Cliente', comprador_telefono: '099999999' })
    });
    const repData = await repRes.json();
    if (!repRes.ok) throw new Error(`Reportar venta falló (${code}): ${JSON.stringify(repData)}`);
  }

  // 6) Director: aprobar cobro (PAGADO)
  const cobrarRes = await fetch(`${BASE}/api/tickets/cobrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({ showId: funcionId, actorId: '48376667' })
  });
  const cobrarData = await cobrarRes.json();
  if (!cobrarRes.ok) throw new Error(`Cobrar tickets falló: ${JSON.stringify(cobrarData)}`);
  if (!cobrarData.ok || cobrarData.count < 1) throw new Error(`Cobro no aplicó: ${JSON.stringify(cobrarData)}`);

  // 7) Validar 1 ticket para pasar a USADO
  const validarRes = await fetch(`${BASE}/api/tickets/validar/${codes[0]}`, {
    headers: { 'Authorization': `Bearer ${tokenDirector}` }
  });
  const validarData = await validarRes.json();
  if (!validarRes.ok) throw new Error(`Validar ticket falló: ${JSON.stringify(validarData)}`);

  // 8) Finalizar grupo (ARCHIVADO)
  const finRes = await fetch(`${BASE}/api/grupos/${grupoId}/finalizar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenDirector}` }
  });
  const finData = await finRes.json();
  if (!finRes.ok) throw new Error(`Finalizar grupo falló: ${JSON.stringify(finData)}`);

  // 9) Crear snapshot liquidación
  const liqCreateRes = await fetch(`${BASE}/api/grupos/${grupoId}/liquidacion-final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenDirector}` },
    body: JSON.stringify({ gastos_total: 100, alquiler_total: 50 })
  });
  const liqCreateData = await liqCreateRes.json();
  if (!liqCreateRes.ok) throw new Error(`Crear liquidación falló: ${JSON.stringify(liqCreateData)}`);

  // 10) Obtener liquidación (debe traer snapshot y calculado)
  const liqGetRes = await fetch(`${BASE}/api/grupos/${grupoId}/liquidacion-final`, {
    headers: { 'Authorization': `Bearer ${tokenDirector}` }
  });
  const liqGetData = await liqGetRes.json();
  if (!liqGetRes.ok) throw new Error(`Obtener liquidación falló: ${JSON.stringify(liqGetData)}`);

  const ingresos = liqGetData?.snapshot?.ingresos_total ?? liqGetData?.calculado?.totales?.ingresos_total;
  if (typeof ingresos !== 'number' || ingresos <= 0) {
    throw new Error(`Ingresos inválidos en liquidación: ${JSON.stringify(liqGetData)}`);
  }

  console.log('✅ Test LIQUIDACIÓN GRUPO: OK');
}

main().catch(err => {
  console.error('❌ Error en test LIQUIDACIÓN GRUPO:', err);
  process.exit(1);
});
