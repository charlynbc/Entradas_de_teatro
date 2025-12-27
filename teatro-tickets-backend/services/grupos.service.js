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
 * - ACTOR: ve los grupos donde es miembro
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
    // ACTOR ve grupos donde es miembro
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

  // Verificar que el miembro sea ACTOR o ADMIN
  const miembro = await query(`SELECT role FROM users WHERE cedula = $1 AND active = true`, [miembroCedula]);
  if (miembro.rows.length === 0) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  if (miembro.rows[0].role !== 'ACTOR' && miembro.rows[0].role !== 'ADMIN') {
    throw new Error('Solo se pueden agregar actores/actrices (ACTOR) o directores (ADMIN) al grupo');
  }

  // Determinar rol en el grupo: DIRECTOR si es ADMIN, ACTOR si es ACTOR
  const rolEnGrupo = miembro.rows[0].role === 'ADMIN' ? 'DIRECTOR' : 'ACTOR';

  // Insertar o reactivar miembro
  const result = await query(
    `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo, fecha_ingreso)
     VALUES ($1, $2, $3, TRUE, NOW())
     ON CONFLICT (grupo_id, miembro_cedula) 
     DO UPDATE SET rol_en_grupo = $3, activo = TRUE, fecha_ingreso = NOW(), fecha_salida = NULL
     RETURNING *`,
    [grupoId, miembroCedula, rolEnGrupo]
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
 * Listar actores/actrices y directores disponibles para agregar al grupo
 * (excluye los que ya son miembros activos)
 */
export async function listActoresDisponibles(grupoId) {
  const result = await query(
    `SELECT u.cedula, u.name, u.role, u.genero, u.phone
     FROM users u
     WHERE (u.role = 'ACTOR' OR u.role = 'ADMIN')
       AND u.active = TRUE
       AND u.cedula NOT IN (
         SELECT miembro_cedula FROM grupo_miembros 
         WHERE grupo_id = $1 AND activo = TRUE
       )
     ORDER BY u.role DESC, u.name`,
    [grupoId]
  );

  return result.rows;
}

/**
 * Finalizar grupo con conclusión y puntuación
 */
export async function finalizarGrupo(grupoId, userCedula, userRole, data) {
  const { conclusion, puntuacion } = data;

  // Verificar que el grupo existe
  const grupoResult = await query(
    'SELECT * FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  // Verificar permisos (director o SUPER)
  if (userRole !== 'SUPER' && grupo.director_cedula !== userCedula) {
    throw new Error('No tienes permiso para finalizar este grupo');
  }

  // Validar puntuación
  if (puntuacion && (puntuacion < 1 || puntuacion > 10)) {
    throw new Error('La puntuación debe estar entre 1 y 10');
  }

  // Actualizar grupo
  const result = await query(
    `UPDATE grupos 
     SET estado = 'FINALIZADO',
         conclusion = $1,
         puntuacion = $2,
         fecha_finalizacion = NOW(),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [conclusion, puntuacion, grupoId]
  );

  return result.rows[0];
}

/**
 * Listar grupos finalizados
 */
export async function listGruposFinalizados(userCedula, userRole) {
  let sqlQuery = `
    SELECT 
      g.*,
      u.name as director_nombre,
      COUNT(DISTINCT gm.miembro_cedula) as total_miembros,
      COUNT(DISTINCT o.id) as total_obras,
      COUNT(DISTINCT e.id) as total_ensayos
    FROM grupos g
    JOIN users u ON u.cedula = g.director_cedula
    LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
    LEFT JOIN obras o ON o.grupo_id = g.id
    LEFT JOIN v_ensayos_completos e ON e.grupo_id = g.id
    WHERE g.estado = 'FINALIZADO'
  `;

  const params = [];
  
  // Si no es SUPER, solo ver sus grupos
  if (userRole !== 'SUPER') {
    sqlQuery += ' AND g.director_cedula = $1';
    params.push(userCedula);
  }

  sqlQuery += `
    GROUP BY g.id, u.name
    ORDER BY g.fecha_finalizacion DESC
  `;

  const result = await query(sqlQuery, params);
  return result.rows;
}

/**
 * Generar PDF de informe de grupo finalizado
 */
export async function generarPDFGrupo(grupoId, userCedula, userRole, res) {
  const PDFDocument = (await import('pdfkit')).default;

  // Obtener información del grupo
  const grupoResult = await query(
    `SELECT g.*, u.name as director_nombre
     FROM grupos g
     JOIN users u ON u.cedula = g.director_cedula
     WHERE g.id = $1`,
    [grupoId]
  );

  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  // Verificar permisos
  if (userRole !== 'SUPER' && grupo.director_cedula !== userCedula) {
    throw new Error('No tienes permiso para ver este informe');
  }

  // Obtener miembros
  const miembrosResult = await query(
    `SELECT u.name, u.cedula, u.genero, gm.rol_en_grupo, gm.fecha_ingreso
     FROM grupo_miembros gm
     JOIN users u ON u.cedula = gm.miembro_cedula
     WHERE gm.grupo_id = $1
     ORDER BY gm.rol_en_grupo DESC, u.name`,
    [grupoId]
  );

  // Obtener obras
  const obrasResult = await query(
    `SELECT nombre, descripcion, created_at
     FROM obras
     WHERE grupo_id = $1
     ORDER BY created_at`,
    [grupoId]
  );

  // Obtener estadísticas de ensayos
  const ensayosResult = await query(
    `SELECT COUNT(*) as total_ensayos,
            MIN(fecha) as primer_ensayo,
            MAX(fecha) as ultimo_ensayo
     FROM v_ensayos_completos
     WHERE grupo_id = $1`,
    [grupoId]
  );

  const ensayosStats = ensayosResult.rows[0];

  // Crear PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=grupo-${grupoId}-${grupo.nombre}.pdf`);
  
  doc.pipe(res);

  // Título
  doc.fontSize(20).fillColor('#8B0000').text('🎭 INFORME DE GRUPO FINALIZADO', { align: 'center' });
  doc.moveDown();

  // Información general
  doc.fontSize(16).fillColor('#000').text('Información General', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Nombre: ${grupo.nombre}`);
  doc.text(`Director: ${grupo.director_nombre}`);
  doc.text(`Descripción: ${grupo.descripcion || 'Sin descripción'}`);
  doc.text(`Día de clase: ${grupo.dia_semana} a las ${grupo.hora_inicio}`);
  doc.text(`Período: ${new Date(grupo.fecha_inicio).toLocaleDateString('es-UY')} - ${new Date(grupo.fecha_fin).toLocaleDateString('es-UY')}`);
  doc.text(`Obra trabajada: ${grupo.obra_a_realizar || 'No especificada'}`);
  doc.moveDown();

  // Estadísticas de ensayos
  doc.fontSize(16).fillColor('#000').text('Estadísticas de Ensayos', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Total de ensayos: ${ensayosStats.total_ensayos || 0}`);
  if (ensayosStats.primer_ensayo) {
    doc.text(`Primer ensayo: ${new Date(ensayosStats.primer_ensayo).toLocaleDateString('es-UY')}`);
  }
  if (ensayosStats.ultimo_ensayo) {
    doc.text(`Último ensayo: ${new Date(ensayosStats.ultimo_ensayo).toLocaleDateString('es-UY')}`);
  }
  doc.moveDown();

  // Obras realizadas
  doc.fontSize(16).fillColor('#000').text('Obras Realizadas', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (obrasResult.rows.length > 0) {
    obrasResult.rows.forEach((obra, index) => {
      doc.text(`${index + 1}. ${obra.nombre}`);
      if (obra.descripcion) {
        doc.fontSize(10).fillColor('#666').text(`   ${obra.descripcion}`);
        doc.fontSize(12).fillColor('#000');
      }
    });
  } else {
    doc.text('No se registraron obras');
  }
  doc.moveDown();

  // Miembros del grupo
  doc.fontSize(16).fillColor('#000').text('Miembros del Grupo', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (miembrosResult.rows.length > 0) {
    miembrosResult.rows.forEach((miembro, index) => {
      doc.text(
        `${index + 1}. ${miembro.name} (${miembro.rol_en_grupo}) - ${miembro.genero}`
      );
    });
  } else {
    doc.text('No hay miembros registrados');
  }
  doc.moveDown();

  // Conclusión
  if (grupo.conclusion) {
    doc.fontSize(16).fillColor('#000').text('Conclusión del Director', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(grupo.conclusion, { align: 'justify' });
    doc.moveDown();
  }

  // Puntuación
  if (grupo.puntuacion) {
    doc.fontSize(16).fillColor('#000').text('Puntuación del Año', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`${grupo.puntuacion}/10`, { align: 'center' });
    doc.moveDown();
  }

  // Fecha de finalización
  if (grupo.fecha_finalizacion) {
    doc.fontSize(10).fillColor('#666');
    doc.text(
      `Grupo finalizado el: ${new Date(grupo.fecha_finalizacion).toLocaleString('es-UY')}`,
      { align: 'right' }
    );
  }

  doc.end();
}
