import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  // cuando Postgres arranca dentro de Docker puede tardar unos segundos
  connectionTimeoutMillis: 5_000
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureSchema(client) {
  const check = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema='public' AND table_name='users'`
  );
  if (check.rows.length > 0) return;

  console.log('🧱 DB vacía detectada: aplicando schema v3...');
  const initPath = path.join(__dirname, '..', 'db', 'init-v3-postgres.sql');
  const sql = await fs.readFile(initPath, 'utf8');
  await client.query(sql);
  console.log('✅ Schema v3 aplicado');
}

async function ensureCompatViews(client) {
  // grupo_miembros: el código legacy usa joined_at
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='grupo_miembros' AND column_name='joined_at'
      ) THEN
        ALTER TABLE grupo_miembros ADD COLUMN joined_at TIMESTAMP;
        -- si existe fecha_ingreso (schema anterior), migrar valores
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='grupo_miembros' AND column_name='fecha_ingreso'
        ) THEN
          UPDATE grupo_miembros SET joined_at = COALESCE(joined_at, fecha_ingreso, NOW());
        ELSE
          UPDATE grupo_miembros SET joined_at = COALESCE(joined_at, NOW());
        END IF;
        ALTER TABLE grupo_miembros ALTER COLUMN joined_at SET DEFAULT NOW();
        ALTER TABLE grupo_miembros ALTER COLUMN joined_at SET NOT NULL;
      END IF;
    END $$;
  `);

  // Tabla reportes_obras (algunos endpoints la esperan)
  await client.query(`
    CREATE TABLE IF NOT EXISTS reportes_obras (
      id               SERIAL PRIMARY KEY,
      show_id          INT NOT NULL,
      nombre_obra      VARCHAR(255) NOT NULL,
      fecha_show       TIMESTAMP NOT NULL,
      director_id      VARCHAR(20) NOT NULL,
      total_tickets    INT NOT NULL DEFAULT 0,
      tickets_vendidos INT NOT NULL DEFAULT 0,
      tickets_usados   INT NOT NULL DEFAULT 0,
      ingresos_totales NUMERIC(12,2) NOT NULL DEFAULT 0,
      datos_vendedores JSONB NOT NULL DEFAULT '[]'::jsonb,
      datos_ventas     JSONB NOT NULL DEFAULT '{}'::jsonb,
      fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_reportes_obras_show_id ON reportes_obras(show_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_obras_director_id ON reportes_obras(director_id);
    CREATE INDEX IF NOT EXISTS idx_reportes_obras_fecha_show ON reportes_obras(fecha_show);
  `);

  // Compatibilidad: vistas+triggers para grupo_directores / grupo_actores
  const migPath = path.join(__dirname, '..', 'db', 'migrations', '002-normalize-relations.sql');
  const sql = await fs.readFile(migPath, 'utf8');
  await client.query(sql);
}

async function ensureSafeConstraints(client) {
  // Constraints e índices tolerantes (sin borrar datos)
  const migPath = path.join(__dirname, '..', 'db', 'migrations', '004-constraints-safe.sql');
  const sql = await fs.readFile(migPath, 'utf8');
  await client.query(sql);
}

async function ensureGrupoCierreDefinitivo(client) {
  const migPath = path.join(__dirname, '..', 'db', 'migrations', '005-grupos-cierre-definitivo.sql');
  const sql = await fs.readFile(migPath, 'utf8');
  await client.query(sql);
}

async function ensureTicketAuditoriaAnulacion(client) {
  const migPath = path.join(__dirname, '..', 'db', 'migrations', '007-ticket-auditoria-anulacion.sql');
  const sql = await fs.readFile(migPath, 'utf8');
  await client.query(sql);
}

async function ensureLiquidacionesGrupo(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS liquidaciones_grupo (
      id               SERIAL PRIMARY KEY,
      grupo_id          INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
      created_by_cedula VARCHAR(20) REFERENCES users(cedula) ON DELETE SET NULL,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
      ingresos_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_tickets     INT NOT NULL DEFAULT 0,
      tickets_pagados   INT NOT NULL DEFAULT 0,
      tickets_usados    INT NOT NULL DEFAULT 0,
      gastos_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
      alquiler_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
      neto_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
      puntos_total      INT,
      valor_punto       NUMERIC(12,4),
      notas             TEXT,
      datos             JSONB NOT NULL DEFAULT '{}'::jsonb,
      UNIQUE (grupo_id)
    );

    CREATE INDEX IF NOT EXISTS idx_liquidaciones_grupo_grupo_id ON liquidaciones_grupo(grupo_id);
    CREATE INDEX IF NOT EXISTS idx_liquidaciones_grupo_created_at ON liquidaciones_grupo(created_at);
  `);
}

async function run() {
  console.log('🚀 Migración: users.phone único + FK tickets.vendedor_phone');
  let client;
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      const msg = String(err?.message || err);
      const retryable = msg.includes('Connection terminated unexpectedly') || msg.includes('ECONNREFUSED') || msg.includes('timeout') || msg.includes('terminating connection');
      if (!retryable || attempt === 15) {
        console.error(`❌ No se pudo conectar a Postgres (intento ${attempt}/15):`, msg);
        throw err;
      }
      console.log(`⏳ Esperando Postgres... (intento ${attempt}/15)`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  try {
    await client.query('BEGIN');

    // 0) Si la DB está vacía, crear schema base (orden correcto)
    await ensureSchema(client);

    // 0.1) Compatibilidad con joins legacy (grupo_directores/grupo_actores)
    await ensureCompatViews(client);

    // 0.15) Constraints tolerantes (roles/estados)
    await ensureSafeConstraints(client);

    // 0.16) Cierre definitivo de grupo (CERRADO) + campos extra de liquidación
    await ensureGrupoCierreDefinitivo(client);

    // 0.17) Auditoría/anulación de tickets (ticket_movimientos, columnas, constraint)
    await ensureTicketAuditoriaAnulacion(client);

    // 0.2) Tabla de liquidación final de grupo (snapshot)
    await ensureLiquidacionesGrupo(client);

    // 1) users.phone e índice único
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)');

    // 2) tickets: asegurar estados tolerantes (evita errores por CHECK desfasado)
    await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_estado_check');
    await client.query(
      `ALTER TABLE tickets ADD CONSTRAINT tickets_estado_check
       CHECK (estado IN ('DISPONIBLE', 'STOCK_ACTOR', 'STOCK_VENDEDOR', 'RESERVADO', 'REPORTADA_VENDIDA', 'PAGADO', 'USADO', 'ANULADO'))`
    );

    // 3) FK tickets.vendedor_phone -> users(phone)
    await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_vendedor_phone_fkey');
    await client.query(
      `ALTER TABLE tickets
       ADD CONSTRAINT tickets_vendedor_phone_fkey
       FOREIGN KEY (vendedor_phone) REFERENCES users(phone) ON DELETE SET NULL`
    );

    await client.query('COMMIT');
    console.log('✅ Migración aplicada correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error aplicando migración:', err.message);
    process.exitCode = 1;
  } finally {
    client?.release();
    await pool.end();
  }
}

run();
