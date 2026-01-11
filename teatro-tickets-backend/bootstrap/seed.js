/**
 * Bootstrap: Seed de datos mínimos
 * Extrae la lógica de inserción de datos iniciales
 */

import { seedMinimo } from '../seed-minimo-init.js';
import { logger } from '../utils/logger.js';

export async function initSeed() {
  try {
    logger.info('Aplicando seed de datos mínimos...');
    await seedMinimo();
    logger.success('Seed aplicado correctamente');
  } catch (error) {
    // No es crítico - el sistema puede arrancar sin esto
    logger.warn('Error aplicando seed (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
