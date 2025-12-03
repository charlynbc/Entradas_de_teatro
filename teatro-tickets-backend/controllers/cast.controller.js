import { query } from '../db.js';

/**
 * Agregar vendedor al elenco de una obra
 */
export async function agregarVendedor(req, res) {
  try {
    const { id } = req.params;  // show_id
    const { cedula_vendedor } = req.body;
    
    // Solo ADMIN y SUPER
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar elenco' });
    }
    
    // Verificar que la obra existe
    const showResult = await query('SELECT * FROM shows WHERE id = $1', [id]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    // Verificar que el vendedor existe y es VENDEDOR
    const vendedorResult = await query(
      'SELECT * FROM users WHERE cedula = $1 AND role = $2',
      [cedula_vendedor, 'VENDEDOR']
    );
    
    if (vendedorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    
    // Verificar si ya está en el elenco
    const existeResult = await query(
      'SELECT * FROM shows_cast WHERE show_id = $1 AND cedula_vendedor = $2',
      [id, cedula_vendedor]
    );
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ error: 'El vendedor ya está en el elenco de esta obra' });
    }
    
    // Agregar al elenco
    await query(
      'INSERT INTO shows_cast (show_id, cedula_vendedor) VALUES ($1, $2)',
      [id, cedula_vendedor]
    );
    
    const vendedor = vendedorResult.rows[0];
    
    res.json({
      ok: true,
      mensaje: `${vendedor.name} agregado al elenco`,
      vendedor: {
        cedula: vendedor.cedula,
        nombre: vendedor.name
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
    const { id, cedula } = req.params;  // show_id, cedula_vendedor
    
    // Solo ADMIN y SUPER
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar elenco' });
    }
    
    // Verificar que existe la relación
    const result = await query(
      'SELECT * FROM shows_cast WHERE show_id = $1 AND cedula_vendedor = $2',
      [id, cedula]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no está en el elenco de esta obra' });
    }
    
    // Remover del elenco
    await query(
      'DELETE FROM shows_cast WHERE show_id = $1 AND cedula_vendedor = $2',
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
    const { id } = req.params;  // show_id
    
    const result = await query(
      `SELECT u.cedula, u.name, u.active, sc.assigned_at
       FROM shows_cast sc
       JOIN users u ON sc.cedula_vendedor = u.cedula
       WHERE sc.show_id = $1
       ORDER BY sc.assigned_at DESC`,
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
