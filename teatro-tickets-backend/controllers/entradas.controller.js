import { query } from '../db/postgres.js';

/**
 * Crear reserva (invitado o vendedor)
 */
export async function crearReserva(req, res) {
  try {
    const { funcion_id, comprador_nombre, comprador_contacto, cantidad } = req.body;
    
    if (!funcion_id || !comprador_nombre || !cantidad) {
      return res.status(400).json({ 
        error: 'funcion_id, comprador_nombre y cantidad son obligatorios' 
      });
    }
    
    // Obtener entradas disponibles de la función
    const disponiblesResult = await query(
      `SELECT * FROM entradas 
       WHERE funcion_id = $1 AND estado = 'DISPONIBLE'
       LIMIT $2`,
      [funcion_id, cantidad]
    );
    
    if (disponiblesResult.rows.length < cantidad) {
      return res.status(400).json({
        error: `Solo hay ${disponiblesResult.rows.length} entradas disponibles`
      });
    }
    
    // Reservar entradas
    const codes = disponiblesResult.rows.map(e => e.code);
    await query(
      `UPDATE entradas 
       SET estado = 'RESERVADA',
           comprador_nombre = $1,
           comprador_contacto = $2,
           reservada_at = NOW()
       WHERE code = ANY($3)`,
      [comprador_nombre, comprador_contacto || '', codes]
    );
    
    res.json({
      ok: true,
      mensaje: `${codes.length} entradas reservadas`,
      entradas_reservadas: codes
    });
  } catch (error) {
    console.error('Error creando reserva:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Quitar reserva (vendedor puede liberar entradas reservadas de su stock)
 */
export async function quitarReserva(req, res) {
  try {
    const { code } = req.params;
    
    // Obtener entrada
    const entradaResult = await query(
      'SELECT * FROM entradas WHERE code = $1',
      [code]
    );
    
    if (entradaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }
    
    const entrada = entradaResult.rows[0];
    
    // Si es vendedor, solo puede quitar reservas de su propio stock
    if (req.user.role === 'VENDEDOR') {
      if (entrada.cedula_vendedor !== req.user.id) {
        return res.status(403).json({ 
          error: 'Solo puedes gestionar reservas de tus propias entradas' 
        });
      }
      
      if (entrada.estado !== 'RESERVADA') {
        return res.status(400).json({ error: 'Esta entrada no está reservada' });
      }
      
      // Liberar entrada pero mantenerla en stock del vendedor
      await query(
        `UPDATE entradas 
         SET estado = 'EN_STOCK',
             comprador_nombre = NULL,
             comprador_contacto = NULL,
             reservada_at = NULL
         WHERE code = $1`,
        [code]
      );
    } else {
      // ADMIN o SUPER pueden liberar cualquier reserva
      await query(
        `UPDATE entradas 
         SET estado = 'DISPONIBLE',
             cedula_vendedor = NULL,
             comprador_nombre = NULL,
             comprador_contacto = NULL,
             reservada_at = NULL,
             asignada_at = NULL
         WHERE code = $1`,
        [code]
      );
    }
    
    res.json({
      ok: true,
      mensaje: 'Reserva eliminada correctamente'
    });
  } catch (error) {
    console.error('Error quitando reserva:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Listar entradas del vendedor
 */
export async function misEntradas(req, res) {
  try {
    const cedula = req.user.id;
    
    const result = await query(
      `SELECT 
        e.*,
        f.fecha as funcion_fecha,
        f.lugar as funcion_lugar,
        f.precio_base,
        o.nombre as obra_nombre
       FROM entradas e
       JOIN funciones f ON e.funcion_id = f.id
       JOIN obras o ON f.obra_id = o.id
       WHERE e.cedula_vendedor = $1
       ORDER BY f.fecha ASC, e.estado ASC`,
      [cedula]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Reportar venta de entrada
 */
export async function reportarVenta(req, res) {
  try {
    const { code } = req.params;
    const { precio } = req.body;
    
    const entradaResult = await query(
      'SELECT * FROM entradas WHERE code = $1',
      [code]
    );
    
    if (entradaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }
    
    const entrada = entradaResult.rows[0];
    
    // Verificar que sea el vendedor propietario
    if (req.user.role === 'VENDEDOR' && entrada.cedula_vendedor !== req.user.id) {
      return res.status(403).json({ error: 'Esta entrada no te pertenece' });
    }
    
    if (!['EN_STOCK', 'RESERVADA'].includes(entrada.estado)) {
      return res.status(400).json({ error: 'Esta entrada no puede ser vendida' });
    }
    
    await query(
      `UPDATE entradas 
       SET estado = 'VENDIDA',
           precio = $1,
           vendida_at = NOW()
       WHERE code = $2`,
      [precio || entrada.precio, code]
    );
    
    res.json({
      ok: true,
      mensaje: 'Venta reportada exitosamente'
    });
  } catch (error) {
    console.error('Error reportando venta:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Validar entrada (escanear QR en puerta)
 */
export async function validarEntrada(req, res) {
  try {
    const { code } = req.params;
    
    const entradaResult = await query(
      `SELECT 
        e.*,
        f.fecha as funcion_fecha,
        f.lugar as funcion_lugar,
        o.nombre as obra_nombre
       FROM entradas e
       JOIN funciones f ON e.funcion_id = f.id
       JOIN obras o ON f.obra_id = o.id
       WHERE e.code = $1`,
      [code]
    );
    
    if (entradaResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false,
        error: 'Entrada no encontrada' 
      });
    }
    
    const entrada = entradaResult.rows[0];
    
    if (entrada.estado === 'USADA') {
      return res.status(400).json({
        ok: false,
        error: 'Esta entrada ya fue utilizada',
        entrada
      });
    }
    
    if (!['VENDIDA', 'PAGADA'].includes(entrada.estado)) {
      return res.status(400).json({
        ok: false,
        error: 'Esta entrada no ha sido pagada',
        entrada
      });
    }
    
    // Marcar como usada
    await query(
      `UPDATE entradas 
       SET estado = 'USADA', usada_at = NOW()
       WHERE code = $1`,
      [code]
    );
    
    res.json({
      ok: true,
      mensaje: '✅ Entrada válida',
      entrada: {
        ...entrada,
        estado: 'USADA'
      }
    });
  } catch (error) {
    console.error('Error validando entrada:', error);
    res.status(500).json({ error: error.message });
  }
}
