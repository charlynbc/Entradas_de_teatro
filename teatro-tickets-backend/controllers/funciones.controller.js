/**
 * Controller: Funciones (asociadas a Grupos)
 * Descripción: Gestión de funciones teatrales dentro de grupos
 * Fecha: 27-12-2025
 */

import pool from '../db/postgres.js';
import crypto from 'crypto';

/**
 * Crear función dentro de un grupo
 * Solo SUPER y ADMIN (directores del grupo)
 */
export async function crearFuncion(req, res) {
    const client = await pool.connect();
    
    try {
        const { grupo_id, fecha, lugar, capacidad, precio_base, descripcion } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Validar campos requeridos
        if (!grupo_id || !fecha || !lugar || !capacidad || !precio_base) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: grupo_id, fecha, lugar, capacidad, precio_base' 
            });
        }

        // Verificar que el grupo existe
        const grupoResult = await client.query(
            'SELECT * FROM grupos WHERE id = $1',
            [grupo_id]
        );

        if (grupoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const grupo = grupoResult.rows[0];

        // Si es ADMIN, verificar que es director del grupo
        if (userRole === 'ADMIN') {
            const directorResult = await client.query(
                'SELECT * FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [grupo_id, userCedula]
            );

            if (directorResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permiso para crear funciones en este grupo' 
                });
            }
        }

        // Generar código QR único
        const qrCode = crypto.randomBytes(16).toString('hex');

        // Obtener obra_id del grupo (si existe la relación)
        let obraId = grupo.obra_id || null;

        await client.query('BEGIN');

        // Insertar función
        const result = await client.query(
            `INSERT INTO funciones (
                grupo_id, obra_id, fecha, lugar, capacidad, precio_base, 
                qr_code, entradas_disponibles, estado, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PROGRAMADA', NOW(), NOW())
            RETURNING *`,
            [grupo_id, obraId, fecha, lugar, capacidad, precio_base, qrCode, capacidad]
        );

        const funcion = result.rows[0];

        // Crear entradas automáticamente
        const entradas = [];
        for (let i = 1; i <= capacidad; i++) {
            const qrEntrada = `${qrCode}-${i.toString().padStart(4, '0')}`;
            entradas.push([funcion.id, i, qrEntrada]);
        }

        // Insertar entradas en lote
        const valuesPlaceholder = entradas.map((_, idx) => 
            `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3}, 'NO_ASIGNADA', NOW())`
        ).join(',');

        await client.query(
            `INSERT INTO tickets (funcion_id, numero_asiento, qr_code, estado, created_at)
             VALUES ${valuesPlaceholder}`,
            entradas.flat()
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Función creada exitosamente',
            funcion,
            entradas_creadas: capacidad
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear función:', error);
        res.status(500).json({ error: 'Error al crear función' });
    } finally {
        client.release();
    }
}

/**
 * Listar funciones de un grupo
 */
export async function listarFuncionesGrupo(req, res) {
    try {
        const { grupo_id } = req.params;

        const result = await pool.query(
            `SELECT 
                f.*,
                g.nombre as grupo_nombre,
                g.obra as grupo_obra,
                (SELECT COUNT(*) FROM tickets WHERE funcion_id = f.id AND estado != 'NO_ASIGNADA') as entradas_asignadas
            FROM funciones f
            JOIN grupos g ON f.grupo_id = g.id
            WHERE f.grupo_id = $1
            ORDER BY f.fecha ASC`,
            [grupo_id]
        );

        res.json({
            total: result.rows.length,
            funciones: result.rows
        });

    } catch (error) {
        console.error('Error al listar funciones:', error);
        res.status(500).json({ error: 'Error al listar funciones' });
    }
}

/**
 * Obtener función por ID
 */
export async function obtenerFuncion(req, res) {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                f.*,
                g.nombre as grupo_nombre,
                g.obra as grupo_obra,
                g.estado as grupo_estado
            FROM funciones f
            JOIN grupos g ON f.grupo_id = g.id
            WHERE f.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        // Obtener estadísticas de entradas
        const statsResult = await pool.query(
            `SELECT 
                estado,
                COUNT(*) as cantidad
            FROM tickets
            WHERE funcion_id = $1
            GROUP BY estado`,
            [id]
        );

        const funcion = result.rows[0];
        funcion.estadisticas_entradas = statsResult.rows;

        res.json(funcion);

    } catch (error) {
        console.error('Error al obtener función:', error);
        res.status(500).json({ error: 'Error al obtener función' });
    }
}

/**
 * Actualizar función
 */
export async function actualizarFuncion(req, res) {
    try {
        const { id } = req.params;
        const { fecha, lugar, capacidad, precio_base, estado, foto_url } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar que la función existe y obtener su grupo
        const funcionResult = await pool.query(
            'SELECT grupo_id FROM funciones WHERE id = $1',
            [id]
        );

        if (funcionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        const grupoId = funcionResult.rows[0].grupo_id;

        // Si es ADMIN, verificar que es director del grupo
        if (userRole === 'ADMIN') {
            const directorResult = await pool.query(
                'SELECT * FROM grupo_directores WHERE grupo_id = $1 AND director_cedula = $2',
                [grupoId, userCedula]
            );

            if (directorResult.rows.length === 0) {
                return res.status(403).json({ 
                    error: 'No tienes permiso para actualizar funciones de este grupo' 
                });
            }
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (fecha !== undefined) {
            updates.push(`fecha = $${paramCount++}`);
            values.push(fecha);
        }
        if (lugar !== undefined) {
            updates.push(`lugar = $${paramCount++}`);
            values.push(lugar);
        }
        if (precio_base !== undefined) {
            updates.push(`precio_base = $${paramCount++}`);
            values.push(precio_base);
        }
        if (estado !== undefined) {
            updates.push(`estado = $${paramCount++}`);
            values.push(estado);
        }
        if (foto_url !== undefined) {
            updates.push(`foto_url = $${paramCount++}`);
            values.push(foto_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE funciones 
             SET ${updates.join(', ')}
             WHERE id = $${paramCount}
             RETURNING *`,
            values
        );

        res.json({
            message: 'Función actualizada exitosamente',
            funcion: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar función:', error);
        res.status(500).json({ error: 'Error al actualizar función' });
    }
}

/**
 * Eliminar función
 * Solo SUPER
 */
export async function eliminarFuncion(req, res) {
    try {
        const { id } = req.params;

        // Verificar si hay entradas vendidas
        const entradasResult = await pool.query(
            `SELECT COUNT(*) as vendidas 
             FROM tickets 
             WHERE funcion_id = $1 AND estado IN ('PAGADA', 'USADA')`,
            [id]
        );

        const entradasVendidas = parseInt(entradasResult.rows[0].vendidas);

        if (entradasVendidas > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar una función con entradas vendidas',
                entradas_vendidas: entradasVendidas
            });
        }

        // Eliminar función (las entradas se eliminan en cascada)
        const result = await pool.query(
            'DELETE FROM funciones WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        res.json({ 
            message: 'Función eliminada exitosamente',
            funcion: result.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar función:', error);
        res.status(500).json({ error: 'Error al eliminar función' });
    }
}

/**
 * Listar todas las funciones (con filtros)
 */
export async function listarFunciones(req, res) {
    try {
        const { estado, fecha_desde, fecha_hasta } = req.query;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        let query = `
            SELECT 
                f.*,
                g.nombre as grupo_nombre,
                g.obra as grupo_obra,
                g.estado as grupo_estado
            FROM funciones f
            JOIN grupos g ON f.grupo_id = g.id
        `;

        const conditions = [];
        const values = [];
        let paramCount = 1;

        // Filtro por rol
        if (userRole === 'ACTOR') {
            // Actores solo ven funciones de sus grupos
            query += ` JOIN grupo_actores ga ON g.id = ga.grupo_id `;
            conditions.push(`ga.actor_cedula = $${paramCount++}`);
            values.push(userCedula);
        } else if (userRole === 'ADMIN') {
            // Admins solo ven funciones de grupos donde son directores
            query += ` JOIN grupo_directores gd ON g.id = gd.grupo_id `;
            conditions.push(`gd.director_cedula = $${paramCount++}`);
            values.push(userCedula);
        }

        // Filtros adicionales
        if (estado) {
            conditions.push(`f.estado = $${paramCount++}`);
            values.push(estado);
        }
        if (fecha_desde) {
            conditions.push(`f.fecha >= $${paramCount++}`);
            values.push(fecha_desde);
        }
        if (fecha_hasta) {
            conditions.push(`f.fecha <= $${paramCount++}`);
            values.push(fecha_hasta);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY f.fecha ASC`;

        const result = await pool.query(query, values);

        res.json({
            total: result.rows.length,
            funciones: result.rows
        });

    } catch (error) {
        console.error('Error al listar funciones:', error);
        res.status(500).json({ error: 'Error al listar funciones' });
    }
}
