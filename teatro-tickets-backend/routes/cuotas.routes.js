/**
 * RUTAS DE CUOTAS - SISTEMA BACO
 * Gestión de cuotas de estudiantes
 */

import express from 'express';
import { query } from '../db/postgres.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { formatearFecha, convertirAISO } from '../utils/fechas-server.js';

const router = express.Router();

// ==========================================
// OBTENER CUOTAS
// ==========================================
router.get('/', authenticate, async (req, res) => {
    try {
        const { rol, cedula } = req.user;
        const { grupo_id, actor_cedula } = req.query;

        let sqlQuery;
        let params = [];

        if (actor_cedula && grupo_id) {
            // Cuotas de un actor en un grupo específico
            sqlQuery = `
                SELECT * FROM v_cuotas_actor
                WHERE actor_cedula = $1 
                AND grupo IN (SELECT nombre FROM grupos WHERE id = $2)
            `;
            params = [actor_cedula, grupo_id];
        } else if (actor_cedula) {
            // Todas las cuotas de un actor
            sqlQuery = `
                SELECT * FROM v_cuotas_actor
                WHERE actor_cedula = $1
            `;
            params = [actor_cedula];
        } else if (grupo_id) {
            // Todas las cuotas de un grupo
            sqlQuery = `
                SELECT 
                    c.id,
                    c.grupo_id,
                    c.actor_cedula,
                    c.monto,
                    c.vencimiento,
                    c.estado,
                    c.created_at,
                    u.nombre || ' ' || u.apellido AS actor_nombre,
                    u.foto_url AS actor_foto,
                    g.nombre AS grupo_nombre
                FROM cuotas c
                JOIN usuarios u ON u.cedula = c.actor_cedula
                JOIN grupos g ON g.id = c.grupo_id
                WHERE c.grupo_id = $1
                ORDER BY c.vencimiento ASC
            `;
            params = [grupo_id];
        } else {
            // Según rol
            if (rol === 'super') {
                // Super ve todas
                sqlQuery = `
                    SELECT 
                        c.id,
                        c.grupo_id,
                        c.actor_cedula,
                        c.monto,
                        c.vencimiento,
                        c.estado,
                        c.created_at,
                        u.nombre || ' ' || u.apellido AS actor_nombre,
                        u.foto_url AS actor_foto,
                        g.nombre AS grupo_nombre
                    FROM cuotas c
                    JOIN usuarios u ON u.cedula = c.actor_cedula
                    JOIN grupos g ON g.id = c.grupo_id
                    ORDER BY c.vencimiento ASC
                `;
            } else if (rol === 'director') {
                // Director ve cuotas de sus grupos
                sqlQuery = `
                    SELECT 
                        c.id,
                        c.grupo_id,
                        c.actor_cedula,
                        c.monto,
                        c.vencimiento,
                        c.estado,
                        c.created_at,
                        u.nombre || ' ' || u.apellido AS actor_nombre,
                        u.foto_url AS actor_foto,
                        g.nombre AS grupo_nombre
                    FROM cuotas c
                    JOIN usuarios u ON u.cedula = c.actor_cedula
                    JOIN grupos g ON g.id = c.grupo_id
                    WHERE g.director_cedula = $1
                    ORDER BY c.vencimiento ASC
                `;
                params = [cedula];
            } else {
                // Actor ve solo sus cuotas
                sqlQuery = `SELECT * FROM v_cuotas_actor WHERE actor_cedula = $1`;
                params = [cedula];
            }
        }

        const result = await query(sqlQuery, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo cuotas:', error);
        res.status(500).json({ error: 'Error obteniendo cuotas' });
    }
});

// ==========================================
// OBTENER UNA CUOTA POR ID
// ==========================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, cedula } = req.user;

        const result = await query(`
            SELECT 
                c.id,
                c.grupo_id,
                c.actor_cedula,
                c.monto,
                c.vencimiento,
                c.estado,
                c.created_at,
                u.nombre || ' ' || u.apellido AS actor_nombre,
                u.foto_url AS actor_foto,
                g.nombre AS grupo_nombre,
                g.director_cedula
            FROM cuotas c
            JOIN usuarios u ON u.cedula = c.actor_cedula
            JOIN grupos g ON g.id = c.grupo_id
            WHERE c.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cuota no encontrada' });
        }

        const cuota = result.rows[0];

        // Verificar permisos
        if (rol === 'actor' && cuota.actor_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (rol === 'director' && cuota.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        cuota.vencimiento_formato = formatearFecha(cuota.vencimiento);

        res.json(cuota);
    } catch (error) {
        console.error('Error obteniendo cuota:', error);
        res.status(500).json({ error: 'Error obteniendo cuota' });
    }
});

// ==========================================
// ACTUALIZAR CUOTA (Director o Super)
// ==========================================
router.put('/:id', authenticate, requireRole(['super', 'director']), async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, vencimiento, estado } = req.body;
        const { rol, cedula } = req.user;

        // Verificar que la cuota existe
        const cuotaResult = await query(`
            SELECT c.id, g.director_cedula
            FROM cuotas c
            JOIN grupos g ON g.id = c.grupo_id
            WHERE c.id = $1
        `, [id]);

        if (cuotaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cuota no encontrada' });
        }

        const cuota = cuotaResult.rows[0];

        // Si es director, verificar que es del grupo
        if (rol === 'director' && cuota.director_cedula !== cedula) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        let updates = [];
        let values = [];
        let paramCount = 1;

        if (monto !== undefined) {
            updates.push(`monto = $${paramCount++}`);
            values.push(monto);
        }

        if (vencimiento !== undefined) {
            const vencimientoISO = vencimiento.includes('/') ? convertirAISO(vencimiento) : vencimiento;
            updates.push(`vencimiento = $${paramCount++}`);
            values.push(vencimientoISO);
        }

        if (estado !== undefined) {
            if (!['al_dia', 'parcial', 'adeuda'].includes(estado)) {
                return res.status(400).json({ error: 'Estado de cuota inválido' });
            }
            updates.push(`estado = $${paramCount++}`);
            values.push(estado);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(id);

        await query(`
            UPDATE cuotas
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
        `, values);

        res.json({ message: 'Cuota actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando cuota:', error);
        res.status(500).json({ error: 'Error actualizando cuota' });
    }
});

// ==========================================
// ELIMINAR CUOTA (Solo Super)
// ==========================================
router.delete('/:id', authenticate, requireRole(['SUPER']), async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM cuotas WHERE id = $1', [id]);

        res.json({ message: 'Cuota eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando cuota:', error);
        res.status(500).json({ error: 'Error eliminando cuota' });
    }
});

export default router;
