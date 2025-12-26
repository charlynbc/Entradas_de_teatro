import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from '../db/postgres.js';

async function ensureUser({ cedula, nombre, rol, password }) {
  const existing = await query('SELECT id FROM users WHERE cedula = $1', [cedula]);
  if (existing.rows.length > 0) {
    console.log(`ℹ️ Usuario ya existe: ${cedula}`);
    return existing.rows[0].id;
  }
  const id = `${rol}_${Date.now()}_${cedula}`;
  const hashed = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, cedula, nombre, hashed, rol]
  );
  console.log(`✅ Usuario creado: ${cedula} (${rol})`);
  return id;
}

async function main() {
  await ensureUser({ cedula: '48376668', nombre: 'Admin Sistema', rol: 'admin', password: 'admin123' });
  await ensureUser({ cedula: '48376667', nombre: 'Vendedor Base', rol: 'vendedor', password: 'admin123' });
  console.log('✅ Seed usuarios base: completo');
}

main().catch(err => { console.error('❌ Seed usuarios base error:', err); process.exit(1); });
