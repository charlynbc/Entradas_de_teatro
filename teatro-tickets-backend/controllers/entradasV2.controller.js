import { query } from '../db/postgres.js';
import { logger } from '../utils/logger.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const ESTADOS = {
  SIN_ASIGNAR: 'sin_asignar',
  ASIGNADA: 'asignada',
  RESERVADA: 'reservada',
  PRONTA: 'pronta',
  PAGADA: 'pagada',
  UTILIZADA: 'utilizada',
  NO_VENDIDA: 'no_vendida',
  PERDONADA: 'perdonada'
};

function generarQrToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function generarCodigoEntrada(funcionId) {
  const result = await query('SELECT COUNT(*) AS total FROM entradas_v2 WHERE funcion_id = $1', [String(funcionId)]);
  const total = parseInt(result.rows[0]?.total || '0', 10) + 1;
  return `E-${funcionId}-${total.toString().padStart(4, '0')}`;
}

async function ensureQrToken(entrada) {
  if (entrada.qr_token) return entrada.qr_token;
  const nuevo = generarQrToken();
  try {
    const res = await query('UPDATE entradas_v2 SET qr_token = $1 WHERE id = $2 RETURNING qr_token', [nuevo, entrada.id]);
    const actualizado = res.rows[0]?.qr_token || nuevo;
    entrada.qr_token = actualizado;
    return actualizado;
  } catch (error) {
    logger.warn(`No se pudo asegurar qr_token para entrada ${entrada.id}: ${error.message}`);
    return nuevo;
  }
}

async function logCambio({ entradaId, estadoAnterior, estadoNuevo, accion, detalle, ejecutadoPor, actorCedula }) {
  try {
    await query(
      `INSERT INTO entradas_v2_logs (entrada_id, estado_anterior, estado_nuevo, accion, detalle, ejecutado_por, actor_cedula)
       VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
      [entradaId, estadoAnterior, estadoNuevo, accion, detalle || null, ejecutadoPor || null, actorCedula || null]
    );
  } catch (error) {
    logger.warn(`No se pudo registrar log de entrada ${entradaId}: ${error.message}`);
  }
}

function esCreadorOSuper(user, entrada) {
  if (!user) return false;
  if (user.role === 'SUPER') return true;
  return entrada.creador_cedula && entrada.creador_cedula === user.cedula;
}

function puedeOperarEntrada(user, entrada) {
  if (!user) return false;
  if (user.role === 'SUPER') return true;
  if (entrada.creador_cedula && entrada.creador_cedula === user.cedula) return true;
  return entrada.actor_cedula && entrada.actor_cedula === user.cedula;
}

function requireEstado(actual, esperado) {
  if (!Array.isArray(esperado)) {
    return actual === esperado;
  }
  return esperado.includes(actual);
}

export async function generarEntradasFuncion(req, res) {
  try {
    const { funcionId } = req.params;
    const { cantidad, precio } = req.body;
    const qty = parseInt(cantidad || '0', 10);
    if (!funcionId || !qty || qty <= 0) {
      return res.status(400).json({ error: 'funcionId y cantidad son obligatorios' });
    }

    const funcionRes = await query('SELECT id, precio_base, grupo_id, capacidad FROM funciones WHERE id = $1', [String(funcionId)]);
    if (funcionRes.rows.length === 0) return res.status(404).json({ error: 'Función no encontrada' });
    const precioBase = precio ?? funcionRes.rows[0].precio_base ?? 0;

    const countRes = await query('SELECT COUNT(*) AS total FROM entradas_v2 WHERE funcion_id = $1', [String(funcionId)]);
    const existentes = parseInt(countRes.rows[0]?.total || '0', 10);
    if (funcionRes.rows[0].capacidad && existentes + qty > Number(funcionRes.rows[0].capacidad)) {
      return res.status(400).json({ error: 'La cantidad supera la capacidad de la función', capacidad_disponible: Number(funcionRes.rows[0].capacidad) - existentes });
    }

    const entradas = [];
    for (let i = 0; i < qty; i++) {
      const code = await generarCodigoEntrada(funcionId);
      entradas.push([code, funcionId, req.user?.cedula || null, precioBase, generarQrToken()]);
    }

    const placeholders = entradas.map((_, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`).join(',');
    await query(
      `INSERT INTO entradas_v2 (code, funcion_id, creador_cedula, precio, qr_token)
       VALUES ${placeholders}`,
      entradas.flat()
    );

    res.status(201).json({ message: 'Entradas generadas', cantidad: qty });
  } catch (error) {
    logger.error(`Error generando entradas: ${error.message}`);
    res.status(500).json({ error: 'Error generando entradas' });
  }
}

export async function listarEntradas(req, res) {
  try {
    const { actor_cedula, funcion_id } = req.query;
    const params = [];
    const filtros = [];
    if (actor_cedula) { filtros.push(`e.actor_cedula = $${filtros.length + 1}`); params.push(actor_cedula); }
    if (funcion_id) { filtros.push(`e.funcion_id = $${filtros.length + 1}`); params.push(funcion_id); }

    const result = await query(
      `SELECT e.*, f.fecha, f.lugar, f.obra_id, o.nombre AS obra_nombre
       FROM entradas_v2 e
       JOIN funciones f ON f.id = e.funcion_id
       LEFT JOIN obras o ON o.id = f.obra_id
       ${filtros.length ? 'WHERE ' + filtros.join(' AND ') : ''}
       ORDER BY e.funcion_id ASC, e.id ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    logger.error(`Error listando entradas: ${error.message}`);
    res.status(500).json({ error: 'Error listando entradas' });
  }
}

async function obtenerEntrada(code) {
  const result = await query(
    `SELECT e.*, f.fecha, f.lugar, f.obra_id, o.nombre AS obra_nombre
     FROM entradas_v2 e
     JOIN funciones f ON f.id = e.funcion_id
     LEFT JOIN obras o ON o.id = f.obra_id
     WHERE e.code = $1`,
    [String(code)]
  );
  return result.rows[0] || null;
}

export async function asignarActor(req, res) {
  try {
    const { code } = req.params;
    const { actor_cedula } = req.body;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!esCreadorOSuper(req.user, entrada)) return res.status(403).json({ error: 'Solo el creador o super pueden asignar' });
    if (!actor_cedula) return res.status(400).json({ error: 'actor_cedula requerido' });
    const actorExiste = await query('SELECT role FROM users WHERE cedula = $1', [actor_cedula]);
    if (actorExiste.rows.length === 0 || !['ACTOR', 'DIRECTOR'].includes(actorExiste.rows[0].role)) {
      return res.status(400).json({ error: 'Vendedor no válido (solo actor/director)' });
    }
    if (!requireEstado(entrada.estado, ESTADOS.SIN_ASIGNAR)) return res.status(409).json({ error: 'Solo se puede asignar desde sin_asignar' });

    const update = await query(
      `UPDATE entradas_v2
       SET actor_cedula = $1, estado = $2, updated_at = NOW()
       WHERE code = $3 AND estado = $4
       RETURNING *`,
      [actor_cedula, ESTADOS.ASIGNADA, code, ESTADOS.SIN_ASIGNAR]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });

    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'asignar', ejecutadoPor: req.user?.cedula, actorCedula: actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error asignando actor: ${error.message}`);
    res.status(500).json({ error: 'Error asignando actor' });
  }
}

export async function reservarEntrada(req, res) {
  try {
    const { code } = req.params;
    const { nombre, telefono } = req.body;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (entrada.actor_cedula !== req.user.cedula) return res.status(403).json({ error: 'No puedes operar entradas de otro actor' });
    if (!requireEstado(entrada.estado, ESTADOS.ASIGNADA)) return res.status(409).json({ error: 'Solo se puede reservar desde asignada' });
    if (!nombre || !telefono) return res.status(400).json({ error: 'Nombre y teléfono son obligatorios' });

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, reservante_nombre = $2, reservante_telefono = $3, reservada_at = NOW(), updated_at = NOW()
       WHERE code = $4 AND estado = $5
       RETURNING *`,
      [ESTADOS.RESERVADA, nombre, telefono, code, ESTADOS.ASIGNADA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'reservar', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error reservando entrada: ${error.message}`);
    res.status(500).json({ error: 'Error reservando entrada' });
  }
}

export async function marcarPronta(req, res) {
  try {
    const { code } = req.params;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (entrada.actor_cedula !== req.user.cedula) return res.status(403).json({ error: 'No puedes operar entradas de otro actor' });
    if (!requireEstado(entrada.estado, ESTADOS.RESERVADA)) return res.status(409).json({ error: 'Solo se puede marcar pronta desde reservada' });

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, pronta_at = NOW(), updated_at = NOW()
       WHERE code = $2 AND estado = $3
       RETURNING *`,
      [ESTADOS.PRONTA, code, ESTADOS.RESERVADA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'pronta', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error marcando pronta: ${error.message}`);
    res.status(500).json({ error: 'Error marcando pronta' });
  }
}

export async function confirmarPago(req, res) {
  try {
    const { code } = req.params;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!esCreadorOSuper(req.user, entrada)) return res.status(403).json({ error: 'Solo el creador o super pueden confirmar pago' });
    if (!requireEstado(entrada.estado, ESTADOS.PRONTA)) return res.status(409).json({ error: 'Solo se puede pagar desde pronta' });

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, pagada_at = NOW(), updated_at = NOW()
       WHERE code = $2 AND estado = $3
       RETURNING *`,
      [ESTADOS.PAGADA, code, ESTADOS.PRONTA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'pagar', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error confirmando pago: ${error.message}`);
    res.status(500).json({ error: 'Error confirmando pago' });
  }
}

export async function marcarNoVendida(req, res) {
  try {
    const { code } = req.params;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!esCreadorOSuper(req.user, entrada)) return res.status(403).json({ error: 'Solo el creador o super pueden marcar no vendida' });
    if (!requireEstado(entrada.estado, [ESTADOS.ASIGNADA, ESTADOS.RESERVADA, ESTADOS.PRONTA])) {
      return res.status(409).json({ error: 'Solo se puede marcar no_vendida desde asignada/reservada/pronta' });
    }

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, no_vendida_at = NOW(), updated_at = NOW()
       WHERE code = $2 AND estado IN ($3, $4, $5)
       RETURNING *`,
      [ESTADOS.NO_VENDIDA, code, ESTADOS.ASIGNADA, ESTADOS.RESERVADA, ESTADOS.PRONTA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'no_vendida', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error marcando no vendida: ${error.message}`);
    res.status(500).json({ error: 'Error marcando no vendida' });
  }
}

export async function perdonarDeuda(req, res) {
  try {
    const { code } = req.params;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!esCreadorOSuper(req.user, entrada)) return res.status(403).json({ error: 'Solo el creador o super pueden perdonar deuda' });
    if (!requireEstado(entrada.estado, ESTADOS.NO_VENDIDA)) return res.status(409).json({ error: 'Solo se puede perdonar desde no_vendida' });

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, perdonada_at = NOW(), updated_at = NOW()
       WHERE code = $2 AND estado = $3
       RETURNING *`,
      [ESTADOS.PERDONADA, code, ESTADOS.NO_VENDIDA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'perdonar', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json(nueva);
  } catch (error) {
    logger.error(`Error perdonando deuda: ${error.message}`);
    res.status(500).json({ error: 'Error perdonando deuda' });
  }
}

export async function escanearEntrada(req, res) {
  try {
    const { code } = req.params;
    const { funcion_id, token } = req.body;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!esCreadorOSuper(req.user, entrada)) return res.status(403).json({ error: 'Solo el creador o super pueden escanear' });
    if (!funcion_id) return res.status(400).json({ error: 'Debes seleccionar la función activa para escanear' });
    if (String(funcion_id) !== String(entrada.funcion_id)) return res.status(400).json({ error: 'La entrada no pertenece a la función seleccionada' });
    if (token && entrada.qr_token && token !== entrada.qr_token) {
      return res.status(400).json({ error: 'QR inválido o alterado' });
    }
    if (!requireEstado(entrada.estado, ESTADOS.PAGADA)) return res.status(409).json({ error: 'Solo se pueden escanear entradas pagadas' });

    const update = await query(
      `UPDATE entradas_v2
       SET estado = $1, utilizada_at = NOW(), escaneada_por = $2, updated_at = NOW()
       WHERE code = $3 AND estado = $4
       RETURNING *`,
      [ESTADOS.UTILIZADA, req.user?.cedula || null, code, ESTADOS.PAGADA]
    );
    const nueva = update.rows[0];
    if (!nueva) return res.status(409).json({ error: 'Estado ya cambiado, reintente' });
    await logCambio({ entradaId: nueva.id, estadoAnterior: entrada.estado, estadoNuevo: nueva.estado, accion: 'escanear', ejecutadoPor: req.user?.cedula, actorCedula: entrada.actor_cedula });
    res.json({ message: 'Entrada válida', entrada: nueva });
  } catch (error) {
    logger.error(`Error escaneando entrada: ${error.message}`);
    res.status(500).json({ error: 'Error escaneando entrada' });
  }
}

export async function statsFuncion(req, res) {
  try {
    const { funcionId } = req.params;
    const result = await query('SELECT * FROM v_entradas_v2_funcion_stats WHERE funcion_id = $1', [String(funcionId)]);
    if (result.rows.length === 0) {
      return res.json({
        funcion_id: Number(funcionId),
        total_creadas: 0,
        pagadas: 0,
        utilizadas: 0,
        no_vendidas: 0,
        perdonadas: 0,
        efectivamente_vendidas: 0,
        total_real_funcion: 0
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(`Error obteniendo stats función: ${error.message}`);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
}

export async function statsActor(req, res) {
  try {
    const { actorCedula } = req.params;
    const result = await query('SELECT * FROM v_entradas_v2_actor_stats WHERE cedula = $1', [String(actorCedula)]);
    if (result.rows.length === 0) {
      return res.json({
        cedula: actorCedula,
        asignadas: 0,
        vendidas: 0,
        prontas: 0,
        no_vendidas: 0,
        perdonadas: 0,
        saldo_negativo: 0,
        deuda_perdonada: 0
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(`Error obteniendo stats actor: ${error.message}`);
    res.status(500).json({ error: 'Error obteniendo estadísticas de actor' });
  }
}

export async function generarPdfEntrada(req, res) {
  try {
    const { code } = req.params;
    const entrada = await obtenerEntrada(code);
    if (!entrada) return res.status(404).json({ error: 'Entrada no encontrada' });
    if (!puedeOperarEntrada(req.user, entrada)) {
      return res.status(403).json({ error: 'No tienes permiso para generar este PDF' });
    }

    const qrToken = await ensureQrToken(entrada);
    const vendedor = entrada.actor_cedula
      ? await query('SELECT name, apellido FROM users WHERE cedula = $1 LIMIT 1', [entrada.actor_cedula])
      : { rows: [] };
    const vendedorNombre = vendedor.rows[0]
      ? `${vendedor.rows[0].name || ''} ${vendedor.rows[0].apellido || ''}`.trim()
      : 'Vendedor asignado';

    const fecha = entrada.fecha ? new Date(entrada.fecha) : null;
    const fechaStr = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Fecha a confirmar';
    const horaStr = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
      : 'Hora a confirmar';

    const esValida = [ESTADOS.PAGADA, ESTADOS.UTILIZADA].includes(entrada.estado);
    const estadoLabel = esValida ? 'VÁLIDA' : 'NO VÁLIDA – PAGO NO CONFIRMADO';
    const estadoColor = esValida ? '#0f8a5f' : '#b00020';

    const qrPayload = JSON.stringify({ code: entrada.code, funcion_id: entrada.funcion_id, token: qrToken });
    const qrDataUrl = await QRCode.toDataURL(qrPayload);
    const qrBase64 = qrDataUrl.replace('data:image/png;base64,', '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${entrada.code}.pdf`);

    const doc = new PDFDocument({ size: 'A5', layout: 'portrait', margin: 26 });
    doc.pipe(res);

    // Fondo teatral simple
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0d0609');
    doc.fillColor('#f4d6a0').rect(16, 16, doc.page.width - 32, doc.page.height - 32).stroke('#c58b46');
    doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44).stroke('#3a1b12');

    // Encabezado
    doc.fillColor('#c58b46').fontSize(18).text('🎭 Entrada de Teatro', 30, 32, { align: 'left' });
    doc.fillColor('#f4d6a0').fontSize(12).text('BACO Teatro', 30, 52);
    doc.fillColor('#c58b46').fontSize(10).text(`Código ${entrada.code}`, 30, 68);

    // Estado destacado
    doc.roundedRect(doc.page.width - 170, 32, 140, 32, 6).fillOpacity(0.14).fill(estadoColor).fillOpacity(1);
    doc.fillColor(estadoColor).fontSize(11).font('Helvetica-Bold').text(estadoLabel, doc.page.width - 165, 42, { width: 130, align: 'center' });

    // Bloque principal
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a0f0a').text(entrada.obra_nombre || 'Obra', 30, 110, { width: doc.page.width - 60 });
    doc.font('Helvetica').fontSize(11).fillColor('#2f1a12');
    const precioStr = Number.isFinite(Number(entrada.precio)) ? `$ ${Number(entrada.precio).toFixed(0)}` : 'Sin precio definido';
    doc.text(`Función #${entrada.funcion_id}`, 30, 136);
    doc.text(`${fechaStr} • ${horaStr}`, 30, 152);
    doc.text(entrada.lugar || 'Sala a confirmar', 30, 168);
    doc.text(`Precio de referencia: ${precioStr}`, 30, 184);

    // Invitado y vendedor
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fillColor('#1a0f0a').text('Invitado', 30, 204);
    doc.font('Helvetica').fillColor('#2f1a12').text(entrada.reservante_nombre || 'Por confirmar', { continued: false });
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fillColor('#1a0f0a').text('Vendedor', 30);
    doc.font('Helvetica').fillColor('#2f1a12').text(vendedorNombre || 'Por confirmar');

    // QR + datos
    doc.image(qrBuffer, doc.page.width - 170, 120, { width: 120 });
    doc.rect(doc.page.width - 176, 114, 132, 132).stroke('#3a1b12');
    doc.font('Helvetica').fontSize(9).fillColor('#2f1a12').text('Escanear en puerta. Solo válida si el pago fue confirmado por dirección.', doc.page.width - 180, 256, { width: 140, align: 'center' });

    // Detalles adicionales
    const yBase = 250;
    doc.font('Helvetica-Bold').fillColor('#1a0f0a').text('Identificador', 30, yBase);
    doc.font('Helvetica').fillColor('#2f1a12').text(`${entrada.id} / ${entrada.code}`);
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fillColor('#1a0f0a').text('Política de puntualidad');
    doc.font('Helvetica').fillColor('#2f1a12').text('Una vez iniciada la función, el ingreso queda sujeto a disponibilidad y seguridad de sala.');
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fillColor('#1a0f0a').text('Contacto del teatro');
    doc.font('Helvetica').fillColor('#2f1a12').text('WhatsApp boletería: +598 000 000');

    // Marca de agua
    doc.rotate(-20, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.font('Helvetica-Bold').fontSize(42).fillColor('#f4d6a0').opacity(0.08);
    doc.text('BACO', doc.page.width / 2 - 60, doc.page.height / 2 - 30);
    doc.opacity(1).rotate(20, { origin: [doc.page.width / 2, doc.page.height / 2] });

    doc.end();
  } catch (error) {
    logger.error(`Error generando PDF de entrada: ${error.message}`);
    res.status(500).json({ error: 'No se pudo generar el PDF' });
  }
}
