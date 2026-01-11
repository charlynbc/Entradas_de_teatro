#!/usr/bin/env node
/**
 * Seed demo público: 1 grupo, 1 obra, 2 funciones (hoy y futura)
 */
import pool from '../db/postgres.js';

function isoAt(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().slice(0,19).replace('T',' ');
}

function isoFuture(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString().slice(0,19).replace('T',' ');
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('⏳ Seed demo público...');
    await client.query('BEGIN');

    // Director para el grupo (preferir ADMIN, sino SUPER)
    const dirRes = await client.query(`SELECT cedula FROM users WHERE role IN ('ADMIN','SUPER') ORDER BY role = 'ADMIN' DESC LIMIT 1`);
    const directorCedula = dirRes.rows[0]?.cedula || '48376669';

    // Grupo
    // Buscar grupo por nombre
    const gFind = await client.query(`SELECT id FROM grupos WHERE nombre = $1 LIMIT 1`, ['Grupo Demo Público']);
    let grupoId;
    if (gFind.rows.length) {
      grupoId = gFind.rows[0].id;
    } else {
      const fechaInicio = new Date().toISOString().slice(0,10);
      const fechaFin = new Date(Date.now()+1000*60*60*24*180).toISOString().slice(0,10);
      const gIns = await client.query(
        `INSERT INTO grupos (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, estado, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO', NOW()) RETURNING id`,
        ['Grupo Demo Público', 'Grupo para demo pública', directorCedula, 'viernes', '20:00', fechaInicio, fechaFin]
      );
      grupoId = gIns.rows[0].id;
    }

    // Obra
    const oFind = await client.query(`SELECT id FROM obras WHERE grupo_id = $1 AND nombre = $2 LIMIT 1`, [grupoId, 'Obra Demostración']);
    let obraId;
    if (oFind.rows.length) {
      obraId = oFind.rows[0].id;
    } else {
      const oIns = await client.query(
        `INSERT INTO obras (grupo_id, nombre, descripcion, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [grupoId, 'Obra Demostración', 'Obra de ejemplo para la cartelera pública']
      );
      obraId = oIns.rows[0].id;
    }

    // Función hoy (si ya pasó la hora elegida, poner +1h)
    const now = new Date();
    const hour = now.getHours() < 20 ? 20 : now.getHours() + 1;
    const fechaHoy = isoAt(hour);

    // Verificar existencia por fecha exacta
    const f1Exists = await client.query(
      `SELECT id FROM funciones WHERE obra_id = $1 AND fecha = $2 LIMIT 1`,
      [obraId, fechaHoy]
    );
    if (f1Exists.rows.length === 0) {
      await client.query(
        `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado, created_at)
         VALUES ($1, $2, $3, $4, $5, 'PROGRAMADA', NOW())`,
        [obraId, fechaHoy, 'Sala Principal', 80, 0]
      );
      console.log('✅ Función de hoy creada');
    } else {
      console.log('ℹ️  Función de hoy ya existía');
    }

    // Función futura (3 días)
    const fechaFutura = isoFuture(3, 20);
    const f2Exists = await client.query(
      `SELECT id FROM funciones WHERE obra_id = $1 AND fecha = $2 LIMIT 1`,
      [obraId, fechaFutura]
    );
    if (f2Exists.rows.length === 0) {
      await client.query(
        `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado, created_at)
         VALUES ($1, $2, $3, $4, $5, 'PROGRAMADA', NOW())`,
        [obraId, fechaFutura, 'Sala Alternativa', 100, 0]
      );
      console.log('✅ Función futura creada');
    } else {
      console.log('ℹ️  Función futura ya existía');
    }

    await client.query('COMMIT');
    console.log('🎉 Seed demo completado');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed demo:', e.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
