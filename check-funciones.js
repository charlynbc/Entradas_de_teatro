import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function checkFunciones() {
  try {
    // Verificar funciones futuras
    const funciones = await pool.query(`
      SELECT f.id, f.fecha, o.nombre as obra 
      FROM funciones f 
      LEFT JOIN obras o ON f.obra_id = o.id 
      WHERE f.fecha >= NOW() 
      ORDER BY f.fecha ASC 
      LIMIT 5
    `);
    
    console.log('=== Funciones futuras ===');
    console.log('Total:', funciones.rows.length);
    console.log(funciones.rows);
    
    // Probar el endpoint directamente con la query del controller
    const BOLETERIA_PHONE = '099999999';
    const BOLETERIA_NOMBRE = 'Boletería BACO';
    
    const result = await pool.query(
      `SELECT 
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
          (SELECT COUNT(*) FROM entradas_v2 t WHERE t.funcion_id = f.id AND t.estado IN ('sin_asignar', 'asignada')) AS entradas_disponibles,
          $1 AS boleteria_contacto,
          $2 AS boleteria_nombre
       FROM funciones f
       LEFT JOIN obras o ON o.id = f.obra_id
       LEFT JOIN grupos g ON g.id = o.grupo_id
       WHERE f.fecha >= NOW()
       ORDER BY f.fecha ASC`,
      [BOLETERIA_PHONE, BOLETERIA_NOMBRE]
     );
    
    console.log('\n=== Query del controller ===');
    console.log('Total:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkFunciones();
