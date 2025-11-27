import { db } from "../db.js";
import { comparePassword, hashPassword, generateToken } from "../config/auth.js";

export async function login(req, res) {
  const { phone, password } = req.body;

  try {
    const r = await db.query(`SELECT * FROM users WHERE phone=$1`, [phone]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ error: "Usuario no existe" });

    if (!user.password_hash)
      return res.status(400).json({ error: "Debe completar registro" });

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Clave incorrecta" });

    const token = generateToken({
      phone: user.phone,
      role: user.role,
      name: user.name
    });

    res.json({
      token,
      user: {
        phone: user.phone,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
}

export async function completarRegistro(req, res) {
  const { phone, name, password } = req.body;
  try {
    const hash = await hashPassword(password);
    await db.query(
      `UPDATE users SET name=$1, password_hash=$2 WHERE phone=$3`,
      [name, hash, phone]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error completando registro" });
  }
}
