import { comparePassword, hashPassword, generateToken } from '../config/auth.js';
import { readData, writeData } from '../utils/dataStore.js';

export async function login(req, res) {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'phone y password son obligatorios' });
    }
    
    const data = await readData();
    const user = (data.users || []).find(u => u.phone === phone && u.active !== false);
    
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
    
    const data = await readData();
    const user = (data.users || []).find(u => u.phone === phone);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (user.password_hash) {
      return res.status(400).json({ error: 'Usuario ya completó registro' });
    }
    
    user.name = name;
    user.password_hash = await hashPassword(password);
    await writeData(data);
    
    const token = generateToken({
      phone,
      role: user.role,
      name
    });
    
    res.json({ 
      ok: true, 
      token,
      user: { phone, name, role: user.role }
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
