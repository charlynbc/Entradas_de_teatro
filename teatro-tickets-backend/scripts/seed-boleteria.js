import pool from '../db/postgres.js';

async function ensureBoleteria() {
  const cedula = process.env.BOLETERIA_CEDULA || '99999999';
  const phone = process.env.BOLETERIA_PHONE || cedula;
  const nombre = process.env.BOLETERIA_NOMBRE || 'Boletería BACO';

  try {
    const exists = await pool.query('SELECT cedula FROM users WHERE cedula = $1', [cedula]);
    if (exists.rows.length > 0) {
      console.log('ℹ️  Usuario boletería ya existe');
      return;
    }

    // Evitar violar checks de role: usar ADMIN como rol operativo
    const bcrypt = (await import('bcrypt')).default;
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (cedula, name, role, password_hash, phone, active)
       VALUES ($1, $2, 'ADMIN', $3, $4, TRUE)`,
      [cedula, nombre, hash, phone]
    );

    console.log('✅ Usuario boletería creado:', { cedula, phone, nombre });
  } catch (e) {
    console.error('❌ Error creando boletería:', e.message);
  } finally {
    await pool.end();
  }
}

ensureBoleteria();
