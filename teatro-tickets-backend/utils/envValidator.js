/**
 * Validación de variables de entorno requeridas
 * Evita que el servidor arranque con configuración incompleta
 */

import { logger } from '../utils/logger.js';

/**
 * Valida que todas las variables de entorno críticas estén presentes
 * @throws {Error} Si falta alguna variable requerida
 */
export function validateEnvironment() {
  const requiredEnv = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  const missing = requiredEnv.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Faltan variables de entorno requeridas:');
    missing.forEach(key => logger.error(`  - ${key}`));
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  logger.success('Variables de entorno validadas correctamente');
}

/**
 * Valida variables opcionales pero recomendadas
 * No lanza error, solo advierte
 */
export function validateOptionalEnvironment() {
  const optionalEnv = {
    'NODE_ENV': 'development',
    'PORT': '3000',
    'FRONTEND_URL': 'http://localhost:3000'
  };

  Object.entries(optionalEnv).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      logger.warn(`Variable ${key} no configurada, usando valor por defecto: ${defaultValue}`);
    }
  });
}
