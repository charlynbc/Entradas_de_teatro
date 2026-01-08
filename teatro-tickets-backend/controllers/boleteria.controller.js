import { query } from '../db/postgres.js';

const SOLD = new Set(['REPORTADA_VENDIDA', 'PAGADO', 'USADO']);
const PAID = new Set(['PAGADO', 'USADO']);

function assertPermisoObra(obra, user) {
  if (!obra) {
    const err = new Error('Obra no encontrada');
    err.status = 404;
    throw err;
  }
  if (!obra.es_profesional) {
    const err = new Error('La obra no es profesional');
    err.status = 400;
    throw err;
  }
  if (user.role !== 'SUPER' && user.role !== 'ADMIN') {
    const err = new Error('Sin permisos para sección boletería');
    err.status = 403;
    throw err;
  }
  if (user.role === 'ADMIN' && obra.director_cedula && obra.director_cedula !== user.cedula) {
    const err = new Error('Solo el director de la obra puede ver esta sección');
    err.status = 403;
    throw err;
  }
}

export async function resumenObraProfesional(req, res) {
  try {
    const obraId = Number(req.params.obraId);
    if (!Number.isFinite(obraId)) {
      return res.status(400).json({ error: 'obraId inválido' });
    }

    const obraRes = await query(
      `SELECT o.id, o.nombre, COALESCE(o.es_profesional, FALSE) AS es_profesional, g.director_cedula
       FROM obras o
       JOIN grupos g ON g.id = o.grupo_id
       WHERE o.id = $1`,
      [obraId]
    );
    const obra = obraRes.rows[0];
    assertPermisoObra(obra, req.user);

    const funcionesRes = await query(
      `SELECT
         f.id AS funcion_id,
         f.fecha,
         f.lugar,
         COALESCE(f.precio_base, 0) AS precio_base,
         COUNT(t.code) FILTER (WHERE t.estado IN ('REPORTADA_VENDIDA','PAGADO','USADO')) AS vendidas,
         COUNT(t.code) FILTER (WHERE t.estado IN ('PAGADO','USADO')) AS pagadas,
         SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS recaudado
       FROM funciones f
       LEFT JOIN tickets t ON t.funcion_id = f.id
       WHERE f.obra_id = $1
       GROUP BY f.id, f.fecha, f.lugar, f.precio_base
       ORDER BY f.fecha ASC`,
      [obraId]
    );

    const totales = funcionesRes.rows.reduce((acc, f) => {
      acc.vendidas += Number(f.vendidas || 0);
      acc.pagadas += Number(f.pagadas || 0);
      acc.recaudado += Number(f.recaudado || 0);
      return acc;
    }, { vendidas: 0, pagadas: 0, recaudado: 0 });

    res.json({
      obra: { id: obra.id, nombre: obra.nombre },
      totales,
      funciones: funcionesRes.rows
    });
  } catch (error) {
    console.error('Error resumen boletería:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

export async function balanceObraProfesional(req, res) {
  try {
    const obraId = Number(req.params.obraId);
    if (!Number.isFinite(obraId)) {
      return res.status(400).json({ error: 'obraId inválido' });
    }

    const obraRes = await query(
      `SELECT o.id, o.nombre, COALESCE(o.es_profesional, FALSE) AS es_profesional, g.director_cedula
       FROM obras o
       JOIN grupos g ON g.id = o.grupo_id
       WHERE o.id = $1`,
      [obraId]
    );
    const obra = obraRes.rows[0];
    assertPermisoObra(obra, req.user);

    const balanceRes = await query(
      `SELECT * FROM v_balance_obras_profesionales WHERE obra_id = $1`,
      [obraId]
    );

    const resumen = balanceRes.rows[0] || { ingresos: 0, gastos: 0, balance: 0 };

    const funciones = await query(
      `SELECT
         f.id AS funcion_id,
         f.fecha,
         f.lugar,
         COALESCE(f.precio_base, 0) AS precio_base,
         COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(ga.monto), 0) AS gastos
       FROM funciones f
       LEFT JOIN tickets t ON t.funcion_id = f.id
       LEFT JOIN gastos ga ON ga.funcion_id = f.id
       WHERE f.obra_id = $1
       GROUP BY f.id, f.fecha, f.lugar, f.precio_base
       ORDER BY f.fecha ASC`,
      [obraId]
    );

    res.json({
      obra: { id: obra.id, nombre: obra.nombre },
      resumen,
      funciones: funciones.rows
    });
  } catch (error) {
    console.error('Error balance obra profesional:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}

export async function marcarCierreObra(req, res) {
  try {
    const obraId = Number(req.params.obraId);
    if (!Number.isFinite(obraId)) {
      return res.status(400).json({ error: 'obraId inválido' });
    }

    const obraRes = await query(
      `SELECT o.id, o.nombre, COALESCE(o.es_profesional, FALSE) AS es_profesional, g.director_cedula
       FROM obras o
       JOIN grupos g ON g.id = o.grupo_id
       WHERE o.id = $1`,
      [obraId]
    );
    const obra = obraRes.rows[0];
    assertPermisoObra(obra, req.user);

    // Calcular ingresos/gastos antes de cerrar
    const balanceRes = await query(
      `SELECT * FROM v_balance_obras_profesionales WHERE obra_id = $1`,
      [obraId]
    );
    const resumen = balanceRes.rows[0] || { ingresos: 0, gastos: 0, balance: 0 };

    const result = await query(
      `INSERT INTO cierre_obras_profesionales (obra_id, ingresos_totales, gastos_totales, balance_final, cerrado_por)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (obra_id) DO UPDATE
         SET ingresos_totales = EXCLUDED.ingresos_totales,
             gastos_totales = EXCLUDED.gastos_totales,
             balance_final = EXCLUDED.balance_final,
             cerrado_por = EXCLUDED.cerrado_por,
             fecha_cierre = CURRENT_DATE
       RETURNING *`,
      [obraId, resumen.ingresos || 0, resumen.gastos || 0, resumen.balance || 0, req.user.cedula]
    );

    res.json({ ok: true, cierre: result.rows[0] });
  } catch (error) {
    console.error('Error marcando cierre:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}
