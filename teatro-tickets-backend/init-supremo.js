/**
 * Inicialización de usuario SUPER
 * Verifica o crea el usuario supremo en la base de datos
 */

import pool from './db/postgres.js';
import { logger } from './utils/logger.js';

export async function initSupremo() {
  try {
    const client = await pool.connect();
    
    try {
      // Buscar usuario SUPER existente
      const result = await client.query(
        `SELECT cedula FROM users WHERE role = 'SUPER' LIMIT 1`
      );
      
      if (result.rows.length > 0) {
        logger.info('Usuario SUPER ya existe:', result.rows[0].cedula);
        return;
      }
      
      // Crear usuario SUPER si no existe
      const supremoCedula = '48376669';
      const supremoName = 'Super Usuario';
      
      // Usar contraseña hasheada por defecto
      const passwordHash = 'hashedPassword_Teamomama91';
      
      await client.query(
        `INSERT INTO users (cedula, name, password_hash, role, genero, active, created_at)
         VALUES ($1, $2, $3, 'SUPER', 'otro', true, NOW())
         ON CONFLICT (cedula) DO NOTHING`,
        [supremoCedula, supremoName, passwordHash]
      );
      
      logger.success('Usuario SUPER creado/verificado correctamente');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.warn('Error en initSupremo (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
