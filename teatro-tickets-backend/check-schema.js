// Script temporal para verificar schema
import pool from './db/postgres.js';

async function checkSchema() {
  try {
    // Verificar columnas de funciones
    const funcColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'funciones'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Columnas de funciones ===');
    funcColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar si existe tabla obras
    const obrasExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'obras'
      )
    `);
    
    console.log('\n=== Tabla obras ===');
    console.log(`  Existe: ${obrasExists.rows[0].exists}`);
    
    if (obrasExists.rows[0].exists) {
      const obrasColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'obras'
        ORDER BY ordinal_position
      `);
      
      console.log('\n=== Columnas de obras ===');
      obrasColumns.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
    }
    
    // Contar registros
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM grupos) as grupos,
        (SELECT COUNT(*) FROM funciones) as funciones,
        (SELECT COUNT(*) FROM users) as users
    `);
    
    console.log('\n=== Conteo de registros ===');
    console.log(`  Grupos: ${counts.rows[0].grupos}`);
    console.log(`  Funciones: ${counts.rows[0].funciones}`);
    console.log(`  Users: ${counts.rows[0].users}`);
    
    // Probar query de listarFunciones
    console.log('\n=== Probando query de listarFunciones ===');
    try {
      const testQuery = await pool.query(`
        SELECT 
          f.*,
          o.id as obra_id,
          o.nombre as obra_nombre,
          g.id as grupo_id,
          g.nombre as grupo_nombre
        FROM funciones f
        JOIN obras o ON f.obra_id = o.id
        JOIN grupos g ON o.grupo_id = g.id
        LIMIT 1
      `);
      console.log('  ✅ Query funciona');
    } catch (error) {
      console.log('  ❌ Error en query:', error.message);
      
      // Probar query alternativa
      console.log('\n=== Probando query alternativa (sin obras) ===');
      try {
        const altQuery = await pool.query(`
          SELECT 
            f.*,
            g.id as grupo_id,
            g.nombre as grupo_nombre
          FROM funciones f
          JOIN grupos g ON f.grupo_id = g.id
          LIMIT 1
        `);
        console.log('  ✅ Query alternativa funciona');
        console.log('  Schema usa funciones.grupo_id directo (sin tabla obras)');
      } catch (error2) {
        console.log('  ❌ Query alternativa también falló:', error2.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
