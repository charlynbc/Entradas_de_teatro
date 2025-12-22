import { query } from '../db/postgres.js';

// Crear ensayo para una obra
export const crearEnsayo = async (req, res) => {
  try {
    const { obra_id, titulo, fecha, hora_fin, lugar, descripcion } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;

    if (!obra_id || !titulo || !fecha || !lugar) {
      return res.status(400).json({ error: 'obra_id, título, fecha y lugar son requeridos' });
    }

    // Verificar que la obra existe y que el usuario tiene permiso
    const obraResult = await query(
      `SELECT o.grupo_id, g.director_cedula 
       FROM obras o 
       JOIN grupos g ON g.id = o.grupo_id 
       WHERE o.id = $1`,
      [obra_id]
    );

    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    const { grupo_id, director_cedula } = obraResult.rows[0];

    // Solo el director del grupo, co-directores, o SUPER pueden crear ensayos
    if (userRole !== 'SUPER' && director_cedula !== userCedula) {
      // Verificar si es co-director
      const coDirectorResult = await query(
        'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
        [grupo_id, userCedula, 'DIRECTOR']
      );

      if (coDirectorResult.rows.length === 0) {
        return res.status(403).json({ error: 'Solo los directores del grupo pueden crear ensayos' });
      }
    }

    const result = await query(
      `INSERT INTO ensayos_generales 
       (obra_id, titulo, fecha, hora_fin, lugar, descripcion, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [obra_id, titulo, fecha, hora_fin || null, lugar, descripcion || '']
    );

    console.log(`✅ Ensayo creado para obra ${obra_id}: ${titulo}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creando ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar ensayos - TODOS los ensayos del teatro (filtro en frontend)
export const listarEnsayos = async (req, res) => {
  try {
    // Traer TODOS los ensayos con información de grupo
    // El filtro "solo mis ensayos" se hace en el frontend
    const ensayos = await query('SELECT * FROM v_ensayos_completos ORDER BY fecha ASC, hora_fin ASC');

    res.json(ensayos.rows);
  } catch (error) {
    console.error('Error listando ensayos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener ensayo por ID
export const obtenerEnsayo = async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula: userCedula, role: userRole } = req.user;

    const result = await query(
      'SELECT * FROM v_ensayos_completos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    const ensayo = result.rows[0];

    if (userRole === 'SUPER') {
      return res.json(ensayo);
    }

    if (userRole === 'ADMIN') {
      if (ensayo.grupo_director_cedula !== userCedula) {
        return res.status(403).json({ error: 'No tienes permiso para ver este ensayo' });
      }
      return res.json(ensayo);
    }

    const memberCheck = await query(
      'SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE',
      [ensayo.grupo_id, userCedula]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ensayo' });
    }

    res.json(ensayo);
  } catch (error) {
    console.error('Error obteniendo ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar ensayo
export const actualizarEnsayo = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, fecha, hora_fin, lugar, descripcion } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;

    const ensayoActual = await query(
      `SELECT e.*, g.director_cedula 
       FROM ensayos_generales e
       JOIN grupos g ON g.id = e.grupo_id
       WHERE e.id = $1`,
      [id]
    );

    if (ensayoActual.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    if (userRole !== 'SUPER' && ensayoActual.rows[0].director_cedula !== userCedula) {
      return res.status(403).json({ error: 'No tienes permiso para editar este ensayo' });
    }

    const result = await query(
      `UPDATE ensayos_generales 
       SET titulo = $1, fecha = $2, hora_fin = $3, lugar = $4, descripcion = $5 
       WHERE id = $6 
       RETURNING *`,
      [titulo, fecha, hora_fin || null, lugar, descripcion || '', id]
    );

    console.log(`✅ Ensayo actualizado: \${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar ensayo
export const eliminarEnsayo = async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula: userCedula, role: userRole } = req.user;

    const ensayoActual = await query(
      `SELECT e.*, g.director_cedula 
       FROM ensayos_generales e
       JOIN grupos g ON g.id = e.grupo_id
       WHERE e.id = $1`,
      [id]
    );

    if (ensayoActual.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    if (userRole !== 'SUPER' && ensayoActual.rows[0].director_cedula !== userCedula) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este ensayo' });
    }

    await query('DELETE FROM ensayos_generales WHERE id = $1', [id]);
    
    console.log(`✅ Ensayo eliminado: \${id}`);
    res.json({ message: 'Ensayo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar ensayos de un grupo específico

// ===== ASISTENCIAS =====

// Registrar asistencia a ensayo
export const registrarAsistencia = async (req, res) => {
  try {
    const { id: ensayo_id } = req.params;
    const { miembro_cedula, asistio, llego_tarde, minutos_tarde, observaciones } = req.body;
    const { cedula: registrador, role: userRole } = req.user;

    if (!miembro_cedula) {
      return res.status(400).json({ error: 'miembro_cedula es requerido' });
    }

    // Verificar que el ensayo existe
    const ensayoResult = await query(
      `SELECT e.*, o.grupo_id, g.director_cedula 
       FROM ensayos_generales e
       JOIN obras o ON o.id = e.obra_id
       JOIN grupos g ON g.id = o.grupo_id
       WHERE e.id = $1`,
      [ensayo_id]
    );

    if (ensayoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    const ensayo = ensayoResult.rows[0];

    // Verificar permisos: solo director, co-directores o SUPER pueden registrar asistencias
    if (userRole !== 'SUPER' && ensayo.director_cedula !== registrador) {
      const coDirectorResult = await query(
        'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
        [ensayo.grupo_id, registrador, 'DIRECTOR']
      );

      if (coDirectorResult.rows.length === 0) {
        return res.status(403).json({ error: 'Solo los directores del grupo pueden registrar asistencias' });
      }
    }

    // Verificar que el miembro pertenece al grupo
    const miembroResult = await query(
      'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE',
      [ensayo.grupo_id, miembro_cedula]
    );

    if (miembroResult.rows.length === 0) {
      return res.status(400).json({ error: 'El miembro no pertenece al grupo de esta obra' });
    }

    // Insertar o actualizar asistencia
    const result = await query(
      `INSERT INTO asistencias_ensayos 
       (ensayo_id, miembro_cedula, asistio, llego_tarde, minutos_tarde, observaciones, registrado_por, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (ensayo_id, miembro_cedula) 
       DO UPDATE SET 
         asistio = EXCLUDED.asistio,
         llego_tarde = EXCLUDED.llego_tarde,
         minutos_tarde = EXCLUDED.minutos_tarde,
         observaciones = EXCLUDED.observaciones,
         registrado_por = EXCLUDED.registrado_por,
         created_at = NOW()
       RETURNING *`,
      [
        ensayo_id,
        miembro_cedula,
        asistio !== false, // Por defecto TRUE
        llego_tarde === true,
        minutos_tarde || 0,
        observaciones || '',
        registrador
      ]
    );

    console.log(`✅ Asistencia registrada para ${miembro_cedula} en ensayo ${ensayo_id}`);
    res.json({ 
      ok: true, 
      message: 'Asistencia registrada correctamente',
      asistencia: result.rows[0] 
    });
  } catch (error) {
    console.error('Error registrando asistencia:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener asistencias de un ensayo
export const obtenerAsistencias = async (req, res) => {
  try {
    const { id: ensayo_id } = req.params;

    // Obtener todas las asistencias del ensayo con info de miembros
    const result = await query(
      `SELECT 
        a.*,
        u.name as miembro_nombre,
        u.genero as miembro_genero,
        reg.name as registrado_por_nombre
       FROM asistencias_ensayos a
       JOIN users u ON u.cedula = a.miembro_cedula
       LEFT JOIN users reg ON reg.cedula = a.registrado_por
       WHERE a.ensayo_id = $1
       ORDER BY u.name ASC`,
      [ensayo_id]
    );

    // También obtener el resumen estadístico
    const resumenResult = await query(
      'SELECT * FROM v_resumen_asistencias_ensayo WHERE ensayo_id = $1',
      [ensayo_id]
    );

    res.json({
      ensayo_id,
      asistencias: result.rows,
      resumen: resumenResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener historial de asistencias de un miembro
export const obtenerHistorialMiembro = async (req, res) => {
  try {
    const { cedula } = req.params;
    const { grupo_id, obra_id } = req.query;

    let sql = 'SELECT * FROM v_historial_asistencias_miembro WHERE cedula = $1';
    const params = [cedula];

    if (grupo_id) {
      params.push(grupo_id);
      sql += ` AND grupo_id = $${params.length}`;
    }

    if (obra_id) {
      params.push(obra_id);
      sql += ` AND obra_id = $${params.length}`;
    }

    sql += ' ORDER BY ensayo_fecha DESC';

    const result = await query(sql, params);

    // Calcular estadísticas
    const total = result.rows.length;
    const presentes = result.rows.filter(r => r.asistio).length;
    const ausentes = result.rows.filter(r => !r.asistio).length;
    const llegadas_tarde = result.rows.filter(r => r.llego_tarde).length;

    res.json({
      cedula,
      total_ensayos: total,
      presentes,
      ausentes,
      llegadas_tarde,
      porcentaje_asistencia: total > 0 ? ((presentes / total) * 100).toFixed(2) : 0,
      historial: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo historial de asistencias:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener resumen de asistencias por grupo
export const obtenerResumenGrupo = async (req, res) => {
  try {
    const { grupo_id } = req.params;

    const result = await query(
      'SELECT * FROM v_resumen_asistencias_ensayo WHERE grupo_id = $1 ORDER BY ensayo_fecha DESC',
      [grupo_id]
    );

    res.json({
      grupo_id,
      ensayos: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo resumen de grupo:', error);
    res.status(500).json({ error: error.message });
  }
};