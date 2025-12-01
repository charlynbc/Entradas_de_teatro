import { comparePassword, hashPassword, generateToken } from '../config/auth.js';
import { query } from '../db/postgres.js';

export async function login(req, res) {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'phone y password son obligatorios' });
    }
    
    // Buscar usuario por cédula en PostgreSQL
    const result = await query(
      'SELECT * FROM users WHERE cedula = $1',
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }
    
    const user = result.rows[0];
    
    if (!user.password) {
      return res.status(400).json({ 
        error: 'Debe completar registro',
        requiresSetup: true,
        phone: user.cedula 
      });
    }
    
    // Verificar password con bcrypt
    const valid = await comparePassword(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Mapear roles: supremo -> SUPER, admin -> ADMIN, vendedor -> VENDEDOR
    const roleMap = {
      'supremo': 'SUPER',
      'admin': 'ADMIN',
      'vendedor': 'VENDEDOR'
    };
    
    const token = generateToken({
      phone: user.cedula,
      role: roleMap[user.rol] || user.rol,
      name: user.nombre
    });
    
    res.json({
      token,
      user: {
        phone: user.cedula,
        role: roleMap[user.rol] || user.rol,
        name: user.nombre
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function completarRegistro(req, res) {
  try {
    const { phone, name, password } = req.body;
    
    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'phone, name y password son obligatorios' });
    }
    
    // Buscar usuario en PostgreSQL
    const result = await query('SELECT * FROM users WHERE cedula = $1', [phone]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = result.rows[0];
    
    if (user.password) {
      return res.status(400).json({ error: 'Usuario ya completó registro' });
    }
    
    // Actualizar usuario con nombre y password hasheado
    const hashedPassword = await hashPassword(password);
    await query(
      'UPDATE users SET nombre = $1, password = $2, updated_at = NOW() WHERE cedula = $3',
      [name, hashedPassword, phone]
    );
    
    const roleMap = {
      'supremo': 'SUPER',
      'admin': 'ADMIN',
      'vendedor': 'VENDEDOR'
    };
    
    const token = generateToken({
      phone,
      role: roleMap[user.rol] || user.rol,
      name
    });
    
    res.json({ 
      ok: true, 
      token,
      user: { phone, name, role: roleMap[user.rol] || user.rol }
    });
  } catch (error) {
    console.error('Error en completar registro:', error);
    res.status(500).json({ error: error.message });
  }
}
    console.error('Error completando registro:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function verificarToken(req, res) {
  // Si llegó acá, el middleware authenticate ya validó el token
  res.json({ 
    ok: true, 
    user: req.user 
  });
}
