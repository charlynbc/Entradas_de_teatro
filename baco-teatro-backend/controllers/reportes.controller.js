import { db } from "../db.js";

export async function ventasPorVendedor(req, res) {
  const showId = req.params.id;

  try {
    const r = await db.query(
      `SELECT 
         vendedor_phone,
         COUNT(*) FILTER (WHERE estado='STOCK_VENDEDOR') AS para_vender,
         COUNT(*) FILTER (WHERE estado='RESERVADO') AS reservadas,
         COUNT(*) FILTER (WHERE estado='REPORTADA_VENDIDA') AS reportadas,
         COUNT(*) FILTER (WHERE estado='PAGADO') AS pagadas
       FROM tickets
       WHERE show_id=$1
       GROUP BY vendedor_phone`,
      [showId]
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en reporte" });
  }
}

export async function deudaActores(req, res) {
  const showId = req.params.id;

  try {
    const r = await db.query(
      `SELECT vendedor_phone,
         COUNT(*) AS entradas_reportadas,
         SUM(
           COALESCE(
             precio,
             (SELECT base_price FROM shows WHERE id=$1)
           )
         ) AS monto_reportado
       FROM tickets
       WHERE show_id=$1
         AND reportada_por_vendedor=TRUE
         AND aprobada_por_admin=FALSE
       GROUP BY vendedor_phone`,
      [showId]
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en deudas" });
  }
}

export async function resumenFuncion(req, res) {
  const showId = req.params.id;

  try {
    const r = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado='PAGADO') AS pagadas,
         COUNT(*) FILTER (WHERE estado='REPORTADA_VENDIDA') AS reportadas,
         COUNT(*) FILTER (WHERE estado='RESERVADO') AS reservadas,
         COUNT(*) FILTER (WHERE estado='STOCK_VENDEDOR') AS stock
       FROM tickets WHERE show_id=$1`,
      [showId]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en resumen" });
  }
}
