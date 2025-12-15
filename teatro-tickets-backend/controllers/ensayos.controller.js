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

// Listar ensayos
export const listarEnsayos = async (req, res) => {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    let ensayos;

    if (userRole === 'SUPER') {
      ensayos = await query('SELECT * FROM v_ensayos_completos ORDER BY fecha ASC, hora_fin ASC');
    } else if (userRole === 'ADMIN') {
      ensayos = await query(
        `SELECT * FROM v_ensayos_completos 
         WHERE grupo_director_cedula = $1 
         ORDER BY fecha ASC, hora_fin ASC`,
        [userCedula]
      );
    } else {
      ensayos = await query(
        `SELECT DISTINCT e.* FROM v_ensayos_completos e
         JOIN grupo_miembros gm ON gm.grupo_id = e.grupo_id
         WHERE gm.miembro_cedula = $1 AND gm.activo = TRUE
         ORDER BY e.fecha ASC, e.hora_fin ASC`,
        [userCedula]
      );
    }

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
export const listarEnsayosGrupo = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { cedula: userCedula, role: userRole } = req.user;

    if (userRole !== 'SUPER') {
      const permisoCheck = await query(
        `SELECT 1 FROM grupos WHERE id = $1 AND director_cedula = $2
         UNION
         SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE`,
        [grupoId, userCedula]
      );

      if (permisoCheck.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso para ver los ensayos de este grupo' });
      }
    }

    const ensayos = await query(
      'SELECT * FROM v_ensayos_completos WHERE grupo_id = $1 ORDER BY fecha ASC, hora_fin ASC',
      [grupoId]
    );

    res.json(ensayos.rows);
  } catch (error) {
    console.error('Error listando ensayos del grupo:', error);
    res.status(500).json({ error: error.message });
  }
};
