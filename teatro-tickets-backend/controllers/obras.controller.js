import { query } from '../db.js';

/**
 * Crear una nueva obra
 */
export async function crearObra(req, res) {
  try {
    const { nombre, descripcion, imagen_url } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la obra es obligatorio' });
    }
    
    // Solo ADMIN y SUPER pueden crear obras
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para crear obras' });
    }
    
    const obraId = `obra_${Date.now()}`;
    
    const result = await query(
      `INSERT INTO obras (id, nombre, descripcion, imagen_url, activa, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
       RETURNING *`,
      [obraId, nombre, descripcion || null, imagen_url || null]
    );
    
    const obra = result.rows[0];
    
    res.status(201).json({
      ok: true,
      mensaje: 'Obra creada exitosamente',
      obra
    });
  } catch (error) {
    console.error('Error creando obra:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Listar todas las obras activas (público)
 */
export async function listarObras(req, res) {
  try {
    const { incluir_inactivas } = req.query;
    
    let sql = `
      SELECT 
        o.*,
        COUNT(DISTINCT f.id) as total_funciones,
        COUNT(DISTINCT e.cedula_vendedor) as total_elenco
      FROM obras o
      LEFT JOIN funciones f ON o.id = f.obra_id
      LEFT JOIN elenco_obra e ON o.id = e.obra_id
    `;
    
    if (incluir_inactivas !== 'true') {
      sql += ' WHERE o.activa = TRUE';
    }
    
    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
    
    const result = await query(sql);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando obras:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtener detalle de una obra con sus funciones
 */
export async function obtenerObra(req, res) {
  try {
    const { id } = req.params;
    
    // Obtener obra
    const obraResult = await query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    const obra = obraResult.rows[0];
    
    // Obtener funciones de la obra
    const funcionesResult = await query(
      `SELECT 
        f.*,
        COUNT(e.code) as total_entradas,
        COUNT(CASE WHEN e.estado = 'DISPONIBLE' THEN 1 END) as disponibles,
        COUNT(CASE WHEN e.estado = 'EN_STOCK' THEN 1 END) as en_stock,
        COUNT(CASE WHEN e.estado = 'RESERVADA' THEN 1 END) as reservadas,
        COUNT(CASE WHEN e.estado IN ('VENDIDA', 'PAGADA', 'USADA') THEN 1 END) as vendidas
       FROM funciones f
       LEFT JOIN entradas e ON f.id = e.funcion_id
       WHERE f.obra_id = $1
       GROUP BY f.id
       ORDER BY f.fecha ASC`,
      [id]
    );
    
    // Obtener elenco
    const elencoResult = await query(
      `SELECT u.cedula, u.nombre as name, u.rol as role, e.assigned_at
       FROM elenco_obra e
       JOIN users u ON e.cedula_vendedor = u.cedula
       WHERE e.obra_id = $1
       ORDER BY e.assigned_at DESC`,
      [id]
    );
    
    res.json({
      ...obra,
      funciones: funcionesResult.rows,
      elenco: elencoResult.rows
    });
  } catch (error) {
    console.error('Error obteniendo obra:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualizar una obra
 */
export async function actualizarObra(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen_url, activa } = req.body;
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para editar obras' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    if (imagen_url !== undefined) {
      updates.push(`imagen_url = $${paramIndex++}`);
      values.push(imagen_url);
    }
    if (activa !== undefined) {
      updates.push(`activa = $${paramIndex++}`);
      values.push(activa);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    const sql = `UPDATE obras SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    res.json({
      ok: true,
      mensaje: 'Obra actualizada correctamente',
      obra: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando obra:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Eliminar una obra (y todas sus funciones y entradas)
 */
export async function eliminarObra(req, res) {
  try {
    const { id } = req.params;
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar obras' });
    }
    
    const obraResult = await query('SELECT * FROM obras WHERE id = $1', [id]);
    
    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    const obra = obraResult.rows[0];
    
    // Eliminar obra (CASCADE eliminará funciones, entradas y elenco)
    await query('DELETE FROM obras WHERE id = $1', [id]);
    
    res.json({
      ok: true,
      mensaje: 'Obra eliminada correctamente',
      obra: obra.nombre
    });
  } catch (error) {
    console.error('Error eliminando obra:', error);
    res.status(500).json({ error: error.message });
  }
}
