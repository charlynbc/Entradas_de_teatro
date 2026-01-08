import pool from '../db/postgres.js';

const BOLETERIA_PHONE = process.env.BOLETERIA_PHONE || process.env.BOLETERIA_CONTACTO || '099999999';
const BOLETERIA_NOMBRE = process.env.BOLETERIA_NOMBRE || 'Boletería BACO';

/**
 * Cartelera pública para invitados (sin autenticación)
 * GET /public/funciones
 */
export async function listarFuncionesInvitado(req, res) {
  try {
    // Soportar esquemas diferentes: tomar campos compatibles y derivados
    const result = await pool.query(
      `SELECT 
          f.id,
          f.fecha AS fecha,
          to_char(f.fecha, 'HH24:MI') AS hora,
          COALESCE(f.lugar, '') AS sala,
          COALESCE(f.precio_base, 0) AS precio,
          COALESCE(o.nombre, 'Baco Teatro') AS obra_nombre,
          g.nombre AS grupo_nombre,
          COALESCE(o.es_profesional, FALSE) AS es_profesional,
          COALESCE(f.estado, 'PROGRAMADA') AS estado
       FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       LEFT JOIN grupos g ON g.id = o.grupo_id
       WHERE f.fecha >= NOW()
       ORDER BY f.fecha ASC`
    );

    // La UI espera { funciones: [] }
    res.json({ total: result.rows.length, funciones: result.rows });
  } catch (error) {
    console.error('Error al listar funciones invitado:', error);
    res.status(500).json({ error: 'Error al listar funciones públicas' });
  }
}

/**
 * Vendedores públicos por función (sin autenticación)
 * Reglas:
 * - Solo vendedores del grupo de la función
 * - Rol vendedor (en DB es ACTOR)
 * - Deben tener tickets asignados a esa función
 * - No expone estados internos ni cantidades
 * GET /public/funciones/:funcionId/vendedores
 */
export async function listarVendedoresPublicosPorFuncion(req, res) {
  try {
    const funcionId = Number(req.params.funcionId);
    if (!Number.isFinite(funcionId)) {
      return res.status(400).json({ error: 'funcionId inválido' });
    }

    // Determinar si es una función pública vigente y si la obra es profesional
    const meta = await pool.query(
      `SELECT f.id, f.fecha, f.estado,
              COALESCE(o.es_profesional, FALSE) AS es_profesional,
              g.id AS grupo_id
         FROM funciones f
         LEFT JOIN obras o ON o.id = f.obra_id
         LEFT JOIN grupos g ON g.id = o.grupo_id
        WHERE f.id = $1
        LIMIT 1`,
      [funcionId]
    );

    if (meta.rows.length === 0) {
      return res.json({ total: 0, vendedores: [] });
    }

    const row = meta.rows[0];
    const esPublica = row.fecha >= new Date();
    if (!esPublica) {
      return res.json({ total: 0, vendedores: [] });
    }

    // Si es profesional: retornar solo boletería
    if (row.es_profesional) {
      const v = [{ nombre: BOLETERIA_NOMBRE, contacto_publico: BOLETERIA_PHONE }]
        .filter(x => x.contacto_publico);
      return res.json({ total: v.length, vendedores: v });
    }

    // Caso común: actores con tickets asignados + agregar boletería al final
    const result = await pool.query(
      `SELECT DISTINCT
          u.name AS nombre,
          u.phone AS contacto_publico
        FROM funciones f
        JOIN obras o ON o.id = f.obra_id
        JOIN grupos g ON g.id = o.grupo_id
        JOIN grupo_miembros gm
          ON gm.grupo_id = g.id
         AND gm.activo = TRUE
         AND gm.rol_en_grupo = 'ACTOR'
        JOIN users u
          ON u.cedula = gm.miembro_cedula
         AND u.active = TRUE
         AND u.role IN ('ACTOR')
        WHERE f.id = $1
          AND EXISTS (
            SELECT 1
            FROM tickets t
            WHERE t.funcion_id = f.id
              AND t.vendedor_phone = u.phone
              AND t.estado <> 'ANULADO'
            LIMIT 1
          )
        ORDER BY u.name ASC`,
      [funcionId]
    );

    const vendedoresActores = result.rows
      .map(v => ({ nombre: v.nombre, contacto_publico: v.contacto_publico || null }))
      .filter(v => v.contacto_publico);

    // Agregar boletería como opción extra
    const boleteria = BOLETERIA_PHONE ? [{ nombre: BOLETERIA_NOMBRE, contacto_publico: BOLETERIA_PHONE }] : [];
    const vendedores = [...vendedoresActores, ...boleteria];

    res.json({ total: vendedores.length, vendedores });
  } catch (error) {
    console.error('Error al listar vendedores públicos por función:', error);
    res.status(500).json({ error: 'Error al listar vendedores públicos' });
  }
}
