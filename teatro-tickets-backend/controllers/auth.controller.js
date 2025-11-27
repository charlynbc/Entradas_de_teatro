import db from '../db.js';
import { comparePassword, hashPassword, generateToken } from '../config/auth.js';

export async function login(req, res) {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'phone y password son obligatorios' });
    }
    
    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1 AND active = TRUE',
      [phone]
    );
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }
    
    if (!user.password_hash) {
      return res.status(400).json({ 
        error: 'Debe completar registro',
        requiresSetup: true,
        phone: user.phone 
      });
    }
    
    const valid = await comparePassword(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    const token = generateToken({
      phone: user.phone,
      role: user.role,
      name: user.name
    });
    
    res.json({
      token,
      user: {
        phone: user.phone,
        role: user.role,
        name: user.name
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
    
    // Verificar que el usuario existe y no tiene password
    const check = await db.query(
      'SELECT password_hash FROM users WHERE phone = $1',
      [phone]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (check.rows[0].password_hash) {
      return res.status(400).json({ error: 'Usuario ya completó registro' });
    }
    
    const passHash = await hashPassword(password);
    
    await db.query(
      'UPDATE users SET name = $1, password_hash = $2 WHERE phone = $3',
      [name, passHash, phone]
    );
    
    const token = generateToken({
      phone,
      role: check.rows[0].role,
      name
    });
    
    res.json({ 
      ok: true, 
      token,
      user: { phone, name, role: check.rows[0].role }
    });
  } catch (error) {
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
