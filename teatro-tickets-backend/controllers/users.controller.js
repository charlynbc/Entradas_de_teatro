import { createUser, listUsers, listSellersWithStats, deleteUserByFlexibleId, listAllMembers as listMembersSvc, resetPasswordByFlexibleId, getWeeklyBirthdaysService, getUserByCedula, updateUserByCedula } from '../services/users.service.js';

export async function crearUsuario(req, res) {
  try {
    const { cedula, nombre, password, rol, genero, phone, email, fecha_nacimiento, apellido, foto_url, direccion, notas } = req.body;
    const userRole = req.user.role;
    const user = await createUser({ 
      cedula, 
      nombre, 
      password, 
      rol, 
      genero,
      phone,
      email,
      fecha_nacimiento,
      apellido,
      foto_url,
      direccion,
      notas,
      requesterRole: userRole 
    });
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const { role } = req.query;
    const rows = await listUsers(role);
    res.json(rows);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarVendedores(req, res) {
  try {
    const rows = await listSellersWithStats();
    res.json(rows);
  } catch (error) {
    console.error('Error listando vendedores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function desactivarUsuario(req, res) {
  try {
    const { id } = req.params;
    const requesterRole = req.user.role;
    await deleteUserByFlexibleId(id, requesterRole);
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

// Listar todos los usuarios activos del sistema (incluye SUPER)
export async function listarMiembros(req, res) {
  try {
    console.log('✅ Controller listarMiembros llamado por usuario:', req.user.cedula);
    const { role } = req.user;
    const rows = await listMembersSvc(role);
    console.log(`📋 listMembersSvc devolvió ${rows.length} miembros`);
    res.json(rows);
  } catch (error) {
    console.error('Error listando miembros:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    const requesterRole = req.user?.role;
    if (requesterRole !== 'SUPER') {
      const error = new Error('Solo el Super Usuario puede resetear contraseñas');
      error.status = 403;
      throw error;
    }
    const finalPassword = newPassword || 'admin';
    await resetPasswordByFlexibleId(id, finalPassword);
    res.json({ ok: true, mensaje: 'Contraseña reseteada correctamente', nueva: finalPassword });
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

// Crear actor/vendedor (para SUPER y ADMIN)
export async function crearActor(req, res) {
  try {
    const { cedula, nombre, name, password, genero, phone, telefono, email } = req.body;
    const userRole = req.user.role;
    const user = await createUser({ 
      cedula, 
      nombre: nombre || name, 
      name: nombre || name,
      password: password || 'admin', 
      rol: 'ACTOR',
      role: 'ACTOR',
      genero: genero || 'otro',
      phone: phone || telefono,
      email,
      requesterRole: userRole 
    });
    res.status(201).json({
      message: 'Actor/Actriz creado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error creando actor:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

// Crear director/admin (solo para SUPER)
export async function crearDirector(req, res) {
  try {
    const {
      cedula,
      nombre,
      name,
      password,
      genero,
      phone,
      telefono,
      email
    } = req.body;
    const userRole = req.user.role;
    
    if (userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Solo el Super Usuario puede crear directores' });
    }
    
    const user = await createUser({ 
      cedula, 
      nombre: nombre || name,
      name: nombre || name,
      password: password || 'admin', 
      rol: 'ADMIN',
      role: 'ADMIN',
      genero: genero || 'otro',
      phone: phone || telefono,
      email,
      requesterRole: userRole 
    });
    res.status(201).json({
      message: 'Director/Admin creado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error creando director:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

// Obtener cumpleaños de la semana actual
export async function getWeeklyBirthdays(req, res) {
  try {
    const birthdays = await getWeeklyBirthdaysService();
    res.json(birthdays);
  } catch (error) {
    console.error('Error obteniendo cumpleaños semanales:', error);
    res.status(500).json({ error: error.message });
  }
}
// Obtener perfil del usuario actual
export async function getMe(req, res) {
  try {
    const cedula = req.user.cedula;
    const user = await getUserByCedula(cedula);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    // No enviar el password_hash
    const { password_hash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: error.message });
  }
}

// Actualizar perfil del usuario actual
export async function updateMe(req, res) {
  try {
    const cedula = req.user.cedula;
    const updateData = req.body;
    
    // No permitir cambiar role, cedula, active, etc
    const allowedFields = ['name', 'nombre', 'email', 'telefono', 'foto_url', 'genero', 'fecha_nacimiento'];
    const filteredData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }
    
    const updated = await updateUserByCedula(cedula, filteredData);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const { password_hash, ...userData } = updated;
    res.json(userData);
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: error.message });
  }
}

// Obtener perfil de un usuario por cédula (solo SUPER o ADMIN)
export async function obtenerUsuarioPorCedula(req, res) {
  try {
    const { id } = req.params;
    const target = await getUserByCedula(id);

    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo SUPER puede ver a SUPER; ADMIN puede ver ACTOR/ADMIN
    if (target.role === 'SUPER' && req.user.role !== 'SUPER') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (req.user.role === 'ADMIN' && target.role === 'ADMIN' && target.cedula !== req.user.cedula) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { password_hash, ...userData } = target;
    return res.json(userData);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
}

// Actualizar usuario por cédula (solo SUPER o ADMIN sobre actores propios)
export async function actualizarUsuarioPorCedula(req, res) {
  try {
    const { id } = req.params;
    const requesterRole = req.user.role;
    const target = await getUserByCedula(id);

    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (target.role === 'SUPER' && requesterRole !== 'SUPER') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Directores solo pueden editar actores
    if (requesterRole === 'ADMIN' && target.role !== 'ACTOR') {
      return res.status(403).json({ error: 'Solo puedes editar actores' });
    }

    const allowedMap = {
      name: 'name',
      nombre: 'name',
      apellido: 'apellido',
      email: 'email',
      phone: 'phone',
      telefono: 'phone',
      fecha_nacimiento: 'fecha_nacimiento',
      foto_url: 'foto_url',
      notas: 'notas',
      descripcion: 'notas',
      direccion: 'direccion',
      genero: 'genero'
    };

    const payload = {};
    Object.entries(req.body || {}).forEach(([key, value]) => {
      const dbKey = allowedMap[key];
      if (dbKey) {
        payload[dbKey] = value;
      }
    });

    const updated = await updateUserByCedula(id, payload);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password_hash, ...userData } = updated;
    res.json(userData);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
}

// Cambiar contraseña del usuario actual
export async function changePassword(req, res) {
  try {
    const cedula = req.user.cedula;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    // Verificar contraseña actual
    const user = await getUserByCedula(cedula);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const bcrypt = (await import('bcrypt')).default;
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    
    // Actualizar contraseña
    const newHash = await bcrypt.hash(newPassword, 10);
    await updateUserByCedula(cedula, { password_hash: newHash });
    
    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: error.message });
  }
}