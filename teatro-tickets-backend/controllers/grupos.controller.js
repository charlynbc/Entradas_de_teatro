/**
 * Controller: Grupos Teatrales
 * Descripción: Gestión completa de grupos según SUPER PROMPT BACÓ
 * Fecha: 27-12-2025
 */

import pool, { transaction } from '../db/postgres.js';
import PDFDocument from 'pdfkit';

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

        // Regla:
        // - Un ADMIN crea grupos y queda asignado automáticamente como DIRECTOR del grupo.
        // - Un SUPER puede crear grupos para sí mismo o para un director_principal_cedula.
        const isAdminCreator = req.user.role === 'ADMIN';
        const directorPrincipal = isAdminCreator
            ? req.user.cedula
            : (director_principal_cedula || req.user.cedula);

        // Un ADMIN no puede crear un grupo para otro director.
        if (isAdminCreator && director_principal_cedula && director_principal_cedula !== req.user.cedula) {
            return res.status(403).json({ error: 'Un director solo puede crear grupos para sí mismo' });
        }

        const grupo = await transaction(async (client) => {
            // Verificar que el director principal existe y es ADMIN o SUPER
            const checkDirector = await client.query(
                'SELECT cedula, role FROM users WHERE cedula = $1',
                [directorPrincipal]
            );

            if (checkDirector.rows.length === 0) {
                const err = new Error('Director no encontrado');
                err.status = 404;
                throw err;
            }

            if (!['SUPER', 'ADMIN'].includes(checkDirector.rows[0].role)) {
                const err = new Error('El director principal debe ser SUPER o ADMIN');
                err.status = 403;
                throw err;
            }

            const result = await client.query(
                `INSERT INTO grupos 
                (nombre, descripcion, director_cedula, fecha_inicio, fecha_fin, dia_semana, hora_inicio, obra_a_realizar, estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO')
                RETURNING *`,
                [
                    nombre,
                    req.body.descripcion,
                    directorPrincipal,
                    fecha_inicio,
                    fecha_fin,
                    req.body.dia_semana,
                    req.body.hora_inicio,
                    obra || req.body.obra_a_realizar,
                ]
            );

            const created = result.rows[0];

            // Insertar membresía del director principal en el grupo
            await client.query(
                `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
                 VALUES ($1, $2, 'DIRECTOR', true)
                 ON CONFLICT (grupo_id, miembro_cedula)
                 DO UPDATE SET rol_en_grupo = 'DIRECTOR', activo = true`,
                [created.id, directorPrincipal]
            );

            return created;
        });

        res.status(201).json({
            message: 'Grupo creado exitosamente',
            grupo
        });

    } catch (error) {
        console.error('Error al crear grupo:', error);
        res.status(error.status || 500).json({ error: error.message || 'Error al crear grupo' });
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

        // En schema v3 la vista canónica es v_grupos_completos.
        // Devolvemos un ARRAY (compat con frontend y tests: response.data.grupos || response.data)
        let query = 'SELECT * FROM v_grupos_completos WHERE 1=1';
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

        // Compatibilidad: algunos consumidores esperan directamente el array
        res.json(result.rows);

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
            'SELECT * FROM v_grupos_completos WHERE id = $1',
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
            `SELECT
                gd.grupo_id,
                gd.director_cedula,
                gd.activo,
                gd.joined_at as fecha_asignacion,
                gd.es_principal,
                u.name as nombre,
                u.apellido,
                u.email,
                u.foto_url
            FROM grupo_directores gd
            JOIN users u ON gd.director_cedula = u.cedula
            WHERE gd.grupo_id = $1
            ORDER BY gd.es_principal DESC, gd.joined_at`,
            [id]
        );

        // Obtener actores
        const actoresResult = await pool.query(
            `SELECT
                ga.grupo_id,
                ga.actor_cedula,
                ga.activo,
                ga.joined_at as fecha_asignacion,
                ga.personaje,
                u.name as nombre,
                u.apellido,
                u.email,
                u.foto_url
            FROM grupo_actores ga
            JOIN users u ON ga.actor_cedula = u.cedula
            WHERE ga.grupo_id = $1
            ORDER BY ga.joined_at`,
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
        const { director_cedula, es_principal = false, cedula, nombre, name, password, genero, phone, email } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        const targetCedula = director_cedula || cedula;
        if (!targetCedula) {
            return res.status(400).json({ error: 'director_cedula es obligatorio' });
        }

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
        // Verificar que el nuevo director existe. Si no existe, SUPER puede crearlo (backend se adapta al frontend).
        let checkNewDirector = await pool.query(
            'SELECT role FROM users WHERE cedula = $1',
            [targetCedula]
        );

        if (checkNewDirector.rows.length === 0) {
            if (userRole !== 'SUPER') {
                return res.status(404).json({ error: 'Director no encontrado' });
            }

            // Crear director si el payload trae datos mínimos
            const finalName = nombre || name;
            if (!finalName) {
                return res.status(400).json({ error: 'Para crear un director nuevo se requiere nombre' });
            }

            const { createUser } = await import('../services/users.service.js');
            await createUser({
                cedula: targetCedula,
                nombre: finalName,
                password: password || 'admin123',
                rol: 'ADMIN',
                genero: genero || 'otro',
                phone,
                email,
                requesterRole: userRole
            });

            checkNewDirector = await pool.query(
                'SELECT role FROM users WHERE cedula = $1',
                [targetCedula]
            );
        }

        if (!['SUPER', 'ADMIN'].includes(checkNewDirector.rows[0].role)) {
            return res.status(400).json({
                error: 'El usuario debe ser SUPER o ADMIN'
            });
        }

        // Si es principal, el principal se define por grupos.director_cedula (schema v3).
        if (es_principal) {
            await pool.query(
                // En schema v3 el campo se llama director_cedula
                'UPDATE grupos SET director_cedula = $1 WHERE id = $2',
                [targetCedula, id]
            );
        }

        // Agregar director (fuente de verdad: grupo_miembros).
        // IMPORTANTE: grupo_directores suele ser una VIEW de compatibilidad; no usar ON CONFLICT sobre views.
        await pool.query(
            `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
             VALUES ($1, $2, 'DIRECTOR', TRUE)
             ON CONFLICT (grupo_id, miembro_cedula)
             DO UPDATE SET rol_en_grupo = 'DIRECTOR', activo = TRUE`,
            [id, targetCedula]
        );

        res.json({ message: 'Director agregado exitosamente' });

    } catch (error) {
        console.error('Error al agregar director:', {
            grupoId: req.params?.id,
            body: req.body,
            error: error?.message || String(error)
        });
        res.status(500).json({ error: error?.message || 'Error al agregar director' });
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
            "SELECT COUNT(*) as total FROM grupo_miembros WHERE grupo_id = $1 AND rol_en_grupo = 'DIRECTOR' AND activo = TRUE",
            [id]
        );

        if (parseInt(countDirectores.rows[0].total) === 1) {
            return res.status(400).json({ 
                error: 'No se puede quitar el único director del grupo' 
            });
        }

        // Quitar director (grupo_miembros)
        await pool.query(
            "DELETE FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = 'DIRECTOR'",
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

        // Agregar actor (fuente de verdad: grupo_miembros). personaje es legacy, no se persiste en schema v3.
        await pool.query(
            `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
             VALUES ($1, $2, 'ACTOR', TRUE)
             ON CONFLICT (grupo_id, miembro_cedula)
             DO UPDATE SET rol_en_grupo = 'ACTOR', activo = TRUE`,
            [id, actor_cedula]
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

        // Quitar actor (grupo_miembros)
        await pool.query(
            "DELETE FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = 'ACTOR'",
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

/**
 * Listar grupos finalizados/archivados
 * GET /api/grupos/finalizados/lista
 */
export const listarGruposFinalizados = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                g.*,
                u.name as director_nombre,
                COUNT(DISTINCT gm.miembro_cedula) FILTER (WHERE gm.activo = TRUE) as total_miembros,
                COUNT(DISTINCT o.id) as total_obras,
                COUNT(DISTINCT f.id) as total_funciones
            FROM grupos g
            LEFT JOIN users u ON u.cedula = g.director_cedula
            LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
            LEFT JOIN obras o ON o.grupo_id = g.id
            LEFT JOIN funciones f ON f.obra_id = o.id
            WHERE g.estado IN ('ARCHIVADO', 'INACTIVO')
               OR (g.fecha_fin IS NOT NULL AND g.fecha_fin < CURRENT_DATE)
            GROUP BY g.id, u.name
            ORDER BY g.fecha_fin DESC, g.updated_at DESC`
        );

        res.json({
            total: result.rows.length,
            grupos: result.rows
        });
    } catch (error) {
        console.error('Error al listar grupos finalizados:', error);
        res.status(500).json({ error: 'Error al listar grupos finalizados' });
    }
};

/**
 * Finalizar/Archivar grupo
 * POST /api/grupos/:id/finalizar
 */
export const finalizarGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar que el grupo existe
        const checkRes = await pool.query(
            'SELECT * FROM grupos WHERE id = $1',
            [id]
        );

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const grupo = checkRes.rows[0];

        // Solo SUPER o director del grupo pueden finalizar
        if (userRole === 'ADMIN' && grupo.director_cedula !== userCedula) {
            return res.status(403).json({ error: 'No tienes permiso para finalizar este grupo' });
        }

        // Actualizar estado a ARCHIVADO
        const result = await pool.query(
            'UPDATE grupos SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            ['ARCHIVADO', id]
        );

        res.json({
            message: 'Grupo finalizado exitosamente',
            grupo: result.rows[0]
        });

    } catch (error) {
        console.error('Error finalizando grupo:', error);
        res.status(500).json({ error: 'Error al finalizar grupo' });
    }
};

async function computeLiquidacionGrupo(grupoId) {
    const totalesRes = await pool.query(
        `SELECT
            COUNT(*)::int AS total_tickets,
            COUNT(*) FILTER (WHERE t.estado IN ('PAGADO','USADO'))::int AS tickets_pagados,
            COUNT(*) FILTER (WHERE t.estado = 'USADO')::int AS tickets_usados,
            COALESCE(SUM(
              CASE WHEN t.estado IN ('PAGADO','USADO')
                THEN COALESCE(t.precio, f.precio_base)
                ELSE 0
              END
            ), 0)::numeric(12,2) AS ingresos_total
         FROM tickets t
         JOIN funciones f ON f.id = t.funcion_id
         JOIN obras o ON o.id = f.obra_id
         WHERE o.grupo_id = $1`,
        [grupoId]
    );

    const porFuncionRes = await pool.query(
        `SELECT
            f.id AS funcion_id,
            f.fecha,
            f.lugar,
            o.id AS obra_id,
            o.nombre AS obra_nombre,
            COUNT(*)::int AS total_tickets,
            COUNT(*) FILTER (WHERE t.estado IN ('PAGADO','USADO'))::int AS tickets_pagados,
            COUNT(*) FILTER (WHERE t.estado = 'USADO')::int AS tickets_usados,
            COALESCE(SUM(
              CASE WHEN t.estado IN ('PAGADO','USADO')
                THEN COALESCE(t.precio, f.precio_base)
                ELSE 0
              END
            ), 0)::numeric(12,2) AS ingresos_total
         FROM funciones f
         JOIN obras o ON o.id = f.obra_id
         LEFT JOIN tickets t ON t.funcion_id = f.id
         WHERE o.grupo_id = $1
         GROUP BY f.id, f.fecha, f.lugar, o.id, o.nombre
         ORDER BY f.fecha ASC`,
        [grupoId]
    );

    const porVendedorRes = await pool.query(
        `SELECT
            t.vendedor_phone,
            u.name AS vendedor_nombre,
            COUNT(*)::int AS total_tickets,
            COUNT(*) FILTER (WHERE t.estado IN ('PAGADO','USADO'))::int AS tickets_pagados,
            COUNT(*) FILTER (WHERE t.estado = 'USADO')::int AS tickets_usados,
            COALESCE(SUM(
              CASE WHEN t.estado IN ('PAGADO','USADO')
                THEN COALESCE(t.precio, f.precio_base)
                ELSE 0
              END
            ), 0)::numeric(12,2) AS ingresos_total
         FROM tickets t
         JOIN funciones f ON f.id = t.funcion_id
         JOIN obras o ON o.id = f.obra_id
         LEFT JOIN users u ON u.phone = t.vendedor_phone
         WHERE o.grupo_id = $1
         GROUP BY t.vendedor_phone, u.name
         ORDER BY ingresos_total DESC NULLS LAST`,
        [grupoId]
    );

    const totales = totalesRes.rows[0] || {
        total_tickets: 0,
        tickets_pagados: 0,
        tickets_usados: 0,
        ingresos_total: 0
    };

    return {
        totales: {
            total_tickets: Number(totales.total_tickets || 0),
            tickets_pagados: Number(totales.tickets_pagados || 0),
            tickets_usados: Number(totales.tickets_usados || 0),
            ingresos_total: Number(totales.ingresos_total || 0)
        },
        por_funcion: porFuncionRes.rows.map(r => ({
            funcion_id: r.funcion_id,
            fecha: r.fecha,
            lugar: r.lugar,
            obra_id: r.obra_id,
            obra_nombre: r.obra_nombre,
            total_tickets: Number(r.total_tickets || 0),
            tickets_pagados: Number(r.tickets_pagados || 0),
            tickets_usados: Number(r.tickets_usados || 0),
            ingresos_total: Number(r.ingresos_total || 0)
        })),
        por_vendedor: porVendedorRes.rows.map(r => ({
            vendedor_phone: r.vendedor_phone,
            vendedor_nombre: r.vendedor_nombre || null,
            total_tickets: Number(r.total_tickets || 0),
            tickets_pagados: Number(r.tickets_pagados || 0),
            tickets_usados: Number(r.tickets_usados || 0),
            ingresos_total: Number(r.ingresos_total || 0)
        }))
    };
}

function isGrupoCerrado(grupo) {
    const estado = String(grupo?.estado || '').toUpperCase();
    if (['ARCHIVADO', 'INACTIVO', 'FINALIZADO'].includes(estado)) return true;
    return Boolean(grupo?.fecha_fin) && new Date(grupo.fecha_fin) < new Date(new Date().toISOString().slice(0, 10));
}

async function assertGrupoPermisos(req, res, grupoId) {
    const checkRes = await pool.query('SELECT * FROM grupos WHERE id = $1', [grupoId]);
    if (checkRes.rows.length === 0) {
        res.status(404).json({ error: 'Grupo no encontrado' });
        return null;
    }
    const grupo = checkRes.rows[0];

    if (req.user.role !== 'SUPER' && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'No tienes permiso' });
        return null;
    }
    if (req.user.role === 'ADMIN' && grupo.director_cedula !== req.user.cedula) {
        res.status(403).json({ error: 'No tienes permiso para este grupo' });
        return null;
    }

    if (!isGrupoCerrado(grupo)) {
        res.status(400).json({ error: 'El grupo no está finalizado/archivado' });
        return null;
    }
    return grupo;
}

/**
 * Obtener liquidación final del grupo (live + snapshot si existe)
 * GET /api/grupos/:id/liquidacion-final
 */
export const obtenerLiquidacionFinalGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const grupoId = Number(id);
        if (!Number.isFinite(grupoId)) {
            return res.status(400).json({ error: 'ID de grupo inválido' });
        }

        const grupo = await assertGrupoPermisos(req, res, grupoId);
        if (!grupo) return;

        const snapshotRes = await pool.query(
            'SELECT * FROM liquidaciones_grupo WHERE grupo_id = $1 LIMIT 1',
            [grupoId]
        );

        const calculado = await computeLiquidacionGrupo(grupoId);

        const snapshot = snapshotRes.rows[0]
            ? {
                id: snapshotRes.rows[0].id,
                grupo_id: snapshotRes.rows[0].grupo_id,
                created_by_cedula: snapshotRes.rows[0].created_by_cedula,
                created_at: snapshotRes.rows[0].created_at,
                ingresos_total: Number(snapshotRes.rows[0].ingresos_total || 0),
                total_tickets: Number(snapshotRes.rows[0].total_tickets || 0),
                tickets_pagados: Number(snapshotRes.rows[0].tickets_pagados || 0),
                tickets_usados: Number(snapshotRes.rows[0].tickets_usados || 0),
                gastos_total: Number(snapshotRes.rows[0].gastos_total || 0),
                alquiler_total: Number(snapshotRes.rows[0].alquiler_total || 0),
                neto_total: Number(snapshotRes.rows[0].neto_total || 0),
                puntos_total: snapshotRes.rows[0].puntos_total === null ? null : Number(snapshotRes.rows[0].puntos_total),
                valor_punto: snapshotRes.rows[0].valor_punto === null ? null : Number(snapshotRes.rows[0].valor_punto),
                notas: snapshotRes.rows[0].notas || null,
                datos: snapshotRes.rows[0].datos || {}
              }
            : null;

        res.json({
            ok: true,
            grupo: {
                id: grupo.id,
                nombre: grupo.nombre,
                estado: grupo.estado,
                director_cedula: grupo.director_cedula,
                fecha_inicio: grupo.fecha_inicio,
                fecha_fin: grupo.fecha_fin
            },
            snapshot,
            calculado
        });
    } catch (error) {
        console.error('Error obteniendo liquidación final:', error);
        res.status(500).json({ error: 'Error al obtener liquidación final del grupo' });
    }
};

/**
 * Crear snapshot (congelado) de liquidación final del grupo
 * POST /api/grupos/:id/liquidacion-final
 */
export const crearLiquidacionFinalGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const grupoId = Number(id);
        if (!Number.isFinite(grupoId)) {
            return res.status(400).json({ error: 'ID de grupo inválido' });
        }

        const grupo = await assertGrupoPermisos(req, res, grupoId);
        if (!grupo) return;

        const body = req.body || {};
        const gastos_total = body.gastos_total !== undefined ? Number(body.gastos_total) : 0;
        const alquiler_total = body.alquiler_total !== undefined ? Number(body.alquiler_total) : 0;
        const puntos_total = body.puntos_total !== undefined && body.puntos_total !== null ? Number(body.puntos_total) : null;
        const valor_punto_input = body.valor_punto !== undefined && body.valor_punto !== null ? Number(body.valor_punto) : null;
        const notas = body.notas !== undefined ? String(body.notas || '') : null;

        if (!Number.isFinite(gastos_total) || gastos_total < 0) {
            return res.status(400).json({ error: 'gastos_total inválido' });
        }
        if (!Number.isFinite(alquiler_total) || alquiler_total < 0) {
            return res.status(400).json({ error: 'alquiler_total inválido' });
        }
        if (puntos_total !== null && (!Number.isFinite(puntos_total) || puntos_total <= 0 || !Number.isInteger(puntos_total))) {
            return res.status(400).json({ error: 'puntos_total inválido (debe ser entero > 0)' });
        }
        if (valor_punto_input !== null && (!Number.isFinite(valor_punto_input) || valor_punto_input < 0)) {
            return res.status(400).json({ error: 'valor_punto inválido' });
        }

        const calculado = await computeLiquidacionGrupo(grupoId);
        const ingresos_total = calculado.totales.ingresos_total;
        const neto_total = Number((ingresos_total - gastos_total - alquiler_total).toFixed(2));
        const valor_punto = valor_punto_input !== null
            ? valor_punto_input
            : (puntos_total ? Number((neto_total / puntos_total).toFixed(4)) : null);

        const datos = {
            por_funcion: calculado.por_funcion,
            por_vendedor: calculado.por_vendedor,
            inputs: { gastos_total, alquiler_total, puntos_total, valor_punto: valor_punto_input, notas },
            generado_en: new Date().toISOString()
        };

        const insertRes = await pool.query(
            `INSERT INTO liquidaciones_grupo
             (grupo_id, created_by_cedula, ingresos_total, total_tickets, tickets_pagados, tickets_usados,
              gastos_total, alquiler_total, neto_total, puntos_total, valor_punto, notas, datos)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
             ON CONFLICT (grupo_id) DO NOTHING
             RETURNING *`,
            [
                grupoId,
                req.user.cedula,
                ingresos_total,
                calculado.totales.total_tickets,
                calculado.totales.tickets_pagados,
                calculado.totales.tickets_usados,
                gastos_total,
                alquiler_total,
                neto_total,
                puntos_total,
                valor_punto,
                notas,
                JSON.stringify(datos)
            ]
        );

        if (insertRes.rows.length === 0) {
            const existing = await pool.query('SELECT * FROM liquidaciones_grupo WHERE grupo_id = $1 LIMIT 1', [grupoId]);
            return res.status(409).json({
                error: 'La liquidación final ya existe para este grupo',
                snapshot: existing.rows[0] || null
            });
        }

        res.status(201).json({
            ok: true,
            message: 'Liquidación final creada (snapshot guardado)',
            snapshot: insertRes.rows[0]
        });
    } catch (error) {
        console.error('Error creando liquidación final:', error);
        res.status(500).json({ error: 'Error al crear liquidación final del grupo' });
    }
};

/**
 * Generar PDF de grupo
 * GET /api/grupos/:id/pdf
 */
export const generarPDFGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener datos completos del grupo
        const result = await pool.query(
            `SELECT 
                g.*,
                u.name as director_nombre,
                COUNT(DISTINCT gm.miembro_cedula) FILTER (WHERE gm.activo = TRUE) as total_miembros,
                COUNT(DISTINCT o.id) as total_obras,
                COUNT(DISTINCT f.id) as total_funciones
            FROM grupos g
            LEFT JOIN users u ON u.cedula = g.director_cedula
            LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
            LEFT JOIN obras o ON o.grupo_id = g.id
            LEFT JOIN funciones f ON f.obra_id = o.id
            WHERE g.id = $1
            GROUP BY g.id, u.name`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const grupo = result.rows[0];

        // Obtener miembros
        const miembrosRes = await pool.query(
            `SELECT u.name, u.cedula, gm.rol_en_grupo, gm.joined_at
            FROM grupo_miembros gm
            JOIN users u ON u.cedula = gm.miembro_cedula
            WHERE gm.grupo_id = $1 AND gm.activo = TRUE
            ORDER BY gm.rol_en_grupo, u.name`,
            [id]
        );

        // Crear documento PDF
        const doc = new PDFDocument();
        const filename = `grupo-${id}-${Date.now()}.pdf`;

        // Configurar headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // Contenido del PDF
        doc.fontSize(20).text('🎭 REPORTE DE GRUPO TEATRAL', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`${grupo.nombre}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12);
        doc.text(`Director: ${grupo.director_nombre || 'N/A'}`);
        doc.text(`Obra realizando: ${grupo.obra_a_realizar || 'N/A'}`);
        doc.text(`Estado: ${grupo.estado}`);
        doc.moveDown();

        if (grupo.fecha_inicio) {
            doc.text(`Fecha inicio: ${new Date(grupo.fecha_inicio).toLocaleDateString('es-DO')}`);
        }
        if (grupo.fecha_fin) {
            doc.text(`Fecha fin: ${new Date(grupo.fecha_fin).toLocaleDateString('es-DO')}`);
        }
        if (grupo.dia_semana && grupo.hora_inicio) {
            doc.text(`Horario: ${grupo.dia_semana} ${grupo.hora_inicio}`);
        }
        doc.moveDown();

        doc.fontSize(14).text('Estadísticas:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Miembros activos: ${parseInt(grupo.total_miembros) || 0}`);
        doc.text(`Obras: ${parseInt(grupo.total_obras) || 0}`);
        doc.text(`Funciones realizadas: ${parseInt(grupo.total_funciones) || 0}`);
        doc.moveDown();

        if (miembrosRes.rows.length > 0) {
            doc.fontSize(14).text('Miembros:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            miembrosRes.rows.forEach((miembro, i) => {
                doc.text(`${i + 1}. ${miembro.name} (${miembro.rol_en_grupo}) - ${miembro.cedula}`);
            });
            doc.moveDown();
        }

        doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-DO')}`, { align: 'right' });

        // Finalizar PDF
        doc.end();

    } catch (error) {
        console.error('Error generando PDF grupo:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al generar PDF' });
        }
    }
};
