#!/usr/bin/env node
/**
 * Script simple para insertar función de prueba
 */
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/teatro'
});

async function insertarFuncionPrueba() {
  const client = await pool.connect();
  
  try {
    console.log('🎭 Insertando función de prueba...\n');
    
    // Obtener o crear grupo
    let grupoId;
    const grupo = await client.query('SELECT id FROM grupos LIMIT 1');
    
    if (grupo.rows.length === 0) {
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 6); // 6 meses después
      
      const nuevoGrupo = await client.query(`
        INSERT INTO grupos (
          nombre, descripcion, director_cedula, 
          dia_semana, hora_inicio, 
          fecha_inicio, fecha_fin, 
          obra_a_realizar, estado
        )
        VALUES (
          'Baco Teatro', 
          'Grupo principal de teatro independiente', 
          '48376667', 
          'Sábado', 
          '20:00', 
          $1, 
          $2, 
          'Hamlet', 
          'ACTIVO'
        )
        RETURNING id
      `, [fechaInicio, fechaFin]);
      grupoId = nuevoGrupo.rows[0].id;
      console.log(`✅ Grupo creado: ${grupoId}`);
    } else {
      grupoId = grupo.rows[0].id;
      console.log(`✅ Usando grupo existente: ${grupoId}`);
    }
    
    // Crear obra
    const obra = await client.query(`
      INSERT INTO obras (nombre, descripcion, grupo_id, estado, duracion_aprox, autor, genero)
      VALUES ('Hamlet - Ensayo Abierto', 'Función de prueba abierta al público', $1, 'LISTA', 90, 'William Shakespeare', 'Tragedia')
      RETURNING id
    `, [grupoId]);
    const obraId = obra.rows[0].id;
    console.log(`✅ Obra creada: ${obraId} - Hamlet`);
    
    // Crear función para mañana a las 20:00
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(20, 0, 0, 0);
    
    const funcion = await client.query(`
      INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
      VALUES ($1, $2, 'Teatro La Candela - Sala Principal', 50, 300, 'PROGRAMADA')
      RETURNING id
    `, [obraId, manana]);
    
    const funcionId = funcion.rows[0].id;
    console.log(`✅ Función creada: ${funcionId}`);
    console.log(`   📅 Fecha: ${manana.toLocaleString('es-UY')}`);
    console.log(`   🏛️  Lugar: Teatro La Candela`);
    console.log(`   💰 Precio: $300`);
    
    // Crear función adicional en 7 días
    const semana = new Date();
    semana.setDate(semana.getDate() + 7);
    semana.setHours(21, 0, 0, 0);
    
    const funcion2 = await client.query(`
      INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
      VALUES ($1, $2, 'Teatro Victoria - Sala Grande', 80, 500, 'PROGRAMADA')
      RETURNING id
    `, [obraId, semana]);
    
    const funcionId2 = funcion2.rows[0].id;
    console.log(`✅ Función creada: ${funcionId2}`);
    console.log(`   📅 Fecha: ${semana.toLocaleString('es-UY')}`);
    console.log(`   🏛️  Lugar: Teatro Victoria`);
    console.log(`   💰 Precio: $500`);
    
    // Crear entradas para ambas funciones
    console.log('\n🎫 Creando entradas...');
    
    const funciones = [
      { id: funcionId, capacidad: 50, precio: 300 },
      { id: funcionId2, capacidad: 80, precio: 500 }
    ];
    
    let totalEntradas = 0;
    for (const func of funciones) {
      for (let i = 1; i <= func.capacidad; i++) {
        const code = `E-${func.id}-${String(i).padStart(4, '0')}`;
        const qrToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        await client.query(`
          INSERT INTO entradas_v2 (code, funcion_id, estado, precio, qr_token, creador_cedula)
          VALUES ($1, $2, 'sin_asignar', $3, $4, '48376667')
        `, [code, func.id, func.precio, qrToken]);
        
        totalEntradas++;
      }
      console.log(`   ✅ ${func.capacidad} entradas para función ${func.id}`);
    }
    
    console.log(`\n✅ Total: ${totalEntradas} entradas creadas`);
    console.log('\n🎉 ¡Datos insertados exitosamente!');
    console.log('\n📍 Ahora podés ver las funciones en:');
    console.log('   http://localhost:3000/proximas-funciones.html\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertarFuncionPrueba();
