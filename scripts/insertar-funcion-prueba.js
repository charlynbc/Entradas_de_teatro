#!/usr/bin/env node
/**
 * Script rápido para insertar funciones futuras de prueba
 */
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Verificando funciones futuras...');
    
    // Verificar si hay funciones futuras
    const check = await client.query(`
      SELECT COUNT(*) as total 
      FROM funciones 
      WHERE fecha >= NOW()
    `);
    
    const count = parseInt(check.rows[0].total);
    console.log(`Funciones futuras existentes: ${count}`);
    
    if (count === 0) {
      console.log('\nNo hay funciones futuras. Creando datos de prueba...');
      
      // Obtener o crear grupo
      let grupoId;
      const grupo = await client.query(`
        SELECT id FROM grupos LIMIT 1
      `);
      
      if (grupo.rows.length === 0) {
        // Crear grupo
        const nuevoGrupo = await client.query(`
          INSERT INTO grupos (nombre, descripcion, director_cedula, estado)
          VALUES ('Baco Teatro', 'Grupo principal', '48376667', 'ACTIVO')
          RETURNING id
        `);
        grupoId = nuevoGrupo.rows[0].id;
        console.log(`Grupo creado: ${grupoId}`);
      } else {
        grupoId = grupo.rows[0].id;
        console.log(`Usando grupo existente: ${grupoId}`);
      }
      
      // Crear obra
      const obra = await client.query(`
        INSERT INTO obras (nombre, descripcion, grupo_id, director_cedula, estado)
        VALUES ('Hamlet - Ensayo Abierto', 'Función de prueba', $1, '48376667', 'EN_PRODUCCION')
        RETURNING id
      `, [grupoId]);
      const obraId = obra.rows[0].id;
      console.log(`Obra creada: ${obraId}`);
      
      // Crear función para mañana
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      manana.setHours(20, 0, 0, 0);
      
      const funcion = await client.query(`
        INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
        VALUES ($1, $2, 'Teatro La Candela', 50, 300, 'PROGRAMADA')
        RETURNING id
      `, [obraId, manana]);
      
      const funcionId = funcion.rows[0].id;
      console.log(`Función creada: ${funcionId} para ${manana.toLocaleString()}`);
      
      // Crear entradas
      for (let i = 1; i <= 50; i++) {
        const code = `E-${funcionId}-${String(i).padStart(4, '0')}`;
        const qrToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        await client.query(`
          INSERT INTO entradas_v2 (code, funcion_id, estado, precio, qr_token, creador_cedula)
          VALUES ($1, $2, 'sin_asignar', 300, $3, '48376667')
        `, [code, funcionId, qrToken]);
      }
      console.log('50 entradas creadas');
      
      console.log('\n✅ Datos de prueba creados exitosamente');
    }
    
    // Mostrar funciones resultantes
    const funciones = await client.query(`
      SELECT 
        f.id, 
        f.fecha,
        o.nombre as obra,
        f.lugar,
        f.precio_base,
        COUNT(e.id) as total_entradas
      FROM funciones f
      LEFT JOIN obras o ON f.obra_id = o.id
      LEFT JOIN entradas_v2 e ON e.funcion_id = f.id
      WHERE f.fecha >= NOW()
      GROUP BY f.id, f.fecha, o.nombre, f.lugar, f.precio_base
      ORDER BY f.fecha ASC
    `);
    
    console.log('\n=== Funciones Próximas ===');
    funciones.rows.forEach(f => {
      console.log(`ID: ${f.id} | ${new Date(f.fecha).toLocaleString()} | ${f.obra} | ${f.lugar} | $${f.precio_base} | ${f.total_entradas} entradas`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
