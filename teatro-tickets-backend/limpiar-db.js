import pkg from 'pg';
const { Pool } = pkg;

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurado');
  console.log('\n📝 Para ejecutar este script:');
  console.log('   1. Desde Render Dashboard, ve a tu base de datos');
  console.log('   2. Copia la "Internal Database URL"');
  console.log('   3. Ejecuta: DATABASE_URL="tu-url-aqui" node limpiar-db.js\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function limpiarBaseDatos() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpieza completa de base de datos...\n');
    
    // 1. Eliminar todos los reportes de obras
    console.log('📊 Eliminando reportes de obras...');
    const reportesResult = await client.query('DELETE FROM reportes_obras');
    console.log(`   ✅ ${reportesResult.rowCount} reportes eliminados`);
    
    // 2. Eliminar todos los ensayos generales
    console.log('🎭 Eliminando ensayos generales...');
    const ensayosResult = await client.query('DELETE FROM ensayos_generales');
    console.log(`   ✅ ${ensayosResult.rowCount} ensayos eliminados`);
    
    // 3. Eliminar todos los tickets
    console.log('🎫 Eliminando tickets...');
    const ticketsResult = await client.query('DELETE FROM tickets');
    console.log(`   ✅ ${ticketsResult.rowCount} tickets eliminados`);
    
    // 4. Eliminar todos los shows
    console.log('🎬 Eliminando shows...');
    const showsResult = await client.query('DELETE FROM shows');
    console.log(`   ✅ ${showsResult.rowCount} shows eliminados`);
    
    // 5. Eliminar todos los usuarios EXCEPTO el SUPER
    console.log('👥 Eliminando usuarios (manteniendo SUPER)...');
    const usersResult = await client.query(
      "DELETE FROM users WHERE rol != 'SUPER' RETURNING nombre, rol"
    );
    console.log(`   ✅ ${usersResult.rowCount} usuarios eliminados`);
    
    // 6. Verificar usuarios restantes
    console.log('\n🔍 Verificando usuarios restantes...');
    const remainingUsers = await client.query('SELECT cedula, nombre, rol FROM users');
    console.log(`   Total de usuarios: ${remainingUsers.rowCount}`);
    remainingUsers.rows.forEach(u => {
      console.log(`      - ${u.nombre} (${u.cedula}) - Rol: ${u.rol}`);
    });
    
    // 7. Resetear secuencias para que los IDs empiecen desde 1
    console.log('\n🔄 Reseteando secuencias de IDs...');
    try {
      await client.query('ALTER SEQUENCE IF EXISTS shows_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE IF EXISTS tickets_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE IF EXISTS ensayos_generales_id_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE IF EXISTS reportes_obras_id_seq RESTART WITH 1');
      console.log('   ✅ Secuencias reseteadas');
    } catch (seqError) {
      console.log('   ⚠️  Algunas secuencias no se pudieron resetear (puede ser normal)');
    }
    
    console.log('\n✨ ¡Base de datos limpiada exitosamente!');
    console.log('📌 El sistema está listo para entrega con solo el usuario SUPER');
    console.log('📊 Estado final:');
    console.log(`   - Usuarios: ${remainingUsers.rowCount} (solo supremo)`);
    console.log(`   - Obras: 0`);
    console.log(`   - Tickets: 0`);
    console.log(`   - Reportes: 0`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

limpiarBaseDatos()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
