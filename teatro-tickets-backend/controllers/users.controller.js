import db from '../db.js';

export async function crearUsuario(req, res) {
  try {
    const { phone, name, role } = req.body;
    
    if (!phone || !role) {
      return res.status(400).json({ error: 'phone y role son obligatorios' });
    }
    
    if (!['ADMIN', 'VENDEDOR'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser ADMIN o VENDEDOR' });
    }
    
    // Verificar si ya existe
    const exists = await db.query('SELECT phone FROM users WHERE phone = $1', [phone]);
    
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese teléfono' });
    }
    
    const result = await db.query(
      'INSERT INTO users(phone, name, role) VALUES($1, $2, $3) RETURNING phone, name, role, created_at',
      [phone, name || null, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const result = await db.query(
      'SELECT phone, name, role, created_at FROM users WHERE active = TRUE ORDER BY created_at'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarVendedores(req, res) {
  try {
    const result = await db.query(
      `SELECT phone, name, created_at FROM users 
       WHERE role = 'VENDEDOR' AND active = TRUE 
       ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando vendedores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function desactivarUsuario(req, res) {
  try {
    const { phone } = req.params;
    
    await db.query('UPDATE users SET active = FALSE WHERE phone = $1', [phone]);
    
    res.json({ ok: true, mensaje: 'Usuario desactivado' });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}
