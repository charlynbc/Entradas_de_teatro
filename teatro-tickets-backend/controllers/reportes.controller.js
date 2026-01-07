import { query } from '../db/postgres.js';

export async function resumenPorVendedor(req, res) {
  try {
    const funcionId = String(req.params.id);
    const result = await query(
      `SELECT
        t.funcion_id AS show_id,
        t.vendedor_phone,
        COALESCE(u.name, t.vendedor_phone) AS vendedor_nombre,
        COUNT(*) FILTER (WHERE t.estado = 'STOCK_ACTOR')::int AS asignados,
        COUNT(*) FILTER (WHERE t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO'))::int AS vendidos,
        COALESCE(SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS monto_reportado,
        COALESCE(SUM(CASE WHEN t.aprobada_por_admin
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS monto_pagado,
        COALESCE(SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS monto_debe
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      LEFT JOIN users u ON u.phone = t.vendedor_phone
      WHERE t.funcion_id = $1
        AND t.vendedor_phone IS NOT NULL
      GROUP BY t.funcion_id, t.vendedor_phone, u.name
      ORDER BY vendedor_nombre ASC`,
      [funcionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error en resumen por vendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenAdmin(req, res) {
  try {
    const funcionId = String(req.params.id);
    const result = await query(
      `SELECT
        f.id AS show_id,
        f.fecha,
        f.lugar,
        f.capacidad,
        f.precio_base,
        f.estado AS estado_funcion,
        o.nombre AS obra_nombre,
        g.nombre AS grupo_nombre,
        COUNT(t.code)::int AS total_generados,
        COUNT(*) FILTER (WHERE t.estado = 'DISPONIBLE')::int AS disponibles,
        COUNT(*) FILTER (WHERE t.estado = 'STOCK_ACTOR')::int AS en_stock_actores,
        COUNT(*) FILTER (WHERE t.estado = 'RESERVADO')::int AS reservadas,
        COUNT(*) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA')::int AS reportadas_sin_aprobar,
        COUNT(*) FILTER (WHERE t.estado IN ('PAGADO', 'USADO'))::int AS pagadas,
        COUNT(*) FILTER (WHERE t.estado = 'USADO')::int AS usadas,
        COALESCE(SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS recaudacion_teorica,
        COALESCE(SUM(CASE WHEN t.aprobada_por_admin
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS recaudacion_real,
        COALESCE(SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS pendiente_aprobar
      FROM funciones f
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      WHERE f.id = $1
      GROUP BY f.id, o.nombre, g.nombre`,
      [funcionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en resumen admin:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deudores(req, res) {
  try {
    const funcionId = String(req.params.id);
    const result = await query(
      `SELECT
        t.funcion_id AS show_id,
        t.vendedor_phone,
        COALESCE(u.name, t.vendedor_phone) AS vendedor_nombre,
        COALESCE(SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
          THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0)::numeric AS monto_debe
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      LEFT JOIN users u ON u.phone = t.vendedor_phone
      WHERE t.funcion_id = $1
        AND t.vendedor_phone IS NOT NULL
      GROUP BY t.funcion_id, t.vendedor_phone, u.name
      HAVING COALESCE(SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
        THEN COALESCE(t.precio, f.precio_base) ELSE 0 END), 0) > 0
      ORDER BY monto_debe DESC`,
      [funcionId]
    );

    const total = result.rows.reduce((sum, r) => sum + Number(r.monto_debe || 0), 0);
    res.json({ show_id: Number(funcionId), total_deuda: total, vendedores_deudores: result.rows });
  } catch (error) {
    console.error('Error obteniendo deudores:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function resumenFuncion(req, res) {
  return resumenAdmin(req, res);
}

export async function dashboardSuper(req, res) {
  try {
    const obrasResult = await query('SELECT COUNT(*)::int as total FROM obras');
    const funcionesResult = await query('SELECT COUNT(*)::int as total FROM funciones');
    const ticketsResult = await query('SELECT COUNT(*)::int as total FROM tickets');
    const soldResult = await query(
      `SELECT COUNT(*)::int as total
       FROM tickets
       WHERE estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')`
    );
    const revenueResult = await query(
      `SELECT COALESCE(SUM(COALESCE(t.precio, f.precio_base)), 0)::numeric as total
       FROM tickets t
       JOIN funciones f ON f.id = t.funcion_id
       WHERE t.estado IN ('PAGADO', 'USADO')`
    );

    res.json({
      ok: true,
      totals: {
        productions: obrasResult.rows[0]?.total || 0,
        functions: funcionesResult.rows[0]?.total || 0,
        tickets: ticketsResult.rows[0]?.total || 0,
        sold: soldResult.rows[0]?.total || 0,
        revenue: Number(revenueResult.rows[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('Error en dashboard super:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function dashboardDirector(req, res) {
  try {
    const directorCedula = String(req.user.cedula || req.user.phone || '').trim();
    if (!directorCedula) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const funciones = await query(
      `SELECT
        f.id,
        f.fecha,
        f.lugar,
        o.nombre AS obra,
        g.nombre AS grupo
      FROM funciones f
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      WHERE g.director_cedula = $1
      ORDER BY f.fecha ASC`,
      [directorCedula]
    );

    const actores = await query(
      `SELECT DISTINCT u.cedula AS id, u.cedula, u.name AS nombre, u.phone, u.role
       FROM grupo_miembros gm
       JOIN grupos g ON g.id = gm.grupo_id
       JOIN users u ON u.cedula = gm.miembro_cedula
       WHERE g.director_cedula = $1
         AND gm.activo = TRUE
         AND u.role = 'ACTOR'
       ORDER BY u.name ASC`,
      [directorCedula]
    );

    res.json({ ok: true, functions: funciones.rows, actors: actores.rows });
  } catch (error) {
    console.error('Error en dashboard director:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function historialVendedor(req, res) {
  try {
    const actorPhone = req.user.phone || req.user.cedula;
    const stats = await query(
      `SELECT
        COUNT(*) FILTER (WHERE estado = 'REPORTADA_VENDIDA')::int AS vendidas,
        COUNT(*) FILTER (WHERE estado IN ('PAGADO', 'USADO'))::int AS pagadas,
        COALESCE(SUM(CASE WHEN estado IN ('PAGADO', 'USADO') THEN COALESCE(precio, 0) ELSE 0 END), 0)::numeric AS entregado
      FROM tickets
      WHERE vendedor_phone = $1`,
      [String(actorPhone)]
    );

    res.json({ ok: true, ...stats.rows[0] });
  } catch (error) {
    console.error('Error historialVendedor:', error);
    res.status(500).json({ error: error.message });
  }
}

/* LEGACY (deshabilitado)
function buildVendorSummary(tickets, users) {
  const summary = new Map();

  tickets.forEach(ticket => {
    if (!ticket.vendedor_phone) return;
    if (!summary.has(ticket.vendedor_phone)) {
      const user = users.find(u => u.phone === ticket.vendedor_phone) || {};
      summary.set(ticket.vendedor_phone, {
        show_id: ticket.show_id,
        vendedor_cedula: user.cedula || ticket.vendedor_phone,
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
      const funcionId = String(req.params.id);
      const row = await query(
        `SELECT
          id AS show_id,
          fecha,
          lugar,
          capacidad,
          precio_base,
          estado_funcion,
          obra_nombre,
          grupo_nombre,
          total_generados,
          disponibles,
          reservadas,
          reportadas_sin_aprobar,
          pagadas,
          usadas,
          recaudacion_teorica,
          recaudacion_real,
          pendiente_aprobar
        FROM v_resumen_funcion_admin
        WHERE id = $1`,
        [funcionId]
      );

      if (row.rows.length === 0) {
        return res.status(404).json({ error: 'Función no encontrada' });
      }

      res.json(row.rows[0]);
  }
}

export async function resumenAdmin(req, res) {
  try {
    const showId = parseInt(req.params.id);
    const data = await readData();
    const show = data.shows.find(s => s.id === showId);
      const funcionId = String(req.params.id);
      const result = await query(
        `SELECT
          funcion_id AS show_id,
          vendedor_phone,
          vendedor_nombre,
          monto_debe
        FROM v_resumen_vendedor_funcion
        WHERE funcion_id = $1
          AND monto_debe > 0
        ORDER BY monto_debe DESC`,
        [funcionId]
      );

      const total = result.rows.reduce((sum, r) => sum + Number(r.monto_debe || 0), 0);
      res.json({ show_id: Number(funcionId), total_deuda: total, vendedores_deudores: result.rows });
    });
  } catch (error) {
    console.error('Error en resumen admin:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deudores(req, res) {
      const funcionId = String(req.params.id);
      const row = await query(
        `SELECT
          id AS show_id,
          fecha,
          lugar,
          obra_nombre,
          grupo_nombre,
          total_generados,
          disponibles,
          reservadas,
          reportadas_sin_aprobar,
          pagadas,
          usadas,
          recaudacion_real AS monto_total
        FROM v_resumen_funcion_admin
        WHERE id = $1`,
        [funcionId]
      );
      if (row.rows.length === 0) {
        return res.status(404).json({ error: 'Función no encontrada' });
      }
      res.json(row.rows[0]);
      monto_total: 0
    };

    data.tickets
      .filter(ticket => ticket.show_id === showId)
      .forEach(ticket => {
        const precio = Number(ticket.precio) || 0;
        switch (ticket.estado) {
          case 'DISPONIBLE':
      const obrasResult = await query('SELECT COUNT(*)::int as total FROM obras');
      const funcionesResult = await query('SELECT COUNT(*)::int as total FROM funciones');
      const ticketsResult = await query('SELECT COUNT(*)::int as total FROM tickets');
      const soldResult = await query(
        `SELECT COUNT(*)::int as total
         FROM tickets
         WHERE estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')`
      );
      const revenueResult = await query(
        `SELECT COALESCE(SUM(COALESCE(t.precio, f.precio_base)), 0)::numeric as total
         FROM tickets t
         JOIN funciones f ON f.id = t.funcion_id
         WHERE t.estado IN ('PAGADO', 'USADO')`
      );

      res.json({
        ok: true,
        totals: {
          productions: obrasResult.rows[0]?.total || 0,
          functions: funcionesResult.rows[0]?.total || 0,
          tickets: ticketsResult.rows[0]?.total || 0,
          sold: soldResult.rows[0]?.total || 0,
          revenue: Number(revenueResult.rows[0]?.total || 0)
        }
      });
    // Contar vendedores activos (solo vendedores que son usuarios)
    const vendedoresResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE rol = 'vendedor'`
    );
    const vendedoresActivos = parseInt(vendedoresResult.rows[0].total);
    
    // Información de ventas (simplificado - sin vendor tracking por ahora)
    const ventasResult = await query(
      `SELECT 
      const directorCedula = String(req.user.cedula || req.user.phone || '').trim();
      if (!directorCedula) {
        return res.status(400).json({ error: 'Token inválido' });
      }

      // Funciones del director (por grupos/obras)
      const funciones = await query(
        `SELECT
          f.id,
          f.fecha,
          f.lugar,
          o.nombre AS obra,
          g.nombre AS grupo
        FROM funciones f
        JOIN obras o ON o.id = f.obra_id
        JOIN grupos g ON g.id = o.grupo_id
        WHERE g.director_cedula = $1
        ORDER BY f.fecha ASC`,
        [directorCedula]
      );

      // Actores del/los grupos del director
      const actores = await query(
        `SELECT DISTINCT u.cedula AS id, u.cedula, u.name AS nombre, u.phone, u.role
         FROM grupo_miembros gm
         JOIN grupos g ON g.id = gm.grupo_id
         JOIN users u ON u.cedula = gm.miembro_cedula
         WHERE g.director_cedula = $1
           AND gm.activo = TRUE
           AND u.role = 'ACTOR'
         ORDER BY u.name ASC`,
        [directorCedula]
      );

      res.json({ ok: true, functions: funciones.rows, actors: actores.rows });
        functions: functions,
        tickets: totalTickets,
        sold: ticketsVendidos,
        revenue: ingresosTotal
      },

  export async function historialVendedor(req, res) {
    try {
      const actorPhone = req.user.phone || req.user.cedula;
      const stats = await query(
        `SELECT
          COUNT(*) FILTER (WHERE estado = 'REPORTADA_VENDIDA')::int AS vendidas,
          COUNT(*) FILTER (WHERE estado IN ('PAGADO', 'USADO'))::int AS pagadas,
          COALESCE(SUM(CASE WHEN estado IN ('PAGADO', 'USADO') THEN COALESCE(precio, 0) ELSE 0 END), 0)::numeric AS entregado
        FROM tickets
        WHERE vendedor_phone = $1`,
        [String(actorPhone)]
      );

      res.json({ ok: true, ...stats.rows[0] });
    } catch (error) {
      console.error('Error historialVendedor:', error);
      res.status(500).json({ error: error.message });
    }
  }
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

*/
