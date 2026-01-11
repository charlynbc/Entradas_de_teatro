/**
 * RUTAS DE USUARIOS - SISTEMA BACO
 * Gestión completa de usuarios con roles y permisos validados en backend
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/postgres.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { formatearFecha, calcularEdad } from '../utils/fechas-server.js';

const router = express.Router();

const MAP_ROL = {
    director: 'DIRECTOR',
    actor: 'ACTOR',
    super: 'SUPER'
};

function normalizeUsuario(row) {
    const foto = row.foto_url || '/images/logo-baco.svg';
    return {
        cedula: row.cedula,
        rol: (row.rol || row.role || '').toLowerCase(),
        nombre: row.nombre || row.name,
        apellido: row.apellido || '',
        fecha_nacimiento: row.fecha_nacimiento || null,
        celular: row.celular || row.phone || null,
        foto_url: foto,
        descripcion: row.descripcion || row.notas || null,
        created_at: row.created_at,
        active: row.active
    };
}

// ==========================================
// OBTENER TODOS LOS USUARIOS (Solo super)
// ==========================================
router.get('/', authenticate, requireRole(['SUPER']), async (_req, res) => {
    try {
        const result = await query(`
            SELECT 
                cedula,
                role,
                name,
                apellido,
                fecha_nacimiento,
                phone,
                foto_url,
                notas,
                created_at,
                active
            FROM users
            WHERE active = true
        `);

        const usuarios = result.rows.map((row) => {
            const usuario = normalizeUsuario(row);
            return {
                ...usuario,
                edad: calcularEdad(usuario.fecha_nacimiento),
                fecha_nacimiento_formato: formatearFecha(usuario.fecha_nacimiento)
            };
        });

        res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// ==========================================
// OBTENER CUMPLEAÑOS DEL DÍA
// ==========================================
router.get('/cumpleanos/hoy', authenticate, async (_req, res) => {
    try {
        const result = await query('SELECT * FROM v_cumpleanos_hoy');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo cumpleaños:', error);
        res.status(500).json({ error: 'Error obteniendo cumpleaños' });
    }
});

// ==========================================
// CREAR USUARIO (Super total, Admin solo actores)
// ==========================================
router.post('/', authenticate, requireRole(['SUPER', 'ADMIN']), async (req, res) => {
    try {
        const {
            cedula,
            rol,
            nombre,
            apellido,
            fecha_nacimiento,
            celular,
            foto_url,
            descripcion
        } = req.body;

        if (!cedula || !nombre || !apellido || !fecha_nacimiento || !rol) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const rolNormalizado = MAP_ROL[rol] || rol.toUpperCase();
        if (!['DIRECTOR', 'ACTOR', 'SUPER'].includes(rolNormalizado)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        if (req.user.role === 'ADMIN' && rolNormalizado !== 'ACTOR') {
            return res.status(403).json({ error: 'Solo el super usuario puede crear directores o super.' });
        }

        const existe = await query('SELECT cedula FROM users WHERE cedula = $1', [cedula]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
        }

        const passwordHash = await bcrypt.hash('admin', 10);

        await query(
            `INSERT INTO users (
                cedula,
                role,
                name,
                apellido,
                fecha_nacimiento,
                phone,
                foto_url,
                notas,
                password_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                cedula,
                rolNormalizado,
                nombre,
                apellido,
                fecha_nacimiento,
                celular,
                foto_url || '/images/logo-baco.svg',
                descripcion,
                passwordHash
            ]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            cedula,
            nombre,
            apellido
        });
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});

// ==========================================
// ACTUALIZAR USUARIO (Propio, super, o admin sobre actores)
// ==========================================
router.put('/:cedula', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;
        const { celular, foto_url, descripcion, nueva_password } = req.body;

        if (req.user.cedula !== cedula && req.user.role !== 'SUPER') {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'No autorizado' });
            }
            const target = await query('SELECT role FROM users WHERE cedula = $1', [cedula]);
            if (target.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
            if (target.rows[0].role !== 'ACTOR') {
                return res.status(403).json({ error: 'Solo puedes editar actores' });
            }
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (celular !== undefined) {
            updates.push(`phone = $${paramCount++}`);
            values.push(celular);
        }

        if (foto_url !== undefined) {
            updates.push(`foto_url = $${paramCount++}`);
            values.push(foto_url || '/images/logo-baco.svg');
        }

        if (descripcion !== undefined) {
            updates.push(`notas = $${paramCount++}`);
            values.push(descripcion);
        }

        if (nueva_password) {
            const passwordHash = await bcrypt.hash(nueva_password, 10);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(cedula);

        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE cedula = $${paramCount}`,
            values
        );

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});

// ==========================================
// DESACTIVAR USUARIO (Super total, admin solo actores)
// ==========================================
router.delete('/:cedula', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;

        if (cedula === '48376669') {
            return res.status(403).json({ error: 'No se puede eliminar al usuario supremo base' });
        }

        if (req.user.role === 'ADMIN') {
            const target = await query('SELECT role FROM users WHERE cedula = $1', [cedula]);
            if (target.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
            if (target.rows[0].role !== 'ACTOR') {
                return res.status(403).json({ error: 'Solo puedes eliminar actores' });
            }
        } else if (req.user.role !== 'SUPER') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await query('UPDATE users SET active = false WHERE cedula = $1', [cedula]);
        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({ error: 'Error desactivando usuario' });
    }
});

// ==========================================
// HISTORIAL DE FUNCIONES DE UN USUARIO
// ==========================================
router.get('/:cedula/historial', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;
        const result = await query(
            'SELECT * FROM v_historial_funciones WHERE usuario_cedula = $1',
            [cedula]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error obteniendo historial' });
    }
});

// ==========================================
// OBTENER UN USUARIO POR CÉDULA
// ==========================================
router.get('/:cedula', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;
        const result = await query(
            `SELECT 
                cedula,
                role,
                name,
                apellido,
                fecha_nacimiento,
                phone,
                foto_url,
                notas,
                created_at,
                active
            FROM users
            WHERE cedula = $1 AND active = true`,
            [cedula]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = normalizeUsuario(result.rows[0]);
        usuario.edad = calcularEdad(usuario.fecha_nacimiento);
        usuario.fecha_nacimiento_formato = formatearFecha(usuario.fecha_nacimiento);

        if (req.user.role !== 'SUPER' && req.user.cedula !== cedula) {
            return res.json({
                cedula: usuario.cedula,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                foto_url: usuario.foto_url,
                descripcion: usuario.descripcion
            });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ error: 'Error obteniendo usuario' });
    }
});

export default router;
