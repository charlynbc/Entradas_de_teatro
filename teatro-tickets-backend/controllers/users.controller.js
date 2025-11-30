import { readData, writeData } from '../utils/dataStore.js';

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
    const data = await readData();
    const vendedores = (data.users || [])
      .filter(user => user.role === 'VENDEDOR' && user.active !== false)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(vendedores);
  } catch (error) {
    console.error('Error listando vendedores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function desactivarUsuario(req, res) {
  try {
    const { phone } = req.params;
    const data = await readData();
    const user = data.users.find(u => u.phone === phone);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    user.active = false;
    await writeData(data);
    res.json({ ok: true, mensaje: 'Usuario desactivado' });
  } catch (error) {
    console.error('Error desactivando usuario:', error);
    res.status(500).json({ error: error.message });
  }
}
