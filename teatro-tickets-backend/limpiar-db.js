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
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function limpiarBaseDatos() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Iniciando limpieza de base de datos...');
    
    // Eliminar todos los tickets
    const ticketsResult = await client.query('DELETE FROM tickets');
    console.log(`✅ Eliminados ${ticketsResult.rowCount} tickets`);
    
    // Eliminar todos los shows
    const showsResult = await client.query('DELETE FROM shows');
    console.log(`✅ Eliminadas ${showsResult.rowCount} obras/shows`);
    
    // Eliminar todos los reportes
    const reportesResult = await client.query('DELETE FROM reportes_obras');
    console.log(`✅ Eliminados ${reportesResult.rowCount} reportes`);
    
    // Eliminar todos los usuarios EXCEPTO el supremo
    const usersResult = await client.query(
      "DELETE FROM users WHERE cedula != '48376669'"
    );
    console.log(`✅ Eliminados ${usersResult.rowCount} usuarios (mantenido usuario supremo)`);
    
    // Verificar usuarios restantes
    const remainingUsers = await client.query('SELECT cedula, nombre, rol FROM users');
    console.log('\n👤 Usuarios que quedan en la base:');
    remainingUsers.rows.forEach(u => {
      console.log(`   - ${u.nombre} (${u.cedula}) - Rol: ${u.rol}`);
    });
    
    console.log('\n🎉 Limpieza completada exitosamente!');
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
