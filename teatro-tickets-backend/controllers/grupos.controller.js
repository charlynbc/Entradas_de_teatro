import {
  createGrupo as createGrupoSvc,
  listGrupos as listGruposSvc,
  getGrupoById as getGrupoByIdSvc,
  updateGrupo as updateGrupoSvc,
  addMiembroToGrupo as addMiembroSvc,
  removeMiembroFromGrupo as removeMiembroSvc,
  archivarGrupo as archivarGrupoSvc,
  listActoresDisponibles as listActoresSvc
} from '../services/grupos.service.js';

/**
 * Crear nuevo grupo
 * POST /api/grupos
 */
export async function crearGrupo(req, res) {
  try {
    const { cedula, rol } = req.user;

    // Solo SUPER y ADMIN pueden crear grupos
    if (rol !== 'SUPER' && rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para crear grupos' });
    }

    const {
      nombre,
      descripcion,
      dia_semana,
      hora_inicio,
      fecha_inicio,
      fecha_fin,
      obra_a_realizar
    } = req.body;

    // Validaciones
    if (!nombre || !dia_semana || !hora_inicio || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: nombre, dia_semana, hora_inicio, fecha_inicio, fecha_fin' 
      });
    }

    const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (!diasValidos.includes(dia_semana)) {
      return res.status(400).json({ error: 'Día de semana inválido' });
    }

    // Crear grupo con el usuario como director
    const grupo = await createGrupoSvc({
      nombre,
      descripcion,
      director_cedula: cedula,
      dia_semana,
      hora_inicio,
      fecha_inicio,
      fecha_fin,
      obra_a_realizar
    });

    console.log(`✅ Grupo creado: ${grupo.nombre} por ${req.user.name}`);
    res.json(grupo);
  } catch (error) {
    console.error('Error creando grupo:', error);
    res.status(500).json({ error: error.message || 'Error al crear grupo' });
  }
}

/**
 * Listar grupos según el rol del usuario
 * GET /api/grupos
 */
export async function listarGrupos(req, res) {
  try {
    const { cedula, rol } = req.user;
    const grupos = await listGruposSvc(cedula, rol);
    res.json(grupos);
  } catch (error) {
    console.error('Error listando grupos:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
}

/**
 * Obtener grupo por ID
 * GET /api/grupos/:id
 */
export async function obtenerGrupo(req, res) {
  try {
    const { cedula, rol } = req.user;
    const { id } = req.params;

    const grupo = await getGrupoByIdSvc(parseInt(id), cedula, rol);

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado o sin permiso' });
    }

    res.json(grupo);
  } catch (error) {
    console.error('Error obteniendo grupo:', error);
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
}

/**
 * Actualizar grupo
 * PUT /api/grupos/:id
 */
export async function actualizarGrupo(req, res) {
  try {
    const { cedula, rol } = req.user;
    const { id } = req.params;
    const updates = req.body;

    const grupo = await updateGrupoSvc(parseInt(id), cedula, rol, updates);

    console.log(`✅ Grupo actualizado: ${grupo.nombre}`);
    res.json(grupo);
  } catch (error) {
    console.error('Error actualizando grupo:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar grupo' });
  }
}

/**
 * Agregar miembro al grupo
 * POST /api/grupos/:id/miembros
 */
export async function agregarMiembro(req, res) {
  try {
    const { cedula, rol } = req.user;
    const { id } = req.params;
    const { miembro_cedula } = req.body;

    if (!miembro_cedula) {
      return res.status(400).json({ error: 'Falta miembro_cedula' });
    }

    const miembro = await addMiembroSvc(parseInt(id), miembro_cedula, cedula, rol);

    console.log(`✅ Miembro agregado al grupo ${id}`);
    res.json(miembro);
  } catch (error) {
    console.error('Error agregando miembro:', error);
    res.status(400).json({ error: error.message || 'Error al agregar miembro' });
  }
}

/**
 * Eliminar miembro del grupo
 * DELETE /api/grupos/:id/miembros/:miembroCedula
 */
export async function eliminarMiembro(req, res) {
  try {
    const { cedula, rol } = req.user;
    const { id, miembroCedula } = req.params;

    const miembro = await removeMiembroSvc(parseInt(id), miembroCedula, cedula, rol);

    console.log(`✅ Miembro eliminado del grupo ${id}`);
    res.json({ message: 'Miembro eliminado exitosamente', miembro });
  } catch (error) {
    console.error('Error eliminando miembro:', error);
    res.status(400).json({ error: error.message || 'Error al eliminar miembro' });
  }
}

/**
 * Archivar grupo
 * POST /api/grupos/:id/archivar
 */
export async function archivarGrupo(req, res) {
  try {
    const { cedula, rol } = req.user;
    const { id } = req.params;

    const grupo = await archivarGrupoSvc(parseInt(id), cedula, rol);

    console.log(`🗄️  Grupo archivado: ${grupo.nombre}`);
    res.json(grupo);
  } catch (error) {
    console.error('Error archivando grupo:', error);
    res.status(400).json({ error: error.message || 'Error al archivar grupo' });
  }
}

/**
 * Listar actores disponibles para agregar al grupo
 * GET /api/grupos/:id/actores-disponibles
 */
export async function listarActoresDisponibles(req, res) {
  try {
    const { id } = req.params;
    const actores = await listActoresSvc(parseInt(id));
    res.json(actores);
  } catch (error) {
    console.error('Error listando actores disponibles:', error);
    res.status(500).json({ error: 'Error al listar actores disponibles' });
  }
}
