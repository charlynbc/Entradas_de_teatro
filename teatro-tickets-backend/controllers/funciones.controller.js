import { query } from '../db.js';
import QRCode from 'qrcode';
import { generateTicketCode } from '../utils/generateCode.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function generarQR(code) {
  try {
    const url = `${BASE_URL}/validar/${code}`;
    const dataUrl = await QRCode.toDataURL(url);
    return dataUrl;
  } catch (error) {
    console.error('Error generando QR:', error);
    return null;
  }
}

/**
 * Crear una función para una obra
 */
export async function crearFuncion(req, res) {
  try {
    const { obra_id, fecha, lugar, capacidad, precio_base } = req.body;
    
    if (!obra_id || !fecha || !capacidad || !precio_base) {
      return res.status(400).json({ 
        error: 'obra_id, fecha, capacidad y precio_base son obligatorios' 
      });
    }
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para crear funciones' });
    }
    
    // Verificar que la obra existe
    const obraResult = await query('SELECT * FROM obras WHERE id = $1', [obra_id]);
    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    const funcionId = `funcion_${Date.now()}`;
    const capacidadNum = Number(capacidad);
    const precioNum = Number(precio_base);
    
    // Crear función
    const funcionResult = await query(
      `INSERT INTO funciones (id, obra_id, fecha, lugar, capacidad, precio_base, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [funcionId, obra_id, fecha, lugar || 'Teatro Principal', capacidadNum, precioNum]
    );
    
    const funcion = funcionResult.rows[0];
    
    // Generar entradas para la función
    const entradas = [];
    for (let i = 0; i < capacidadNum; i++) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateTicketCode();
        const existente = await query('SELECT code FROM entradas WHERE code = $1', [code]);
        isUnique = existente.rows.length === 0;
      }
      
      const qrCode = await generarQR(code);
      
      const entradaResult = await query(
        `INSERT INTO entradas (code, funcion_id, estado, precio, qr_code, created_at)
         VALUES ($1, $2, 'DISPONIBLE', $3, $4, NOW())
         RETURNING *`,
        [code, funcionId, precioNum, qrCode]
      );
      
      entradas.push(entradaResult.rows[0]);
    }
    
    res.status(201).json({
      ok: true,
      mensaje: `Función creada con ${entradas.length} entradas`,
      funcion,
      entradas_generadas: entradas.length
    });
  } catch (error) {
    console.error('Error creando función:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Listar funciones de una obra
 */
export async function listarFunciones(req, res) {
  try {
    const { obra_id } = req.query;
    
    let sql = `
      SELECT 
        f.*,
        o.nombre as obra_nombre,
        COUNT(e.code) as total_entradas,
        COUNT(CASE WHEN e.estado = 'DISPONIBLE' THEN 1 END) as disponibles,
        COUNT(CASE WHEN e.estado = 'EN_STOCK' THEN 1 END) as en_stock,
        COUNT(CASE WHEN e.estado = 'RESERVADA' THEN 1 END) as reservadas,
        COUNT(CASE WHEN e.estado IN ('VENDIDA', 'PAGADA', 'USADA') THEN 1 END) as vendidas
      FROM funciones f
      LEFT JOIN obras o ON f.obra_id = o.id
      LEFT JOIN entradas e ON f.id = e.funcion_id
    `;
    
    const params = [];
    if (obra_id) {
      sql += ' WHERE f.obra_id = $1';
      params.push(obra_id);
    }
    
    sql += ' GROUP BY f.id, o.nombre ORDER BY f.fecha ASC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando funciones:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtener detalle de una función
 */
export async function obtenerFuncion(req, res) {
  try {
    const { id } = req.params;
    
    const funcionResult = await query(
      `SELECT 
        f.*,
        o.nombre as obra_nombre,
        o.descripcion as obra_descripcion,
        o.imagen_url as obra_imagen
       FROM funciones f
       JOIN obras o ON f.obra_id = o.id
       WHERE f.id = $1`,
      [id]
    );
    
    if (funcionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    const funcion = funcionResult.rows[0];
    
    // Obtener estadísticas de entradas
    const entradasResult = await query(
      `SELECT 
        estado,
        COUNT(*) as cantidad
       FROM entradas
       WHERE funcion_id = $1
       GROUP BY estado`,
      [id]
    );
    
    const estadisticas = {
      disponibles: 0,
      en_stock: 0,
      reservadas: 0,
      vendidas: 0,
      total: 0
    };
    
    entradasResult.rows.forEach(row => {
      estadisticas.total += parseInt(row.cantidad);
      if (row.estado === 'DISPONIBLE') estadisticas.disponibles = parseInt(row.cantidad);
      if (row.estado === 'EN_STOCK') estadisticas.en_stock = parseInt(row.cantidad);
      if (row.estado === 'RESERVADA') estadisticas.reservadas = parseInt(row.cantidad);
      if (['VENDIDA', 'PAGADA', 'USADA'].includes(row.estado)) {
        estadisticas.vendidas += parseInt(row.cantidad);
      }
    });
    
    res.json({
      ...funcion,
      estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo función:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualizar una función
 */
export async function actualizarFuncion(req, res) {
  try {
    const { id } = req.params;
    const { fecha, lugar, precio_base } = req.body;
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para editar funciones' });
    }
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (fecha !== undefined) {
      updates.push(`fecha = $${paramIndex++}`);
      values.push(fecha);
    }
    if (lugar !== undefined) {
      updates.push(`lugar = $${paramIndex++}`);
      values.push(lugar);
    }
    if (precio_base !== undefined) {
      updates.push(`precio_base = $${paramIndex++}`);
      values.push(precio_base);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    const sql = `UPDATE funciones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    res.json({
      ok: true,
      mensaje: 'Función actualizada correctamente',
      funcion: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando función:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Eliminar una función
 */
export async function eliminarFuncion(req, res) {
  try {
    const { id } = req.params;
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar funciones' });
    }
    
    const funcionResult = await query('SELECT * FROM funciones WHERE id = $1', [id]);
    
    if (funcionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    // Eliminar función (CASCADE eliminará entradas)
    await query('DELETE FROM funciones WHERE id = $1', [id]);
    
    res.json({
      ok: true,
      mensaje: 'Función eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando función:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Asignar entradas a un vendedor del elenco
 */
export async function asignarEntradas(req, res) {
  try {
    const { id } = req.params; // funcion_id
    const { cedula_vendedor, cantidad } = req.body;
    
    if (!cedula_vendedor || !cantidad) {
      return res.status(400).json({ error: 'cedula_vendedor y cantidad son obligatorios' });
    }
    
    if (!['ADMIN', 'SUPER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para asignar entradas' });
    }
    
    // Obtener obra de la función
    const funcionResult = await query(
      'SELECT obra_id FROM funciones WHERE id = $1',
      [id]
    );
    
    if (funcionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    const obraId = funcionResult.rows[0].obra_id;
    
    // Verificar que el vendedor está en el elenco de la obra
    const elencoResult = await query(
      'SELECT * FROM elenco_obra WHERE obra_id = $1 AND cedula_vendedor = $2',
      [obraId, cedula_vendedor]
    );
    
    if (elencoResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'El vendedor no está en el elenco de esta obra' 
      });
    }
    
    // Obtener entradas disponibles
    const disponiblesResult = await query(
      `SELECT * FROM entradas 
       WHERE funcion_id = $1 AND estado = 'DISPONIBLE'
       LIMIT $2`,
      [id, cantidad]
    );
    
    if (disponiblesResult.rows.length < cantidad) {
      return res.status(400).json({
        error: `Solo hay ${disponiblesResult.rows.length} entradas disponibles`
      });
    }
    
    // Asignar entradas
    const codes = disponiblesResult.rows.map(e => e.code);
    await query(
      `UPDATE entradas 
       SET estado = 'EN_STOCK', 
           cedula_vendedor = $1,
           asignada_at = NOW()
       WHERE code = ANY($2)`,
      [cedula_vendedor, codes]
    );
    
    res.json({
      ok: true,
      mensaje: `${codes.length} entradas asignadas`,
      entradas_asignadas: codes
    });
  } catch (error) {
    console.error('Error asignando entradas:', error);
    res.status(500).json({ error: error.message });
  }
}
