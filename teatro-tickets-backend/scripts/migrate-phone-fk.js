import 'dotenv/config';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function run() {
  console.log('🚀 Migración: users.phone único + FK tickets.vendedor_phone');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone)');

    // Si la tabla tickets no existe, crear estructura mínima
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        code VARCHAR(50) PRIMARY KEY,
        show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        estado VARCHAR(20) NOT NULL CHECK (estado IN ('DISPONIBLE','STOCK_VENDEDOR','RESERVADO','REPORTADA_VENDIDA','PAGADO','USADO')) DEFAULT 'DISPONIBLE',
        vendedor_phone VARCHAR(20),
        comprador_nombre VARCHAR(150),
        comprador_contacto VARCHAR(150),
        precio NUMERIC(10,2),
        medio_pago VARCHAR(50),
        reportada_por_vendedor BOOLEAN NOT NULL DEFAULT FALSE,
        aprobada_por_admin BOOLEAN NOT NULL DEFAULT FALSE,
        qr_code TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reservado_at TIMESTAMP,
        reportada_at TIMESTAMP,
        pagado_at TIMESTAMP,
        usado_at TIMESTAMP
      );
    `);

    // FK a users(phone)
    await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_vendedor_phone_fkey');
    await client.query('ALTER TABLE tickets ADD CONSTRAINT tickets_vendedor_phone_fkey FOREIGN KEY (vendedor_phone) REFERENCES users(phone)');

    await client.query('COMMIT');
    console.log('✅ Migración aplicada correctamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error aplicando migración:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
