/**
 * Controller: Funciones (asociadas a Grupos)
 * Descripción: Gestión de funciones teatrales dentro de grupos
 * Fecha: 27-12-2025
 */

import pool from '../db/postgres.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

/**
 * Crear función dentro de un grupo
 * Solo SUPER y ADMIN (directores del grupo)
 */
export async function crearFuncion(req, res) {
    const client = await pool.connect();
    
    try {
        const { obra_id, fecha, lugar, capacidad, precio_base, foto_url } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Validar campos requeridos
        if (!obra_id || !fecha || !lugar || !capacidad || !precio_base) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: obra_id, fecha, lugar, capacidad, precio_base' 
            });
        }

        // Verificar que la obra existe y obtener su grupo
        const obraResult = await client.query(
            'SELECT o.*, g.director_cedula FROM obras o JOIN grupos g ON o.grupo_id = g.id WHERE o.id = $1',
            [obra_id]
        );

        if (obraResult.rows.length === 0) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        const obra = obraResult.rows[0];

        // Si es ADMIN, verificar que es director del grupo
        if (userRole === 'ADMIN' && obra.director_cedula !== userCedula) {
            return res.status(403).json({ 
                error: 'No tienes permiso para crear funciones de esta obra' 
            });
        }

        await client.query('BEGIN');

        // Insertar función
        const result = await client.query(
            `INSERT INTO funciones (
                obra_id, fecha, lugar, capacidad, precio_base, foto_url,
                estado, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PROGRAMADA', NOW(), NOW())
            RETURNING *`,
            [obra_id, fecha, lugar, capacidad, precio_base, foto_url]
        );

        const funcion = result.rows[0];

        // Crear tickets/entradas automáticamente
        const tickets = [];
        for (let i = 1; i <= capacidad; i++) {
            const code = `T-${funcion.id}-${i.toString().padStart(4, '0')}`;
            tickets.push([code, funcion.id, precio_base]);
        }

        // Insertar tickets en lote
        if (tickets.length > 0) {
            const valuesPlaceholder = tickets.map((_, idx) => 
                `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3}, 'DISPONIBLE')`
            ).join(',');

            await client.query(
                `INSERT INTO tickets (code, funcion_id, precio, estado)
                 VALUES ${valuesPlaceholder}`,
                tickets.flat()
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Función creada exitosamente',
            funcion,
            tickets_creados: capacidad
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
                o.nombre as obra_nombre,
                g.nombre as grupo_nombre,
                (SELECT COUNT(*) FROM tickets WHERE funcion_id = f.id AND estado != 'ANULADO') as entradas_asignadas
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
            WHERE g.id = $1
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
                o.id as obra_id,
                o.nombre as obra_nombre,
                g.id as grupo_id,
                g.nombre as grupo_nombre,
                g.estado as grupo_estado
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
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
                o.id as obra_id,
                o.nombre as obra_nombre,
                g.id as grupo_id,
                g.nombre as grupo_nombre,
                g.estado as grupo_estado
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
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

/**
 * Listar funciones concluidas/realizadas
 * GET /api/funciones/concluidas
 */
export async function listarFuncionesConcluidas(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                f.*,
                o.id as obra_id,
                o.nombre as obra_nombre,
                g.id as grupo_id,
                g.nombre as grupo_nombre,
                COUNT(t.code) as total_tickets,
                COUNT(t.code) FILTER (WHERE t.estado = 'USADO') as tickets_usados,
                SUM(CASE WHEN t.estado IN ('PAGADO', 'USADO') THEN t.precio ELSE 0 END) as recaudacion_total
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
            LEFT JOIN tickets t ON t.funcion_id = f.id
            WHERE f.estado = 'REALIZADA'
            GROUP BY f.id, o.id, o.nombre, g.id, g.nombre
            ORDER BY f.fecha DESC`
        );

        res.json({
            total: result.rows.length,
            funciones: result.rows
        });
    } catch (error) {
        console.error('Error al listar funciones concluidas:', error);
        res.status(500).json({ error: 'Error al listar funciones concluidas' });
    }
}

/**
 * Listar funciones públicas (próximas, sin autenticación)
 * GET /api/funciones/publicas
 */
export async function listarFuncionesPublicas(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                f.id,
                f.fecha,
                f.lugar,
                f.capacidad,
                f.precio_base,
                f.foto_url,
                f.estado,
                o.nombre as obra_nombre,
                o.descripcion as obra_descripcion,
                g.nombre as grupo_nombre,
                COUNT(t.code) FILTER (WHERE t.estado = 'DISPONIBLE') as entradas_disponibles
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
            LEFT JOIN tickets t ON t.funcion_id = f.id
            WHERE f.estado IN ('PROGRAMADA', 'CONFIRMADA')
              AND f.fecha >= CURRENT_TIMESTAMP
            GROUP BY f.id, o.nombre, o.descripcion, g.nombre
            ORDER BY f.fecha ASC`
        );

        res.json({
            total: result.rows.length,
            funciones: result.rows
        });
    } catch (error) {
        console.error('Error al listar funciones públicas:', error);
        res.status(500).json({ error: 'Error al listar funciones públicas' });
    }
}

/**
 * Cerrar/Finalizar función
 * POST /api/funciones/:id/cerrar
 */
export async function cerrarFuncion(req, res) {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        // Verificar que la función existe
        const checkRes = await pool.query(
            'SELECT f.*, o.grupo_id FROM funciones f JOIN obras o ON f.obra_id = o.id WHERE f.id = $1',
            [id]
        );

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        const funcion = checkRes.rows[0];

        // Solo SUPER o director del grupo pueden cerrar
        if (userRole === 'ADMIN') {
            const grupoRes = await pool.query(
                'SELECT director_cedula FROM grupos WHERE id = $1',
                [funcion.grupo_id]
            );
            
            if (grupoRes.rows[0]?.director_cedula !== req.user.cedula) {
                return res.status(403).json({ error: 'No tienes permiso para cerrar esta función' });
            }
        }

        // Actualizar estado a REALIZADA
        const result = await pool.query(
            'UPDATE funciones SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            ['REALIZADA', id]
        );

        res.json({
            message: 'Función cerrada exitosamente',
            funcion: result.rows[0]
        });

    } catch (error) {
        console.error('Error cerrando función:', error);
        res.status(500).json({ error: 'Error al cerrar función' });
    }
}

/**
 * Generar PDF de función
 * GET /api/funciones/:id/pdf
 */
export async function generarPDFFuncion(req, res) {
    try {
        const { id } = req.params;

        // Obtener datos completos de la función
        const result = await pool.query(
            `SELECT 
                f.*,
                o.nombre as obra_nombre,
                g.nombre as grupo_nombre,
                g.director_cedula,
                u.name as director_nombre,
                COUNT(t.code) as total_tickets,
                COUNT(t.code) FILTER (WHERE t.estado = 'USADO') as tickets_usados,
                COUNT(t.code) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) as tickets_pagados,
                SUM(CASE WHEN t.estado IN ('PAGADO', 'USADO') THEN t.precio ELSE 0 END) as recaudacion_total
            FROM funciones f
            JOIN obras o ON f.obra_id = o.id
            JOIN grupos g ON o.grupo_id = g.id
            LEFT JOIN users u ON u.cedula = g.director_cedula
            LEFT JOIN tickets t ON t.funcion_id = f.id
            WHERE f.id = $1
            GROUP BY f.id, o.nombre, g.nombre, g.director_cedula, u.name`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        const data = result.rows[0];

        // Crear documento PDF
        const doc = new PDFDocument();
        const filename = `funcion-${id}-${Date.now()}.pdf`;

        // Configurar headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // Contenido del PDF
        doc.fontSize(20).text('🎭 REPORTE DE FUNCIÓN', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`${data.obra_nombre}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12);
        doc.text(`Grupo: ${data.grupo_nombre}`);
        doc.text(`Director: ${data.director_nombre || 'N/A'}`);
        doc.text(`Fecha: ${new Date(data.fecha).toLocaleDateString('es-DO')}`);
        doc.text(`Lugar: ${data.lugar}`);
        doc.text(`Estado: ${data.estado}`);
        doc.moveDown();

        doc.fontSize(14).text('Estadísticas:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Capacidad: ${data.capacidad}`);
        doc.text(`Tickets vendidos: ${parseInt(data.tickets_pagados) || 0}`);
        doc.text(`Tickets usados: ${parseInt(data.tickets_usados) || 0}`);
        doc.text(`Recaudación total: RD$ ${parseFloat(data.recaudacion_total || 0).toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-DO')}`, { align: 'right' });

        // Finalizar PDF
        doc.end();

    } catch (error) {
        console.error('Error generando PDF función:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al generar PDF' });
        }
    }
}
