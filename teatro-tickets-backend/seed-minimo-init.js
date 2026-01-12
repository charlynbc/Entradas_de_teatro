/**
 * Seed minimalista - Datos iniciales básicos
 * Asegura que existan las tablas y datos mínimos necesarios
 * Incluye usuarios demo para testing
 */

import pool from './db/postgres.js';
import { logger } from './utils/logger.js';
import { hashPassword } from './config/auth.js';

export async function seedMinimo() {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // ====================================
      // USUARIOS DEMO
      // ====================================
      
      // 1. Usuario SUPER (Dios del sistema)
      const supCountRes = await client.query(`SELECT COUNT(*) as count FROM users WHERE role = 'SUPER'`);
      if (Number(supCountRes.rows[0].count) === 0) {
        const supPassword = await hashPassword('Teamomama91');
        await client.query(
          `INSERT INTO users (cedula, name, password_hash, role, genero, active, phone, created_at)
           VALUES ('48376669', 'Super Baco', $1, 'SUPER', 'otro', true, '48376669', NOW())
           ON CONFLICT (cedula) DO NOTHING`,
          [supPassword]
        );
        logger.info('✅ Usuario SUPER creado: 48376669 / Teamomama91');
      } else {
        logger.info('✅ Usuario SUPER ya existe: 48376669');
      }

      // 2. Usuario ADMIN/Director demo
      const dirPassword = await hashPassword('1234');
      await client.query(
        `INSERT INTO users (cedula, name, password_hash, role, genero, active, phone, created_at)
         VALUES ('48376667', 'Director Demo', $1, 'ADMIN', 'masculino', true, '48376667', NOW())
         ON CONFLICT (cedula) DO NOTHING`,
        [dirPassword]
      );
      logger.info('✅ Usuario ADMIN (Director) creado: 48376667 / 1234');

      // 3. Usuario ACTOR demo
      await client.query(
        `INSERT INTO users (cedula, name, password_hash, role, genero, active, phone, created_at)
         VALUES ('48376668', 'Actor Demo', $1, 'ACTOR', 'masculino', true, '48376668', NOW())
         ON CONFLICT (cedula) DO NOTHING`,
        [dirPassword]
      );
      logger.info('✅ Usuario ACTOR creado: 48376668 / 1234');

      // 4. Usuario ACTRIZ demo
      await client.query(
        `INSERT INTO users (cedula, name, password_hash, role, genero, active, phone, created_at)
         VALUES ('48376666', 'Actriz Demo', $1, 'ACTOR', 'femenino', true, '48376666', NOW())
         ON CONFLICT (cedula) DO NOTHING`,
        [dirPassword]
      );
      logger.info('✅ Usuario ACTRIZ creado: 48376666 / 1234');

      // ====================================
      // NOTA: Grupo y funciones demo omitidos
      // El schema actual tiene restricciones NOT NULL que requieren
      // columnas específicas (dia_semana, hora_inicio, etc.)
      // Los usuarios pueden crear grupos desde el dashboard
      // ====================================

      await client.query('COMMIT');
      logger.info('✅ Seed mínimo completado correctamente');
      logger.info('ℹ️  Usuarios disponibles:');
      logger.info('   - SUPER: 48376669 / Teamomama91');
      logger.info('   - Director: 48376667 / 1234');
      logger.info('   - Actor: 48376668 / 1234');
      logger.info('   - Actriz: 48376666 / 1234');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.warn('Error en seedMinimo (no crítico):', error.message);
    // No propagamos el error para no detener el servidor
  }
}
