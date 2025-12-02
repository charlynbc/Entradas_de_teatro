import { query } from '../db/postgres.js';
import PDFDocument from 'pdfkit';

export async function generarReporteObra(req, res) {
  try {
    const { showId } = req.params;
    
    // Obtener información del show
    const showResult = await query(
      'SELECT * FROM shows WHERE id = $1',
      [showId]
    );
    
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    
    const show = showResult.rows[0];
    
    // Verificar que el usuario tenga permisos (creador o SUPER)
    if (req.user.role !== 'SUPER' && show.creado_por !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para generar este reporte' });
    }
    
    // Obtener todos los tickets del show
    const ticketsResult = await query(
      `SELECT t.*, u.nombre as vendedor_nombre, u.cedula as vendedor_cedula
       FROM tickets t
       LEFT JOIN users u ON t.vendedor_id = u.id
       WHERE t.show_id = $1`,
      [showId]
    );
    
    const tickets = ticketsResult.rows;
    
    // Calcular estadísticas
    const totalTickets = tickets.length;
    const ticketsVendidos = tickets.filter(t => 
      ['VENDIDA_NO_PAGADA', 'VENDIDA_PAGADA', 'USADA'].includes(t.estado)
    ).length;
    const ticketsUsados = tickets.filter(t => t.estado === 'USADA').length;
    
    const ingresosTotales = tickets
      .filter(t => ['VENDIDA_PAGADA', 'USADA'].includes(t.estado))
      .reduce((sum, t) => sum + parseFloat(t.precio_venta || 0), 0);
    
    // Agrupar por vendedor
    const vendedoresMap = {};
    tickets.forEach(ticket => {
      if (ticket.vendedor_id) {
        if (!vendedoresMap[ticket.vendedor_id]) {
          vendedoresMap[ticket.vendedor_id] = {
            id: ticket.vendedor_id,
            nombre: ticket.vendedor_nombre,
            cedula: ticket.vendedor_cedula,
            asignados: 0,
            vendidos: 0,
            usados: 0,
            ingresos: 0
          };
        }
        
        vendedoresMap[ticket.vendedor_id].asignados++;
        
        if (['VENDIDA_NO_PAGADA', 'VENDIDA_PAGADA', 'USADA'].includes(ticket.estado)) {
          vendedoresMap[ticket.vendedor_id].vendidos++;
        }
        
        if (ticket.estado === 'USADA') {
          vendedoresMap[ticket.vendedor_id].usados++;
        }
        
        if (['VENDIDA_PAGADA', 'USADA'].includes(ticket.estado)) {
          vendedoresMap[ticket.vendedor_id].ingresos += parseFloat(ticket.precio_venta || 0);
        }
      }
    });
    
    const datosVendedores = Object.values(vendedoresMap);
    
    // Datos de ventas por estado
    const datosVentas = {
      noAsignados: tickets.filter(t => t.estado === 'NO_ASIGNADO').length,
      enPoder: tickets.filter(t => t.estado === 'EN_PODER').length,
      vendidasNoPagadas: tickets.filter(t => t.estado === 'VENDIDA_NO_PAGADA').length,
      vendidasPagadas: tickets.filter(t => t.estado === 'VENDIDA_PAGADA').length,
      usadas: ticketsUsados
    };
    
    // Guardar reporte en la base de datos
    const reporteResult = await query(
      `INSERT INTO reportes_obras 
       (show_id, nombre_obra, fecha_show, director_id, total_tickets, 
        tickets_vendidos, tickets_usados, ingresos_totales, datos_vendedores, datos_ventas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        showId,
        show.nombre,
        show.fecha,
        show.creado_por,
        totalTickets,
        ticketsVendidos,
        ticketsUsados,
        ingresosTotales,
        JSON.stringify(datosVendedores),
        JSON.stringify(datosVentas)
      ]
    );
    
    res.json({
      ok: true,
      mensaje: 'Reporte generado correctamente',
      reporte: {
        id: reporteResult.rows[0].id,
        nombreObra: show.nombre,
        fechaShow: show.fecha,
        totalTickets,
        ticketsVendidos,
        ticketsUsados,
        ingresosTotales,
        vendedores: datosVendedores,
        ventas: datosVentas
      }
    });
    
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarReportes(req, res) {
  try {
    let reportesQuery = 'SELECT * FROM reportes_obras';
    const params = [];
    
    // Si no es SUPER, solo mostrar sus reportes
    if (req.user.role !== 'SUPER') {
      reportesQuery += ' WHERE director_id = $1';
      params.push(req.user.id);
    }
    
    reportesQuery += ' ORDER BY fecha_show DESC';
    
    const result = await query(reportesQuery, params);
    
    res.json({
      ok: true,
      reportes: result.rows.map(r => ({
        id: r.id,
        showId: r.show_id,
        nombreObra: r.nombre_obra,
        fechaShow: r.fecha_show,
        fechaGeneracion: r.fecha_generacion,
        totalTickets: r.total_tickets,
        ticketsVendidos: r.tickets_vendidos,
        ticketsUsados: r.tickets_usados,
        ingresosTotales: parseFloat(r.ingresos_totales),
        vendedores: r.datos_vendedores,
        ventas: r.datos_ventas
      }))
    });
    
  } catch (error) {
    console.error('Error listando reportes:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function obtenerReporte(req, res) {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM reportes_obras WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    const reporte = result.rows[0];
    
    // Verificar permisos
    if (req.user.role !== 'SUPER' && reporte.director_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este reporte' });
    }
    
    res.json({
      ok: true,
      reporte: {
        id: reporte.id,
        showId: reporte.show_id,
        nombreObra: reporte.nombre_obra,
        fechaShow: reporte.fecha_show,
        fechaGeneracion: reporte.fecha_generacion,
        totalTickets: reporte.total_tickets,
        total_tickets: reporte.total_tickets,  // Snake_case para compatibilidad
        ticketsVendidos: reporte.tickets_vendidos,
        tickets_vendidos: reporte.tickets_vendidos,  // Snake_case para compatibilidad
        ticketsUsados: reporte.tickets_usados,
        tickets_usados: reporte.tickets_usados,  // Snake_case para compatibilidad
        ingresosTotales: parseFloat(reporte.ingresos_totales),
        ingresos_totales: parseFloat(reporte.ingresos_totales),  // Snake_case para compatibilidad
        datos_vendedores: reporte.datos_vendedores,  // Mantener nombre de columna de DB
        datos_ventas: reporte.datos_ventas,  // Mantener nombre de columna de DB
        vendedores: reporte.datos_vendedores,  // Alias para compatibilidad
        ventas: reporte.datos_ventas  // Alias para compatibilidad
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarReporte(req, res) {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM reportes_obras WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    const reporte = result.rows[0];
    
    // Verificar permisos
    if (req.user.role !== 'SUPER' && reporte.director_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este reporte' });
    }
    
    await query('DELETE FROM reportes_obras WHERE id = $1', [id]);
    
    res.json({
      ok: true,
      mensaje: 'Reporte eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function descargarReportePDF(req, res) {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM reportes_obras WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    const reporte = result.rows[0];
    
    // Verificar permisos
    if (req.user.role !== 'SUPER' && reporte.director_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para descargar este reporte' });
    }
    
    // Crear el PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${reporte.nombre_obra.replace(/\s+/g, '-')}-${reporte.id}.pdf`);
    
    // Pipe del PDF a la respuesta
    doc.pipe(res);
    
    // === HEADER ===
    doc.fontSize(24)
       .fillColor('#F48C06')
       .text('BACO TEATRO', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(18)
       .fillColor('#000000')
       .text('Reporte de Obra', { align: 'center' })
       .moveDown(1.5);
    
    // === INFO DE LA OBRA ===
    doc.fontSize(16)
       .fillColor('#F48C06')
       .text(reporte.nombre_obra, { underline: true })
       .moveDown(0.5);
    
    doc.fontSize(11)
       .fillColor('#000000')
       .text(`Fecha de la Función: ${new Date(reporte.fecha_show).toLocaleString('es-UY')}`)
       .text(`Fecha de Generación: ${new Date(reporte.fecha_generacion).toLocaleString('es-UY')}`)
       .moveDown(1.5);
    
    // === RESUMEN GENERAL ===
    doc.fontSize(14)
       .fillColor('#F48C06')
       .text('📊 Resumen General')
       .moveDown(0.3);
    
    doc.fontSize(11)
       .fillColor('#000000');
    
    const resumenY = doc.y;
    doc.text(`Total de Tickets: ${reporte.total_tickets}`, 50, resumenY);
    doc.text(`Tickets Vendidos: ${reporte.tickets_vendidos}`, 300, resumenY);
    
    doc.text(`Tickets Usados (Asistieron): ${reporte.tickets_usados}`, 50, doc.y + 5);
    doc.text(`Ingresos Totales: $${parseFloat(reporte.ingresos_totales).toFixed(2)}`, 300, doc.y);
    
    doc.moveDown(2);
    
    // === VENDEDORES ===
    doc.fontSize(14)
       .fillColor('#F48C06')
       .text('👥 Estadísticas por Vendedor')
       .moveDown(0.5);
    
    const vendedores = reporte.datos_vendedores || [];
    
    if (vendedores.length > 0) {
      // Tabla de vendedores
      doc.fontSize(10)
         .fillColor('#000000');
      
      const tableTop = doc.y;
      const colWidths = [150, 70, 70, 70, 90];
      const headers = ['Vendedor', 'Asignados', 'Vendidos', 'Usados', 'Ingresos'];
      
      // Headers
      doc.font('Helvetica-Bold');
      let xPos = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
      });
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
      
      // Datos
      doc.font('Helvetica');
      vendedores.forEach((vendedor, index) => {
        const rowY = doc.y;
        
        doc.text(vendedor.nombre, 50, rowY, { width: 150 });
        doc.text(vendedor.asignados.toString(), 200, rowY, { width: 70, align: 'center' });
        doc.text(vendedor.vendidos.toString(), 270, rowY, { width: 70, align: 'center' });
        doc.text(vendedor.usados.toString(), 340, rowY, { width: 70, align: 'center' });
        doc.text(`$${vendedor.ingresos.toFixed(2)}`, 410, rowY, { width: 90, align: 'right' });
        
        doc.moveDown(0.8);
        
        // Separador cada 5 filas
        if ((index + 1) % 5 === 0) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#CCCCCC');
          doc.moveDown(0.3);
        }
      });
    } else {
      doc.fontSize(10)
         .fillColor('#666666')
         .text('No hay vendedores asignados', { align: 'center' })
         .moveDown(1);
    }
    
    doc.moveDown(1.5);
    
    // === ESTADOS DE TICKETS ===
    doc.fontSize(14)
       .fillColor('#F48C06')
       .text('🎫 Estados de Tickets')
       .moveDown(0.5);
    
    const ventas = reporte.datos_ventas || {};
    
    doc.fontSize(11)
       .fillColor('#000000');
    
    const ventasY = doc.y;
    doc.text(`No Asignados: ${ventas.noAsignados || 0}`, 50, ventasY);
    doc.text(`En Poder de Vendedor: ${ventas.enPoder || 0}`, 300, ventasY);
    
    doc.text(`Vendidas (No Pagadas): ${ventas.vendidasNoPagadas || 0}`, 50, doc.y + 5);
    doc.text(`Vendidas (Pagadas): ${ventas.vendidasPagadas || 0}`, 300, doc.y);
    
    doc.text(`Usadas: ${ventas.usadas || 0}`, 50, doc.y + 5);
    
    doc.moveDown(3);
    
    // === FOOTER ===
    doc.fontSize(8)
       .fillColor('#666666')
       .text('Este reporte fue generado automáticamente por el sistema de gestión de Baco Teatro.', 50, doc.page.height - 100, {
         align: 'center',
         width: 500
       });
    
    doc.text(`ID del Reporte: ${reporte.id}`, {
      align: 'center'
    });
    
    // Finalizar el PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    // Si ya enviamos headers, no podemos enviar JSON
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}
