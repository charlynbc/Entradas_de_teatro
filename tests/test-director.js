const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function loginDirector() {
  const creds = { phone: '48376668', password: 'admin123', name: 'Director' };
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
    if (!cr.ok) throw new Error(`Completar registro director falló: ${JSON.stringify(crd)}`);
    return crd.token;
  }
  if (!res.ok) throw new Error(`Login director falló: ${JSON.stringify(data)}`);
  return data.token;
}

async function main() {
  console.log('▶ Test DIRECTOR: inicio');
  const token = await loginDirector();

  // Listar shows
  const shows = await fetch(`${BASE}/api/shows`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  console.log('Shows:', Array.isArray(shows) ? shows.length : shows);

  // Reportes obras
  const reportesObras = await fetch(`${BASE}/api/reportes-obras`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  console.log('Reportes obras:', Array.isArray(reportesObras) ? reportesObras.length : reportesObras);

  console.log('✅ Test DIRECTOR: OK');
}

main().catch(err => { console.error('❌ Error en test DIRECTOR:', err); process.exit(1); });
