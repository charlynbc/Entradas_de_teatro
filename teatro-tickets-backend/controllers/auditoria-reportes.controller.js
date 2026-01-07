/**
 * Controllers: Auditoría, Reportes y Página Pública
 */

import { query } from '../db/postgres.js';
import PDFDocument from 'pdfkit';

// ═══════════════════════════════════════════════════════════════════════════
// AUDITORÍA: Historial de acciones
// ═══════════════════════════════════════════════════════════════════════════

export async function obtenerLogsGrupo(req, res) {
  try {
    const { grupo_id, accion, user_cedula, desde, hasta, pagina = 1 } = req.query;

    // Permisos: ADMIN solo ve sus grupos, SUPER ve todo
    let grupo_filter = '';
    const params = [];

    if (req.user.role === 'ADMIN' && grupo_id) {
      // Verificar que el ADMIN es director del grupo
      const grupoCheck = await query(
        'SELECT id FROM grupos WHERE id = $1 AND director_cedula = $2 LIMIT 1',
        [grupo_id, req.user.cedula]
      );
      if (grupoCheck.rows.length === 0) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      grupo_filter = ' AND al.grupo_id = $1';
      params.push(grupo_id);
    } else if (grupo_id) {
      grupo_filter = ' AND al.grupo_id = $1';
      params.push(grupo_id);
    }

    let sql = `
      SELECT 
        al.id, al.user_cedula, al.rol, al.accion, al.entidad, al.entidad_id,
        al.grupo_id, al.descripcion, al.created_at,
        u.name as user_name,
        g.nombre as grupo_nombre
      FROM action_logs al
      LEFT JOIN users u ON u.cedula = al.user_cedula
      LEFT JOIN grupos g ON g.id = al.grupo_id
      WHERE 1=1
    `;

    if (grupo_filter) {
      sql += grupo_filter;
    }

    if (accion) {
      sql += ` AND al.accion = $${params.length + 1}`;
      params.push(accion);
    }

    if (user_cedula) {
      sql += ` AND al.user_cedula = $${params.length + 1}`;
      params.push(user_cedula);
    }

    if (desde) {
      sql += ` AND al.created_at >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND al.created_at <= $${params.length + 1}`;
      params.push(hasta);
    }

    sql += ' ORDER BY al.created_at DESC LIMIT 500';

    const result = await query(sql, params);
    res.json({
      total: result.rows.length,
      logs: result.rows
    });
  } catch (error) {
    console.error('Error en obtenerLogsGrupo:', error);
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTES: Ventas simples
// ═══════════════════════════════════════════════════════════════════════════

export async function obtenerReportesVentas(req, res) {
  try {
    const { grupo_id, funcion_id, vendedor_cedula, desde, hasta, tipo = 'grupo' } = req.query;

    let sql = `
      SELECT 
        COALESCE(f.id, 0) as funcion_id,
        COALESCE(f.fecha, CURRENT_DATE) as fecha,
        COALESCE(o.nombre, 'N/A') as obra_nombre,
        COALESCE(u.name, t.vendedor_phone, 'Desconocido') as vendedor_nombre,
        COUNT(DISTINCT t.code) as cantidad_tickets,
        SUM(CASE WHEN t.estado IN ('PAGADO', 'USADO') THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN t.estado = 'PAGADO' THEN t.precio ELSE 0 END) as total_recaudado,
        SUM(CASE WHEN t.estado = 'REPORTADA_VENDIDA' THEN 1 ELSE 0 END) as pendientes_aprobacion
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN users u ON u.cedula = t.vendedor_phone OR u.phone = t.vendedor_phone
      WHERE g.estado = 'ACTIVO'
    `;

    const params = [];

    if (grupo_id) {
      sql += ` AND g.id = $${params.length + 1}`;
      params.push(grupo_id);
    }

    if (funcion_id) {
      sql += ` AND f.id = $${params.length + 1}`;
      params.push(funcion_id);
    }

    if (vendedor_cedula) {
      sql += ` AND (u.cedula = $${params.length + 1} OR t.vendedor_phone = $${params.length + 1})`;
      params.push(vendedor_cedula);
      params.push(vendedor_cedula);
    }

    if (desde) {
      sql += ` AND f.fecha >= $${params.length + 1}`;
      params.push(desde);
    }

    if (hasta) {
      sql += ` AND f.fecha <= $${params.length + 1}`;
      params.push(hasta);
    }

    // Agrupar según tipo
    if (tipo === 'funcion') {
      sql += ` GROUP BY f.id, f.fecha, o.nombre ORDER BY f.fecha DESC`;
    } else if (tipo === 'vendedor') {
      sql += ` GROUP BY u.name, t.vendedor_phone ORDER BY total_recaudado DESC NULLS LAST`;
    } else {
      sql += ` GROUP BY o.nombre ORDER BY total_recaudado DESC NULLS LAST`;
    }

    const result = await query(sql, params);

    const totales = {
      cantidad_total: result.rows.reduce((sum, r) => sum + (r.cantidad_tickets || 0), 0),
      pagados_total: result.rows.reduce((sum, r) => sum + (r.pagados || 0), 0),
      recaudado_total: result.rows.reduce((sum, r) => sum + (parseFloat(r.total_recaudado) || 0), 0),
      pendientes_total: result.rows.reduce((sum, r) => sum + (r.pendientes_aprobacion || 0), 0)
    };

    res.json({
      tipo,
      totales,
      reportes: result.rows
    });
  } catch (error) {
    console.error('Error en obtenerReportesVentas:', error);
    res.status(500).json({ error: 'Error obteniendo reportes' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR: CSV
// ═══════════════════════════════════════════════════════════════════════════

export async function exportarVentasCSV(req, res, tipo = 'ventas') {
  try {
    const { grupo_id, funcion_id, vendedor_cedula } = req.query;

    let sql = '';
    const params = [];

    if (tipo === 'logs') {
      sql = `
        SELECT id, user_cedula, rol, accion, entidad, entidad_id, grupo_id, descripcion, created_at
        FROM action_logs
        WHERE 1=1
      `;

      if (grupo_id) {
        sql += ` AND grupo_id = $${params.length + 1}`;
        params.push(grupo_id);
      }

      sql += ' ORDER BY created_at DESC LIMIT 1000';
    } else {
      sql = `
        SELECT 
          f.fecha, o.nombre as obra, u.name as vendedor,
          COUNT(t.code) as cantidad, SUM(t.precio) as total
        FROM tickets t
        JOIN funciones f ON f.id = t.funcion_id
        JOIN obras o ON o.id = f.obra_id
        WHERE t.estado IN ('PAGADO', 'USADO')
      `;

      if (grupo_id) {
        sql += ` AND o.grupo_id = $${params.length + 1}`;
        params.push(grupo_id);
      }

      sql += ' GROUP BY f.fecha, o.nombre, u.name ORDER BY f.fecha DESC';
    }

    const result = await query(sql, params);

    let csv = '';
    if (result.rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${Date.now()}.csv"`);
      res.send('Sin datos');
      return;
    }

    // Header
    const headers = Object.keys(result.rows[0]);
    csv = headers.join(',') + '\n';

    // Rows
    result.rows.forEach(row => {
      csv += headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${tipo}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error en exportarVentasCSV:', error);
    res.status(500).json({ error: 'Error exportando CSV' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR: PDF
// ═══════════════════════════════════════════════════════════════════════════

export async function exportarVentasPDF(req, res) {
  try {
    const { grupo_id } = req.query;

    let sql = `
      SELECT 
        g.nombre as grupo, o.nombre as obra, f.fecha, f.lugar,
        u.name as vendedor, COUNT(t.code) as cantidad, SUM(t.precio) as total
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN users u ON u.phone = t.vendedor_phone
      WHERE t.estado IN ('PAGADO', 'USADO')
    `;

    const params = [];
    if (grupo_id) {
      sql += ` AND g.id = $${params.length + 1}`;
      params.push(grupo_id);
    }

    sql += ' GROUP BY g.nombre, o.nombre, f.fecha, f.lugar, u.name ORDER BY f.fecha DESC';

    const result = await query(sql, params);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${Date.now()}.pdf"`);

    doc.pipe(res);

    // Título
    doc.fontSize(16).text('Reporte de Ventas - BACO Teatro', { align: 'center' });
    doc.fontSize(10).text(`Fecha: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Tabla simple
    doc.fontSize(10);
    const headers = ['Grupo', 'Obra', 'Fecha', 'Vendedor', 'Qty', 'Total'];
    doc.text(headers.join(' | '));
    doc.movDown(0.3);

    let totalGeneral = 0;
    result.rows.forEach(row => {
      doc.text([
        row.grupo.substring(0, 15),
        row.obra.substring(0, 12),
        row.fecha,
        (row.vendedor || 'N/A').substring(0, 10),
        row.cantidad,
        `$${row.total}`
      ].join(' | '), { fontSize: 9 });
      totalGeneral += parseFloat(row.total) || 0;
    });

    doc.movDown();
    doc.fontSize(11).text(`TOTAL RECAUDADO: $${totalGeneral.toFixed(2)}`, { bold: true });

    doc.end();
  } catch (error) {
    console.error('Error en exportarVentasPDF:', error);
    res.status(500).json({ error: 'Error exportando PDF' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PÚBLICA: Obra
// ═══════════════════════════════════════════════════════════════════════════

export async function obtenerObraPublica(req, res) {
  try {
    const { obraId } = req.params;

    const result = await query(`
      SELECT 
        o.id, o.nombre, o.descripcion, o.elenco, o.duracion,
        o.foto_url, o.grupo_id,
        g.nombre as grupo_nombre,
        COUNT(DISTINCT f.id) as total_funciones,
        COUNT(DISTINCT CASE WHEN f.estado IN ('PROGRAMADA', 'CONFIRMADA') AND f.fecha >= CURRENT_DATE THEN f.id END) as funciones_proximas
      FROM obras o
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN funciones f ON f.obra_id = o.id
      WHERE o.id = $1 AND g.estado = 'ACTIVO'
      GROUP BY o.id, g.nombre
    `, [obraId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    const obra = result.rows[0];

    // Sin datos de dinero, sin estados internos
    res.json({
      id: obra.id,
      nombre: obra.nombre,
      descripcion: obra.descripcion,
      elenco: obra.elenco,
      duracion: obra.duracion,
      foto_url: obra.foto_url,
      grupo_nombre: obra.grupo_nombre,
      estado: obra.funciones_proximas > 0 ? 'ACTIVA' : 'FINALIZADA',
      funciones_proximas: obra.funciones_proximas
    });
  } catch (error) {
    console.error('Error en obtenerObraPublica:', error);
    res.status(500).json({ error: 'Error obteniendo obra' });
  }
}

export async function obtenerFuncionesObraPublica(req, res) {
  try {
    const { obraId } = req.params;

    const result = await query(`
      SELECT 
        f.id, f.fecha, f.lugar, f.precio_base as precio,
        COUNT(CASE WHEN t.estado IN ('DISPONIBLE', 'STOCK_ACTOR') THEN 1 END) as disponibles
      FROM funciones f
      LEFT JOIN tickets t ON t.funcion_id = f.id
      WHERE f.obra_id = $1 
        AND f.estado IN ('PROGRAMADA', 'CONFIRMADA')
        AND f.fecha >= CURRENT_DATE
      GROUP BY f.id
      ORDER BY f.fecha ASC
    `, [obraId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error en obtenerFuncionesObraPublica:', error);
    res.status(500).json({ error: 'Error obteniendo funciones' });
  }
}
