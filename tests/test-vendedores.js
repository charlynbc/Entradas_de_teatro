const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function loginVendedor() {
  const creds = { phone: '48376667', password: 'admin123', name: 'Vendedor Base' };
  let res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: creds.phone, password: creds.password })
  });
  let data = await res.json();
  if (data && data.requiresSetup) {
    const cr = await fetch(`${BASE}/api/auth/completar-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: creds.phone, name: creds.name, password: creds.password })
    });
    const crd = await cr.json();
    if (!cr.ok) throw new Error(`Completar registro vendedor falló: ${JSON.stringify(crd)}`);
    return crd.token;
  }
  if (!res.ok) throw new Error(`Login vendedor falló: ${JSON.stringify(data)}`);
  return data.token;
}

async function main() {
  console.log('▶ Test VENDEDOR: inicio');
  const token = await loginVendedor();

  // Listar tickets propios (ruta existente)
  let tickets = await fetch(`${BASE}/api/tickets/mis-tickets`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  console.log('Mis tickets:', Array.isArray(tickets) ? tickets.length : tickets);

  // Si no hay tickets, asignar 1 al show más reciente
  if (Array.isArray(tickets) && tickets.length === 0) {
    const shows = await fetch(`${BASE}/api/shows`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
    const ultimoShow = Array.isArray(shows) && shows.length ? shows[0] : null;
    if (ultimoShow && ultimoShow.id) {
      const asignar = await fetch(`${BASE}/api/tickets/asignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cantidad: 1, show_id: ultimoShow.id })
      });
      console.log('Asignar tickets status:', asignar.status);
      tickets = await fetch(`${BASE}/api/tickets/mis-tickets`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
      console.log('Mis tickets (post-asignacion):', Array.isArray(tickets) ? tickets.length : tickets);
    }
  }

  // Validar un ticket de prueba (si existe T-TEST-0001)
  const validar = await fetch(`${BASE}/api/tickets/validar/T-TEST-0001`);
  console.log('Validar T-TEST-0001 status:', validar.status);

  console.log('✅ Test VENDEDOR: OK');
}

main().catch(err => { console.error('❌ Error en test VENDEDOR:', err); process.exit(1); });
