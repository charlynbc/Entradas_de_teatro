import 'dotenv/config';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro';
const pool = new Pool({ connectionString: url });

async function limpiezaAutomatica() {
  const client = await pool.connect();
  try {
    const ahora = new Date();
    // Borrado de datos no necesarios manteniendo supremo
    await client.query('BEGIN');
    await client.query('DELETE FROM reportes_obras');
    await client.query('DELETE FROM ensayos_generales');
    await client.query('DELETE FROM tickets');
    await client.query('DELETE FROM shows WHERE fecha < NOW()');
    await client.query("DELETE FROM users WHERE cedula <> '48376669' AND (rol IS NULL OR LOWER(rol) <> 'supremo')");
    await client.query('COMMIT');
    const ts = new Date().toLocaleString('es-AR');
    console.log(`[${ts}] ✅ Limpieza automática (PostgreSQL) aplicada`);
  } catch (err) {
    await client.query('ROLLBACK');
    const ts = new Date().toLocaleString('es-AR');
    console.error(`[${ts}] ❌ Error en limpieza automática (PostgreSQL):`, err.message);
  } finally {
    client.release();
  }
}

// Ejecutar inmediatamente
limpiezaAutomatica()
  .finally(() => pool.end());

// Intervalo opcional
if (process.env.AUTO_CLEANUP_INTERVAL) {
  const hours = Number(process.env.AUTO_CLEANUP_INTERVAL) || 6;
  setInterval(limpiezaAutomatica, hours * 60 * 60 * 1000);
}
