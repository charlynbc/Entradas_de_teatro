/**
 * Controller: Funciones (asociadas a Grupos)
 * Descripción: Gestión de funciones teatrales dentro de grupos
 * Fecha: 27-12-2025
 */

import pool from '../db/postgres.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

const BOLETERIA_PHONE = process.env.BOLETERIA_PHONE
    || process.env.BOLETERIA_CONTACTO
    || process.env.BOLETERIA_CEDULA
    || '48376668'; // ADMIN por defecto

async function autoAsignarBoleteriaProfesional(client, funcionId) {
    if (!funcionId) return;

    // Verificar que existe el usuario de boletería
    const userCheck = await client.query(
        'SELECT cedula FROM users WHERE cedula = $1 LIMIT 1',
        [String(BOLETERIA_PHONE)]
    );
    
    if (userCheck.rows.length === 0) {
        console.warn(`Usuario de boletería ${BOLETERIA_PHONE} no existe, no se auto-asigna stock`);
        return;
    }

    await client.query(
        `UPDATE tickets
         SET estado = 'STOCK_ACTOR',
                 vendedor_phone = $1,
                 reservado_at = NOW()
         WHERE funcion_id = $2
             AND estado = 'DISPONIBLE'
             AND (vendedor_phone IS NULL OR vendedor_phone = '')`,
        [String(BOLETERIA_PHONE), funcionId]
    );
}

/**
 * Crear función dentro de un grupo
 * Solo SUPER y ADMIN (directores del grupo)
 */
export async function crearFuncion(req, res) {
    const client = await pool.connect();
    
    try {
        const { obra_id, obra: obraNombreLegacy, fecha, hora_inicio, lugar, capacidad, precio_base, base_price, foto_url } = req.body;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        const precioBase = precio_base ?? base_price;

        // Compatibilidad: payload legacy tipo "show" (sin obra_id)
        // En el modelo actual: siempre creamos una función dentro de una obra (y obra dentro de un grupo).
        // Si no viene obra_id pero viene obra (string), creamos grupo+obra automáticamente para el director.
        let obraId = obra_id;

        // Validar campos requeridos
        if (!obraId && !obraNombreLegacy) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: obra_id (o obra), fecha, lugar, capacidad, precio_base' 
            });
        }

        if (!fecha || !lugar || !capacidad || !precioBase) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: fecha, lugar, capacidad, precio_base' 
            });
        }

        await client.query('BEGIN');

        // Construir timestamp completo con fecha y hora
        let fechaTimestamp = fecha;
        if (hora_inicio) {
            // Si viene hora_inicio, combinar fecha + hora
            const fechaSolo = fecha.includes('T') ? fecha.split('T')[0] : fecha;
            fechaTimestamp = `${fechaSolo}T${hora_inicio}:00`;
        } else if (!fecha.includes('T')) {
            // Si no viene hora y fecha es solo YYYY-MM-DD, agregar hora actual
            const ahora = new Date();
            const hora = ahora.getHours().toString().padStart(2, '0');
            const minutos = ahora.getMinutes().toString().padStart(2, '0');
            fechaTimestamp = `${fecha}T${hora}:${minutos}:00`;
        }

        if (!obraId && obraNombreLegacy) {
            const dateObj = new Date(fechaTimestamp);
            if (Number.isNaN(dateObj.getTime())) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'fecha inválida' });
            }

            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dia_semana = dayNames[dateObj.getDay()];
            const hora_inicio_calc = dateObj.toTimeString().slice(0, 8);

            const today = new Date();
            const fecha_inicio = today.toISOString().slice(0, 10);
            const fecha_fin = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

            // Crear grupo mínimo
            const grupoRes = await client.query(
                `INSERT INTO grupos
                 (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, obra_a_realizar, estado)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO')
                 RETURNING *`,
                [
                    `Grupo ${obraNombreLegacy}`,
                    'Grupo creado automáticamente por compatibilidad (shows → funciones)',
                    userCedula,
                    dia_semana,
                    hora_inicio_calc,
                    fecha_inicio,
                    fecha_fin,
                    String(obraNombreLegacy)
                ]
            );

            const grupo = grupoRes.rows[0];

            // Asegurar relación director (según migraciones, puede existir grupo_miembros o vista+triggers)
            await client.query(
                `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
                 VALUES ($1, $2, 'DIRECTOR', true)
                 ON CONFLICT (grupo_id, miembro_cedula) DO NOTHING`,
                [grupo.id, userCedula]
            );

            // Crear obra mínima y marcarla LISTA
            const obraRes = await client.query(
                `INSERT INTO obras (grupo_id, nombre, descripcion, estado)
                 VALUES ($1, $2, $3, 'LISTA')
                 RETURNING *`,
                [grupo.id, String(obraNombreLegacy), 'Obra creada automáticamente por compatibilidad (shows → funciones)']
            );

            obraId = obraRes.rows[0].id;
        }

        // Verificar que la obra existe y obtener su grupo
        const obraResult = await client.query(
            'SELECT o.*, g.director_cedula, g.estado AS grupo_estado FROM obras o JOIN grupos g ON o.grupo_id = g.id WHERE o.id = $1',
            [obraId]
        );

        if (obraResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        const obra = obraResult.rows[0];

        if (String(obra.grupo_estado || '').toUpperCase() === 'CERRADO') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'No se pueden crear funciones en un grupo CERRADO' });
        }

        // Si es ADMIN, verificar que es director del grupo
        if (userRole === 'ADMIN' && obra.director_cedula !== userCedula) {
            await client.query('ROLLBACK');
            return res.status(403).json({ 
                error: 'No tienes permiso para crear funciones de esta obra' 
            });
        }

        // Marcar la obra como LISTA si no lo estaba (porque si creás función, es porque querés mostrarla)
        if (obra.estado !== 'LISTA') {
            await client.query(
                `UPDATE obras SET estado = 'LISTA' WHERE id = $1`,
                [obraId]
            );
        }

        // Si la obra es profesional, marcar como tal
        if (obra.es_profesional && !obra.es_profesional) {
            await client.query(
                `UPDATE obras SET es_profesional = true WHERE id = $1`,
                [obraId]
            );
        }

        // Insertar función con timestamp completo
        const result = await client.query(
            `INSERT INTO funciones (
                obra_id, fecha, lugar, capacidad, precio_base, foto_url, estado
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PROGRAMADA')
            RETURNING *`,
            [obraId, fechaTimestamp, lugar, capacidad, precioBase, foto_url]
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

        // Crear entradas v2 con estados nuevos (sin_asignar)
        const entradasV2 = [];
        for (let i = 1; i <= capacidad; i++) {
            const code = `E-${funcion.id}-${i.toString().padStart(4, '0')}`;
            const qrToken = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
            entradasV2.push([code, funcion.id, userCedula, precioBase, qrToken]);
        }

        if (entradasV2.length > 0) {
            const placeholders = entradasV2.map((_, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`).join(',');
            await client.query(
                `INSERT INTO entradas_v2 (code, funcion_id, creador_cedula, precio, qr_token)
                 VALUES ${placeholders}`,
                entradasV2.flat()
            );
        }

        // Para obras profesionales, mover stock inicial a la boletería
        if (obra.es_profesional) {
            await autoAsignarBoleteriaProfesional(client, funcion.id);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Función creada exitosamente',
            funcion,
            // Alias de compatibilidad legacy
            show: funcion,
            id: funcion.id,
            tickets_creados: capacidad,
            tickets_generados: capacidad
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

        // Compatibilidad: incluir tickets
        const ticketsResult = await pool.query(
            `SELECT
                code AS id,
                code,
                estado,
                vendedor_phone,
                comprador_nombre,
                COALESCE(comprador_contacto, '') AS comprador_phone,
                precio
            FROM tickets
            WHERE funcion_id = $1
            ORDER BY code ASC`,
            [id]
        );

        funcion.tickets = ticketsResult.rows;

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

        // Permisos: SUPER todo; ADMIN solo si es director del grupo de la función
        if (req.user.role !== 'SUPER') {
            if (req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'No tienes permiso para eliminar esta función' });
            }

            const ownerCheck = await pool.query(
                `SELECT g.director_cedula
                 FROM funciones f
                 JOIN obras o ON o.id = f.obra_id
                 JOIN grupos g ON g.id = o.grupo_id
                 WHERE f.id = $1`,
                [id]
            );

            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Función no encontrada' });
            }
            if (String(ownerCheck.rows[0].director_cedula) !== String(req.user.cedula)) {
                return res.status(403).json({ error: 'No tienes permiso para eliminar esta función' });
            }
        }

        // Verificar si hay entradas vendidas
        const entradasResult = await pool.query(
            `SELECT COUNT(*) as vendidas 
             FROM tickets 
             WHERE funcion_id = $1 AND estado IN ('PAGADO', 'USADO')`,
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

        // Detectar si el schema usa obras (funciones.obra_id) o schema antiguo (funciones.grupo_id)
        const schemaCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'funciones' AND column_name IN ('obra_id', 'grupo_id')
        `);
        const columns = schemaCheck.rows.map(r => r.column_name);
        const usaObras = columns.includes('obra_id');
        const usaGrupoDirecto = columns.includes('grupo_id');

        let query, conditions = [], values = [], paramCount = 1;

        if (usaObras) {
            // Schema v3: funciones -> obras -> grupos
            query = `
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

            // Filtro por rol
            if (userRole === 'ACTOR') {
                query += ` JOIN grupo_integrantes gi ON g.id = gi.grupo_id `;
                conditions.push(`gi.usuario_cedula = $${paramCount++}`);
                values.push(userCedula);
            } else if (userRole === 'ADMIN') {
                conditions.push(`g.director_cedula = $${paramCount++}`);
                values.push(userCedula);
            }
        } else if (usaGrupoDirecto) {
            // Schema antiguo: funciones -> grupos directamente
            query = `
                SELECT 
                    f.*,
                    g.id as grupo_id,
                    g.nombre as grupo_nombre,
                    g.obra_nombre as obra_nombre,
                    g.obra_a_realizar as obra_nombre_alt
                FROM funciones f
                JOIN grupos g ON f.grupo_id = g.id
            `;

            // Filtro por rol
            if (userRole === 'ACTOR') {
                query += ` JOIN grupo_integrantes gi ON g.id = gi.grupo_id `;
                conditions.push(`gi.usuario_cedula = $${paramCount++}`);
                values.push(userCedula);
            } else if (userRole === 'ADMIN') {
                conditions.push(`g.director_cedula = $${paramCount++}`);
                values.push(userCedula);
            }
        } else {
            return res.status(500).json({ error: 'Schema de funciones no reconocido' });
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

        // Normalizar respuesta: asegurar que obra_nombre esté presente
        const funciones = result.rows.map(f => ({
            ...f,
            obra_nombre: f.obra_nombre || f.obra_nombre_alt || 'Sin título'
        }));

        // Compatibilidad: /api/shows espera array y claves legacy
        if (req.baseUrl === '/api/shows') {
            return res.json(
                funciones.map(r => ({
                    ...r,
                    obra: r.obra_nombre ?? r.obra,
                    base_price: r.precio_base || r.precio_entrada
                }))
            );
        }

        res.json({ total: funciones.length, funciones });

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
                        WHERE f.fecha > CURRENT_TIMESTAMP
                            AND f.estado = 'PROGRAMADA'
                            AND o.estado = 'LISTA'
                            AND g.estado = 'ACTIVO'
            GROUP BY f.id, o.nombre, o.descripcion, g.nombre
            ORDER BY f.fecha ASC`
        );

        const funciones = result.rows;

        // Compatibilidad: /api/shows (público) espera array
        if (req.baseUrl === '/api/shows') {
            return res.json(
                funciones.map(r => ({
                    ...r,
                    obra: r.obra_nombre ?? r.obra,
                    base_price: r.precio_base
                }))
            );
        }

        // Entrega array por defecto; permitir objeto con meta si se solicita
        if (req.query.formato === 'obj' || req.query.withMeta === 'true') {
            return res.json({ total: funciones.length, funciones });
        }

        res.json(funciones);
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
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userCedula = req.user.cedula;

        // Verificar que la función existe
        const checkRes = await client.query(
            'SELECT f.*, o.grupo_id FROM funciones f JOIN obras o ON f.obra_id = o.id WHERE f.id = $1',
            [id]
        );

        if (checkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Función no encontrada' });
        }

        const funcion = checkRes.rows[0];

        // Solo SUPER o director del grupo pueden cerrar
        if (userRole === 'ADMIN') {
            const grupoRes = await client.query(
                'SELECT director_cedula FROM grupos WHERE id = $1',
                [funcion.grupo_id]
            );
            if (grupoRes.rows[0]?.director_cedula !== userCedula) {
                return res.status(403).json({ error: 'No tienes permiso para cerrar esta función' });
            }
        }

        await client.query('BEGIN');
        // Setear GUC para auditoría
        await client.query("SELECT set_config('app.usuario', $1, true)", [String(userCedula)]);

        // Procedimiento seguro: calcula ingresos/gastos y marca cerrada
        await client.query('CALL cerrar_funcion($1, $2)', [String(id), String(userCedula)]);

        // Obtener resumen del cierre
        const cierre = await client.query(
            `SELECT cf.*, f.estado, f.cerrada
             FROM cierre_funcion cf
             JOIN funciones f ON f.id = cf.funcion_id
             WHERE cf.funcion_id = $1`,
            [String(id)]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Función cerrada exitosamente',
            cierre: cierre.rows[0] || null
        });

    } catch (error) {
        try { await client.query('ROLLBACK'); } catch {}
        console.error('Error cerrando función:', error);
        res.status(500).json({ error: 'Error al cerrar función' });
    } finally {
        client.release();
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
