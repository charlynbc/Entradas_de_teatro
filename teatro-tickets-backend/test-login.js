// Script para probar el login directamente
import { query } from './db/postgres.js';
import { comparePassword } from './config/auth.js';

async function testLogin() {
  try {
    const cedula = '48376669';
    const password = 'Teamomama91';
    
    console.log('🔍 Buscando usuario con cédula:', cedula);
    
    const result = await query('SELECT * FROM users WHERE cedula = $1', [cedula]);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario NO existe en la base de datos');
      console.log('📋 Usuarios existentes:');
      const allUsers = await query('SELECT cedula, name, role FROM users');
      console.table(allUsers.rows);
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Usuario encontrado:');
    console.log('   Cédula:', user.cedula);
    console.log('   Nombre:', user.name);
    console.log('   Rol:', user.role);
    console.log('   Tiene password_hash:', !!user.password_hash);
    
    if (!user.password_hash) {
      console.log('❌ El usuario no tiene password_hash configurado');
      return;
    }
    
    console.log('\n🔐 Probando contraseña:', password);
    const valid = await comparePassword(password, user.password_hash);
    
    if (valid) {
      console.log('✅ ¡Contraseña correcta!');
      console.log('✅ Login exitoso');
    } else {
      console.log('❌ Contraseña incorrecta');
      console.log('💡 Verifica que la contraseña sea exactamente:', password);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testLogin();
