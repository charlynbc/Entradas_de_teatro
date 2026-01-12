/**
 * Controlador unificado de reservas
 * Proporciona endpoints que funcionan con ambos sistemas
 */

import * as reservasService from '../services/reservasUnificadas.service.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/reservas/crear
 * Crea una reserva (detecta automáticamente el sistema)
 */
export async function crearReserva(req, res) {
  try {
    const { funcion_id, comprador_nombre, comprador_telefono } = req.body;
    const vendedorCedula = req.user.cedula;

    if (!funcion_id || !comprador_nombre || !comprador_telefono) {
      return res.status(400).json({
        error: 'Faltan datos: funcion_id, comprador_nombre, comprador_telefono'
      });
    }

    const resultado = await reservasService.reservarEntrada({
      funcionId: funcion_id,
      vendedorCedula,
      compradorNombre: comprador_nombre,
      compradorTelefono: comprador_telefono
    });

    if (!resultado.success) {
      return res.status(400).json({ error: resultado.error });
    }

    res.status(201).json({
      mensaje: 'Reserva creada exitosamente',
      entrada: resultado.entrada,
      sistema: resultado.sistema
    });
  } catch (error) {
    logger.error(`Error creando reserva: ${error.message}`);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
}

/**
 * GET /api/reservas/mis-entradas
 * Lista todas las entradas del vendedor (ambos sistemas)
 */
export async function misEntradas(req, res) {
  try {
    const vendedorCedula = req.user.cedula;
    const { funcion_id } = req.query;

    const resultado = await reservasService.listarEntradasVendedor(
      vendedorCedula,
      funcion_id ? parseInt(funcion_id) : null
    );

    res.json({
      entradas_v2: resultado.entradas_v2,
      tickets_legacy: resultado.tickets,
      total: resultado.total,
      mensaje: resultado.total === 0 
        ? 'No tienes entradas asignadas' 
        : `Tienes ${resultado.total} entradas asignadas`
    });
  } catch (error) {
    logger.error(`Error listando entradas: ${error.message}`);
    res.status(500).json({ error: 'Error al listar entradas' });
  }
}

/**
 * GET /api/reservas/estadisticas/:funcionId
 * Obtiene estadísticas de una función (unificado)
 */
export async function estadisticasFuncion(req, res) {
  try {
    const { funcionId } = req.params;
    
    if (!funcionId) {
      return res.status(400).json({ error: 'funcionId requerido' });
    }

    const estadisticas = await reservasService.obtenerEstadisticasFuncion(
      parseInt(funcionId)
    );

    res.json(estadisticas);
  } catch (error) {
    logger.error(`Error obteniendo estadísticas: ${error.message}`);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

/**
 * GET /api/reservas/sistema/:funcionId
 * Detecta qué sistema usa una función
 */
export async function detectarSistema(req, res) {
  try {
    const { funcionId } = req.params;
    const sistema = await reservasService.detectarSistemaFuncion(parseInt(funcionId));
    
    res.json({ 
      funcion_id: parseInt(funcionId),
      sistema,
      descripcion: sistema === 'entradas_v2' 
        ? 'Sistema nuevo con estados mejorados' 
        : 'Sistema legacy compatible'
    });
  } catch (error) {
    logger.error(`Error detectando sistema: ${error.message}`);
    res.status(500).json({ error: 'Error al detectar sistema' });
  }
}

export default {
  crearReserva,
  misEntradas,
  estadisticasFuncion,
  detectarSistema
};
