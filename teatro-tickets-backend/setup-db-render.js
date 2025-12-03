import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';

const DATABASE_URL = 'postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets';

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    console.log('📋 Tablas existentes:', tables.rows.map(t => t.table_name).join(', '));
    
    // Verificar columnas de users
    const usersCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n👥 Columnas en users:');
    usersCols.rows.forEach(c => console.log(`   ${c.column_name}: ${c.data_type}`));

    // Agregar columna activo si no existe
    const hasActivo = usersCols.rows.some(c => c.column_name === 'activo');
    if (!hasActivo) {
      console.log('\n➕ Agregando columna activo...');
      await client.query('ALTER TABLE users ADD COLUMN activo BOOLEAN DEFAULT TRUE');
      console.log('✅ Columna activo agregada');
    }

    // Verificar super usuario
    const superUser = await client.query("SELECT * FROM users WHERE rol = 'supremo' LIMIT 1");
    if (superUser.rows.length === 0) {
      console.log('\n➕ Creando super usuario...');
      const hashedPassword = await bcrypt.hash('super123', 10);
      await client.query(
        `INSERT INTO users (id, cedula, nombre, password, rol, activo) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['supremo_SUPER', 'supremo@baco.com', 'Super Baco', hashedPassword, 'supremo', true]
      );
      console.log('✅ Super usuario creado');
    }

    // Estado final
    console.log('\n📊 ESTADO FINAL:');
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
    console.log(`   Ensayos: ${stats.rows[0].ensayos}`);

    const allUsers = await client.query('SELECT cedula, nombre, rol FROM users');
    console.log('\n👥 Usuarios registrados:');
    allUsers.rows.forEach(u => console.log(`   ${u.rol}: ${u.nombre} (${u.cedula})`));

    console.log('\n✅ Base de datos configurada correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

setupDatabase();
