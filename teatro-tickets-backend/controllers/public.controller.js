import pool from '../db/postgres.js';

/**
 * Cartelera pública para invitados (sin autenticación)
 * GET /public/funciones
 */
export async function listarFuncionesInvitado(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        f.id,
        f.fecha,
        f.lugar AS sala,
        f.precio_base AS precio,
        o.nombre AS obra_nombre,
        g.nombre AS grupo_nombre,
        CASE
          WHEN COUNT(t.code) = 0 THEN 'Disponible'
          WHEN (COUNT(t.code) FILTER (WHERE t.estado IN ('DISPONIBLE', 'STOCK_ACTOR'))) > 0 THEN 'Disponible'
          ELSE 'Agotada'
        END AS estado
      FROM funciones f
      JOIN obras o ON o.id = f.obra_id
      JOIN grupos g ON g.id = o.grupo_id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      WHERE f.estado IN ('PROGRAMADA', 'CONFIRMADA')
        AND f.fecha >= DATE_TRUNC('day', NOW())
      GROUP BY f.id, f.fecha, f.lugar, f.precio_base, o.nombre, g.nombre
      ORDER BY f.fecha ASC`
    );

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

    // Solo permitir cartelera pública (misma regla que funciones públicas)
    const funcionRes = await pool.query(
      `SELECT f.id
       FROM funciones f
       WHERE f.id = $1
         AND f.estado IN ('PROGRAMADA', 'CONFIRMADA')
         AND f.fecha >= DATE_TRUNC('day', NOW())
       LIMIT 1`,
      [funcionId]
    );
    if (funcionRes.rows.length === 0) {
      return res.json({ total: 0, vendedores: [] });
    }

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
         AND u.role = 'ACTOR'
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

    // Sanitizar: si no hay contacto, no lo devolvemos
    const vendedores = result.rows
      .map(v => ({
        nombre: v.nombre,
        contacto_publico: v.contacto_publico || null
      }))
      .filter(v => v.contacto_publico);

    res.json({ total: vendedores.length, vendedores });
  } catch (error) {
    console.error('Error al listar vendedores públicos por función:', error);
    res.status(500).json({ error: 'Error al listar vendedores públicos' });
  }
}
