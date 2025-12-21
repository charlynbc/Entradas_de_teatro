import { query } from '../db/postgres.js';
import bcrypt from 'bcrypt';

async function crearUsuariosPrueba() {
  try {
    console.log('🔄 Creando usuarios de prueba...');

    // Hashear contraseñas
    const passwordAdmin = await bcrypt.hash('admin123', 10);
    const passwordActor = await bcrypt.hash('actor123', 10);
    const passwordInvitado = await bcrypt.hash('invitado123', 10);

    // Crear admin de prueba
    const adminExiste = await query('SELECT cedula FROM users WHERE cedula = $1', ['11111111']);
    if (adminExiste.rows.length === 0) {
      await query(
        `INSERT INTO users (cedula, name, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['11111111', 'Admin de Prueba', passwordAdmin, '099111111', 'ADMIN']
      );
      console.log('✅ Admin creado: cedula 11111111, password: admin123');
    } else {
      console.log('ℹ️ Admin 11111111 ya existe');
    }

    // Crear actor/actriz de prueba
    const actorExiste = await query('SELECT cedula FROM users WHERE cedula = $1', ['22222222']);
    if (actorExiste.rows.length === 0) {
      await query(
        `INSERT INTO users (cedula, name, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['22222222', 'Actor/Actriz de Prueba', passwordActor, '099222222', 'ACTOR']
      );
      console.log('✅ Actor/Actriz creado: cedula 22222222, password: actor123');
    } else {
      console.log('ℹ️ Actor/Actriz 22222222 ya existe');
    }

    // Crear invitado de prueba
    const invitadoExiste = await query('SELECT cedula FROM users WHERE cedula = $1', ['33333333']);
    if (invitadoExiste.rows.length === 0) {
      await query(
        `INSERT INTO users (cedula, name, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['33333333', 'Invitado de Prueba', passwordInvitado, '099333333', 'INVITADO']
      );
      console.log('✅ Invitado creado: cedula 33333333, password: invitado123');
    } else {
      console.log('ℹ️ Invitado 33333333 ya existe');
    }

    console.log('\n📋 Resumen de usuarios de prueba:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 SUPER:        cedula: 48376669, password: Teamomama91');
    console.log('🔧 ADMIN:        cedula: 11111111, password: admin123');
    console.log('🎭 ACTOR/ACTRIZ: cedula: 22222222, password: actor123');
    console.log('👥 INVITADO:     cedula: 33333333, password: invitado123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    process.exit(1);
  }
}

crearUsuariosPrueba();
