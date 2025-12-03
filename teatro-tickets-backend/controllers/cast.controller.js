import { query } from '../db.js';

/**
 * Agregar vendedor al elenco de una obra
 */
export async function agregarVendedor(req, res) {
  try {
    const { id } = req.params;  // obra_id
    const { cedula_vendedor } = req.body;
    
    // Solo ADMIN y SUPER
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar elenco' });
    }
    
    // Verificar que la obra existe
    const obraResult = await query('SELECT * FROM obras WHERE id = $1', [id]);
    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Verificar que el vendedor existe y es VENDEDOR
    const vendedorResult = await query(
      'SELECT * FROM users WHERE cedula = $1 AND rol = $2',
      [cedula_vendedor, 'vendedor']
    );
    
    if (vendedorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    // Verificar si ya está en el elenco
    const existeResult = await query(
      'SELECT * FROM elenco_obra WHERE obra_id = $1 AND cedula_vendedor = $2',
      [id, cedula_vendedor]
    );
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: 'El vendedor ya está en el elenco de esta obra' });
    }
    
    // Agregar al elenco
    await query(
      'INSERT INTO elenco_obra (obra_id, cedula_vendedor) VALUES ($1, $2)',
      [id, cedula_vendedor]
    );
    
    const vendedor = vendedorResult.rows[0];
    
    res.json({
      ok: true,
      mensaje: `${vendedor.nombre} agregado al elenco`,
      vendedor: {
        cedula: vendedor.cedula,
        nombre: vendedor.nombre
      }
    });
  } catch (error) {
    console.error('Error agregando vendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Remover vendedor del elenco de una obra
 */
export async function removerVendedor(req, res) {
  try {
    const { id, cedula } = req.params;  // obra_id, cedula_vendedor
    
    // Solo ADMIN y SUPER
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar elenco' });
    }
    
    // Verificar que existe la relación
    const result = await query(
      'SELECT * FROM elenco_obra WHERE obra_id = $1 AND cedula_vendedor = $2',
      [id, cedula]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no está en el elenco de esta obra' });
    }
    
    // Remover del elenco
    await query(
      'DELETE FROM elenco_obra WHERE obra_id = $1 AND cedula_vendedor = $2',
      [id, cedula]
    );
    
    res.json({
      ok: true,
      mensaje: 'Vendedor removido del elenco'
    });
  } catch (error) {
    console.error('Error removiendo vendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Listar elenco de una obra
 */
export async function listarElenco(req, res) {
  try {
    const { id } = req.params;  // obra_id
    
    const result = await query(
      `SELECT u.cedula, u.nombre as name, u.activo as active, e.assigned_at
       FROM elenco_obra e
       JOIN users u ON e.cedula_vendedor = u.cedula
       WHERE e.obra_id = $1
       ORDER BY e.assigned_at DESC`,
      [id]
    );
    
    res.json({
      ok: true,
      elenco: result.rows
    });
  } catch (error) {
    console.error('Error listando elenco:', error);
    res.status(500).json({ error: error.message });
  }
}
