import { query } from '../db/postgres.js';

/**
 * Crear una nueva obra en un grupo
 * Solo el director del grupo o SUPER pueden crear obras
 */
export async function createObra(obraData, userCedula, userRole) {
  const { grupo_id, nombre, descripcion, autor, genero, duracion_aprox } = obraData;

  // Verificar que el grupo existe y el usuario tiene permisos
  const grupoResult = await query(
    'SELECT director_cedula, estado FROM grupos WHERE id = $1',
    [grupo_id]
  );

  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  if (grupo.estado === 'ARCHIVADO') {
    throw new Error('No se pueden crear obras en grupos archivados');
  }

  // Verificar permisos: director del grupo o SUPER
  if (userRole !== 'SUPER' && grupo.director_cedula !== userCedula) {
    // Verificar si es co-director
    const coDirectorResult = await query(
      'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
      [grupo_id, userCedula, 'DIRECTOR']
    );

    if (coDirectorResult.rows.length === 0) {
      throw new Error('No tienes permisos para crear obras en este grupo');
    }
  }

  // Crear obra
  const result = await query(
    `INSERT INTO obras (grupo_id, nombre, descripcion, autor, genero, duracion_aprox)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [grupo_id, nombre, descripcion, autor, genero, duracion_aprox]
  );

  return result.rows[0];
}

/**
 * Listar obras según el rol del usuario
 * - SUPER: todas las obras
 * - ADMIN: obras de sus grupos
 * - VENDEDOR: obras de grupos donde es miembro
 */
export async function listObras(userCedula, userRole) {
  if (userRole === 'SUPER') {
    const result = await query('SELECT * FROM v_obras_completas ORDER BY created_at DESC');
    return result.rows;
  }

  if (userRole === 'ADMIN') {
    // Obras de grupos donde es director o co-director
    const result = await query(
      `SELECT DISTINCT o.* FROM v_obras_completas o
       WHERE o.director_cedula = $1
       OR o.grupo_id IN (
         SELECT grupo_id FROM grupo_miembros 
         WHERE miembro_cedula = $1 AND rol_en_grupo = 'DIRECTOR' AND activo = TRUE
       )
       ORDER BY o.created_at DESC`,
      [userCedula]
    );
    return result.rows;
  }

  // VENDEDOR: solo obras de grupos donde es miembro
  const result = await query(
    `SELECT DISTINCT o.* FROM v_obras_completas o
     WHERE o.grupo_id IN (
       SELECT grupo_id FROM grupo_miembros 
       WHERE miembro_cedula = $1 AND activo = TRUE
     )
     ORDER BY o.created_at DESC`,
    [userCedula]
  );
  return result.rows;
}

/**
 * Obtener una obra por ID con validación de permisos
 */
export async function getObraById(obraId, userCedula, userRole) {
  const result = await query('SELECT * FROM v_obras_completas WHERE id = $1', [obraId]);

  if (result.rows.length === 0) {
    throw new Error('Obra no encontrada');
  }

  const obra = result.rows[0];

  // SUPER puede ver todo
  if (userRole === 'SUPER') {
    return obra;
  }

  // Verificar si es director o miembro del grupo
  const permissionResult = await query(
    `SELECT id FROM grupos WHERE id = $1 AND director_cedula = $2
     UNION
     SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE`,
    [obra.grupo_id, userCedula]
  );

  if (permissionResult.rows.length === 0) {
    throw new Error('No tienes permisos para ver esta obra');
  }

  return obra;
}

/**
 * Listar obras de un grupo específico
 */
export async function listObrasByGrupo(grupoId, userCedula, userRole) {
  // Verificar permisos sobre el grupo
  const grupoResult = await query('SELECT director_cedula FROM grupos WHERE id = $1', [grupoId]);

  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  // Verificar permisos
  if (userRole !== 'SUPER' && grupo.director_cedula !== userCedula) {
    const memberResult = await query(
      'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE',
      [grupoId, userCedula]
    );

    if (memberResult.rows.length === 0) {
      throw new Error('No tienes permisos para ver las obras de este grupo');
    }
  }

  const result = await query(
    'SELECT * FROM v_obras_completas WHERE grupo_id = $1 ORDER BY created_at DESC',
    [grupoId]
  );

  return result.rows;
}

/**
 * Actualizar una obra
 */
export async function updateObra(obraId, obraData, userCedula, userRole) {
  const { nombre, descripcion, autor, genero, duracion_aprox, estado } = obraData;

  // Obtener obra y verificar permisos
  const obraResult = await query(
    'SELECT o.*, g.director_cedula FROM obras o JOIN grupos g ON g.id = o.grupo_id WHERE o.id = $1',
    [obraId]
  );

  if (obraResult.rows.length === 0) {
    throw new Error('Obra no encontrada');
  }

  const obra = obraResult.rows[0];

  // Verificar permisos
  if (userRole !== 'SUPER' && obra.director_cedula !== userCedula) {
    const coDirectorResult = await query(
      'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
      [obra.grupo_id, userCedula, 'DIRECTOR']
    );

    if (coDirectorResult.rows.length === 0) {
      throw new Error('No tienes permisos para actualizar esta obra');
    }
  }

  const result = await query(
    `UPDATE obras 
     SET nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         autor = COALESCE($3, autor),
         genero = COALESCE($4, genero),
         duracion_aprox = COALESCE($5, duracion_aprox),
         estado = COALESCE($6, estado),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [nombre, descripcion, autor, genero, duracion_aprox, estado, obraId]
  );

  return result.rows[0];
}

/**
 * Eliminar una obra
 */
export async function deleteObra(obraId, userCedula, userRole) {
  // Obtener obra y verificar permisos
  const obraResult = await query(
    'SELECT o.*, g.director_cedula FROM obras o JOIN grupos g ON g.id = o.grupo_id WHERE o.id = $1',
    [obraId]
  );

  if (obraResult.rows.length === 0) {
    throw new Error('Obra no encontrada');
  }

  const obra = obraResult.rows[0];

  // Solo director del grupo o SUPER pueden eliminar
  if (userRole !== 'SUPER' && obra.director_cedula !== userCedula) {
    const coDirectorResult = await query(
      'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
      [obra.grupo_id, userCedula, 'DIRECTOR']
    );

    if (coDirectorResult.rows.length === 0) {
      throw new Error('No tienes permisos para eliminar esta obra');
    }
  }

  await query('DELETE FROM obras WHERE id = $1', [obraId]);
  return { message: 'Obra eliminada exitosamente' };
}

/**
 * Archivar una obra (cambiar estado a ARCHIVADA)
 */
export async function archivarObra(obraId, userCedula, userRole) {
  const result = await updateObra(obraId, { estado: 'ARCHIVADA' }, userCedula, userRole);
  return result;
}
