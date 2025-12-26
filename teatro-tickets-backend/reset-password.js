import { hashPassword } from './config/auth.js';
import { query } from './db/postgres.js';

async function resetPassword() {
  try {
    const cedula = '48376669';
    const newPassword = 'Teamomama91';
    
    console.log('🔄 Reseteando contraseña para cédula:', cedula);
    const hash = await hashPassword(newPassword);
    
    await query(
      'UPDATE users SET password_hash = $1 WHERE cedula = $2',
      [hash, cedula]
    );
    
    console.log('✅ Contraseña actualizada exitosamente');
    console.log('   Cédula:', cedula);
    console.log('   Nueva contraseña:', newPassword);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
