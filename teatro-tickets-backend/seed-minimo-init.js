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
      // GRUPO DEMO
      // ====================================
      
      const grupoCheck = await client.query(`SELECT id FROM grupos WHERE nombre = 'Grupo Demo' LIMIT 1`);
      let grupoId;
      
      if (grupoCheck.rows.length === 0) {
        const grupoRes = await client.query(
          `INSERT INTO grupos (nombre, horario_fijo, director_cedula, obra_nombre, created_at)
           VALUES ('Grupo Demo', 'Lunes y Miércoles 19:00', '48376667', 'Obra Demo', NOW())
           RETURNING id`
        );
        grupoId = grupoRes.rows[0].id;
        logger.info(`✅ Grupo Demo creado con ID: ${grupoId}`);
      } else {
        grupoId = grupoCheck.rows[0].id;
        logger.info(`✅ Grupo Demo ya existe con ID: ${grupoId}`);
      }

      // ====================================
      // INTEGRANTES DEL GRUPO
      // ====================================
      
      // Agregar director al grupo
      await client.query(
        `INSERT INTO grupo_integrantes (grupo_id, usuario_cedula, rol_en_grupo, created_at)
         VALUES ($1, '48376667', 'DIRECTOR', NOW())
         ON CONFLICT (grupo_id, usuario_cedula) DO NOTHING`,
        [grupoId]
      );
      logger.info('✅ Director agregado al grupo');

      // Agregar actores al grupo
      await client.query(
        `INSERT INTO grupo_integrantes (grupo_id, usuario_cedula, rol_en_grupo, created_at)
         VALUES ($1, '48376668', 'ACTOR', NOW())
         ON CONFLICT (grupo_id, usuario_cedula) DO NOTHING`,
        [grupoId]
      );
      logger.info('✅ Actor agregado al grupo');

      await client.query(
        `INSERT INTO grupo_integrantes (grupo_id, usuario_cedula, rol_en_grupo, created_at)
         VALUES ($1, '48376666', 'ACTOR', NOW())
         ON CONFLICT (grupo_id, usuario_cedula) DO NOTHING`,
        [grupoId]
      );
      logger.info('✅ Actriz agregada al grupo');

      // ====================================
      // FUNCIONES DEMO (2 funciones: hoy y en 2 días)
      // ====================================
      
      const funcionesCheck = await client.query(
        `SELECT COUNT(*) as count FROM funciones WHERE grupo_id = $1`,
        [grupoId]
      );

      if (Number(funcionesCheck.rows[0].count) === 0) {
        // Función HOY a las 20:00
        const hoy = new Date();
        hoy.setHours(20, 0, 0, 0);
        const fechaHoy = hoy.toISOString();

        await client.query(
          `INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada, created_at)
           VALUES ($1, $2, '20:00', 'Teatro Demo', 500, NOW())`,
          [grupoId, fechaHoy]
        );
        logger.info(`✅ Función HOY creada: ${fechaHoy}`);

        // Función en 2 DÍAS a las 21:00
        const dosDias = new Date();
        dosDias.setDate(dosDias.getDate() + 2);
        dosDias.setHours(21, 0, 0, 0);
        const fechaDosDias = dosDias.toISOString();

        await client.query(
          `INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada, created_at)
           VALUES ($1, $2, '21:00', 'Teatro Demo', 500, NOW())`,
          [grupoId, fechaDosDias]
        );
        logger.info(`✅ Función en 2 DÍAS creada: ${fechaDosDias}`);
      } else {
        logger.info('✅ Funciones demo ya existen');
      }

      await client.query('COMMIT');
      logger.info('✅ Seed mínimo completado correctamente');
      
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
