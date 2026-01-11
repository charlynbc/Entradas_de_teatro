import 'dotenv/config';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';
const pool = new Pool({ connectionString: url });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seed mínimo v3: users.phone, grupo → obra → función → ticket');
    await client.query('BEGIN');

    // Alinear phone con cedula para usuarios existentes
    await client.query("UPDATE users SET phone = cedula WHERE phone IS NULL");

    // Director por defecto (usar SUPER si no hay director)
    const directorCedula = '48376669'; // SUPER creado por bootstrap

    // Crear grupo demo
    const grupoRes = await client.query(
      `INSERT INTO grupos (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, estado)
       VALUES ($1, $2, $3, $4, $5, NOW()::date, NOW()::date + INTERVAL '30 days', 'ACTIVO')
       RETURNING id`,
      ['Grupo Demo', 'Grupo de demostración', directorCedula, 'viernes', '20:00']
    );
    const grupoId = grupoRes.rows[0].id;

    // Crear obra demo
    const obraRes = await client.query(
      `INSERT INTO obras (grupo_id, nombre, descripcion, autor, genero, duracion_aprox, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'LISTA') RETURNING id`,
      [grupoId, 'Obra Demo', 'Obra de demostración', 'Equipo Demo', 'Drama', 90]
    );
    const obraId = obraRes.rows[0].id;

    // Crear función demo (en 2 días)
    const funcionRes = await client.query(
      `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
       VALUES ($1, NOW() + INTERVAL '2 days', $2, $3, $4, 'CONFIRMADA') RETURNING id`,
      [obraId, 'Sala Principal', 50, 1000]
    );
    const funcionId = funcionRes.rows[0].id;

    // Crear ticket demo asignado a vendedor_phone 48376667
    await client.query(
      `INSERT INTO tickets (code, funcion_id, estado, vendedor_phone, precio)
       VALUES ($1, $2, $3, $4, $5)`,
      ['T-TEST-0001', funcionId, 'STOCK_VENDEDOR', '48376667', 1000]
    );

    await client.query('COMMIT');
    console.log('✅ Seed aplicado. funcion_id=', funcionId);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
