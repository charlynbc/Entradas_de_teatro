import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';

const DATABASE_URL = 'postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets';

async function limpiarDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Eliminar todos los usuarios excepto el supremo
    console.log('🧹 Limpiando usuarios de prueba...');
    const deleteResult = await client.query("DELETE FROM users WHERE rol != 'supremo'");
    console.log(`   Eliminados: ${deleteResult.rowCount} usuarios\n`);

    // Verificar que existe el super usuario con las credenciales correctas
    const superUser = await client.query("SELECT * FROM users WHERE cedula = '48376669'");
    
    if (superUser.rows.length === 0) {
      console.log('⚠️  Super usuario no encontrado, creando...');
      const hashedPassword = await bcrypt.hash('super123', 10);
      await client.query(
        `INSERT INTO users (id, cedula, nombre, password, rol, activo) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['supremo_SUPER', '48376669', 'Super Baco', hashedPassword, 'supremo', true]
      );
      console.log('✅ Super usuario creado\n');
    } else {
      console.log('✅ Super usuario existe\n');
    }

    // Limpiar todas las tablas
    console.log('🧹 Limpiando datos...');
    await client.query('DELETE FROM tickets');
    await client.query('DELETE FROM shows');
    await client.query('DELETE FROM ensayos_generales');
    await client.query('DELETE FROM reportes_obras');
    console.log('   ✅ Tickets eliminados');
    console.log('   ✅ Shows eliminados');
    console.log('   ✅ Ensayos eliminados');
    console.log('   ✅ Reportes eliminados\n');

    // Estado final
    console.log('📊 ESTADO FINAL (BASE DE DATOS VIRGEN):');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as usuarios,
        (SELECT COUNT(*) FROM shows) as shows,
        (SELECT COUNT(*) FROM tickets) as tickets,
        (SELECT COUNT(*) FROM ensayos_generales) as ensayos
    `);
    console.log(`   Usuarios: ${stats.rows[0].usuarios}`);
    console.log(`   Shows: ${stats.rows[0].shows}`);
    console.log(`   Tickets: ${stats.rows[0].tickets}`);
    console.log(`   Ensayos: ${stats.rows[0].ensayos}\n`);

    const superUsuario = await client.query("SELECT cedula, nombre, rol FROM users WHERE rol = 'supremo'");
    console.log('👑 SUPER USUARIO:');
    console.log(`   Cédula: ${superUsuario.rows[0].cedula}`);
    console.log(`   Nombre: ${superUsuario.rows[0].nombre}`);
    console.log(`   Password: super123`);
    console.log(`   Rol: ${superUsuario.rows[0].rol}\n`);

    console.log('✅ Base de datos lista - Estado virgen con solo el super usuario');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

limpiarDatabase();
