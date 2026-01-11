/**
 * RUTAS DE GASTOS - SISTEMA BACO
 * Gestión de gastos por función
 */

import express from 'express';
import { query } from '../db/postgres.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==========================================
// OBTENER GASTOS
// ==========================================
router.get('/', authenticate, async (req, res) => {
    try {
        const { rol, cedula } = req.user;
        const { funcion_id } = req.query;

        let sqlQuery;
        let params = [];

        if (funcion_id) {
            // Gastos de una función específica
            sqlQuery = `
                SELECT 
                    ga.id,
                    ga.funcion_id,
                    ga.descripcion,
                    ga.monto,
                    ga.created_at,
                    f.fecha AS funcion_fecha,
                    g.nombre AS grupo_nombre,
                    g.obra_nombre
                FROM gastos ga
                JOIN funciones f ON f.id = ga.funcion_id
                JOIN grupos g ON g.id = f.grupo_id
                WHERE ga.funcion_id = $1
                ORDER BY ga.created_at DESC
            `;
            params = [funcion_id];
        } else {
            // Todos los gastos según rol
            if (rol === 'super') {
                sqlQuery = `
                    SELECT 
                        ga.id,
                        ga.funcion_id,
                        ga.descripcion,
                        ga.monto,
                        ga.created_at,
                        f.fecha AS funcion_fecha,
                        g.nombre AS grupo_nombre,
                        g.obra_nombre
                    FROM gastos ga
                    JOIN funciones f ON f.id = ga.funcion_id
                    JOIN grupos g ON g.id = f.grupo_id
                    ORDER BY ga.created_at DESC
                `;
            } else if (rol === 'director') {
                // Director ve gastos de sus grupos
                sqlQuery = `
                    SELECT 
                        ga.id,
                        ga.funcion_id,
                        ga.descripcion,
                        ga.monto,
                        ga.created_at,
                        f.fecha AS funcion_fecha,
                        g.nombre AS grupo_nombre,
                        g.obra_nombre
                    FROM gastos ga
                    JOIN funciones f ON f.id = ga.funcion_id
                    JOIN grupos g ON g.id = f.grupo_id
                    WHERE g.director_cedula = $1
                    ORDER BY ga.created_at DESC
                `;
                params = [cedula];
            } else {
                // Actor no puede ver gastos
                return res.status(403).json({ error: 'No autorizado' });
            }
        }

        const result = await query(sqlQuery, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo gastos:', error);
        res.status(500).json({ error: 'Error obteniendo gastos' });
    }
});

// ==========================================
// OBTENER UN GASTO POR ID
// ==========================================
router.get('/:id', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, cedula } = req.user;

        const result = await query(`
            SELECT 
                ga.id,
                ga.funcion_id,
                ga.descripcion,
                ga.monto,
                ga.created_at,
                f.fecha AS funcion_fecha,
                g.nombre AS grupo_nombre,
                g.obra_nombre,
                g.director_cedula
            FROM gastos ga
            JOIN funciones f ON f.id = ga.funcion_id
            JOIN grupos g ON g.id = f.grupo_id
            WHERE ga.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        const gasto = result.rows[0];

        // Si es director, verificar que es de su grupo
        if (rol === 'director' && gasto.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        res.json(gasto);
    } catch (error) {
        console.error('Error obteniendo gasto:', error);
        res.status(500).json({ error: 'Error obteniendo gasto' });
    }
});

// ==========================================
// CREAR GASTO (Director o Super)
// ==========================================
router.post('/', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const { funcion_id, descripcion, monto } = req.body;
        const { rol, cedula } = req.user;

        // Validaciones
        if (!funcion_id || !descripcion || monto === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (monto < 0) {
            return res.status(400).json({ error: 'El monto no puede ser negativo' });
        }

        // Verificar que la función existe
        const funcionResult = await query(`
            SELECT f.id, g.director_cedula
            FROM funciones f
            JOIN grupos g ON g.id = f.grupo_id
            WHERE f.id = $1
        `, [funcion_id]);

        if (funcionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        const funcion = funcionResult.rows[0];

        // Si es director, verificar que es de su grupo
        if (rol === 'director' && funcion.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const result = await query(`
            INSERT INTO gastos (funcion_id, descripcion, monto)
            VALUES ($1, $2, $3)
            RETURNING id, funcion_id, descripcion, monto, created_at
        `, [funcion_id, descripcion, monto]);

        res.status(201).json({
            message: 'Gasto registrado exitosamente',
            gasto: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando gasto:', error);
        res.status(500).json({ error: 'Error creando gasto' });
    }
});

// ==========================================
// ACTUALIZAR GASTO
// ==========================================
router.put('/:id', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, monto } = req.body;
        const { rol, cedula } = req.user;

        // Verificar que el gasto existe
        const gastoResult = await query(`
            SELECT ga.id, g.director_cedula
            FROM gastos ga
            JOIN funciones f ON f.id = ga.funcion_id
            JOIN grupos g ON g.id = f.grupo_id
            WHERE ga.id = $1
        `, [id]);

        if (gastoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        const gasto = gastoResult.rows[0];

        // Si es director, verificar que es de su grupo
        if (rol === 'director' && gasto.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        let updates = [];
        let values = [];
        let paramCount = 1;

        if (descripcion !== undefined) {
            updates.push(`descripcion = $${paramCount++}`);
            values.push(descripcion);
        }

        if (monto !== undefined) {
            if (monto < 0) {
                return res.status(400).json({ error: 'El monto no puede ser negativo' });
            }
            updates.push(`monto = $${paramCount++}`);
            values.push(monto);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(id);

        await query(`
            UPDATE gastos
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
        `, values);

        res.json({ message: 'Gasto actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando gasto:', error);
        res.status(500).json({ error: 'Error actualizando gasto' });
    }
});

// ==========================================
// ELIMINAR GASTO
// ==========================================
router.delete('/:id', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, cedula } = req.user;

        // Verificar que el gasto existe
        const gastoResult = await query(`
            SELECT ga.id, g.director_cedula
            FROM gastos ga
            JOIN funciones f ON f.id = ga.funcion_id
            JOIN grupos g ON g.id = f.grupo_id
            WHERE ga.id = $1
        `, [id]);

        if (gastoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        const gasto = gastoResult.rows[0];

        // Si es director, verificar que es de su grupo
        if (rol === 'director' && gasto.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await query('DELETE FROM gastos WHERE id = $1', [id]);

        res.json({ message: 'Gasto eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando gasto:', error);
        res.status(500).json({ error: 'Error eliminando gasto' });
    }
});

// ==========================================
// OBTENER BALANCE DE UNA FUNCIÓN
// ==========================================
router.get('/funcion/:funcion_id/balance', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const { funcion_id } = req.params;
        const { rol, cedula } = req.user;

        // Verificar permisos
        if (rol === 'director') {
            const funcionResult = await query(`
                SELECT g.director_cedula
                FROM funciones f
                JOIN grupos g ON g.id = f.grupo_id
                WHERE f.id = $1
            `, [funcion_id]);

            if (funcionResult.rows.length === 0) {
                return res.status(404).json({ error: 'Función no encontrada' });
            }

            if (funcionResult.rows[0].director_cedula !== cedula) {
                return res.status(403).json({ error: 'No autorizado' });
            }
        }

        const result = await query(`
            SELECT * FROM v_balance_funcion
            WHERE funcion_id = $1
        `, [funcion_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Balance no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo balance:', error);
        res.status(500).json({ error: 'Error obteniendo balance' });
    }
});

export default router;
