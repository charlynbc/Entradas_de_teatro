import { createUser, listUsers, listSellersWithStats, deleteUserByFlexibleId, listMembers as listMembersSvc } from '../services/users.service.js';

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
    const rows = await listUsers();
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
    await deleteUserByFlexibleId(id);
    res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

// Listar todos los miembros (excluye usuario supremo)
export async function listarMiembros(req, res) {
  try {
    const { role } = req.user;
    const rows = await listMembersSvc(role);
    res.json(rows);
  } catch (error) {
    console.error('Error listando miembros:', error);
    res.status(500).json({ error: error.message });
  }
}
