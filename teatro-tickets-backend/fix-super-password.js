import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcrypt';

const DATABASE_URL = 'postgresql://teatro_tickets_user:lw2E3RfTKAf9vlFmcGOd4dS7mPrLN02k@dpg-d4mqerq4d50c73et3un0-a.oregon-postgres.render.com/teatro_tickets';

async function fixSuperPassword() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar super usuario actual
    const current = await client.query("SELECT * FROM users WHERE cedula = '48376669'");
    
    if (current.rows.length === 0) {
      console.log('❌ Super usuario no encontrado\n');
      return;
    }

    console.log('👤 Super usuario encontrado:');
    console.log('   ID:', current.rows[0].id);
    console.log('   Cédula:', current.rows[0].cedula);
    console.log('   Nombre:', current.rows[0].nombre);
    console.log('   Rol:', current.rows[0].rol);

    // Generar nuevo hash para "super123"
    console.log('\n🔐 Generando nuevo hash para password "super123"...');
    const newPassword = 'super123';
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log('Hash generado:', newHash.substring(0, 20) + '...');

    // Probar el hash actual
    const currentHash = current.rows[0].password;
    const isValid = await bcrypt.compare(newPassword, currentHash);
    console.log('\n🔍 Verificando hash actual:');
    console.log('   Hash válido:', isValid ? '✅ SÍ' : '❌ NO');

    if (!isValid) {
      console.log('\n🔄 Actualizando password...');
      await client.query(
        'UPDATE users SET password = $1 WHERE cedula = $2',
        [newHash, '48376669']
      );
      console.log('✅ Password actualizado correctamente');

      // Verificar el nuevo hash
      const updated = await client.query("SELECT password FROM users WHERE cedula = '48376669'");
      const newIsValid = await bcrypt.compare(newPassword, updated.rows[0].password);
      console.log('✅ Verificación del nuevo hash:', newIsValid ? 'CORRECTO' : 'ERROR');
    }

    console.log('\n📋 CREDENCIALES FINALES:');
    console.log('   Cédula: 48376669');
    console.log('   Password: super123');
    console.log('   Estado: ✅ Listo para usar');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixSuperPassword();
