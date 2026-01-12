/**
 * Seed minimalista - Datos iniciales básicos
 * Asegura que existan las tablas y datos mínimos necesarios
 */

import pool from './db/postgres.js';
import { logger } from './utils/logger.js';
import { hashPassword } from './config/auth.js';

export async function seedMinimo() {
  try {
    const client = await pool.connect();
    
    try {
      // Asegurar SOLO el usuario SUPER (Dios del sistema)
      // Es el ÚNICO usuario que viene por defecto
      const supCountRes = await client.query(`SELECT COUNT(*) as count FROM users WHERE role = 'SUPER'`);

      if (Number(supCountRes.rows[0].count) === 0) {
        const supPassword = await hashPassword('Teamomama91');
        await client.query(
          `INSERT INTO users (cedula, name, password_hash, role, genero, active, phone, created_at)
           VALUES ('48376669', 'Super Baco', $1, 'SUPER', 'otro', true, '48376669', NOW())
           ON CONFLICT (cedula) DO NOTHING`,
          [supPassword]
        );
        logger.info('✅ Usuario SUPER creado: 48376669 (Dios del sistema)');
      } else {
        logger.info('✅ Usuario SUPER ya existe: 48376669');
      }

      logger.info('Seed mínimo verificado/aplicado');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.warn('Error en seedMinimo (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
