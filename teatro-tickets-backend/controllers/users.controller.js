import { readData, writeData } from '../utils/dataStore.js';
import { query } from '../db/postgres.js';

export async function crearUsuario(req, res) {
  try {
    const { cedula, nombre, password, rol } = req.body;
    
    if (!cedula || !nombre || !password || !rol) {
      return res.status(400).json({ error: 'cedula, nombre, password y rol son obligatorios' });
    }
    
    if (!['admin', 'vendedor'].includes(rol)) {
      return res.status(400).json({ error: 'rol debe ser admin o vendedor' });
    }
    
    // Verificar si ya existe
    const existente = await query('SELECT id FROM users WHERE cedula = $1', [cedula]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
    }

    // Importar bcrypt
    const bcrypt = (await import('bcrypt')).default;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar ID único
    const id = `${rol}_${cedula}`;

    const result = await query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, cedula, nombre, rol`,
      [id, cedula, nombre, hashedPassword, rol]
    );

    const user = result.rows[0];
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        phone: user.cedula,
        cedula: user.cedula,
        name: user.nombre,
        role: rol.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const result = await query(`
      SELECT id, cedula, nombre, rol, created_at
      FROM users
      WHERE rol IN ('admin', 'vendedor')
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
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
    const { id } = req.params;
    
    // Buscar usuario por cédula (id es la cedula en nuestro sistema)
    const result = await query(
      'SELECT * FROM users WHERE cedula = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Eliminar el usuario
    await query('DELETE FROM users WHERE cedula = $1', [id]);
    
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
