/**
 * Bootstrap: Inicialización de usuario SUPER
 * Extrae la lógica de creación del usuario supremo
 */

import { initSupremo } from '../init-supremo.js';
import { logger } from '../utils/logger.js';

export async function initSuperUser() {
  try {
    logger.info('Verificando usuario SUPER...');
    await initSupremo();
    logger.success('Usuario SUPER verificado/creado');
  } catch (error) {
    // No es crítico - el sistema puede arrancar sin esto
    logger.warn('Error inicializando usuario SUPER (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
