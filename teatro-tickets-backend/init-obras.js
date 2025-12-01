import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const obras = [
  {
    titulo: 'La Casa de Bernarda Alba',
    descripcion: 'Drama intenso de Federico García Lorca que explora temas de represión, deseo y tradición en la España rural. Dirigida por Gustavo Bouzas.',
    fecha: '2025-12-15',
    hora: '20:30',
    lugar: 'Teatro Stella',
    precio: 800,
    capacidad: 150,
    vendidas: 0
  },
  {
    titulo: 'El Enfermo Imaginario',
    descripcion: 'Comedia clásica de Molière que satiriza la hipocondría y la profesión médica del siglo XVII. Dirección de Horacio Nieves.',
    fecha: '2025-12-20',
    hora: '21:00',
    lugar: 'Teatro Circular',
    precio: 750,
    capacidad: 120,
    vendidas: 0
  },
  {
    titulo: 'Esperando a Godot',
    descripcion: 'Obra maestra del teatro del absurdo de Samuel Beckett. Una reflexión existencial sobre la espera y el sentido de la vida. Producción de Baco Teatro.',
    fecha: '2025-12-28',
    hora: '19:30',
    lugar: 'Teatro El Galpón',
    precio: 900,
    capacidad: 200,
    vendidas: 0
  }
];

async function cargarObras() {
  const client = await pool.connect();
  
  try {
    console.log('🎭 Iniciando carga de obras...');
    
    for (const obra of obras) {
      // Verificar si ya existe una obra con el mismo título y fecha
      const checkQuery = `
        SELECT id FROM shows 
        WHERE titulo = $1 AND fecha = $2
      `;
      const existing = await client.query(checkQuery, [obra.titulo, obra.fecha]);
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  Obra "${obra.titulo}" ya existe, omitiendo...`);
        continue;
      }
      
      // Insertar nueva obra
      const insertQuery = `
        INSERT INTO shows (titulo, descripcion, fecha, hora, lugar, precio, capacidad, vendidas)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, titulo
      `;
      
      const result = await client.query(insertQuery, [
        obra.titulo,
        obra.descripcion,
        obra.fecha,
        obra.hora,
        obra.lugar,
        obra.precio,
        obra.capacidad,
        obra.vendidas
      ]);
      
      console.log(`✅ Obra "${result.rows[0].titulo}" cargada con ID: ${result.rows[0].id}`);
    }
    
    console.log('🎉 Carga de obras completada!');
    
  } catch (error) {
    console.error('❌ Error cargando obras:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

export default cargarObras;
