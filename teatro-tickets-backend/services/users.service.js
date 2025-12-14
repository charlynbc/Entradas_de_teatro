import { query } from '../db/postgres.js';

export async function createUser({ cedula, nombre, name, password, rol, role, requesterRole, genero }) {
  const finalNombre = nombre || name;
  const finalRol = rol || role;
  const finalGenero = genero || 'otro';
  
  if (!cedula || !finalNombre || !password || !finalRol) {
    const error = new Error('cedula, nombre, password y rol son obligatorios');
    error.status = 400;
    throw error;
  }

  // Normalizar rol a mayúsculas
  const normalizedRole = finalRol.toUpperCase();
  if (!['ADMIN', 'VENDEDOR', 'INVITADO'].includes(normalizedRole)) {
    const error = new Error('rol debe ser ADMIN (director), VENDEDOR (actor) o INVITADO');
    error.status = 400;
    throw error;
  }
  
  // Solo el SUPER puede crear otros roles, excepto que ADMIN puede crear VENDEDORES
  if (normalizedRole === 'SUPER') {
    const error = new Error('No se puede crear otro usuario SUPER. Solo existe uno.');
    error.status = 403;
    throw error;
  }

  if (requesterRole === 'ADMIN' && normalizedRole === 'ADMIN') {
    const error = new Error('Los directores solo pueden crear actores. Solo el Super Usuario puede crear directores.');
    error.status = 403;
    throw error;
  }

  const existente = await query('SELECT cedula FROM users WHERE cedula = $1', [cedula]);
  if (existente.rows.length > 0) {
    const error = new Error('Ya existe un usuario con esa cédula');
    error.status = 400;
    throw error;
  }

  const bcrypt = (await import('bcrypt')).default;
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (cedula, name, password_hash, role, genero, active, created_at)
     VALUES ($1, $2, $3, $4, $5, TRUE, NOW())
     RETURNING cedula, name, role, genero`,
    [cedula, finalNombre, hashedPassword, normalizedRole, finalGenero]
  );

  const user = result.rows[0];
  return {
    cedula: user.cedula,
    name: user.name,
    role: user.role,
    genero: user.genero
  };
}

export async function listUsers(roleFilter) {
  let sql = `SELECT cedula, name, role, genero, created_at, active
     FROM users
     WHERE role IN ('ADMIN', 'VENDEDOR')`;
  const params = [];
  
  if (roleFilter) {
    sql += ` AND role = $1`;
    params.push(roleFilter);
  }
  
  sql += ` ORDER BY name ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function listSellersWithStats() {
  const result = await query(`
      SELECT 
        u.cedula,
        u.name,
        u.role,
        u.genero,
        COUNT(DISTINCT t.show_id) as total_shows,
        COUNT(t.code) as total_tickets,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_obra', s.obra,
          'tickets_asignados', (
            SELECT COUNT(*) 
            FROM tickets t2 
            WHERE t2.vendedor_phone = u.phone 
            AND t2.show_id = s.id
          )
        )) FILTER (WHERE s.id IS NOT NULL) as shows
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_phone = u.phone
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.role = 'VENDEDOR'
      GROUP BY u.cedula, u.name, u.role
      ORDER BY u.name
  `);
  return result.rows;
}

export async function deleteUserByFlexibleId(idOrCedula, requesterRole) {
  const result = await query('SELECT * FROM users WHERE cedula = $1', [idOrCedula]);
  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  
  const user = result.rows[0];
  
  // Verificar que no sea el super usuario
  if (user.role === 'SUPER') {
    const error = new Error('No se puede eliminar al Super Usuario');
    error.status = 403;
    throw error;
  }
  
  // Solo SUPER puede eliminar ADMIN (directores)
  if (user.role === 'ADMIN' && requesterRole !== 'SUPER') {
    const error = new Error('Solo el Super Usuario puede eliminar directores');
    error.status = 403;
    throw error;
  }
  
  // Primero eliminar o liberar todos los tickets del vendedor
  // Cambiar vendedor_phone a NULL para liberar los tickets
  await query('UPDATE tickets SET vendedor_phone = NULL, estado = $1 WHERE vendedor_phone = $2', 
    ['DISPONIBLE', user.phone]);
  
  // Ahora eliminar el usuario
  await query('DELETE FROM users WHERE cedula = $1', [user.cedula]);
  return { ok: true };
}

export async function resetPasswordByFlexibleId(idOrCedula, newPassword) {
  if (!newPassword) {
    const error = new Error('Nueva contraseña requerida');
    error.status = 400;
    throw error;
  }
  const result = await query('SELECT * FROM users WHERE cedula = $1 OR phone = $1', [idOrCedula]);
  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  const bcrypt = (await import('bcrypt')).default;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE cedula = $2', [hashedPassword, result.rows[0].cedula]);
  return { ok: true };
}

// Listar todos los usuarios activos (incluye SUPER, ADMIN, VENDEDOR)
export async function listAllMembers(currentRole) {
  console.log('🔍 listAllMembers llamado - versión actualizada con SUPER incluido');
  const result = await query(
    `SELECT 
        u.cedula,
        u.name,
        u.phone,
        u.role as rol,
        u.genero,
        u.created_at,
        u.active,
        COUNT(DISTINCT t.show_id) as obras_activas,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_obra', s.obra,
          'show_fecha', s.fecha
        )) FILTER (WHERE s.id IS NOT NULL) as obras
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_phone = u.phone AND t.estado != 'USADO'
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.active = true
      GROUP BY u.cedula, u.name, u.phone, u.role, u.genero, u.created_at, u.active
      ORDER BY 
        CASE u.role 
          WHEN 'SUPER' THEN 1
          WHEN 'ADMIN' THEN 2 
          WHEN 'VENDEDOR' THEN 3 
          ELSE 4 
        END,
        u.name`
  );
  return result.rows;
}
