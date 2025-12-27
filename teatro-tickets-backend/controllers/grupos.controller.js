/**
 * Controller: Grupos Teatrales
 * Descripción: Gestión completa de grupos según SUPER PROMPT BACÓ
 * Fecha: 27-12-2025
 */

import pool from '../db/postgres.js';

/**
 * Crear nuevo grupo
 * Permisos: SUPER, ADMIN
 */
export const crearGrupo = async (req, res) => {
    try {
        const { 
            nombre, 
            obra = 'Baco', 
            fecha_inicio, 
            fecha_fin, 
            horarios,
            director_principal_cedula 
        } = req.body;

        // Validaciones
        if (!nombre || !fecha_inicio) {
            return res.status(400).json({ 
                error: 'Nombre y fecha de inicio son obligatorios' 
            });
        }

        // El director principal puede ser el que crea o uno especificado
        const directorPrincipal = director_principal_cedula || req.user.cedula;

        // Verificar que el director principal existe y es ADMIN o SUPER
        const checkDirector = await pool.query(
            'SELECT cedula, role FROM users WHERE cedula = $1',
            [directorPrincipal]
        );

        if (checkDirector.rows.length === 0) {
            return res.status(404).json({ error: 'Director no encontrado' });
        }

        if (!['SUPER', 'ADMIN'].includes(checkDirector.rows[0].role)) {
            return res.status(403).json({ 
                error: 'El director principal debe ser SUPER o ADMIN' 
            });
        }

        // Crear grupo
        const result = await pool.query(
            `INSERT INTO grupos 
            (nombre, obra, fecha_inicio, fecha_fin, horarios, director_principal_cedula)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [nombre, obra, fecha_inicio, fecha_fin, horarios, directorPrincipal]
        );

        const grupo = result.rows[0];

        // Asignar director principal a la tabla intermedia
        await pool.query(
            `INSERT INTO grupo_directores (grupo_id, director_cedula, es_principal)
            VALUES ($1, $2, true)`,
            [grupo.id, directorPrincipal]
        );

        res.status(201).json({
            message: 'Grupo creado exitosamente',
            grupo
        });

    } catch (error) {
        console.error('Error al crear grupo:', error);
        res.status(500).json({ error: 'Error al crear grupo' });
    }
};

/**
 * Listar grupos
 * Permisos: SUPER, ADMIN, ACTOR (solo los suyos)
 */
export const listarGrupos = async (req, res) => {
    try {
        const { estado, director_cedula } = req.query;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        let query = 'SELECT * FROM v_resumen_grupos WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Filtros
        if (estado) {
            query += ` AND estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        // ACTOR solo ve grupos donde está asignado
        if (userRole === 'ACTOR') {
            query += ` AND id IN (
                SELECT grupo_id FROM grupo_actores WHERE actor_cedula = $${paramIndex}
            )`;
            params.push(userCedula);
            paramIndex++;
        }

        // Filtro por director (solo SUPER y ADMIN)
        if (director_cedula && ['SUPER', 'ADMIN'].includes(userRole)) {
            query += ` AND id IN (
                SELECT grupo_id FROM grupo_directores WHERE director_cedula = $${paramIndex}
            )`;
            params.push(director_cedula);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        res.json({
            total: result.rows.length,
            grupos: result.rows
        });

    } catch (error) {
        console.error('Error al listar grupos:', error);
        res.status(500).json({ error: 'Error al listar grupos' });
    }
};

/**
 * Obtener grupo por ID
 * Permisos: SUPER, ADMIN, ACTOR (si está asignado)
 */
export const obtenerGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Obtener grupo
        const grupoResult = await pool.query(
            'SELECT * FROM v_resumen_grupos WHERE id = $1',
            [id]
        );

        if (grupoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const grupo = grupoResult.rows[0];

        // Verificar permisos para ACTOR
        if (userRole === 'ACTOR') {
            const checkActor = await pool.query(
                'SELECT 1 FROM grupo_actores WHERE grupo_id = $1 AND actor_cedula = $2',
                [id, userCedula]
            );

            if (checkActor.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes acceso a este grupo' 
                });
            }
        }

        // Obtener directores
        const directoresResult = await pool.query(
            `SELECT gd.*, u.name as nombre, u.apellido, u.email, u.foto_url
            FROM grupo_directores gd
            JOIN users u ON gd.director_cedula = u.cedula
            WHERE gd.grupo_id = $1
            ORDER BY gd.es_principal DESC, gd.fecha_asignacion`,
            [id]
        );

        // Obtener actores
        const actoresResult = await pool.query(
            `SELECT ga.*, u.name as nombre, u.apellido, u.email, u.foto_url
            FROM grupo_actores ga
            JOIN users u ON ga.actor_cedula = u.cedula
            WHERE ga.grupo_id = $1
            ORDER BY ga.fecha_asignacion`,
            [id]
        );

        res.json({
            ...grupo,
            directores: directoresResult.rows,
            actores: actoresResult.rows
        });

    } catch (error) {
        console.error('Error al obtener grupo:', error);
        res.status(500).json({ error: 'Error al obtener grupo' });
    }
};

/**
 * Actualizar grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const actualizarGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, obra, fecha_inicio, fecha_fin, horarios, estado } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar que el grupo existe
        const grupoResult = await pool.query(
            'SELECT * FROM grupos WHERE id = $1',
            [id]
        );

        if (grupoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        // Verificar permisos: SUPER o director del grupo
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para editar este grupo' 
                });
            }
        }

        // Construir query de actualización
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (nombre !== undefined) {
            updates.push(`nombre = $${paramIndex}`);
            params.push(nombre);
            paramIndex++;
        }
        if (obra !== undefined) {
            updates.push(`obra = $${paramIndex}`);
            params.push(obra);
            paramIndex++;
        }
        if (fecha_inicio !== undefined) {
            updates.push(`fecha_inicio = $${paramIndex}`);
            params.push(fecha_inicio);
            paramIndex++;
        }
        if (fecha_fin !== undefined) {
            updates.push(`fecha_fin = $${paramIndex}`);
            params.push(fecha_fin);
            paramIndex++;
        }
        if (horarios !== undefined) {
            updates.push(`horarios = $${paramIndex}`);
            params.push(horarios);
            paramIndex++;
        }
        if (estado !== undefined) {
            updates.push(`estado = $${paramIndex}`);
            params.push(estado);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        params.push(id);
        const query = `
            UPDATE grupos 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, params);

        res.json({
            message: 'Grupo actualizado exitosamente',
            grupo: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        res.status(500).json({ error: 'Error al actualizar grupo' });
    }
};

/**
 * Agregar director al grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const agregarDirector = async (req, res) => {
    try {
        const { id } = req.params;
        const { director_cedula, es_principal = false } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar permisos
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para agregar directores' 
                });
            }
        }

        // Verificar que el nuevo director es ADMIN o SUPER
        const checkNewDirector = await pool.query(
            'SELECT role FROM users WHERE cedula = $1',
            [director_cedula]
        );

        if (checkNewDirector.rows.length === 0) {
            return res.status(404).json({ error: 'Director no encontrado' });
        }

        if (!['SUPER', 'ADMIN'].includes(checkNewDirector.rows[0].role)) {
            return res.status(400).json({ 
                error: 'El usuario debe ser SUPER o ADMIN' 
            });
        }

        // Si es principal, quitar principal a otros
        if (es_principal) {
            await pool.query(
                'UPDATE grupo_directores SET es_principal = false WHERE grupo_id = $1',
                [id]
            );

            await pool.query(
                'UPDATE grupos SET director_principal_cedula = $1 WHERE id = $2',
                [director_cedula, id]
            );
        }

        // Agregar director
        await pool.query(
            `INSERT INTO grupo_directores (grupo_id, director_cedula, es_principal)
            VALUES ($1, $2, $3)
            ON CONFLICT (grupo_id, director_cedula) 
            DO UPDATE SET es_principal = $3`,
            [id, director_cedula, es_principal]
        );

        res.json({ message: 'Director agregado exitosamente' });

    } catch (error) {
        console.error('Error al agregar director:', error);
        res.status(500).json({ error: 'Error al agregar director' });
    }
};

/**
 * Quitar director del grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const quitarDirector = async (req, res) => {
    try {
        const { id, director_cedula } = req.params;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar permisos
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para quitar directores' 
                });
            }
        }

        // No permitir quitar el director principal si es el único
        const countDirectores = await pool.query(
            'SELECT COUNT(*) as total FROM grupo_directores WHERE grupo_id = $1',
            [id]
        );

        if (parseInt(countDirectores.rows[0].total) === 1) {
            return res.status(400).json({ 
                error: 'No se puede quitar el único director del grupo' 
            });
        }

        // Quitar director
        await pool.query(
            'DELETE FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
            [id, director_cedula]
        );

        res.json({ message: 'Director eliminado exitosamente' });

    } catch (error) {
        console.error('Error al quitar director:', error);
        res.status(500).json({ error: 'Error al quitar director' });
    }
};

/**
 * Agregar actor/actriz al grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const agregarActor = async (req, res) => {
    try {
        const { id } = req.params;
        const { actor_cedula, personaje } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar permisos
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para agregar actores' 
                });
            }
        }

        // Verificar que el actor es ACTOR
        const checkActor = await pool.query(
            'SELECT role FROM users WHERE cedula = $1',
            [actor_cedula]
        );

        if (checkActor.rows.length === 0) {
            return res.status(404).json({ error: 'Actor no encontrado' });
        }

        if (checkActor.rows[0].role !== 'ACTOR') {
            return res.status(400).json({ 
                error: 'El usuario debe ser ACTOR (Actor/Actriz)' 
            });
        }

        // Agregar actor
        await pool.query(
            `INSERT INTO grupo_actores (grupo_id, actor_cedula, personaje)
            VALUES ($1, $2, $3)
            ON CONFLICT (grupo_id, actor_cedula) 
            DO UPDATE SET personaje = $3`,
            [id, actor_cedula, personaje]
        );

        res.json({ message: 'Actor agregado exitosamente' });

    } catch (error) {
        console.error('Error al agregar actor:', error);
        res.status(500).json({ error: 'Error al agregar actor' });
    }
};

/**
 * Quitar actor/actriz del grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const quitarActor = async (req, res) => {
    try {
        const { id, actor_cedula } = req.params;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar permisos
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para quitar actores' 
                });
            }
        }

        // Quitar actor
        await pool.query(
            'DELETE FROM grupo_actores WHERE grupo_id = $1 AND actor_cedula = $2',
            [id, actor_cedula]
        );

        res.json({ message: 'Actor eliminado exitosamente' });

    } catch (error) {
        console.error('Error al quitar actor:', error);
        res.status(500).json({ error: 'Error al quitar actor' });
    }
};

/**
 * Subir foto del grupo
 * Permisos: SUPER, ADMIN (si es director del grupo)
 */
export const subirFotoGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const { foto_url } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar permisos
        if (userRole !== 'SUPER') {
            const checkDirector = await pool.query(
                'SELECT 1 FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [id, userCedula]
            );

            if (checkDirector.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permisos para cambiar la foto' 
                });
            }
        }

        // Actualizar foto
        const result = await pool.query(
            'UPDATE grupos SET foto_url = $1 WHERE id = $2 RETURNING *',
            [foto_url, id]
        );

        res.json({
            message: 'Foto actualizada exitosamente',
            grupo: result.rows[0]
        });

    } catch (error) {
        console.error('Error al subir foto:', error);
        res.status(500).json({ error: 'Error al subir foto' });
    }
};

/**
 * Eliminar grupo
 * Permisos: SUPER solamente
 */
export const eliminarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        // Solo SUPER puede eliminar grupos
        if (req.user.role !== 'SUPER') {
            return res.status(403).json({ 
                error: 'Solo el Super Usuario puede eliminar grupos' 
            });
        }

        await pool.query('DELETE FROM grupos WHERE id = $1', [id]);

        res.json({ message: 'Grupo eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar grupo:', error);
        res.status(500).json({ error: 'Error al eliminar grupo' });
    }
};
