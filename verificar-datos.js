#!/usr/bin/env node
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function verificar() {
  try {
    const funciones = await pool.query(`
      SELECT f.id, f.fecha, o.nombre as obra, f.lugar, f.precio_base
      FROM funciones f
      LEFT JOIN obras o ON f.obra_id = o.id
      WHERE f.fecha >= NOW()
      ORDER BY f.fecha ASC
    `);
    
    console.log('\n=== FUNCIONES FUTURAS ===');
    console.log('Total:', funciones.rows.length);
    console.log('Datos:', JSON.stringify(funciones.rows, null, 2));
    
    // Probar el endpoint query
    const endpoint = await pool.query(`
      SELECT 
          f.id,
          f.fecha AS fecha,
          to_char(f.fecha, 'HH24:MI') AS hora,
          COALESCE(f.lugar, '') AS sala,
          COALESCE(f.precio_base, 0) AS precio,
          COALESCE(o.nombre, 'Baco Teatro') AS obra_nombre,
          COALESCE(o.descripcion, '') AS descripcion,
          g.nombre AS grupo_nombre,
          FALSE AS es_profesional,
          'INDEPENDIENTE' AS tipo_funcion,
          FALSE AS permite_compra_online,
          COALESCE(f.estado, 'PROGRAMADA') AS estado,
          (SELECT COUNT(*) FROM entradas_v2 t WHERE t.funcion_id = f.id AND t.estado IN ('sin_asignar', 'asignada')) AS entradas_disponibles
       FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       LEFT JOIN grupos g ON g.id = o.grupo_id
       WHERE f.fecha >= NOW()
       ORDER BY f.fecha ASC
    `);
    
    console.log('\n=== QUERY DEL ENDPOINT ===');
    console.log('Total:', endpoint.rows.length);
    console.log('Datos:', JSON.stringify(endpoint.rows, null, 2));
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificar();
