/**
 * RUTAS DE USUARIOS - SISTEMA BACO
 * Gestión completa de usuarios con roles
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/postgres.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { formatearFecha, calcularEdad } from '../utils/fechas-server.js';

const router = express.Router();

// ==========================================
// OBTENER TODOS LOS USUARIOS (Solo super)
// ==========================================
router.get('/', authenticate, requireRole(['SUPER']), async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                cedula,
                rol,
                nombre,
                apellido,
                fecha_nacimiento,
                celular,
                foto_url,
                descripcion,
                created_at,
                active
            FROM usuarios
            WHERE active = true
            ORDER BY nombre, apellido
        `);

        const usuarios = result.rows.map(u => ({
            ...u,
            edad: calcularEdad(u.fecha_nacimiento),
            fecha_nacimiento_formato: formatearFecha(u.fecha_nacimiento)
        }));

        res.json(usuarios);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// ==========================================
// OBTENER UN USUARIO POR CÉDULA
// ==========================================
router.get('/:cedula', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;

        const result = await query(`
            SELECT 
                cedula,
                rol,
                nombre,
                apellido,
                fecha_nacimiento,
                celular,
                foto_url,
                descripcion,
                created_at
            FROM usuarios
            WHERE cedula = $1 AND active = true
        `, [cedula]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.rows[0];
        usuario.edad = calcularEdad(usuario.fecha_nacimiento);
        usuario.fecha_nacimiento_formato = formatearFecha(usuario.fecha_nacimiento);

        // Si no es el mismo usuario o super, limitar información
        if (req.user.cedula !== cedula && req.user.rol !== 'super') {
            // Solo mostrar datos básicos
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

// ==========================================
// CREAR USUARIO (Solo super)
// ==========================================
router.post('/', authenticate, requireRole(['SUPER']), async (req, res) => {
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

        // Validaciones
        if (!cedula || !nombre || !apellido || !fecha_nacimiento || !rol) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!['director', 'actor'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Verificar que no exista
        const existe = await query('SELECT cedula FROM usuarios WHERE cedula = $1', [cedula]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un usuario con esa cédula' });
        }

        // Contraseña por defecto: "admin"
        const passwordHash = await bcrypt.hash('admin', 10);

        // Crear usuario
        await query(`
            INSERT INTO usuarios (
                cedula,
                rol,
                nombre,
                apellido,
                fecha_nacimiento,
                celular,
                foto_url,
                descripcion,
                password_hash
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            cedula,
            rol,
            nombre,
            apellido,
            fecha_nacimiento,
            celular,
            foto_url || '/assets/baco.png',
            descripcion,
            passwordHash
        ]);

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
// ACTUALIZAR USUARIO
// ==========================================
router.put('/:cedula', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;
        const {
            celular,
            foto_url,
            descripcion,
            nueva_password
        } = req.body;

        // Solo puede editar el mismo usuario o super
        if (req.user.cedula !== cedula && req.user.rol !== 'super') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        let updates = [];
        let values = [];
        let paramCount = 1;

        if (celular !== undefined) {
            updates.push(`celular = $${paramCount++}`);
            values.push(celular);
        }

        if (foto_url !== undefined) {
            updates.push(`foto_url = $${paramCount++}`);
            values.push(foto_url);
        }

        if (descripcion !== undefined) {
            updates.push(`descripcion = $${paramCount++}`);
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

        await query(`
            UPDATE usuarios
            SET ${updates.join(', ')}
            WHERE cedula = $${paramCount}
        `, values);

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});

// ==========================================
// DESACTIVAR USUARIO (Solo super)
// ==========================================
router.delete('/:cedula', authenticate, requireRole(['SUPER']), async (req, res) => {
    try {
        const { cedula } = req.params;

        // No permitir eliminar al super
        if (cedula === '48376669') {
            return res.status(403).json({ error: 'No se puede eliminar al usuario supremo' });
        }

        await query(`
            UPDATE usuarios
            SET active = false
            WHERE cedula = $1
        `, [cedula]);

        res.json({ message: 'Usuario desactivado exitosamente' });
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({ error: 'Error desactivando usuario' });
    }
});

// ==========================================
// OBTENER CUMPLEAÑOS DEL DÍA
// ==========================================
router.get('/cumpleanos/hoy', authenticate, async (req, res) => {
    try {
        const result = await query(`
            SELECT * FROM v_cumpleanos_hoy
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo cumpleaños:', error);
        res.status(500).json({ error: 'Error obteniendo cumpleaños' });
    }
});

// ==========================================
// OBTENER HISTORIAL DE FUNCIONES DE UN USUARIO
// ==========================================
router.get('/:cedula/historial', authenticate, async (req, res) => {
    try {
        const { cedula } = req.params;

        const result = await query(`
            SELECT * FROM v_historial_funciones
            WHERE usuario_cedula = $1
        `, [cedula]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ error: 'Error obteniendo historial' });
    }
});

export default router;
