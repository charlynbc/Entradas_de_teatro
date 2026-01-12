import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedMinimo } from '../../seed-minimo-init.js';
import { ensureTestEnv, DEFAULT_TEST_DB_URL } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const DATABASE_URL = ensureTestEnv() || DEFAULT_TEST_DB_URL;

let pool;

function sanitizeDbName(name) {
  const clean = name.replace(/^\//, '');
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    throw new Error(`Nombre de base de datos inválido: ${clean}`);
  }
  return clean;
}

async function ensureDatabaseExists() {
  const url = new URL(DATABASE_URL);
  const dbName = sanitizeDbName(url.pathname);
  const adminUrl = new URL(DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  try {
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
  } catch (err) {
    // 42P04 = database already exists
    if (err.code !== '42P04') {
      throw err;
    }
  } finally {
    await adminPool.end();
  }
}

async function applySqlFile(client, relativePath) {
  const filePath = path.join(projectRoot, relativePath);
  const sql = await fs.readFile(filePath, 'utf8');
  await client.query(sql);
}

async function applyMigrations(client) {
  const filesInOrder = [
    'db/init-v3-postgres.sql',
    'db/migrations/002-normalize-relations.sql',
    'db/migrations/004-constraints-safe.sql',
    'db/migrations/005-grupos-cierre-definitivo.sql',
    'db/migrations/007-ticket-auditoria-anulacion.sql',
    'migrations/03-sistema-ventas-separadas.sql',
    'migrations/04-entradas-v2.sql',
    'migrations/05-entradas-v2-qr-token.sql',
    'migrations/auditoria.sql'
  ];

  for (const file of filesInOrder) {
    try {
      await applySqlFile(client, file);
    } catch (err) {
      err.message = `Error aplicando ${file}: ${err.message}`;
      throw err;
    }
  }
}

export async function ensureTestDatabase() {
  if (pool) {
    try {
      await pool.query('SELECT 1');
      return pool;
    } catch (err) {
      // Pool inválido (db recreada). Re-crear.
      pool = null;
    }
  }

  await ensureDatabaseExists();
  pool = new Pool({ connectionString: DATABASE_URL });
  await applyMigrations(pool);
  return pool;
}

export async function resetDatabase() {
  if (!pool) {
    await ensureTestDatabase();
  }

  const tablesResult = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const tables = tablesResult.rows
    .map((row) => row.tablename)
    .filter((name) => name !== 'pg_stat_statements');

  if (tables.length > 0) {
    const tableList = tables.map((t) => `"${t}"`).join(', ');
    await pool.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  }

  // Volver a crear usuarios base
  await seedMinimo();
}

export async function closeTestDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export function getTestPool() {
  if (!pool) {
    throw new Error('Test pool no inicializado. Llama ensureTestDatabase primero.');
  }
  return pool;
}
