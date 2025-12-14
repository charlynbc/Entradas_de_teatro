import { query } from '../db/postgres.js';

/**
 * Crear un nuevo grupo
 */
export async function createGrupo({
  nombre,
  descripcion,
  director_cedula,
  dia_semana,
  hora_inicio,
  fecha_inicio,
  fecha_fin,
  obra_a_realizar
}) {
  const result = await query(
    `INSERT INTO grupos 
      (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, obra_a_realizar)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, obra_a_realizar]
  );
  return result.rows[0];
}

/**
 * Listar grupos según el rol del usuario
 * - SUPER: ve todos los grupos
 * - ADMIN (Director): ve los grupos que creó
 * - VENDEDOR (Actor): ve los grupos donde es miembro
 */
export async function listGrupos(userCedula, userRole) {
  let sqlQuery;
  let params;

  if (userRole === 'SUPER') {
    // SUPER ve todos los grupos
    sqlQuery = `
      SELECT * FROM v_grupos_completos
      ORDER BY estado ASC, fecha_inicio DESC
    `;
    params = [];
  } else if (userRole === 'ADMIN') {
    // ADMIN ve solo los grupos que creó
    sqlQuery = `
      SELECT * FROM v_grupos_completos
      WHERE director_cedula = $1
      ORDER BY estado ASC, fecha_inicio DESC
    `;
    params = [userCedula];
  } else {
    // VENDEDOR ve grupos donde es miembro
    sqlQuery = `
      SELECT DISTINCT g.* FROM v_grupos_completos g
      JOIN grupo_miembros gm ON gm.grupo_id = g.id
      WHERE gm.miembro_cedula = $1
      ORDER BY g.estado ASC, g.fecha_inicio DESC
    `;
    params = [userCedula];
  }

  const result = await query(sqlQuery, params);
  return result.rows;
}

/**
 * Obtener un grupo por ID con validación de permisos
 */
export async function getGrupoById(grupoId, userCedula, userRole) {
  const result = await query(
    `SELECT * FROM v_grupos_completos WHERE id = $1`,
    [grupoId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const grupo = result.rows[0];

  // Validar permisos
  if (userRole === 'SUPER') {
    return grupo; // SUPER puede ver cualquier grupo
  }

  if (userRole === 'ADMIN' && grupo.director_cedula === userCedula) {
    return grupo; // Director puede ver sus propios grupos
  }

  // Verificar si es miembro
  const memberCheck = await query(
    `SELECT 1 FROM grupo_miembros 
     WHERE grupo_id = $1 AND miembro_cedula = $2`,
    [grupoId, userCedula]
  );

  if (memberCheck.rows.length > 0) {
    return grupo;
  }

  return null; // No tiene permiso
}

/**
 * Actualizar información del grupo (solo director o SUPER)
 * NO permite cambiar dia_semana ni hora_inicio
 */
export async function updateGrupo(grupoId, userCedula, userRole, updates) {
  // Validar que no intente cambiar horario
  if (updates.dia_semana || updates.hora_inicio) {
    throw new Error('No se puede modificar el horario de clases del grupo');
  }

  // Validar permisos
  const grupo = await query(`SELECT director_cedula FROM grupos WHERE id = $1`, [grupoId]);
  if (grupo.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupo.rows[0].director_cedula !== userCedula) {
    throw new Error('No tienes permiso para modificar este grupo');
  }

  // Construir query dinámicamente
  const allowedFields = ['nombre', 'descripcion', 'fecha_inicio', 'fecha_fin', 'obra_a_realizar'];
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No hay campos válidos para actualizar');
  }

  // Agregar updated_at
  setClause.push(`updated_at = NOW()`);

  values.push(grupoId);
  const result = await query(
    `UPDATE grupos SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Agregar miembro al grupo
 */
export async function addMiembroToGrupo(grupoId, miembroCedula, userCedula, userRole) {
  // Validar permisos (solo director del grupo o SUPER)
  const grupo = await query(`SELECT director_cedula, estado FROM grupos WHERE id = $1`, [grupoId]);
  if (grupo.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupo.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director del grupo puede agregar miembros');
  }

  if (grupo.rows[0].estado === 'ARCHIVADO') {
    throw new Error('No se pueden agregar miembros a un grupo archivado');
  }

  // Verificar que el miembro sea VENDEDOR (actor/actriz)
  const miembro = await query(`SELECT role FROM users WHERE cedula = $1 AND active = true`, [miembroCedula]);
  if (miembro.rows.length === 0) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  if (miembro.rows[0].role !== 'VENDEDOR') {
    throw new Error('Solo se pueden agregar actores/actrices (VENDEDOR) al grupo');
  }

  // Insertar o reactivar miembro
  const result = await query(
    `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, activo, fecha_ingreso)
     VALUES ($1, $2, TRUE, NOW())
     ON CONFLICT (grupo_id, miembro_cedula) 
     DO UPDATE SET activo = TRUE, fecha_ingreso = NOW(), fecha_salida = NULL
     RETURNING *`,
    [grupoId, miembroCedula]
  );

  return result.rows[0];
}

/**
 * Eliminar miembro del grupo
 */
export async function removeMiembroFromGrupo(grupoId, miembroCedula, userCedula, userRole) {
  // Validar permisos
  const grupo = await query(`SELECT director_cedula FROM grupos WHERE id = $1`, [grupoId]);
  if (grupo.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupo.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director del grupo puede eliminar miembros');
  }

  // Marcar como inactivo en lugar de eliminar (mantener histórico)
  const result = await query(
    `UPDATE grupo_miembros 
     SET activo = FALSE, fecha_salida = NOW()
     WHERE grupo_id = $1 AND miembro_cedula = $2
     RETURNING *`,
    [grupoId, miembroCedula]
  );

  if (result.rows.length === 0) {
    throw new Error('El miembro no pertenece a este grupo');
  }

  return result.rows[0];
}

/**
 * Archivar grupo (cambiar estado a ARCHIVADO)
 */
export async function archivarGrupo(grupoId, userCedula, userRole) {
  const grupo = await query(`SELECT director_cedula FROM grupos WHERE id = $1`, [grupoId]);
  if (grupo.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupo.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director del grupo puede archivarlo');
  }

  const result = await query(
    `UPDATE grupos SET estado = 'ARCHIVADO', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [grupoId]
  );

  return result.rows[0];
}

/**
 * Tarea automática: Archivar grupos cuya fecha_fin ya pasó
 */
export async function archivarGruposVencidos() {
  const result = await query(
    `UPDATE grupos 
     SET estado = 'ARCHIVADO', updated_at = NOW()
     WHERE estado = 'ACTIVO' AND fecha_fin < CURRENT_DATE
     RETURNING *`
  );

  console.log(`🗄️  Grupos archivados automáticamente: ${result.rows.length}`);
  return result.rows;
}

/**
 * Listar actores/actrices disponibles para agregar al grupo
 * (excluye los que ya son miembros activos)
 */
export async function listActoresDisponibles(grupoId) {
  const result = await query(
    `SELECT u.cedula, u.name, u.genero, u.phone
     FROM users u
     WHERE u.role = 'VENDEDOR' 
       AND u.active = TRUE
       AND u.cedula NOT IN (
         SELECT miembro_cedula FROM grupo_miembros 
         WHERE grupo_id = $1 AND activo = TRUE
       )
     ORDER BY u.name`,
    [grupoId]
  );

  return result.rows;
}
