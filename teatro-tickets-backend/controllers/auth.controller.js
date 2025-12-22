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

// Registrar nuevo usuario
export async function register(req, res) {
  try {
    const { cedula, name, password, phone, genero, role } = req.body;

    if (!cedula || !name || !password) {
      return res.status(400).json({ error: 'cedula, name y password son obligatorios' });
    }

    // Verificar que no exista
    const existing = await query('SELECT * FROM users WHERE cedula = $1', [cedula]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role || 'INVITADO'; // Por defecto INVITADO

    // Solo SUPER puede crear SUPER o ADMIN
    // Por ahora permitimos cualquier rol en registro público
    const validRoles = ['SUPER', 'ADMIN', 'VENDEDOR', 'INVITADO'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    await query(
      `INSERT INTO users (cedula, name, role, password_hash, phone, genero, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())`,
      [cedula, name, userRole, hashedPassword, phone || cedula, genero || 'otro']
    );

    const payload = { cedula, role: userRole, name };
    const token = generateToken(payload);

    res.json({ 
      ok: true, 
      message: 'Usuario registrado exitosamente',
      token, 
      user: payload 
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: error.message });
  }
}

// Cambiar contraseña
export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const cedula = req.user.cedula;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'oldPassword y newPassword son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener usuario
    const result = await query('SELECT * FROM users WHERE cedula = $1', [cedula]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verificar contraseña actual
    const valid = await comparePassword(oldPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await hashPassword(newPassword);

    // Actualizar
    await query(
      'UPDATE users SET password_hash = $1 WHERE cedula = $2',
      [hashedNewPassword, cedula]
    );

    res.json({ 
      ok: true, 
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ error: error.message });
  }
}
