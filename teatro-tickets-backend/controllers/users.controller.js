import { createUser, listUsers, listSellersWithStats, deleteUserByFlexibleId, listAllMembers as listMembersSvc, resetPasswordByFlexibleId } from '../services/users.service.js';

export async function crearUsuario(req, res) {
  try {
    const { cedula, nombre, password, rol } = req.body;
    const userRole = req.user.role;
    const user = await createUser({ cedula, nombre, password, rol, requesterRole: userRole });
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
    const finalPassword = newPassword || 'admin123';
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
    const { cedula, nombre, name, password, genero } = req.body;
    const userRole = req.user.role;
    const user = await createUser({ 
      cedula, 
      nombre: nombre || name, 
      name: nombre || name,
      password: password || 'admin123', 
      rol: 'VENDEDOR',
      role: 'VENDEDOR',
      genero: genero || 'otro',
      requesterRole: userRole 
    });
    res.status(201).json({
      message: 'Actor/Vendedor creado exitosamente',
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
    const { cedula, nombre, name, password, genero } = req.body;
    const userRole = req.user.role;
    
    if (userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Solo el Super Usuario puede crear directores' });
    }
    
    const user = await createUser({ 
      cedula, 
      nombre: nombre || name,
      name: nombre || name,
      password: password || 'admin123', 
      rol: 'ADMIN',
      role: 'ADMIN',
      genero: genero || 'otro',
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
