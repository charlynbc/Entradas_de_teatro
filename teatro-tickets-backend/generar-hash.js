// Script para generar el hash correcto del password
// Ejecuta: node generar-hash.js

import bcrypt from 'bcrypt';

const password = 'Teamomama91';
const saltRounds = 10;

console.log('🔐 Generando hash bcrypt para el password...');
console.log('Password:', password);
console.log('Salt rounds:', saltRounds);
console.log('');

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('✅ Hash generado:');
    console.log(hash);
    console.log('');
    console.log('📋 SQL para actualizar:');
    console.log(`UPDATE users SET password = '${hash}' WHERE cedula = '48376669';`);
    console.log('');
    console.log('📋 SQL para insertar nuevo usuario:');
    console.log(`INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)`);
    console.log(`VALUES ('supremo_' || extract(epoch from now())::bigint, '48376669', 'Super Baco', '${hash}', 'supremo', NOW(), NOW());`);
    console.log('');
    
    // Verificar que el hash funciona
    return bcrypt.compare(password, hash);
  })
  .then(isValid => {
    console.log('🔍 Verificación del hash:', isValid ? '✅ Correcto' : '❌ Incorrecto');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
