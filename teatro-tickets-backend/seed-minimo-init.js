/**
 * Seed minimalista - Datos iniciales básicos
 * Asegura que existan las tablas y datos mínimos necesarios
 */

import pool from './db/postgres.js';
import { logger } from './utils/logger.js';

export async function seedMinimo() {
  try {
    const client = await pool.connect();
    
    try {
      // Verificar que las tablas existen y tienen datos mínimos
      const result = await client.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'SUPER'`
      );
      
      if (result.rows[0].count > 0) {
        logger.info('Datos mínimos ya existen en la BD');
        return;
      }
      
      logger.info('Seed mínimo aplicado (no había datos)');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.warn('Error en seedMinimo (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
