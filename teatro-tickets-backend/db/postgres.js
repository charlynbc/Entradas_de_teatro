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
    console.log('🔄 Verificando conexión a base de datos...');
    
    // Solo verificar que la base de datos esté disponible
    // El schema debe aplicarse manualmente usando schema.sql
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'shows', 'tickets')
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Advertencia: No se encontraron tablas. Por favor aplique schema.sql manualmente.');
      return;
    }
    
    console.log(`✅ Base de datos lista. Tablas encontradas: ${result.rows.map(r => r.table_name).join(', ')}`);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Exportar pool para uso directo si es necesario
export default pool;
