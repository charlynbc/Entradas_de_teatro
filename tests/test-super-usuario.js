const BASE = process.env.BASE_URL || 'http://localhost:3000';

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

async function main() {
  console.log('▶ Test SUPER usuario: inicio');
  const token = await loginSupremo();

  // Health
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log('Health:', health);

  // Crear show (si existe endpoint admin)
  const showRes = await fetch(`${BASE}/api/admin/crear-show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ obra: 'Obra Test', fecha: new Date().toISOString(), capacidad: 50, base_price: 1000 })
  });
  console.log('Crear show status:', showRes.status);

  // Listar reportes admin
  const rep = await fetch(`${BASE}/api/reportes`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  console.log('Reportes:', Array.isArray(rep) ? rep.length : rep);

  console.log('✅ Test SUPER usuario: OK');
}

main().catch(err => { console.error('❌ Error en test SUPER:', err); process.exit(1); });
