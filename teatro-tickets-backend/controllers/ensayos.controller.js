import { query } from '../db/postgres.js';

// Crear ensayo general
export const crearEnsayo = async (req, res) => {
  try {
    const { titulo, fecha, lugar, descripcion, actores } = req.body;
    let directorId = req.user.id;

    // Si el token no tiene ID (tokens antiguos), obtenerlo de la base de datos
    if (!directorId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        directorId = userResult.rows[0].id;
      }
    }

    if (!titulo || !fecha || !lugar) {
      return res.status(400).json({ error: 'Título, fecha y lugar son requeridos' });
    }

    const result = await query(
      `INSERT INTO ensayos_generales 
       (titulo, fecha, lugar, descripcion, director_id, actores_ids, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [titulo, fecha, lugar, descripcion || '', directorId, JSON.stringify(actores || [])]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creando ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Listar ensayos
export const listarEnsayos = async (req, res) => {
  try {
    let { role, id: userId } = req.user;

    // Si el token no tiene ID (tokens antiguos), obtenerlo de la base de datos
    if (!userId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log(`[DEBUG] ID obtenido de DB para ${req.user.phone}: ${userId}`);
      }
    }

    let ensayos;
    if (role === 'SUPER') {
      // Super ve todos
      ensayos = await query(
        `SELECT e.*, u.nombre as director_nombre 
         FROM ensayos_generales e 
         LEFT JOIN users u ON e.director_id = u.id 
         ORDER BY e.fecha DESC`
      );
    } else if (role === 'ADMIN') {
      // Director ve los suyos
      console.log(`[DEBUG] Director buscando ensayos con director_id: ${userId}`);
      ensayos = await query(
        `SELECT e.*, u.nombre as director_nombre 
         FROM ensayos_generales e 
         LEFT JOIN users u ON e.director_id = u.id 
         WHERE e.director_id = $1 
         ORDER BY e.fecha DESC`,
        [userId]
      );
      console.log(`[DEBUG] Ensayos encontrados para director: ${ensayos.rows.length}`);
    } else {
      // Actor ve ensayos donde está incluido
      // Usamos jsonb_array_elements_text para extraer cada elemento del array
      // y compararlo directamente con el userId
      console.log(`[DEBUG] Actor buscando ensayos para userId: ${userId}`);
      ensayos = await query(
        `SELECT DISTINCT e.*, u.nombre as director_nombre 
         FROM ensayos_generales e 
         LEFT JOIN users u ON e.director_id = u.id 
         WHERE EXISTS (
           SELECT 1 
           FROM jsonb_array_elements_text(e.actores_ids) actor_id 
           WHERE actor_id = $1
         )
         ORDER BY e.fecha DESC`,
        [userId]
      );
      console.log(`[DEBUG] Ensayos encontrados: ${ensayos.rows.length}`);
      if (ensayos.rows.length > 0) {
        console.log(`[DEBUG] Primer ensayo actores_ids:`, ensayos.rows[0].actores_ids);
      }
    }

    // Obtener nombres de actores para cada ensayo
    const ensayosConActores = await Promise.all(
      ensayos.rows.map(async (ensayo) => {
        const actoresIds = JSON.parse(ensayo.actores_ids || '[]');
        if (actoresIds.length > 0) {
          const actoresResult = await query(
            `SELECT id, nombre FROM users WHERE id = ANY($1)`,
            [actoresIds]
          );
          ensayo.actores = actoresResult.rows;
        } else {
          ensayo.actores = [];
        }
        return ensayo;
      })
    );

    res.json(ensayosConActores);
  } catch (error) {
    console.error('Error listando ensayos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener ensayo por ID
export const obtenerEnsayo = async (req, res) => {
  try {
    const { id } = req.params;
    let { role, id: userId } = req.user;

    // Backward compatibility para tokens sin ID
    if (!userId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }

    const result = await query(
      `SELECT e.*, u.nombre as director_nombre 
       FROM ensayos_generales e 
       LEFT JOIN users u ON e.director_id = u.id 
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    const ensayo = result.rows[0];

    // Verificar permisos: Super ve todo, Director ve los suyos, Actor ve donde está asignado
    if (role === 'VENDEDOR') {
      return res.status(403).json({ error: 'No tienes permisos para ver ensayos' });
    }

    if (role === 'ADMIN' && ensayo.director_id !== userId) {
      return res.status(403).json({ error: 'No puedes ver ensayos de otros directores' });
    }

    if (role === 'ACTOR') {
      const actoresIds = ensayo.actores_ids || [];
      if (!actoresIds.includes(userId)) {
        return res.status(403).json({ error: 'No estás asignado a este ensayo' });
      }
    }

    const actoresIds = JSON.parse(ensayo.actores_ids || '[]');
    
    if (actoresIds.length > 0) {
      const actoresResult = await query(
        `SELECT id, nombre, cedula FROM users WHERE id = ANY($1)`,
        [actoresIds]
      );
      ensayo.actores = actoresResult.rows;
    } else {
      ensayo.actores = [];
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
    const { titulo, fecha, lugar, descripcion, actores } = req.body;
    let { role, id: userId } = req.user;

    // Si el token no tiene ID (tokens antiguos), obtenerlo de la base de datos
    if (!userId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }

    // Verificar permisos
    const ensayoActual = await query(
      'SELECT director_id FROM ensayos_generales WHERE id = $1',
      [id]
    );

    if (ensayoActual.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    if (role !== 'SUPER' && ensayoActual.rows[0].director_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este ensayo' });
    }

    const result = await query(
      `UPDATE ensayos_generales 
       SET titulo = $1, fecha = $2, lugar = $3, descripcion = $4, actores_ids = $5 
       WHERE id = $6 
       RETURNING *`,
      [titulo, fecha, lugar, descripcion || '', JSON.stringify(actores || []), id]
    );

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
    let { role, id: userId } = req.user;

    // Si el token no tiene ID (tokens antiguos), obtenerlo de la base de datos
    if (!userId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }

    // Verificar permisos
    const ensayoActual = await query(
      'SELECT director_id FROM ensayos_generales WHERE id = $1',
      [id]
    );

    if (ensayoActual.rows.length === 0) {
      return res.status(404).json({ error: 'Ensayo no encontrado' });
    }

    if (role !== 'SUPER' && ensayoActual.rows[0].director_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este ensayo' });
    }

    await query('DELETE FROM ensayos_generales WHERE id = $1', [id]);
    res.json({ message: 'Ensayo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando ensayo:', error);
    res.status(500).json({ error: error.message });
  }
};
