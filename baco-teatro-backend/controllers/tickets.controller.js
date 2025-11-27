import { db } from "../db.js";
import QRCode from "qrcode";

export async function listarTicketsPorShow(req, res) {
  const showId = req.params.id;
  const user = req.user;

  try {
    let r;
    if (user.role === "ADMIN") {
      r = await db.query(
        `SELECT * FROM tickets WHERE show_id=$1 ORDER BY code`,
        [showId]
      );
    } else {
      r = await db.query(
        `SELECT * FROM tickets WHERE show_id=$1 AND vendedor_phone=$2 ORDER BY code`,
        [showId, user.phone]
      );
    }
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando tickets" });
  }
}

export async function reservarTicket(req, res) {
  const { code } = req.params;
  const { compradorNombre, compradorContacto } = req.body;
  const vendedorPhone = req.user.phone;

  try {
    const t = await db.query(`SELECT * FROM tickets WHERE code=$1`, [code]);
    if (!t.rows[0]) return res.status(404).json({ error: "No existe" });

    if (t.rows[0].vendedor_phone !== vendedorPhone)
      return res.status(403).json({ error: "No te pertenece" });

    if (t.rows[0].estado !== "STOCK_VENDEDOR")
      return res.status(400).json({ error: "Debe estar en STOCK_VENDEDOR" });

    await db.query(
      `UPDATE tickets SET 
         estado='RESERVADO',
         comprador_nombre=$1,
         comprador_contacto=$2,
         reservado_at=NOW()
       WHERE code=$3`,
      [compradorNombre, compradorContacto, code]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reservando ticket" });
  }
}

export async function reportarVenta(req, res) {
  const { code } = req.params;
  const vendedorPhone = req.user.phone;

  try {
    const t = await db.query(`SELECT * FROM tickets WHERE code=$1`, [code]);
    if (!t.rows[0]) return res.status(404).json({ error: "No existe" });

    if (t.rows[0].vendedor_phone !== vendedorPhone)
      return res.status(403).json({ error: "No te pertenece" });

    if (t.rows[0].estado !== "RESERVADO")
      return res.status(400).json({ error: "Debe estar RESERVADO" });

    await db.query(
      `UPDATE tickets SET 
         estado='REPORTADA_VENDIDA',
         reportada_por_vendedor=TRUE,
         reportada_at=NOW()
       WHERE code=$1`,
      [code]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reportando venta" });
  }
}

export async function aprobarVentaAdmin(req, res) {
  const { code } = req.params;
  const { medioPago, precio } = req.body;

  try {
    await db.query(
      `UPDATE tickets SET 
         estado='PAGADO',
         aprobada_por_admin=TRUE,
         medio_pago=$1,
         precio=$2,
         pagado_at=NOW()
       WHERE code=$3`,
      [medioPago, precio, code]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error aprobando venta" });
  }
}

export async function validarTicket(req, res) {
  const { code } = req.params;

  try {
    const t = await db.query(`SELECT * FROM tickets WHERE code=$1`, [code]);
    if (!t.rows[0]) return res.status(404).json({ error: "No existe" });

    if (t.rows[0].estado !== "PAGADO")
      return res.status(400).json({ error: "Ticket no está pagado" });

    await db.query(
      `UPDATE tickets SET estado='USADO', usado_at=NOW() WHERE code=$1`,
      [code]
    );

    res.json({ ok: true, mensaje: "Entrada válida" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error validando ticket" });
  }
}

export async function obtenerQR(req, res) {
  const { code } = req.params;

  try {
    const t = await db.query(`SELECT * FROM tickets WHERE code=$1`, [code]);
    if (!t.rows[0]) return res.status(404).json({ error: "No existe" });

    const url = `https://baco-teatro.com/validate/${code}`;
    const dataUrl = await QRCode.toDataURL(url);

    res.json({ code, qr: dataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando QR" });
  }
}
