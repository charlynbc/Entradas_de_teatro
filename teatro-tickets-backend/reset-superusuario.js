// Script para resetear/crear usuario supremo
// Uso: DATABASE_URL="tu-url-de-postgres" node reset-superusuario.js

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurado');
  console.log('\n📝 Uso correcto:');
  console.log('   DATABASE_URL="postgresql://..." node reset-superusuario.js\n');
  process.exit(1);
}

// Configurar pool de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function resetSuperusuario() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    const cedula = '48376669';
    const nombre = 'Super Baco';
    const password = 'Teamomama91';
    const rol = 'supremo';

    console.log('\n📋 Datos del superusuario:');
    console.log('   Cédula:', cedula);
    console.log('   Nombre:', nombre);
    console.log('   Password:', password);
    console.log('   Rol:', rol);

    // Hash del password
    console.log('\n🔐 Generando hash de contraseña...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar ID único
    const id = `supremo_${Date.now()}`;

    // Primero, intentar eliminar el usuario existente
    console.log('\n🗑️  Eliminando usuario supremo anterior (si existe)...');
    const deleteResult = await client.query(
      'DELETE FROM users WHERE cedula = $1',
      [cedula]
    );
    
    if (deleteResult.rowCount > 0) {
      console.log(`   ✅ Usuario anterior eliminado (${deleteResult.rowCount} fila(s))`);
    } else {
      console.log('   ℹ️  No había usuario anterior con esa cédula');
    }

    // Insertar nuevo usuario supremo
    console.log('\n➕ Creando nuevo usuario supremo...');
    await client.query(
      `INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, cedula, nombre, hashedPassword, rol]
    );

    console.log('\n✅ ¡Usuario supremo creado exitosamente!');
    console.log('\n📱 Puedes iniciar sesión con:');
    console.log('   Cédula:', cedula);
    console.log('   Password:', password);
    console.log('   Rol:', rol.toUpperCase());
    
    // Verificar el usuario
    console.log('\n🔍 Verificando usuario...');
    const verifyResult = await client.query(
      'SELECT id, cedula, nombre, rol, created_at FROM users WHERE cedula = $1',
      [cedula]
    );
    
    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('   ✅ Usuario encontrado:');
      console.log('      ID:', user.id);
      console.log('      Nombre:', user.nombre);
      console.log('      Cédula:', user.cedula);
      console.log('      Rol:', user.rol);
      console.log('      Creado:', user.created_at);
      
      // Verificar que el password funciona
      const passwordWorks = await bcrypt.compare(password, hashedPassword);
      console.log('   🔑 Password verificado:', passwordWorks ? '✅' : '❌');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
resetSuperusuario()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
