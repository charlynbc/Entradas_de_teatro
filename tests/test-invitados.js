const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('▶ Test INVITADO (guest): inicio');
  // Health y API pública
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log('Health:', health);

  const api = await fetch(`${BASE}/api`).then(r => r.json());
  console.log('API:', api);

  // Listado público (si existiera)
  const shows = await fetch(`${BASE}/api/shows`).then(r => r.json());
  console.log('Shows públicos:', Array.isArray(shows) ? shows.length : shows);

  console.log('✅ Test INVITADO: OK');
}

main().catch(err => { console.error('❌ Error en test INVITADO:', err); process.exit(1); });
