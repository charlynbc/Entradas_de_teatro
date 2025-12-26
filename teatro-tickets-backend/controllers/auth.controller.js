import { comparePassword, hashPassword, generateToken } from '../config/auth.js';
import { query } from '../db/postgres.js';

export async function login(req, res) {
  try {
    const { cedula: cedulaBody, phone, password } = req.body;
    const cedula = cedulaBody || phone; // aceptar ambos nombres de campo
    if (!cedula || !password) {
      return res.status(400).json({ error: 'cedula y password son obligatorios' });
    }
    const result = await query('SELECT * FROM users WHERE cedula = $1', [cedula]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }
    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Debe completar registro', requiresSetup: true, cedula: user.cedula });
    }
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const payload = { cedula: user.cedula, role: user.role, name: user.name };
    const token = generateToken(payload);
    res.json({ token, user: payload });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function completarRegistro(req, res) {
  try {
    const { cedula: cedulaBody, phone, nombre: nombreBody, name, password } = req.body;
    const cedula = cedulaBody || phone;
    const nombre = nombreBody || name;
    if (!cedula || !nombre || !password) {
      return res.status(400).json({ error: 'cedula, nombre y password son obligatorios' });
    }
    const result = await query('SELECT * FROM users WHERE cedula = $1', [cedula]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = result.rows[0];
    if (user.password_hash) {
      return res.status(400).json({ error: 'Usuario ya completó registro' });
    }
    const hashedPassword = await hashPassword(password);
    await query('UPDATE users SET name = $1, password_hash = $2 WHERE cedula = $3', [nombre, hashedPassword, cedula]);
    const payload = { cedula, role: user.role, name: nombre };
    const token = generateToken(payload);
    res.json({ ok: true, token, user: payload });
  } catch (error) {
    console.error('Error en completar registro:', error);
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
