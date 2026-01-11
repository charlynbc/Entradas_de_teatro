/**
 * Bootstrap: Inicialización de base de datos
 * Extrae la lógica de inicialización del servidor principal
 */

import { initializeDatabase } from '../db/postgres.js';
import { logger } from '../utils/logger.js';

export async function initDatabase() {
  try {
    logger.info('Inicializando base de datos PostgreSQL...');
    
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada. Configura la variable de entorno.');
    }
    
    logger.debug('DATABASE_URL detectada:', process.env.DATABASE_URL.substring(0, 30) + '...');
    
    // Inicializar schema de base de datos
    await initializeDatabase();
    
    logger.success('Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('Error al inicializar base de datos:', error.message);
    throw error;
  }
}
