import { db } from "../db.js";

export async function crearUsuario(req, res) {
  const { userPhone, role } = req.body;

  try {
    await db.query(
      `INSERT INTO users(phone, role) VALUES($1,$2)
       ON CONFLICT (phone) DO UPDATE SET role=EXCLUDED.role`,
      [userPhone, role]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando usuario" });
  }
}
