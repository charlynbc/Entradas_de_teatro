import { query } from '../db/postgres.js';

function assertDirectorOrSuper(req, targetDirector) {
  if (req.user.role === 'SUPER') return;
  if (req.user.role === 'ADMIN' && req.user.cedula === targetDirector) return;
  const err = new Error('No autorizado para contabilidad solicitada');
  err.status = 403;
  throw err;
}

export async function resumenAnual(req, res) {
  try {
    const year = Number(req.query.anio || req.query.year || new Date().getFullYear());
    const directorCedula = req.query.director || req.query.director_cedula || req.user.cedula;

    if (!Number.isFinite(year)) {
      return res.status(400).json({ error: 'Año inválido' });
    }

    assertDirectorOrSuper(req, directorCedula);

    const base = await query(
      `SELECT *
       FROM v_contabilidad_anual_base
       WHERE director_cedula = $1 AND anio = $2`,
      [directorCedula, year]
    );

    const fila = base.rows[0] || {
      director_cedula: directorCedula,
      anio: year,
      ingresos_funciones: 0,
      ingresos_cuotas: 0,
      gastos: 0
    };

    const balance_final = Number(fila.ingresos_funciones || 0) + Number(fila.ingresos_cuotas || 0) - Number(fila.gastos || 0);

    res.json({
      director: fila.director_cedula,
      anio: year,
      ingresos_funciones: Number(fila.ingresos_funciones || 0),
      ingresos_cuotas: Number(fila.ingresos_cuotas || 0),
      gastos_totales: Number(fila.gastos || 0),
      balance_final
    });
  } catch (error) {
    console.error('Error contabilidad anual:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
}
