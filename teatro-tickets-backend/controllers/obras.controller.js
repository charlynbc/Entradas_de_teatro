import * as obrasService from '../services/obras.service.js';

export async function crearObra(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const obraData = req.body;

    if (!obraData.grupo_id || !obraData.nombre) {
      return res.status(400).json({ error: 'grupo_id y nombre son requeridos' });
    }

    const obra = await obrasService.createObra(obraData, userCedula, userRole);
    res.status(201).json(obra);
  } catch (error) {
    console.error('Error creando obra:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}

export async function listarObras(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const obras = await obrasService.listObras(userCedula, userRole);
    res.json(obras);
  } catch (error) {
    console.error('Error listando obras:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function obtenerObra(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const { id } = req.params;

    const obra = await obrasService.getObraById(parseInt(id), userCedula, userRole);
    res.json(obra);
  } catch (error) {
    console.error('Error obteniendo obra:', error);
    res.status(error.message.includes('no encontrada') ? 404 : 
               error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}

export async function listarObrasPorGrupo(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const { grupoId } = req.params;

    const obras = await obrasService.listObrasByGrupo(parseInt(grupoId), userCedula, userRole);
    res.json(obras);
  } catch (error) {
    console.error('Error listando obras del grupo:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}

export async function actualizarObra(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const { id } = req.params;
    const obraData = req.body;

    const obra = await obrasService.updateObra(parseInt(id), obraData, userCedula, userRole);
    res.json(obra);
  } catch (error) {
    console.error('Error actualizando obra:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}

export async function eliminarObra(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const { id } = req.params;

    const result = await obrasService.deleteObra(parseInt(id), userCedula, userRole);
    res.json(result);
  } catch (error) {
    console.error('Error eliminando obra:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}

export async function archivarObra(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;
    const { id } = req.params;

    const obra = await obrasService.archivarObra(parseInt(id), userCedula, userRole);
    res.json(obra);
  } catch (error) {
    console.error('Error archivando obra:', error);
    res.status(error.message.includes('permisos') ? 403 : 500).json({ error: error.message });
  }
}
