import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { generateTicketCode } from '../utils/generateCode.js';
import { readData, writeData, nextId } from '../utils/dataStore.js';
import { query } from '../db/postgres.js';

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

export async function crearShow(req, res) {
  try {
    const { obra_id, obra, fecha, lugar, capacidad, base_price } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;
    const capacidadNum = Number(capacidad);
    const basePriceNum = Number(base_price);

    if (!obra || !fecha || !capacidadNum || !basePriceNum) {
      return res.status(400).json({ 
        error: 'obra, fecha, capacidad y base_price son obligatorios' 
      });
    }

    // Si se proporciona obra_id, verificar permisos
    if (obra_id) {
      const obraResult = await query(
        `SELECT o.grupo_id, g.director_cedula 
         FROM obras o 
         JOIN grupos g ON g.id = o.grupo_id 
         WHERE o.id = $1`,
        [obra_id]
      );

      if (obraResult.rows.length > 0) {
        const { grupo_id, director_cedula } = obraResult.rows[0];

        // Verificar permisos: director, co-director, o SUPER
        if (userRole !== 'SUPER' && director_cedula !== userCedula) {
          const coDirectorResult = await query(
            'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
            [grupo_id, userCedula, 'DIRECTOR']
          );

          if (coDirectorResult.rows.length === 0) {
            return res.status(403).json({ error: 'Solo los directores del grupo pueden crear funciones para esta obra' });
          }
        }
      }
    }

    // Crear el show en PostgreSQL
    const foto_url = req.body.foto_url || null;
    const showResult = await query(
      `INSERT INTO shows (obra_id, obra, fecha, lugar, capacidad, base_price, foto_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [obra_id || null, obra, fecha, lugar || 'Teatro Principal', capacidadNum, basePriceNum, foto_url]
    );

    const show = showResult.rows[0];

    // Generar tickets
    const tickets = [];
    for (let i = 0; i < capacidadNum; i++) {
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateTicketCode();
        const existing = await query('SELECT code FROM tickets WHERE code = $1', [code]);
        isUnique = existing.rows.length === 0;
      }

      const qrCode = await generarQR(code);
      
      const ticketResult = await query(
        `INSERT INTO tickets (code, show_id, qr_code, estado, precio) 
         VALUES ($1, $2, $3, 'DISPONIBLE', $4) 
         RETURNING *`,
        [code, show.id, qrCode, basePriceNum]
      );
      
      tickets.push(ticketResult.rows[0]);
    }

    res.status(201).json({
      show: {
        id: show.id,
        obra: show.obra,
        fecha: show.fecha,
        lugar: show.lugar,
        capacidad: show.capacidad,
        base_price: show.base_price
      },
      tickets_generados: tickets.length,
      mensaje: `Función creada con ${tickets.length} tickets disponibles`
    });
  } catch (error) {
    console.error('Error creando show:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarShows(req, res) {
  try {
    // Adaptado al schema simple: shows tiene 'obra' (string) y 'fecha' (timestamp)
    // No hay tabla 'obras' relacionada por FK en este schema simplificado
    
    let sqlQuery = `
      SELECT s.*, s.obra as obra_nombre, s.fecha as fecha_hora
      FROM shows s
    `;
    
    // En este schema no veo columna 'estado', asumimos que todas las futuras son activas
    sqlQuery += ` WHERE s.fecha >= NOW() - INTERVAL '1 day'`;
    
    sqlQuery += ` ORDER BY s.fecha ASC`;
    
    const result = await query(sqlQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando shows:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function obtenerShow(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const result = await query(
      'SELECT * FROM shows WHERE id = $1',
      [showId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show no encontrado' });
    }
    
    // Obtener tickets del show
    const ticketsResult = await query(
      'SELECT * FROM tickets WHERE show_id = $1 ORDER BY code',
      [showId]
    );
    
    const show = result.rows[0];
    show.tickets = ticketsResult.rows;
    
    res.json(show);
  } catch (error) {
    console.error('Error obteniendo show:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function asignarTickets(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { vendedor_cedula, cantidad } = req.body;
    const cantidadNum = Number(cantidad);

    if (!vendedor_cedula || !cantidadNum) {
      return res.status(400).json({ error: 'vendedor_cedula y cantidad son obligatorios' });
    }
    
    // Verificar que el show existe
    const showResult = await query('SELECT * FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    // Verificar que el vendedor existe (buscar por cedula pero usar phone para FK)
    const vendedorResult = await query(
      'SELECT * FROM users WHERE cedula = $1 AND role = $2 AND active = TRUE',
      [vendedor_cedula, 'VENDEDOR']
    );
    if (vendedorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }
    const vendedor = vendedorResult.rows[0];

    // Obtener tickets disponibles
    const disponiblesResult = await query(
      'SELECT * FROM tickets WHERE show_id = $1 AND estado = $2 LIMIT $3',
      [showId, 'DISPONIBLE', cantidadNum]
    );

    if (disponiblesResult.rows.length < cantidadNum) {
      return res.status(400).json({
        error: `Solo hay ${disponiblesResult.rows.length} tickets disponibles`
      });
    }

    // Asignar tickets al vendedor usando phone (FK)
    const codes = disponiblesResult.rows.map(t => t.code);
    await query(
      `UPDATE tickets 
       SET estado = 'STOCK_VENDEDOR', vendedor_phone = $1, reservado_at = NOW() 
       WHERE code = ANY($2::text[])`,
      [vendedor.phone, codes]
    );

    res.json({
      mensaje: `${codes.length} tickets asignados a ${vendedor.name}`,
      vendedor: { cedula: vendedor.cedula, name: vendedor.name },
      tickets: codes
    });
  } catch (error) {
    console.error('Error asignando tickets:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarShow(req, res) {
  try {
    const showId = parseInt(req.params.id);
    
    // Verificar que el show existe
    const showResult = await query(
      'SELECT * FROM shows WHERE id = $1',
      [showId]
    );
    
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    
    const show = showResult.rows[0];
    
    // Eliminar tickets asociados (por CASCADE debería hacerse automático)
    await query('DELETE FROM tickets WHERE show_id = $1', [showId]);
    
    // Eliminar el show
    await query('DELETE FROM shows WHERE id = $1', [showId]);
    
    res.json({ 
      ok: true, 
      mensaje: 'Función eliminada correctamente',
      obra: show.obra 
    });
  } catch (error) {
    console.error('Error eliminando show:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateShow(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { obra, fecha, lugar, capacidad, base_price, foto_url } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;

    // Verificar que el show existe y obtener permisos
    const showResult = await query(
      'SELECT s.*, o.grupo_id, g.director_cedula FROM shows s LEFT JOIN obras o ON o.id = s.obra_id LEFT JOIN grupos g ON g.id = o.grupo_id WHERE s.id = $1',
      [showId]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const show = showResult.rows[0];

    // Si tiene obra_id asociada, verificar permisos
    if (show.obra_id) {
      const { grupo_id, director_cedula } = show;

      if (userRole !== 'SUPER' && director_cedula !== userCedula) {
        const coDirectorResult = await query(
          'SELECT id FROM grupo_miembros WHERE grupo_id = $1 AND miembro_cedula = $2 AND rol_en_grupo = $3 AND activo = TRUE',
          [grupo_id, userCedula, 'DIRECTOR']
        );

        if (coDirectorResult.rows.length === 0) {
          return res.status(403).json({ 
            error: 'No tienes permisos para modificar esta función. Solo el director del grupo o SUPER pueden hacerlo.' 
          });
        }
      }
    } else if (userRole !== 'SUPER') {
      // Funciones sin obra_id solo las puede modificar SUPER
      return res.status(403).json({ error: 'Solo SUPER puede modificar funciones sin obra asociada' });
    }

    // Construir la consulta UPDATE dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (obra !== undefined) {
      updates.push(`obra = $${paramCount++}`);
      values.push(obra);
    }
    if (fecha !== undefined) {
      updates.push(`fecha = $${paramCount++}`);
      values.push(fecha);
    }
    if (lugar !== undefined) {
      updates.push(`lugar = $${paramCount++}`);
      values.push(lugar);
    }
    if (capacidad !== undefined) {
      updates.push(`capacidad = $${paramCount++}`);
      values.push(Number(capacidad));
    }
    if (base_price !== undefined) {
      updates.push(`base_price = $${paramCount++}`);
      values.push(Number(base_price));
    }
    if (foto_url !== undefined) {
      updates.push(`foto_url = $${paramCount++}`);
      values.push(foto_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(showId);
    const updateQuery = `UPDATE shows SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(updateQuery, values);

    res.json({
      ok: true,
      show: result.rows[0],
      mensaje: 'Función actualizada correctamente'
    });
  } catch (error) {
    console.error('Error actualizando show:', error);
    res.status(500).json({ error: error.message });
  }
}

// Cerrar función (marcarla como concluida con conclusión y puntuación)
export async function cerrarFuncion(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { conclusion_director, puntuacion } = req.body;
    const { cedula: userCedula, role: userRole } = req.user;

    // Verificar que la función existe
    const showResult = await query(
      `SELECT s.*
       FROM shows s
       WHERE s.id = $1`,
      [showId]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const show = showResult.rows[0];

    // SUPER puede cerrar cualquier función
    // TODO: Agregar validación de permisos basada en el grupo cuando se agregue grupo_id a shows

    // Verificar que no esté ya concluida
    if (show.estado === 'CONCLUIDA') {
      return res.status(400).json({ error: 'La función ya está concluida' });
    }

    // Validar puntuación
    if (puntuacion && (puntuacion < 1 || puntuacion > 10)) {
      return res.status(400).json({ error: 'La puntuación debe estar entre 1 y 10' });
    }

    // Actualizar función
    const result = await query(
      `UPDATE shows 
       SET estado = 'CONCLUIDA', 
           conclusion_director = $1, 
           puntuacion = $2,
           fecha_conclusion = NOW()
       WHERE id = $3
       RETURNING *`,
      [conclusion_director, puntuacion, showId]
    );

    res.json({
      ok: true,
      show: result.rows[0],
      mensaje: 'Función cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error cerrando función:', error);
    res.status(500).json({ error: error.message });
  }
}

// Generar PDF de función concluida
export async function generarPDFFuncion(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const { cedula: userCedula, role: userRole } = req.user;

    // Obtener información completa de la función
    const showResult = await query(
      `SELECT s.*
       FROM shows s
       WHERE s.id = $1`,
      [showId]
    );

    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const show = showResult.rows[0];

    // SUPER puede ver cualquier PDF
    // TODO: Agregar validación de permisos basada en el grupo cuando se agregue grupo_id a shows

    // Obtener estadísticas de tickets
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE estado IN ('PAGADO', 'USADO')) as vendidas,
        COUNT(*) FILTER (WHERE estado = 'USADO') as usadas,
        COUNT(*) FILTER (WHERE estado = 'DISPONIBLE') as disponibles,
        SUM(CASE WHEN estado IN ('PAGADO', 'USADO') THEN COALESCE(precio, $2) ELSE 0 END) as recaudacion
       FROM tickets
       WHERE show_id = $1`,
      [showId, show.base_price]
    );

    const stats = statsResult.rows[0];

    // Obtener elenco (vendedores que tuvieron tickets)
    const elencoResult = await query(
      `SELECT DISTINCT u.name, u.cedula, u.genero,
              COUNT(t.code) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) as tickets_vendidos,
              SUM(CASE WHEN t.estado IN ('PAGADO', 'USADO') THEN COALESCE(t.precio, $2) ELSE 0 END) as monto_vendido
       FROM tickets t
       JOIN users u ON u.phone = t.vendedor_phone
       WHERE t.show_id = $1 AND t.vendedor_phone IS NOT NULL
       GROUP BY u.name, u.cedula, u.genero
       ORDER BY u.name`,
      [showId, show.base_price]
    );

    // Crear PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=funcion-${showId}-${show.obra}.pdf`);
    
    doc.pipe(res);

    // Título
    doc.fontSize(20).fillColor('#8B0000').text('🎭 INFORME DE FUNCIÓN CONCLUIDA', { align: 'center' });
    doc.moveDown();

    // Información de la función
    doc.fontSize(16).fillColor('#000').text('Información General', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Obra: ${show.obra}`);
    doc.text(`Fecha: ${new Date(show.fecha).toLocaleString('es-UY')}`);
    doc.text(`Lugar: ${show.lugar || 'No especificado'}`);
    doc.text(`Capacidad: ${show.capacidad}`);
    doc.text(`Precio base: $${Number(show.base_price).toFixed(2)}`);
    if (show.foto_url) doc.text(`Foto: ${show.foto_url}`);
    doc.text(`Estado: ${show.estado}`);
    if (show.fecha_conclusion) {
      doc.text(`Fecha de conclusión: ${new Date(show.fecha_conclusion).toLocaleString('es-UY')}`);
    }
    doc.text(`Lugar: ${show.lugar || 'No especificado'}`);
    doc.text(`Capacidad: ${show.capacidad}`);
    doc.text(`Precio base: $${Number(show.base_price).toFixed(2)}`);
    doc.moveDown();

    // Estadísticas de entradas
    doc.fontSize(16).fillColor('#000').text('Estadísticas de Entradas', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Total generadas: ${stats.total_tickets}`);
    doc.text(`Vendidas: ${stats.vendidas} (${((stats.vendidas / show.capacidad) * 100).toFixed(1)}%)`);
    doc.text(`Usadas: ${stats.usadas}`);
    doc.text(`Disponibles: ${stats.disponibles}`);
    doc.text(`Recaudación total: $${Number(stats.recaudacion || 0).toFixed(2)}`);
    doc.moveDown();

    // Elenco
    doc.fontSize(16).fillColor('#000').text('Elenco y Ventas', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    
    if (elencoResult.rows.length > 0) {
      elencoResult.rows.forEach((actor, index) => {
        doc.text(
          `${index + 1}. ${actor.name} (${actor.genero}) - ${actor.tickets_vendidos} entradas - $${Number(actor.monto_vendido || 0).toFixed(2)}`
        );
      });
    } else {
      doc.text('No hay información de elenco disponible');
    }
    doc.moveDown();

    // Conclusión del director
    if (show.conclusion_director) {
      doc.fontSize(16).fillColor('#000').text('Conclusión del Director', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(show.conclusion_director, { align: 'justify' });
      doc.moveDown();
    }

    // Puntuación
    if (show.puntuacion) {
      doc.fontSize(16).fillColor('#000').text('Puntuación', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`${show.puntuacion}/10`, { align: 'center' });
      doc.moveDown();
    }

    // Fecha de conclusión
    if (show.fecha_conclusion) {
      doc.fontSize(10).fillColor('#666');
      doc.text(`Función concluida el: ${new Date(show.fecha_conclusion).toLocaleString('es-UY')}`, { align: 'right' });
    }

    // Finalizar PDF
    doc.end();

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: error.message });
  }
}

// Listar funciones concluidas
export async function listarFuncionesConcluideas(req, res) {
  try {
    const { cedula: userCedula, role: userRole } = req.user;

    let sqlQuery = `
      SELECT s.*, o.nombre as obra_nombre, o.grupo_id, g.nombre as grupo_nombre, g.director_cedula
      FROM shows s
      LEFT JOIN obras o ON o.id = s.obra_id
      LEFT JOIN grupos g ON g.id = o.grupo_id
      WHERE s.estado = 'CONCLUIDA'
    `;

    // Si no es SUPER, solo ver sus funciones
    const params = [];
    if (userRole !== 'SUPER') {
      sqlQuery += ` AND g.director_cedula = $1`;
      params.push(userCedula);
    }

    sqlQuery += ` ORDER BY s.fecha_hora DESC`;

    const result = await query(sqlQuery, params);

    res.json({
      ok: true,
      shows: result.rows
    });
  } catch (error) {
    console.error('Error listando funciones concluidas:', error);
    res.status(500).json({ error: error.message });
  }
}
