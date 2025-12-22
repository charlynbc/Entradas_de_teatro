import 'dotenv/config';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';
const pool = new Pool({ connectionString: url });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seed mínimo: usuarios.phone, show y ticket de prueba');
    await client.query('BEGIN');

    // Alinear phone con cedula para usuarios existentes
    await client.query("UPDATE users SET phone = cedula WHERE phone IS NULL");

    // Crear show de prueba si no existe
    const showRes = await client.query(
      "INSERT INTO shows (obra, fecha, lugar, capacidad, base_price) VALUES ($1, NOW() + INTERVAL '2 days', $2, $3, $4) RETURNING id",
      ['Obra Test', 'Sala Principal', 50, 1000]
    );
    const showId = showRes.rows[0].id;

    // Crear ticket de prueba y asignarlo al vendedor 48376669
    await client.query(
      "INSERT INTO tickets (code, show_id, estado, vendedor_phone, precio) VALUES ($1, $2, $3, $4, $5)",
      ['T-TEST-0001', showId, 'STOCK_VENDEDOR', '48376669', 1000]
    );

    await client.query('COMMIT');
    console.log('✅ Seed aplicado. show_id=', showId);
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
