import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets';

async function checkDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Usuarios
    const users = await client.query('SELECT id, cedula, nombre, rol, activo FROM users ORDER BY created_at');
    console.log('👥 USUARIOS:');
    users.rows.forEach(u => console.log(`   ${u.rol.toUpperCase()}: ${u.nombre} (${u.cedula}) - ${u.activo ? 'Activo' : 'Inactivo'}`));
    console.log(`   Total: ${users.rows.length}\n`);

    // Shows
    const shows = await client.query('SELECT id, nombre, fecha, precio, total_tickets FROM shows ORDER BY fecha');
    console.log('🎭 SHOWS:');
    if (shows.rows.length === 0) {
      console.log('   Ninguno (base de datos virgen)\n');
    } else {
      shows.rows.forEach(s => console.log(`   ${s.nombre} - ${new Date(s.fecha).toLocaleDateString()} - $${s.precio} - ${s.total_tickets} tickets`));
      console.log(`   Total: ${shows.rows.length}\n`);
    }

    // Tickets
    const tickets = await client.query('SELECT COUNT(*) as total, estado FROM tickets GROUP BY estado');
    console.log('��️  TICKETS:');
    if (tickets.rows.length === 0) {
      console.log('   Ninguno\n');
    } else {
      tickets.rows.forEach(t => console.log(`   ${t.estado}: ${t.total}`));
      const total = await client.query('SELECT COUNT(*) as count FROM tickets');
      console.log(`   Total: ${total.rows[0].count}\n`);
    }

    // Ensayos
    const ensayos = await client.query('SELECT COUNT(*) as count FROM ensayos_generales');
    console.log(`🎬 ENSAYOS GENERALES: ${ensayos.rows[0].count}\n`);

    // Reportes
    const reportes = await client.query('SELECT COUNT(*) as count FROM reportes_obras');
    console.log(`📊 REPORTES: ${reportes.rows[0].count}\n`);

    console.log('✅ Base de datos funcionando correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
