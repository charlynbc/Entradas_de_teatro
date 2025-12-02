import { readData } from '../utils/dataStore.js';

const SOLD_STATES = new Set(['REPORTADA_VENDIDA', 'PAGADO', 'USADO']);
const STOCK_STATES = new Set(['STOCK_VENDEDOR', 'RESERVADO']);

function buildVendorSummary(tickets, users) {
  const summary = new Map();

  tickets.forEach(ticket => {
    if (!ticket.vendedor_phone) return;
    if (!summary.has(ticket.vendedor_phone)) {
      const user = users.find(u => u.phone === ticket.vendedor_phone) || {};
      summary.set(ticket.vendedor_phone, {
        show_id: ticket.show_id,
        vendedor_phone: ticket.vendedor_phone,
        vendedor_nombre: user.name || ticket.vendedor_phone,
        asignados: 0,
        vendidos: 0,
        monto_reportado: 0,
        monto_pagado: 0
      });
    }

    const entry = summary.get(ticket.vendedor_phone);
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
    const data = await readData();
    
    // Contar producciones únicas (por admin)
    const productions = new Set();
    data.shows?.forEach(show => {
      if (show.admin_phone) {
        productions.add(show.admin_phone);
      }
    });
    
    // Contar funciones activas
    const functions = data.shows?.length || 0;
    
    // Contar tickets totales y vendidos
    const totalTickets = data.tickets?.length || 0;
    const ticketsVendidos = data.tickets?.filter(t => SOLD_STATES.has(t.estado)).length || 0;
    
    // Calcular ingresos totales
    const ingresosTotal = data.tickets
      ?.filter(t => t.estado === 'PAGADO' || t.estado === 'USADO')
      .reduce((sum, t) => sum + (Number(t.precio) || 0), 0) || 0;
    
    res.json({
      ok: true,
      totals: {
        productions: productions.size,
        functions: functions,
        tickets: totalTickets,
        sold: ticketsVendidos,
        revenue: ingresosTotal
      }
    });
  } catch (error) {
    console.error('Error en dashboard super:', error);
    res.status(500).json({ error: error.message });
  }
}
