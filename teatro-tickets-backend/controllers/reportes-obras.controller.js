import { query } from '../db/postgres.js';

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
        ticketsVendidos: reporte.tickets_vendidos,
        ticketsUsados: reporte.tickets_usados,
        ingresosTotales: parseFloat(reporte.ingresos_totales),
        vendedores: reporte.datos_vendedores,
        ventas: reporte.datos_ventas
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
