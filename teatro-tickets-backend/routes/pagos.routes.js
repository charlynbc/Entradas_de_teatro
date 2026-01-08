import express from 'express';
import pool from '../db/postgres.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Crear preferencia de Mercado Pago y pre-registrar ticket RESERVADO
router.post('/mp/preference', authenticate, requireRole('SUPER', 'ADMIN'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { funcion_id, buyer_name, buyer_phone, price } = req.body || {};
    if (!funcion_id || !buyer_name || !buyer_phone) {
      return res.status(400).json({ error: 'funcion_id, buyer_name y buyer_phone son obligatorios' });
    }
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'Falta MP_ACCESS_TOKEN en el entorno' });
    }

    // Obtener datos de función
    const fx = await client.query(
      `SELECT f.id, f.fecha, f.lugar, f.precio_base, o.nombre AS obra_nombre
       FROM funciones f JOIN obras o ON o.id = f.obra_id
       WHERE f.id = $1`,
      [String(funcion_id)]
    );
    if (fx.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    const f = fx.rows[0];

    const unitPrice = Number(price ?? f.precio_base ?? 0);
    if (!(unitPrice > 0)) {
      return res.status(400).json({ error: 'Precio inválido' });
    }

    // Crear ticket RESERVADO para esta venta (boletería)
    const code = 'MP-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

    await client.query('BEGIN');
    await client.query("SELECT set_config('app.usuario', $1, true)", [String(req.user?.cedula || req.user?.id || 'boleteria')]);

    await client.query(
      `INSERT INTO tickets (code, funcion_id, estado, vendedor_phone, comprador_nombre, comprador_contacto, precio, medio_pago, reportada_por_vendedor, reportada_at, created_at)
       VALUES ($1, $2, 'RESERVADO', $3, $4, $5, $6, 'MP', TRUE, NOW(), NOW())`,
      [
        String(code),
        String(funcion_id),
        String(process.env.BOLETERIA_PHONE || process.env.BOLETERIA_CONTACTO || process.env.BOLETERIA_CEDULA || '99999999'),
        String(buyer_name),
        String(buyer_phone),
        unitPrice
      ]
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const body = {
      items: [
        {
          title: `${f.obra_nombre} – ${new Date(f.fecha).toLocaleDateString('es-UY')}`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'UYU'
        }
      ],
      external_reference: code,
      metadata: {
        ticket_code: code,
        funcion_id: String(funcion_id),
        buyer_name: String(buyer_name),
        buyer_phone: String(buyer_phone)
      },
      back_urls: {
        success: `${baseUrl}/pages/boleteria/index.html?status=success&code=${encodeURIComponent(code)}`,
        failure: `${baseUrl}/pages/boleteria/index.html?status=failure&code=${encodeURIComponent(code)}`,
        pending: `${baseUrl}/pages/boleteria/index.html?status=pending&code=${encodeURIComponent(code)}`
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/pagos/mp/webhook`
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!mpRes.ok) {
      const text = await mpRes.text();
      await client.query('ROLLBACK');
      return res.status(502).json({ error: 'Error creando preferencia', detail: text });
    }

    const pref = await mpRes.json();
    await client.query('COMMIT');
    res.json({ init_point: pref.init_point || pref.sandbox_init_point, preference_id: pref.id, ticket_code: code });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error creando preferencia MP:', error);
    res.status(500).json({ error: 'Error creando preferencia MP' });
  } finally {
    client.release();
  }
});

// Webhook de Mercado Pago: marcar ticket como PAGADO cuando el pago es aprobado
router.post('/mp/webhook', express.json(), async (req, res) => {
  try {
    const topic = req.query.topic || req.body.type;
    const id = req.query.id || req.body.data?.id || req.body?.id;
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return res.sendStatus(200);

    if (topic === 'payment' || req.body.type === 'payment') {
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (payRes.ok) {
        const pay = await payRes.json();
        const status = pay.status;
        const ext = pay.external_reference;
        if (status === 'approved' && ext) {
          await pool.query(
            `UPDATE tickets
             SET estado = 'PAGADO', pagado_at = NOW(), updated_at = NOW()
             WHERE code = $1 AND estado <> 'ANULADO'`,
            [String(ext)]
          );
        }
      }
    }
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook MP error:', e);
    res.sendStatus(200);
  }
});

export default router;
