import { query } from '../db/postgres.js';

async function getGrupoEstadoByFuncionId(funcionId) {
  const r = await query(
    `SELECT g.id AS grupo_id, g.estado AS grupo_estado
     FROM funciones f
     JOIN obras o ON o.id = f.obra_id
     JOIN grupos g ON g.id = o.grupo_id
     WHERE f.id = $1
     LIMIT 1`,
    [String(funcionId)]
  );
  return r.rows[0] || null;
}

async function getGrupoEstadoByTicketCode(ticketCode) {
  const r = await query(
    `SELECT g.id AS grupo_id, g.estado AS grupo_estado
     FROM tickets t
     JOIN funciones f ON f.id = t.funcion_id
     JOIN obras o ON o.id = f.obra_id
     JOIN grupos g ON g.id = o.grupo_id
     WHERE t.code = $1
     LIMIT 1`,
    [String(ticketCode)]
  );
  return r.rows[0] || null;
}

async function getGrupoEstadoByObraId(obraId) {
  const r = await query(
    `SELECT g.id AS grupo_id, g.estado AS grupo_estado
     FROM obras o
     JOIN grupos g ON g.id = o.grupo_id
     WHERE o.id = $1
     LIMIT 1`,
    [String(obraId)]
  );
  return r.rows[0] || null;
}

async function getGrupoEstadoByGrupoId(grupoId) {
  const r = await query('SELECT id AS grupo_id, estado AS grupo_estado FROM grupos WHERE id = $1 LIMIT 1', [String(grupoId)]);
  return r.rows[0] || null;
}

function isCerrado(estado) {
  return String(estado || '').toUpperCase() === 'CERRADO';
}

function rejectClosed(res) {
  return res.status(409).json({
    error: 'Operación bloqueada: el grupo está CERRADO (cierre definitivo)'
  });
}

export function bloquearSiGrupoCerradoPorParam(paramName = 'id') {
  return async (req, res, next) => {
    try {
      const grupoId = req.params?.[paramName];
      if (!grupoId) return next();

      const r = await getGrupoEstadoByGrupoId(grupoId);
      if (!r) return res.status(404).json({ error: 'Grupo no encontrado' });
      if (isCerrado(r.grupo_estado)) return rejectClosed(res);
      return next();
    } catch (e) {
      console.error('bloquearSiGrupoCerradoPorParam error:', e);
      return res.status(500).json({ error: 'Error validando estado del grupo' });
    }
  };
}

export function bloquearSiGrupoCerradoPorFuncionId({
  paramName = 'id',
  bodyKey,
  queryKey
} = {}) {
  return async (req, res, next) => {
    try {
      const funcionId =
        (paramName && req.params?.[paramName]) ||
        (bodyKey && req.body?.[bodyKey]) ||
        (queryKey && req.query?.[queryKey]);

      if (!funcionId) return next();

      const r = await getGrupoEstadoByFuncionId(funcionId);
      if (!r) return res.status(404).json({ error: 'Función no encontrada' });
      if (isCerrado(r.grupo_estado)) return rejectClosed(res);
      return next();
    } catch (e) {
      console.error('bloquearSiGrupoCerradoPorFuncionId error:', e);
      return res.status(500).json({ error: 'Error validando estado del grupo' });
    }
  };
}

export function bloquearSiGrupoCerradoPorObraId(bodyKey = 'obra_id') {
  return async (req, res, next) => {
    try {
      const obraId = req.body?.[bodyKey];
      if (!obraId) return next();
      const r = await getGrupoEstadoByObraId(obraId);
      if (!r) return res.status(404).json({ error: 'Obra no encontrada' });
      if (isCerrado(r.grupo_estado)) return rejectClosed(res);
      return next();
    } catch (e) {
      console.error('bloquearSiGrupoCerradoPorObraId error:', e);
      return res.status(500).json({ error: 'Error validando estado del grupo' });
    }
  };
}

export function bloquearSiGrupoCerradoPorTicketCodes({
  bodyKey = 'ticketIds',
  singleKey = 'ticketCode',
  paramName = 'code'
} = {}) {
  return async (req, res, next) => {
    try {
      const codes = [];

      if (Array.isArray(req.body?.[bodyKey])) {
        for (const c of req.body[bodyKey]) codes.push(String(c));
      }

      const single = req.body?.[singleKey] || req.body?.ticketId || req.body?.ticketCode || req.params?.[paramName];
      if (single && !codes.includes(String(single))) codes.push(String(single));

      if (codes.length === 0) return next();

      // Validar si cualquiera de los tickets pertenece a un grupo cerrado
      for (const code of codes) {
        const r = await getGrupoEstadoByTicketCode(code);
        if (!r) continue; // si no existe, lo manejará el controller
        if (isCerrado(r.grupo_estado)) return rejectClosed(res);
      }

      return next();
    } catch (e) {
      console.error('bloquearSiGrupoCerradoPorTicketCodes error:', e);
      return res.status(500).json({ error: 'Error validando estado del grupo' });
    }
  };
}
