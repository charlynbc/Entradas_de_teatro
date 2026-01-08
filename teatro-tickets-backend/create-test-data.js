import pool from './db/postgres.js';

async function createTestData() {
  try {
    console.log('🎭 Creando datos de prueba para Baco Teatro...');
    
    // 1. Crear usuario super
    await pool.query(`
      INSERT INTO usuarios (cedula, rol, nombre, apellido, fecha_nacimiento, celular, password_hash)
      VALUES ('48376669', 'super', 'Charly', 'Barrios', '1991-10-29', '099893748', 
              '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e')
      ON CONFLICT (cedula) DO NOTHING
    `);
    console.log('✅ Usuario super creado');
    
    // 2. Crear director
    await pool.query(`
      INSERT INTO usuarios (cedula, rol, nombre, apellido, fecha_nacimiento, celular, password_hash)
      VALUES ('12345678', 'director', 'Gustavo', 'Bouzas', '1970-05-15', '099111111',
              '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e')
      ON CONFLICT (cedula) DO NOTHING
    `);
    console.log('✅ Director creado');
    
    // 3. Crear grupo
    const grupo = await pool.query(`
      INSERT INTO grupos (nombre, director_cedula)
      VALUES ('Grupo de Teatro Baco', '12345678')
      RETURNING id
    `);
    const grupoId = grupo.rows[0].id;
    console.log('✅ Grupo creado:', grupoId);
    
    // 4. Crear obra (si no existe tabla "obras", usamos funciones directamente)
    // Verificar si existe tabla obras
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'obras'
      )
    `);
    
    let obraId;
    if (tableCheck.rows[0].exists) {
      const obra = await pool.query(`
        INSERT INTO obras (nombre, descripcion, autor, grupo_id, duracion_aprox)
        VALUES ('La Vida es Sueño', 'Clásico de Calderón', 'Calderón de la Barca', $1, 120)
        RETURNING id
      `, [grupoId]);
      obraId = obra.rows[0].id;
      console.log('✅ Obra creada:', obraId);
    }
    
    // 5. Crear funciones para hoy y próximos días
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    const pasadoMañana = new Date(hoy);
    pasadoMañana.setDate(pasadoMañana.getDate() + 2);
    
    // Función de hoy a las 20:00
    await pool.query(`
      INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada)
      VALUES ($1, $2, '20:00', 'Sala Principal', 300)
    `, [grupoId, hoy.toISOString().split('T')[0]]);
    
    // Función mañana a las 20:00
    await pool.query(`
      INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada)
      VALUES ($1, $2, '20:00', 'Sala Principal', 300)
    `, [grupoId, mañana.toISOString().split('T')[0]]);
    
    // Función pasado mañana a las 20:30
    await pool.query(`
      INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada)
      VALUES ($1, $2, '20:30', 'Sala Intimista', 250)
    `, [grupoId, pasadoMañana.toISOString().split('T')[0]]);
    
    // Función en 5 días
    const cincodias = new Date(hoy);
    cincodias.setDate(cincodias.getDate() + 5);
    await pool.query(`
      INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada)
      VALUES ($1, $2, '19:00', 'Sala Principal', 350)
    `, [grupoId, cincodias.toISOString().split('T')[0]]);
    
    console.log('✅ Funciones creadas');
    
    // 6. Verificar datos
    const funciones = await pool.query('SELECT COUNT(*) FROM funciones');
    console.log('📊 Total de funciones:', funciones.rows[0].count);
    
    const funcionesProximas = await pool.query(`
      SELECT f.id, f.fecha, f.hora, f.lugar, f.precio_entrada, g.nombre
      FROM funciones f
      JOIN grupos g ON g.id = f.grupo_id
      WHERE f.fecha >= CURRENT_DATE
      ORDER BY f.fecha, f.hora
      LIMIT 5
    `);
    
    console.log('🎭 Próximas funciones:');
    funcionesProximas.rows.forEach(f => {
      const fecha = new Date(f.fecha);
      console.log(`   - ${fecha.toLocaleDateString('es-UY')} a las ${f.hora} - ${f.lugar} - $${f.precio_entrada} (${f.nombre})`);
    });
    
    console.log('✅ Datos de prueba creados correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createTestData();
