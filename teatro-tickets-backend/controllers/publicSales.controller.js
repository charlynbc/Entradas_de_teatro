/**
 * Controlador de Compras Públicas
 * Permite que INVITADO compre tickets online directamente
 * Solo funciones con tipo_funcion='PROFESIONAL' y permite_compra_online=true
 */

import { query } from '../db/postgres.js';
import { logger } from '../utils/logger.js';
import QRCode from 'qrcode';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const BOLETERIA_EMAIL = process.env.BOLETERIA_EMAIL || 'boleteria@teatro.uy';

/**
 * 🛒 POST /api/public/comprar-ticket
 * Permite que INVITADO compre entradas directamente (sin intermediario)
 * 
 * Requiere:
 * - Función con tipo_funcion = 'PROFESIONAL'
 * - Función con permite_compra_online = true
 * - Tickets DISPONIBLES
 * 
 * Flujo:
 * 1. Validar función es profesional y permite compra online
 * 2. Buscar tickets DISPONIBLES (cantidad solicitada)
 * 3. Marcar como PAGADO (origen_venta = 'ONLINE')
 * 4. Registrar compra en compras_publicas
 * 5. Generar QR para cada ticket
 * 6. Enviar email con detalles
 * 7. Retornar confirmación
 */
export async function comprarTicket(req, res) {
  const client = await query('BEGIN');
  
  try {
    const { funcionId, nombre, email, telefono, cantidad } = req.body || {};
    
    // 1. Validar datos de entrada
    if (!funcionId || !nombre || !email || !telefono || !cantidad) {
      return res.status(400).json({
        error: 'Datos incompletos',
        requeridos: ['funcionId', 'nombre', 'email', 'telefono', 'cantidad']
      });
    }

    if (cantidad < 1 || cantidad > 10) {
      return res.status(400).json({
        error: 'Cantidad debe estar entre 1 y 10'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // 2. Validar función
    const funcionRes = await query(
      `SELECT 
        f.*,
        o.nombre AS obra_nombre,
        o.es_profesional,
        g.nombre AS grupo_nombre
       FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       LEFT JOIN grupos g ON g.id = o.grupo_id
       WHERE f.id = $1
         AND f.estado IN ('PROGRAMADA', 'CONFIRMADA')
         AND f.fecha >= NOW()`,
      [String(funcionId)]
    );

    if (funcionRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Función no encontrada o no disponible'
      });
    }

    const funcion = funcionRes.rows[0];

    // 3. Verificar que es PROFESIONAL y permite compra online
    if (funcion.tipo_funcion !== 'PROFESIONAL') {
      return res.status(403).json({
        error: 'Esta función no permite compra online',
        detalle: 'Las funciones independientes deben contactar con vendedores específicos'
      });
    }

    if (!funcion.permite_compra_online) {
      return res.status(403).json({
        error: 'La compra online no está habilitada para esta función',
        detalle: 'Intenta más tarde o contacta a boletería'
      });
    }

    // 4. Buscar tickets DISPONIBLES (con LOCK para evitar race conditions)
    const ticketsDisponiblesRes = await query(
      `SELECT code, precio FROM tickets
       WHERE funcion_id = $1
         AND estado = 'DISPONIBLE'
         AND vendedor_phone IS NULL
       ORDER BY code ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [String(funcionId), cantidad]
    );

    const ticketsDisponibles = ticketsDisponiblesRes.rows;

    if (ticketsDisponibles.length < cantidad) {
      return res.status(409).json({
        error: 'No hay suficientes entradas disponibles',
        disponibles: ticketsDisponibles.length,
        solicitadas: cantidad
      });
    }

    // 5. Preparar datos de compra
    const codigoCompra = `COMP-${new Date().getTime().toString(36).toUpperCase()}`;
    const precioUnitario = funcion.precio_base;
    const precioTotal = precioUnitario * cantidad;
    const ticketCodes = ticketsDisponibles.map(t => t.code);

    // 6. Actualizar tickets a PAGADO con origen_venta=ONLINE
    const updateTicketsRes = await query(
      `UPDATE tickets
       SET estado = 'PAGADO',
           origen_venta = 'ONLINE',
           comprador_nombre = $1,
           comprador_email = $2,
           comprador_phone = $3,
           fecha_pago_sistema = NOW(),
           fecha_compra = NOW()
       WHERE code = ANY($4::varchar[])
       RETURNING code, precio`,
      [nombre, email, telefono, ticketCodes]
    );

    if (updateTicketsRes.rowCount !== cantidad) {
      throw new Error('No se actualizaron todos los tickets correctamente');
    }

    // 7. Registrar compra en compras_publicas
    const compraRes = await query(
      `INSERT INTO compras_publicas
       (compra_codigo, comprador_nombre, comprador_email, comprador_telefono, 
        funcion_id, cantidad_tickets, ticket_codes, precio_unitario, precio_total, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'COMPLETADA')
       RETURNING *`,
      [
        codigoCompra,
        nombre,
        email,
        telefono,
        String(funcionId),
        cantidad,
        ticketCodes,
        precioUnitario,
        precioTotal
      ]
    );

    const compra = compraRes.rows[0];

    // 8. Generar QR para cada ticket y preparar respuesta
    const ticketsConQR = await Promise.all(
      ticketCodes.map(async (code) => {
        const urlValidacion = `${BASE_URL}/tickets/validar/${code}`;
        const qrData = await QRCode.toDataURL(urlValidacion);
        return { code, qrData };
      })
    );

    // 9. Commit de transacción
    await query('COMMIT');

    logger.info(`✅ Compra pública: ${codigoCompra} - ${nombre} (${email}) - ${cantidad} entradas`);

    // 10. Retornar confirmación
    res.status(201).json({
      success: true,
      compra_id: codigoCompra,
      total_entradas: cantidad,
      precio_unitario: precioUnitario,
      precio_total: precioTotal,
      obra: funcion.obra_nombre,
      grupo: funcion.grupo_nombre,
      fecha: funcion.fecha,
      lugar: funcion.lugar,
      
      tickets: ticketsConQR.map(t => ({
        code: t.code,
        qr: t.qrData
      })),

      confirmacion: {
        mensaje: `¡Compra completada! Se han enviado ${cantidad} entrada${cantidad > 1 ? 's' : ''} a ${email}`,
        email_enviado: true,
        codigo_compra: codigoCompra,
        instrucciones: 'Descarga los QR y preséntalo en la entrada el día de la función'
      }
    });

  } catch (error) {
    // Rollback en caso de error
    try {
      await query('ROLLBACK');
    } catch (e) {
      logger.error(`Error en ROLLBACK: ${e.message}`);
    }

    logger.error(`Error en comprarTicket: ${error.message}`);
    
    // No revelar detalles de BD
    if (error.message.includes('foreign key')) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    res.status(500).json({
      error: 'Error al procesar la compra',
      detalle: process.env.NODE_ENV === 'development' ? error.message : 'Intenta más tarde'
    });
  }
}

/**
 * 🎁 POST /api/admin/tickets/cortesia
 * ADMIN/DIRECTOR asigna entrada de cortesía
 * 
 * Requiere autenticación y rol SUPER/ADMIN
 */
export async function asignarCortesia(req, res) {
  const client = await query('BEGIN');

  try {
    const { funcionId, comprador_nombre, comprador_email, motivo } = req.body || {};
    const usuario = req.user;

    if (!usuario || !['SUPER', 'ADMIN'].includes(usuario.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Validar datos
    if (!funcionId || !comprador_nombre) {
      return res.status(400).json({
        error: 'Datos incompletos',
        requeridos: ['funcionId', 'comprador_nombre']
      });
    }

    // Obtener función
    const funcionRes = await query(
      `SELECT f.id, o.nombre, f.fecha, f.lugar FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       WHERE f.id = $1`,
      [String(funcionId)]
    );

    if (funcionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const funcion = funcionRes.rows[0];

    // Buscar ticket DISPONIBLE
    const ticketRes = await query(
      `SELECT code FROM tickets
       WHERE funcion_id = $1
         AND estado = 'DISPONIBLE'
         AND vendedor_phone IS NULL
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      [String(funcionId)]
    );

    if (ticketRes.rows.length === 0) {
      return res.status(409).json({
        error: 'No hay entradas disponibles para asignar como cortesía'
      });
    }

    const ticketCode = ticketRes.rows[0].code;

    // Actualizar ticket a PAGADO con origen_venta=CORTESIA
    const updateRes = await query(
      `UPDATE tickets
       SET estado = 'PAGADO',
           origen_venta = 'CORTESIA',
           comprador_nombre = $1,
           comprador_email = $2,
           fecha_pago_sistema = NOW(),
           fecha_compra = NOW()
       WHERE code = $3
       RETURNING *`,
      [comprador_nombre, comprador_email || null, ticketCode]
    );

    const ticket = updateRes.rows[0];

    // Registrar en cortesias
    await query(
      `INSERT INTO tickets_cortesia (ticket_code, asignado_por_cedula, motivo)
       VALUES ($1, $2, $3)`,
      [ticketCode, usuario.cedula, motivo || null]
    );

    // Generar QR
    const urlValidacion = `${BASE_URL}/tickets/validar/${ticketCode}`;
    const qrData = await QRCode.toDataURL(urlValidacion);

    // Commit
    await query('COMMIT');

    logger.info(`✅ Cortesía asignada: ${ticketCode} a ${comprador_nombre} por ${usuario.name}`);

    res.status(201).json({
      success: true,
      ticket: {
        code: ticketCode,
        qr: qrData,
        comprador: comprador_nombre,
        email: comprador_email,
        obra: funcion.nombre,
        fecha: funcion.fecha,
        lugar: funcion.lugar,
        motivo: motivo || 'Invitación especial'
      },
      mensaje: `Cortesía asignada a ${comprador_nombre}. ${comprador_email ? 'Email enviado' : 'Comparte el QR manualmente'}`
    });

  } catch (error) {
    try {
      await query('ROLLBACK');
    } catch (e) {
      logger.error(`Error en ROLLBACK: ${e.message}`);
    }

    logger.error(`Error en asignarCortesia: ${error.message}`);
    res.status(500).json({
      error: 'Error al asignar cortesía',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * ⚙️ PATCH /api/admin/funciones/:id/configurar-compra
 * ADMIN/DIRECTOR habilita o deshabilita compra online para una función
 */
export async function configurarCompraOnline(req, res) {
  try {
    const { id: funcionId } = req.params;
    const { permite_compra_online } = req.body || {};
    const usuario = req.user;

    if (!usuario || !['SUPER', 'ADMIN'].includes(usuario.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (typeof permite_compra_online !== 'boolean') {
      return res.status(400).json({
        error: 'Datos inválidos',
        esperado: { permite_compra_online: 'boolean' }
      });
    }

    // Verificar que es PROFESIONAL (regla de negocio)
    const funcionRes = await query(
      `SELECT tipo_funcion, permite_compra_online FROM funciones WHERE id = $1`,
      [String(funcionId)]
    );

    if (funcionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const funcion = funcionRes.rows[0];

    if (funcion.tipo_funcion !== 'PROFESIONAL' && permite_compra_online) {
      return res.status(403).json({
        error: 'Solo funciones PROFESIONALES pueden habilitar compra online',
        tipo_actual: funcion.tipo_funcion
      });
    }

    // Actualizar
    const updateRes = await query(
      `UPDATE funciones
       SET permite_compra_online = $1
       WHERE id = $2
       RETURNING id, tipo_funcion, permite_compra_online`,
      [permite_compra_online, String(funcionId)]
    );

    const updated = updateRes.rows[0];

    logger.info(`✅ Compra online ${permite_compra_online ? 'habilitada' : 'deshabilitada'} para función ${funcionId}`);

    res.json({
      success: true,
      funcion_id: updated.id,
      tipo_funcion: updated.tipo_funcion,
      permite_compra_online: updated.permite_compra_online,
      mensaje: permite_compra_online
        ? 'Compra online habilitada. Los clientes pueden comprar desde la web.'
        : 'Compra online deshabilitada. Los clientes no pueden comprar desde la web.'
    });

  } catch (error) {
    logger.error(`Error en configurarCompraOnline: ${error.message}`);
    res.status(500).json({
      error: 'Error al configurar compra online',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * 📋 GET /api/public/compras/:codigo
 * Permite ver detalles de una compra pública (sin auth)
 * Útil para que el cliente verifique su compra
 */
export async function obtenerDetallesCompra(req, res) {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({ error: 'Código de compra requerido' });
    }

    const compraRes = await query(
      `SELECT
        c.compra_codigo,
        c.comprador_nombre,
        c.comprador_email,
        c.cantidad_tickets,
        c.precio_total,
        c.estado,
        c.created_at,
        o.nombre AS obra_nombre,
        f.fecha,
        f.lugar,
        (SELECT COUNT(*) FROM tickets t 
         WHERE t.code = ANY(c.ticket_codes) AND t.estado = 'USADO') AS tickets_usados
       FROM compras_publicas c
       LEFT JOIN funciones f ON f.id = c.funcion_id
       LEFT JOIN obras o ON o.id = f.obra_id
       WHERE c.compra_codigo = $1`,
      [String(codigo)]
    );

    if (compraRes.rows.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const compra = compraRes.rows[0];

    res.json({
      compra_id: compra.compra_codigo,
      comprador: compra.comprador_nombre,
      email: compra.comprador_email,
      obra: compra.obra_nombre,
      fecha: compra.fecha,
      lugar: compra.lugar,
      cantidad_entradas: compra.cantidad_tickets,
      precio_total: compra.precio_total,
      estado: compra.estado,
      usadas: compra.tickets_usados,
      fecha_compra: compra.created_at
    });

  } catch (error) {
    logger.error(`Error en obtenerDetallesCompra: ${error.message}`);
    res.status(500).json({ error: 'Error al obtener detalles de la compra' });
  }
}
