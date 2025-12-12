import { query } from '../db/postgres.js';

export async function createUser({ cedula, nombre, password, rol, requesterRole }) {
  if (!cedula || !nombre || !password || !rol) {
    const error = new Error('cedula, nombre, password y rol son obligatorios');
    error.status = 400;
    throw error;
  }

  if (!['admin', 'vendedor'].includes(rol)) {
    const error = new Error('rol debe ser admin o vendedor');
    error.status = 400;
    throw error;
  }

  if (requesterRole === 'ADMIN' && rol === 'admin') {
    const error = new Error('Los directores solo pueden crear actores. Solo el Super Usuario puede crear directores.');
    error.status = 403;
    throw error;
  }

  const existente = await query('SELECT id FROM users WHERE cedula = $1', [cedula]);
  if (existente.rows.length > 0) {
    const error = new Error('Ya existe un usuario con esa cédula');
    error.status = 400;
    throw error;
  }

  const bcrypt = (await import('bcrypt')).default;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = `${rol}_${cedula}`;

  const result = await query(
    `INSERT INTO users (id, cedula, nombre, password, rol, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, cedula, nombre, rol`,
    [id, cedula, nombre, hashedPassword, rol]
  );

  const user = result.rows[0];
  return {
    id: user.id,
    phone: user.cedula,
    cedula: user.cedula,
    name: user.nombre,
    role: rol.toUpperCase()
  };
}

export async function listUsers() {
  const result = await query(
    `SELECT id, cedula, nombre, rol, created_at
     FROM users
     WHERE rol IN ('admin', 'vendedor')
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function listSellersWithStats() {
  const result = await query(`
      SELECT 
        u.id,
        u.cedula,
        u.nombre,
        u.rol,
        COUNT(DISTINCT t.show_id) as total_shows,
        COUNT(t.id) as total_tickets,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_nombre', s.nombre,
          'tickets_asignados', (
            SELECT COUNT(*) 
            FROM tickets t2 
            WHERE t2.vendedor_id = u.id 
            AND t2.show_id = s.id
          )
        )) FILTER (WHERE s.id IS NOT NULL) as shows
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_id = u.id
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.rol = 'vendedor'
      GROUP BY u.id, u.cedula, u.nombre, u.rol
      ORDER BY u.nombre
  `);
  return result.rows;
}

export async function deleteUserByFlexibleId(idOrCedula) {
  const result = await query('SELECT * FROM users WHERE id = $1 OR cedula = $1', [idOrCedula]);
  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  await query('DELETE FROM users WHERE id = $1', [result.rows[0].id]);
  return { ok: true };
}

export async function listMembers(currentRole) {
  const result = await query(
    `SELECT 
        u.id,
        u.cedula,
        u.nombre,
        u.rol,
        u.created_at,
        COUNT(DISTINCT t.show_id) as obras_activas,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_nombre', s.nombre,
          'show_fecha', s.fecha
        )) FILTER (WHERE s.id IS NOT NULL) as obras
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_id = u.id AND t.estado != 'USADA'
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.rol != 'supremo' OR $1 = 'SUPER'
      GROUP BY u.id, u.cedula, u.nombre, u.rol, u.created_at
      ORDER BY 
        CASE u.rol 
          WHEN 'admin' THEN 1 
          WHEN 'vendedor' THEN 2 
          ELSE 3 
        END,
        u.nombre`,
    [currentRole]
  );
  return result.rows;
}
