// db.js - Conexión a PostgreSQL con soporte para Render y desarrollo local
const { Pool } = require('pg');

// Configuración de conexión
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/baco_teatro',
  // Render requiere SSL en producción
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Configuración de pool
  max: 20, // máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de DB:', err);
  process.exit(-1);
});

// Función helper para queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Query ejecutada', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error);
    throw error;
  }
};

// Función para verificar conexión
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

// Función para inicializar la base de datos (crear tablas si no existen)
const initDB = async () => {
  try {
    // Verificar si existe la tabla users
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('⚠️  Tablas no encontradas. Ejecuta schema.sql primero:');
      console.log('   psql -d baco_teatro -f schema.sql');
      console.log('   o en Render: ejecuta el SQL en el dashboard');
    } else {
      console.log('✅ Tablas existentes detectadas');
    }
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
  }
};

// Cerrar pool (útil para tests)
const closePool = async () => {
  await pool.end();
};

module.exports = {
  query,
  pool,
  testConnection,
  initDB,
  closePool,
};
