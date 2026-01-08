import pool from '../db/postgres.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear director si no existe
    const dirCedula = '20000001';
    const dirPhone = '091000001';
    const dirName = 'Director Demo';
    const bcrypt = (await import('bcrypt')).default;
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (cedula, name, role, password_hash, phone, active)
       VALUES ($1, $2, 'ADMIN', $3, $4, TRUE)
       ON CONFLICT (cedula) DO NOTHING`,
      [dirCedula, dirName, hash, dirPhone]
    );

    // Crear actor vendedor demo
    const actorCedula = '20000002';
    const actorPhone = '091000002';
    const actorName = 'Actor Vendedor';
    await client.query(
      `INSERT INTO users (cedula, name, role, password_hash, phone, active)
       VALUES ($1, $2, 'ACTOR', $3, $4, TRUE)
       ON CONFLICT (cedula) DO NOTHING`,
      [actorCedula, actorName, hash, actorPhone]
    );

    // Crear grupo demo
    const g = await client.query(
      `INSERT INTO grupos (nombre, descripcion, director_cedula, estado)
       VALUES ('Grupo Demo', 'Grupo de prueba', $1, 'ACTIVO')
       ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
       RETURNING *`,
      [dirCedula]
    );
    const grupoId = g.rows[0].id;

    // Director miembro
    await client.query(
      `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
       VALUES ($1, $2, 'DIRECTOR', TRUE)
       ON CONFLICT (grupo_id, miembro_cedula) DO NOTHING`,
      [grupoId, dirCedula]
    );
    // Actor miembro
    await client.query(
      `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
       VALUES ($1, $2, 'ACTOR', TRUE)
       ON CONFLICT (grupo_id, miembro_cedula) DO NOTHING`,
      [grupoId, actorCedula]
    );

    // Crear obra común
    const o1 = await client.query(
      `INSERT INTO obras (grupo_id, nombre, descripcion, estado, es_profesional)
       VALUES ($1, 'Obra Común Demo', 'Obra de grupo', 'LISTA', FALSE)
       RETURNING *`,
      [grupoId]
    );
    const obraComunId = o1.rows[0].id;

    // Crear obra profesional
    const o2 = await client.query(
      `INSERT INTO obras (grupo_id, nombre, descripcion, estado, es_profesional)
       VALUES ($1, 'Obra Profesional Demo', 'Obra profesional', 'LISTA', TRUE)
       RETURNING *`,
      [grupoId]
    );
    const obraProfId = o2.rows[0].id;

    // Función futura común (mañana 20:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    const f1 = await client.query(
      `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
       VALUES ($1, $2, 'Sala A', 10, 200, 'PROGRAMADA')
       RETURNING *`,
      [obraComunId, tomorrow]
    );
    const funcionComunId = f1.rows[0].id;

    // Función futura profesional (pasado mañana 21:00)
    const next = new Date();
    next.setDate(next.getDate() + 2);
    next.setHours(21, 0, 0, 0);
    const f2 = await client.query(
      `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
       VALUES ($1, $2, 'Sala B', 8, 300, 'PROGRAMADA')
       RETURNING *`,
      [obraProfId, next]
    );
    const funcionProfId = f2.rows[0].id;

    // Generar tickets comunes
    const tickets1 = [];
    for (let i = 1; i <= 10; i++) {
      tickets1.push([`T-${funcionComunId}-${String(i).padStart(3,'0')}`, funcionComunId, 200]);
    }
    await client.query(
      `INSERT INTO tickets (code, funcion_id, precio, estado)
       VALUES ${tickets1.map((_,i)=>`($${i*3+1}, $${i*3+2}, $${i*3+3}, 'DISPONIBLE')`).join(',')}`,
      tickets1.flat()
    );
    // Asignar algunos al actor
    await client.query(
      `UPDATE tickets SET estado = 'STOCK_ACTOR', vendedor_phone = $1
       WHERE funcion_id = $2 AND code IN (
         SELECT code FROM tickets WHERE funcion_id = $2 ORDER BY code ASC LIMIT 3
       )`,
      [actorPhone, funcionComunId]
    );

    // Generar tickets profesionales (queda en DISPO para boletería)
    const tickets2 = [];
    for (let i = 1; i <= 8; i++) {
      tickets2.push([`T-${funcionProfId}-${String(i).padStart(3,'0')}`, funcionProfId, 300]);
    }
    await client.query(
      `INSERT INTO tickets (code, funcion_id, precio, estado)
       VALUES ${tickets2.map((_,i)=>`($${i*3+1}, $${i*3+2}, $${i*3+3}, 'DISPONIBLE')`).join(',')}`,
      tickets2.flat()
    );

    await client.query('COMMIT');
    console.log('✅ Seed demo completado');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error seed demo:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
