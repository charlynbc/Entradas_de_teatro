import { db } from "../db.js";
import { generateTicketCode } from "../utils/generateCode.js";

export async function listarShows(req, res) {
  try {
    const r = await db.query(`SELECT * FROM shows ORDER BY fecha ASC`);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando shows" });
  }
}

export async function crearShow(req, res) {
  const { obra, fecha, capacidad, base_price } = req.body;
  try {
    const r = await db.query(
      `INSERT INTO shows(obra, fecha, capacidad, base_price)
       VALUES($1,$2,$3,$4)
       RETURNING *`,
      [obra, fecha, capacidad, base_price]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando show" });
  }
}

export async function generarTickets(req, res) {
  const showId = req.params.id;
  const { cantidad } = req.body;

  try {
    const generated = [];

    for (let i = 0; i < cantidad; i++) {
      const code = generateTicketCode();
      const r = await db.query(
        `INSERT INTO tickets(code, show_id, estado)
         VALUES($1,$2,'DISPONIBLE')
         RETURNING *`,
        [code, showId]
      );
      generated.push(r.rows[0]);
    }

    res.json(generated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando tickets" });
  }
}

export async function asignarTickets(req, res) {
  const showId = req.params.id;
  const { vendedorPhone, cantidad } = req.body;

  try {
    const disponibles = await db.query(
      `SELECT code FROM tickets
       WHERE show_id=$1 AND estado='DISPONIBLE'
       LIMIT $2`,
      [showId, cantidad]
    );

    if (disponibles.rowCount < cantidad) {
      return res.status(400).json({ error: "No hay suficientes entradas" });
    }

    for (const t of disponibles.rows) {
      await db.query(
        `UPDATE tickets
         SET estado='STOCK_VENDEDOR', vendedor_phone=$1
         WHERE code=$2`,
        [vendedorPhone, t.code]
      );
    }

    res.json({ ok: true, asignados: disponibles.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error asignando tickets" });
  }
}
