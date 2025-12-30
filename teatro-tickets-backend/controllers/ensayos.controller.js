import { query } from '../db/postgres.js';

// Crear ensayo para una obra
export const crearEnsayo = async (req, res) => {
  try {
    const { obra_id, showId, funcion_id, titulo, fecha, hora_fin, lugar, descripcion } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;

    // Compatibilidad: el cliente legacy puede no enviar obra_id.
    // Intentar derivarlo desde funcion_id/showId, o como fallback usar la última obra del director.
    let finalObraId = obra_id;
    const funcionId = Number(funcion_id ?? showId);

    if (!finalObraId && Number.isFinite(funcionId)) {
      const obraFromFuncion = await query('SELECT obra_id FROM funciones WHERE id = $1', [funcionId]);
      if (obraFromFuncion.rows.length > 0) {
        finalObraId = obraFromFuncion.rows[0].obra_id;
      }
    }

    if (!finalObraId && userRole === 'ADMIN') {
      const lastObra = await query(
        `SELECT o.id AS obra_id
         FROM funciones f
         JOIN obras o ON o.id = f.obra_id
         JOIN grupos g ON g.id = o.grupo_id
         WHERE g.director_cedula = $1
         ORDER BY f.fecha DESC
         LIMIT 1`,
        [userCedula]
      );
      if (lastObra.rows.length > 0) {
        finalObraId = lastObra.rows[0].obra_id;
      }
    }

    if (!finalObraId || !titulo || !fecha || !lugar) {
      return res.status(400).json({ error: 'obra_id (o showId/funcion_id), título, fecha y lugar son requeridos' });
    }

    // Verificar que la obra existe y que el usuario tiene permiso
    const obraResult = await query(
      `SELECT o.grupo_id, g.director_cedula 
       FROM obras o 
       JOIN grupos g ON g.id = o.grupo_id 
       WHERE o.id = $1`,
      [finalObraId]
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
      [finalObraId, titulo, fecha, hora_fin || null, lugar, descripcion || '']
    );

    console.log(`✅ Ensayo creado para obra ${finalObraId}: ${titulo}`);
    // Compatibilidad con cliente legacy/tests
    res.json({ ...result.rows[0], actores: [] });
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

    res.json(ensayos.rows.map(e => ({ ...e, actores: [] })));
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
      return res.json({ ...ensayo, actores: [] });
    }

    if (userRole === 'ADMIN') {
      const directorCedula = ensayo.grupo_director_cedula ?? ensayo.director_cedula;
      if (directorCedula && String(directorCedula) !== String(userCedula)) {
        return res.status(403).json({ error: 'No tienes permiso para ver este ensayo' });
      }
      return res.json({ ...ensayo, actores: [] });
    }

    const memberCheck = await query(
      'SELECT 1 FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE',
      [ensayo.grupo_id, userCedula]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ensayo' });
    }

    res.json({ ...ensayo, actores: [] });
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
       JOIN obras o ON o.id = e.obra_id
       JOIN grupos g ON g.id = o.grupo_id
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
    res.json({ ...result.rows[0], actores: [] });
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
       JOIN obras o ON o.id = e.obra_id
       JOIN grupos g ON g.id = o.grupo_id
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
