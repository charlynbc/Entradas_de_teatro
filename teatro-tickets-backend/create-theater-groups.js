import pool from './db/postgres.js';

async function createTheaterGroups() {
  try {
    console.log('🎭 Creando grupos teatrales de prueba...\n');
    
    // 1. Crear directores adicionales
    const directores = [
      { cedula: '11111111', nombre: 'Horacio', apellido: 'Nieves' },
      { cedula: '22222222', nombre: 'Rosa', apellido: 'Quintero' },
      { cedula: '33333333', nombre: 'Carlos', apellido: 'Lara' },
      { cedula: '44444444', nombre: 'María', apellido: 'González' }
    ];
    
    for (const d of directores) {
      await pool.query(`
        INSERT INTO usuarios (cedula, rol, nombre, apellido, fecha_nacimiento, celular, password_hash)
        VALUES ($1, 'director', $2, $3, '1980-01-15', '099000000',
                '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e')
        ON CONFLICT (cedula) DO NOTHING
      `, [d.cedula, d.nombre, d.apellido]);
      console.log(`✅ Director creado: ${d.nombre} ${d.apellido}`);
    }
    
    // 2. Crear actores
    const actores = [
      { cedula: '55555555', nombre: 'Ana', apellido: 'Martínez' },
      { cedula: '66666666', nombre: 'Luis', apellido: 'Rodríguez' },
      { cedula: '77777777', nombre: 'Sofía', apellido: 'López' },
      { cedula: '88888888', nombre: 'Diego', apellido: 'Pérez' },
      { cedula: '99999999', nombre: 'Lucía', apellido: 'García' }
    ];
    
    for (const a of actores) {
      await pool.query(`
        INSERT INTO usuarios (cedula, rol, nombre, apellido, fecha_nacimiento, celular, password_hash)
        VALUES ($1, 'actor', $2, $3, '1995-05-20', '099111111',
                '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e')
        ON CONFLICT (cedula) DO NOTHING
      `, [a.cedula, a.nombre, a.apellido]);
      console.log(`✅ Actor creado: ${a.nombre} ${a.apellido}`);
    }
    
    console.log('\n🎭 Creando grupos teatrales...\n');
    
    // 3. Crear grupos con directores diferentes
    const gruposData = [
      { nombre: 'La Candela', director_cedula: '11111111', obra: 'Romeo y Julieta' },
      { nombre: 'Los Trágicos', director_cedula: '22222222', obra: 'Hamlet' },
      { nombre: 'Etapas', director_cedula: '33333333', obra: 'La Casa de Bernarda Alba' },
      { nombre: 'Máscaras Teatro', director_cedula: '44444444', obra: 'Don Juan Tenorio' },
      { nombre: 'Baco Teatro', director_cedula: '12345678', obra: 'La Vida es Sueño' }
    ];
    
    const grupoIds = [];
    for (const g of gruposData) {
      try {
        const result = await pool.query(`
          INSERT INTO grupos (nombre, director_cedula)
          VALUES ($1, $2)
          RETURNING id
        `, [g.nombre, g.director_cedula]);
        
        const grupoId = result.rows[0].id;
        grupoIds.push({ id: grupoId, nombre: g.nombre, obra: g.obra });
        console.log(`✅ Grupo creado: ${g.nombre} (ID: ${grupoId})`);
      } catch (e) {
        console.log(`⚠️  Grupo ${g.nombre} ya existe`);
      }
    }
    
    // 4. Agregar actores a grupos (relación grupo_integrantes)
    for (const grupo of grupoIds) {
      for (let i = 0; i < actores.length; i++) {
        try {
          await pool.query(`
            INSERT INTO grupo_integrantes (grupo_id, miembro_cedula, rol_en_grupo)
            VALUES ($1, $2, 'ACTOR')
            ON CONFLICT DO NOTHING
          `, [grupo.id, actores[i].cedula]);
        } catch (e) {
          // Ignorar duplicados
        }
      }
      console.log(`✅ ${actores.length} actores agregados a ${grupo.nombre}`);
    }
    
    // 5. Crear funciones para cada grupo (distribuidas en el mes)
    console.log('\n🎪 Creando funciones...\n');
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (const grupo of grupoIds) {
      // 3-4 funciones por grupo
      for (let i = 0; i < 4; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + (i * 3) + Math.floor(Math.random() * 2));
        
        const hora = ['19:00', '20:00', '20:30', '21:00'][Math.floor(Math.random() * 4)];
        const sala = ['Sala Principal', 'Sala Intimista', 'Teatro del Fondo', 'Sala de Cámara'][
          Math.floor(Math.random() * 4)
        ];
        const precio = [250, 300, 350, 400][Math.floor(Math.random() * 4)];
        
        try {
          await pool.query(`
            INSERT INTO funciones (grupo_id, fecha, hora, lugar, precio_entrada)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            grupo.id,
            fecha.toISOString().split('T')[0],
            hora,
            sala,
            precio
          ]);
        } catch (e) {
          // Ignorar duplicados
        }
      }
      console.log(`✅ 4 funciones creadas para ${grupo.nombre}`);
    }
    
    // 6. Mostrar resumen
    console.log('\n📊 RESUMEN DE DATOS CREADOS:\n');
    
    const usuariosCount = await pool.query('SELECT COUNT(*) FROM usuarios');
    const gruposCount = await pool.query('SELECT COUNT(*) FROM grupos');
    const integrantesCount = await pool.query('SELECT COUNT(*) FROM grupo_integrantes');
    const funcionesCount = await pool.query('SELECT COUNT(*) FROM funciones');
    
    console.log(`👥 Usuarios: ${usuariosCount.rows[0].count}`);
    console.log(`🎭 Grupos: ${gruposCount.rows[0].count}`);
    console.log(`🎪 Integrantes: ${integrantesCount.rows[0].count}`);
    console.log(`🎬 Funciones: ${funcionesCount.rows[0].count}`);
    
    // 7. Mostrar próximas funciones
    const proximasFunciones = await pool.query(`
      SELECT 
        g.nombre as grupo,
        f.fecha,
        f.hora,
        f.lugar,
        f.precio_entrada
      FROM funciones f
      JOIN grupos g ON g.id = f.grupo_id
      WHERE f.fecha >= CURRENT_DATE
      ORDER BY f.fecha, f.hora
      LIMIT 10
    `);
    
    console.log('\n🎭 Próximas funciones:');
    console.log('─'.repeat(80));
    proximasFunciones.rows.forEach(f => {
      const fecha = new Date(f.fecha);
      console.log(`${fecha.toLocaleDateString('es-UY')} ${f.hora} | ${f.lugar} | $${f.precio_entrada} | ${f.grupo}`);
    });
    
    console.log('\n✅ Grupos teatrales de prueba creados correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createTheaterGroups();
