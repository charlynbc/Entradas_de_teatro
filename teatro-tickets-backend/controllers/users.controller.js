import { readData, writeData } from '../utils/dataStore.js';
import { query } from '../db/postgres.js';

export async function crearUsuario(req, res) {
  try {
    const { phone, name, role } = req.body;
    
    if (!phone || !role) {
      return res.status(400).json({ error: 'phone y role son obligatorios' });
    }
    
    if (!['ADMIN', 'VENDEDOR'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser ADMIN o VENDEDOR' });
    }
    
    const data = await readData();
    if (data.users.find(user => user.phone === phone)) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese teléfono' });
    }

    const nuevoUsuario = {
      phone,
      name: name || null,
      role,
      active: true,
      created_at: new Date().toISOString()
    };

    data.users.push(nuevoUsuario);
    await writeData(data);

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const data = await readData();
    const usuariosActivos = (data.users || [])
      .filter(user => user.active !== false)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json(usuariosActivos);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarVendedores(req, res) {
  try {
    // Obtener vendedores con información de sus tickets y shows
    const result = await query(`
      SELECT 
        u.id,
        u.cedula,
        u.nombre,
        u.rol,
        COUNT(DISTINCT t.show_id) as total_shows,
        COUNT(t.id) as total_tickets,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_nombre', s.nombre,
          'tickets_asignados', (
            SELECT COUNT(*) 
            FROM tickets t2 
            WHERE t2.vendedor_id = u.id 
            AND t2.show_id = s.id
          )
        )) FILTER (WHERE s.id IS NOT NULL) as shows
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_id = u.id
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.rol = 'vendedor'
      GROUP BY u.id, u.cedula, u.nombre, u.rol
      ORDER BY u.nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando vendedores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function desactivarUsuario(req, res) {
  try {
    const { phone } = req.params;
    
    // Buscar usuario por cédula (phone es realmente cedula en nuestro sistema)
    const result = await query(
      'SELECT * FROM users WHERE cedula = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar el usuario
    await query('DELETE FROM users WHERE cedula = $1', [phone]);
    
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

// Listar todos los miembros (excluye usuario supremo)
export async function listarMiembros(req, res) {
  try {
    const { role } = req.user;

    // Super puede ver todos incluyéndose, directores y actores ven a todos excepto super
    const result = await query(`
      SELECT 
        u.id,
        u.cedula,
        u.nombre,
        u.rol,
        u.created_at,
        COUNT(DISTINCT t.show_id) as obras_activas,
        json_agg(DISTINCT jsonb_build_object(
          'show_id', s.id,
          'show_nombre', s.nombre,
          'show_fecha', s.fecha
        )) FILTER (WHERE s.id IS NOT NULL) as obras
      FROM users u
      LEFT JOIN tickets t ON t.vendedor_id = u.id AND t.estado != 'USADA'
      LEFT JOIN shows s ON s.id = t.show_id
      WHERE u.rol != 'supremo' OR $1 = 'SUPER'
      GROUP BY u.id, u.cedula, u.nombre, u.rol, u.created_at
      ORDER BY 
        CASE u.rol 
          WHEN 'admin' THEN 1 
          WHEN 'vendedor' THEN 2 
          ELSE 3 
        END,
        u.nombre
    `, [role]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listando miembros:', error);
    res.status(500).json({ error: error.message });
  }
}
