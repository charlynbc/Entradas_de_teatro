import { query } from '../db/postgres.js';

export async function createUser({ cedula, nombre, name, password, rol, role, requesterRole, genero, phone, email, fecha_nacimiento, apellido, foto_url, direccion, notas }) {
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
  if (!['ADMIN', 'ACTOR', 'INVITADO'].includes(normalizedRole)) {
    const error = new Error('rol debe ser ADMIN (director), ACTOR (actor/actriz) o INVITADO');
    error.status = 400;
    throw error;
  }
  
  // Solo el SUPER puede crear otros roles, excepto que ADMIN puede crear ACTORES
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

  // Construir query con campos opcionales
  const fields = ['cedula', 'name', 'password_hash', 'role', 'genero', 'active'];
  const values = [cedula, finalNombre, hashedPassword, normalizedRole, finalGenero, true];
  
  // Agregar campos opcionales si están presentes
  const optionalFields = { phone, email, fecha_nacimiento, apellido, foto_url, direccion, notas };
  Object.entries(optionalFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fields.push(key);
      values.push(value);
    }
  });

  fields.push('created_at');
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ') + ', NOW()';
  
  const result = await query(
    `INSERT INTO users (${fields.join(', ')})
     VALUES (${placeholders})
     RETURNING cedula, name, role, genero, phone, email, fecha_nacimiento, apellido, foto_url`,
    values
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
     WHERE role IN ('ADMIN', 'ACTOR')`;
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
        COUNT(DISTINCT t.funcion_id) as total_funciones,
        COUNT(t.code) as total_tickets,
        json_agg(DISTINCT jsonb_build_object(
          'funcion_id', f.id,
          'funcion_obra', o.nombre,
          'tickets_asignados', (
            SELECT COUNT(*) 
            FROM tickets t2 
            WHERE t2.vendedor_phone = u.phone 
            AND t2.funcion_id = f.id
          )
        )) FILTER (WHERE f.id IS NOT NULL) as funciones
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_phone = u.phone
      LEFT JOIN funciones f ON f.id = t.funcion_id
      LEFT JOIN obras o ON o.id = f.obra_id
      WHERE u.role = 'ACTOR'
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
  
  // Primero eliminar o liberar todos los tickets del actor
  // Cambiar vendedor_phone a NULL para liberar los tickets (campo de base de datos no cambiado)
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

// Listar todos los usuarios activos (incluye SUPER, ADMIN, ACTOR)
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
        COUNT(DISTINCT t.funcion_id) as obras_activas,
        json_agg(DISTINCT jsonb_build_object(
          'funcion_id', f.id,
          'funcion_obra', o.nombre,
          'funcion_fecha', f.fecha
        )) FILTER (WHERE f.id IS NOT NULL) as obras
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_phone = u.phone AND t.estado != 'USADO'
      LEFT JOIN funciones f ON f.id = t.funcion_id
      LEFT JOIN obras o ON o.id = f.obra_id
      WHERE u.active = true
      GROUP BY u.cedula, u.name, u.phone, u.role, u.genero, u.created_at, u.active
      ORDER BY 
        CASE u.role 
          WHEN 'SUPER' THEN 1
          WHEN 'ADMIN' THEN 2 
          WHEN 'ACTOR' THEN 3 
          ELSE 4 
        END,
        u.name`
  );
  return result.rows;
}

/**
 * Obtiene usuarios con cumpleaños en la semana actual (lunes a domingo)
 */
export async function getWeeklyBirthdaysService() {
  // Calcular inicio y fin de la semana actual
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustar para que lunes sea el inicio
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Obtener todos los usuarios activos con fecha de nacimiento
  const result = await query(
    `SELECT 
      cedula,
      name as nombre,
      role,
      fecha_nacimiento,
      genero
    FROM users 
    WHERE active = true 
      AND fecha_nacimiento IS NOT NULL
    ORDER BY name`
  );

  // Filtrar en JavaScript los que cumplen esta semana
  const birthdays = result.rows.filter(user => {
    const birth = new Date(user.fecha_nacimiento);
    const thisBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    return thisBirthday >= monday && thisBirthday <= sunday;
  });

  return birthdays;
}

// Obtener un usuario por cédula
export async function getUserByCedula(cedula) {
  const result = await query(
    'SELECT * FROM users WHERE cedula = $1 AND active = true',
    [cedula]
  );
  return result.rows[0] || null;
}

// Actualizar un usuario por cédula
export async function updateUserByCedula(cedula, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }
  
  if (fields.length === 0) {
    return await getUserByCedula(cedula);
  }
  
  values.push(cedula);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE cedula = $${idx} RETURNING *`;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
}
