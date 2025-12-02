import pg from 'pg';

const { Pool } = pg;

// Configuración del pool de PostgreSQL usando variable de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de PostgreSQL:', err);
});

// Helper para ejecutar queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutado:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', { text, error: error.message });
    throw error;
  }
}

// Helper para transacciones
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Inicializar schema de base de datos
export async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando schema de base de datos...');
    
    // Crear tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('supremo', 'admin', 'vendedor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de funciones/shows
    await query(`
      CREATE TABLE IF NOT EXISTS shows (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        fecha TIMESTAMP,
        precio DECIMAL(10, 2) DEFAULT 0,
        total_tickets INTEGER DEFAULT 0,
        creado_por VARCHAR(50) REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de tickets
    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(50) PRIMARY KEY,
        show_id VARCHAR(50) REFERENCES shows(id) ON DELETE CASCADE,
        qr_code TEXT UNIQUE NOT NULL,
        estado VARCHAR(20) NOT NULL CHECK (estado IN ('NO_ASIGNADO', 'EN_PODER', 'VENDIDA_NO_PAGADA', 'VENDIDA_PAGADA', 'USADA')),
        vendedor_id VARCHAR(50) REFERENCES users(id),
        precio_venta DECIMAL(10, 2),
        comprador_nombre VARCHAR(100),
        comprador_contacto VARCHAR(100),
        fecha_asignacion TIMESTAMP,
        fecha_venta TIMESTAMP,
        fecha_uso TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices para mejorar performance
    await query(`CREATE INDEX IF NOT EXISTS idx_tickets_show_id ON tickets(show_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tickets_vendedor_id ON tickets(vendedor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula)`);

    // Crear tabla de reportes de obras finalizadas
    await query(`
      CREATE TABLE IF NOT EXISTS reportes_obras (
        id SERIAL PRIMARY KEY,
        show_id VARCHAR(50) REFERENCES shows(id) ON DELETE CASCADE,
        nombre_obra VARCHAR(200) NOT NULL,
        fecha_show TIMESTAMP NOT NULL,
        fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        director_id VARCHAR(50) REFERENCES users(id),
        total_tickets INTEGER DEFAULT 0,
        tickets_vendidos INTEGER DEFAULT 0,
        tickets_usados INTEGER DEFAULT 0,
        ingresos_totales DECIMAL(10, 2) DEFAULT 0,
        datos_vendedores JSONB,
        datos_ventas JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_reportes_show_id ON reportes_obras(show_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reportes_director_id ON reportes_obras(director_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reportes_fecha_show ON reportes_obras(fecha_show)`);

    // Crear tabla de ensayos generales
    await query(`
      CREATE TABLE IF NOT EXISTS ensayos_generales (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        fecha TIMESTAMP NOT NULL,
        lugar VARCHAR(200) NOT NULL,
        descripcion TEXT,
        director_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        actores_ids JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_ensayos_director_id ON ensayos_generales(director_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ensayos_fecha ON ensayos_generales(fecha)`);

    console.log('✅ Schema de base de datos inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Exportar pool para uso directo si es necesario
export default pool;
