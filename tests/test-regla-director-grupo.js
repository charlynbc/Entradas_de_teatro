/*
  Test: Regla "Director sin grupo" + auto-asignación al crear grupo

  Requiere:
  - Backend corriendo (por defecto http://localhost:3000)
  - DATABASE_URL seteado para poder verificar Postgres

  Ejecutar:
    export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
    node tests/test-regla-director-grupo.js
*/

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function loginSupremo() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '48376669', password: 'Teamomama91' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login supremo falló: ${JSON.stringify(data)}`);
  if (!data.token) throw new Error(`Login supremo sin token: ${JSON.stringify(data)}`);
  return data.token;
}

async function dbQuery(sql, params) {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL no está seteado; no se puede verificar la BD');
  }
  const pg = await import('pg');
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('▶ Test regla Director↔Grupo (backend + BD)');

  // Health
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  console.log('Health:', health?.status || health);

  const token = await loginSupremo();
  console.log('✅ Login SUPER OK');

  const unique = Date.now();
  const directorCedula = `T${unique}`;
  const groupName = `Grupo Test ${unique}`;

  let createdGroupId = null;

  try {
    // 1) Crear director (sin grupo)
    const createDirRes = await fetch(`${BASE}/api/usuarios/directores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cedula: directorCedula, nombre: 'Director Sin Grupo', genero: 'otro' }),
    });
    const createDirBody = await createDirRes.json().catch(() => ({}));
    assert(createDirRes.ok, `Crear director falló: HTTP ${createDirRes.status} ${JSON.stringify(createDirBody)}`);
    console.log('✅ Director creado:', directorCedula);

    // 2) Verificar BD: 0 filas en grupo_miembros para ese director
    const gmBefore = await dbQuery(
      'SELECT COUNT(*)::int AS total FROM grupo_miembros WHERE miembro_cedula = $1',
      [directorCedula]
    );
    assert(gmBefore.rows[0].total === 0, `Se esperaba 0 filas en grupo_miembros antes de crear grupo, pero hay ${gmBefore.rows[0].total}`);
    console.log('✅ BD OK: director sin grupos (grupo_miembros=0)');

    // 3) Crear grupo y asignarlo al director
    const createGroupRes = await fetch(`${BASE}/api/grupos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre: groupName,
        descripcion: 'test',
        fecha_inicio: '2026-01-02',
        fecha_fin: '2026-12-31',
        dia_semana: 'Lunes',
        hora_inicio: '19:00',
        obra_a_realizar: 'Obra X',
        director_principal_cedula: directorCedula,
      }),
    });
    const createGroupBody = await createGroupRes.json().catch(() => ({}));
    assert(createGroupRes.ok, `Crear grupo falló: HTTP ${createGroupRes.status} ${JSON.stringify(createGroupBody)}`);

    createdGroupId = createGroupBody?.grupo?.id;
    assert(createdGroupId, `Crear grupo no devolvió grupo.id: ${JSON.stringify(createGroupBody)}`);
    console.log('✅ Grupo creado:', createdGroupId);

    // 4) Verificar BD: fila DIRECTOR en grupo_miembros y grupos.director_cedula
    const groupRow = await dbQuery('SELECT id, director_cedula FROM grupos WHERE id = $1', [createdGroupId]);
    assert(groupRow.rows.length === 1, 'Grupo no encontrado en BD');
    assert(groupRow.rows[0].director_cedula === directorCedula, `grupos.director_cedula esperado ${directorCedula} pero fue ${groupRow.rows[0].director_cedula}`);

    const gmAfter = await dbQuery(
      "SELECT grupo_id, miembro_cedula, rol_en_grupo, activo FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2",
      [createdGroupId, directorCedula]
    );
    assert(gmAfter.rows.length === 1, `Se esperaba 1 fila en grupo_miembros para director en grupo ${createdGroupId}, pero hay ${gmAfter.rows.length}`);
    assert(gmAfter.rows[0].rol_en_grupo === 'DIRECTOR', `rol_en_grupo esperado DIRECTOR pero fue ${gmAfter.rows[0].rol_en_grupo}`);
    assert(gmAfter.rows[0].activo === true, 'Se esperaba activo=true en grupo_miembros');
    console.log('✅ BD OK: auto-asignación DIRECTOR en grupo_miembros');

    console.log('✅ Test regla Director↔Grupo: OK');
  } finally {
    // Limpieza best-effort (para no ensuciar la BD)
    if (createdGroupId) {
      try {
        await fetch(`${BASE}/api/grupos/${createdGroupId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {
        // ignore
      }
    }

    try {
      await fetch(`${BASE}/api/usuarios/${directorCedula}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error('❌ Test regla Director↔Grupo falló:', err);
  process.exit(1);
});
