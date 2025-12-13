import { readData } from '../utils/dataStore.js';
import { query } from '../db/postgres.js';  // Import query for PostgreSQL operations

const SOLD_STATES = new Set(['REPORTADA_VENDIDA', 'PAGADO', 'USADO']);
const STOCK_STATES = new Set(['STOCK_VENDEDOR', 'RESERVADO']);

function buildVendorSummary(tickets, users) {
  const summary = new Map();

  tickets.forEach(ticket => {
    if (!ticket.vendedor_cedula) return;
    if (!summary.has(ticket.vendedor_cedula)) {
      const user = users.find(u => u.cedula === ticket.vendedor_cedula) || {};
      summary.set(ticket.vendedor_cedula, {
        show_id: ticket.show_id,
        vendedor_cedula: ticket.vendedor_cedula,
        vendedor_nombre: user.name || ticket.vendedor_cedula,
        asignados: 0,
        vendidos: 0,
        monto_reportado: 0,
        monto_pagado: 0
      });
    }

    const entry = summary.get(ticket.vendedor_cedula);
    if (STOCK_STATES.has(ticket.estado)) {
      entry.asignados += 1;
    }
    if (SOLD_STATES.has(ticket.estado)) {
      entry.vendidos += 1;
      entry.monto_reportado += Number(ticket.precio) || 0;
      if (ticket.estado === 'PAGADO' || ticket.estado === 'USADO') {
        entry.monto_pagado += Number(ticket.precio) || 0;
      }
    }
  });

  return Array.from(summary.values()).map(entry => ({
    ...entry,
    monto_debe: Math.max(entry.monto_reportado - entry.monto_pagado, 0)
  }));
}

export async function resumenPorVendedor(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    const ticketsShow = data.tickets.filter(ticket => ticket.show_id === showId);
    const resumen = buildVendorSummary(ticketsShow, data.users || []);
    res.json(resumen);
  } catch (error) {
    console.error('Error en resumen por vendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenAdmin(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const summary = data.tickets
      .filter(ticket => ticket.show_id === showId)
      .reduce(
        (acc, ticket) => {
          acc.total += 1;
          acc.estados[ticket.estado] = (acc.estados[ticket.estado] || 0) + 1;
          if (ticket.estado === 'PAGADO' || ticket.estado === 'USADO') {
            acc.monto_total += Number(ticket.precio) || 0;
          }
          return acc;
        },
        { total: 0, estados: {}, monto_total: 0 }
      );

    res.json({
      show,
      total_tickets: summary.total,
      estados: summary.estados,
      monto_total: summary.monto_total
    });
  } catch (error) {
    console.error('Error en resumen admin:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deudores(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const resumen = buildVendorSummary(
      data.tickets.filter(ticket => ticket.show_id === showId),
      data.users || []
    );

    const vendedoresDeudores = resumen
      .filter(entry => entry.monto_debe > 0)
      .sort((a, b) => b.monto_debe - a.monto_debe);

    const totalDeuda = vendedoresDeudores.reduce((sum, entry) => sum + entry.monto_debe, 0);

    res.json({
      show_id: showId,
      total_deuda: totalDeuda,
      vendedores_deudores: vendedoresDeudores
    });
  } catch (error) {
    console.error('Error obteniendo deudores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenFuncion(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const resumen = {
      show,
      disponibles: 0,
      en_stock_vendedor: 0,
      reservadas: 0,
      reportadas_vendidas: 0,
      pagadas: 0,
      usadas: 0,
      monto_total: 0
    };

    data.tickets
      .filter(ticket => ticket.show_id === showId)
      .forEach(ticket => {
        const precio = Number(ticket.precio) || 0;
        switch (ticket.estado) {
          case 'DISPONIBLE':
            resumen.disponibles += 1;
            break;
          case 'STOCK_VENDEDOR':
            resumen.en_stock_vendedor += 1;
            break;
          case 'RESERVADO':
            resumen.reservadas += 1;
            break;
          case 'REPORTADA_VENDIDA':
            resumen.reportadas_vendidas += 1;
            break;
          case 'PAGADO':
            resumen.pagadas += 1;
            resumen.monto_total += precio;
            break;
          case 'USADO':
            resumen.usadas += 1;
            resumen.monto_total += precio;
            break;
        }
      });

    res.json(resumen);
  } catch (error) {
    console.error('Error en resumen de función:', error);
    res.status(500).json({ error: error.message });
  }
}

// Dashboard global para usuario SUPER
export async function dashboardSuper(req, res) {
  try {
    // Contar shows
    const showsResult = await query('SELECT COUNT(*) as total FROM shows');
    const functions = parseInt(showsResult.rows[0].total);
    
    // Contar directores únicos (productions = directores con shows)
    const directoresResult = await query('SELECT COUNT(DISTINCT creado_por) as total FROM shows');
    const productions = parseInt(directoresResult.rows[0].total);
    
    // Contar tickets totales
    const ticketsResult = await query('SELECT COUNT(*) as total FROM tickets');
    const totalTickets = parseInt(ticketsResult.rows[0].total);
    
    // Contar tickets vendidos (REPORTADA_VENDIDA, PAGADO, USADO)
    const vendidosResult = await query(
      `SELECT COUNT(*) as total FROM tickets 
       WHERE estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')`
    );
    const ticketsVendidos = parseInt(vendidosResult.rows[0].total);
    
    // Calcular ingresos totales (solo PAGADO y USADO)
    const ingresosResult = await query(
      `SELECT COALESCE(SUM(precio_venta), 0) as total FROM tickets 
       WHERE estado IN ('PAGADO', 'USADO')`
    );
    const ingresosTotal = parseFloat(ingresosResult.rows[0].total);
    
    // Contar vendedores activos (solo vendedores que son usuarios)
    const vendedoresResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE rol = 'vendedor'`
    );
    const vendedoresActivos = parseInt(vendedoresResult.rows[0].total);
    
    // Información de ventas (simplificado - sin vendor tracking por ahora)
    const ventasResult = await query(
      `SELECT 
        COUNT(*) as total_ventas
       FROM tickets 
       WHERE estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')`
    );
    
    res.json({
      ok: true,
      totals: {
        productions: productions,
        functions: functions,
        tickets: totalTickets,
        sold: ticketsVendidos,
        revenue: ingresosTotal
      },
      vendedores: {
        activos: vendedoresActivos,
        con_ventas: 0  // Simplificado - tickets no tienen vendor tracking
      },
      ventas: {
        total: parseInt(ventasResult.rows[0].total_ventas),
        porcentaje: totalTickets > 0 ? ((ticketsVendidos / totalTickets) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Error en dashboard super:', error);
    res.status(500).json({ error: error.message });
  }
}

// Dashboard para directores (ADMIN)
export async function dashboardDirector(req, res) {
  try {
    let { id: userId } = req.user;

    // Backward compatibility para tokens sin ID
    if (!userId && req.user.phone) {
      const userResult = await query('SELECT id FROM users WHERE cedula = $1', [req.user.phone]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }
    
    // Shows del director
    const showsResult = await query(
      'SELECT * FROM shows WHERE creado_por = $1 ORDER BY fecha DESC',
      [userId]
    );
    
    // Actores (todos los vendedores del sistema - simplificado)
    const actoresResult = await query(
      `SELECT id, nombre, cedula FROM users WHERE rol = 'vendedor'`
    );
    
    res.json({
      ok: true,
      functions: showsResult.rows,
      actors: actoresResult.rows
    });
  } catch (error) {
    console.error('Error en dashboard director:', error);
    res.status(500).json({ error: error.message });
  }
}
