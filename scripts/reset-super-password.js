// Login como SUPER y resetea la contraseña del SUPER a admin123
import fetch from 'node-fetch';

const BASE = 'http://localhost:3000';
const SUPER_CEDULA = '48376669';
const NEW_PASSWORD = 'admin123';

async function main() {
  try {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: SUPER_CEDULA, password: 'Teamomama91' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login SUPER falló:', loginData);
      process.exit(1);
    }
    const token = loginData.token;
    console.log('🔐 Login SUPER OK');

    const resetRes = await fetch(`${BASE}/api/usuarios/${SUPER_CEDULA}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword: NEW_PASSWORD })
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok) {
      console.error('Reset falló:', resetData);
      process.exit(1);
    }
    console.log('✅ Reset OK:', resetData);

    // Verificar login con nueva contraseña
    const reloginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: SUPER_CEDULA, password: NEW_PASSWORD })
    });
    const reloginData = await reloginRes.json();
    if (!reloginRes.ok) {
      console.error('Re-login con nueva contraseña falló:', reloginData);
      process.exit(1);
    }
    console.log('🔁 Re-login SUPER OK con nueva contraseña');
    console.log('🎉 Todo listo.');
  } catch (err) {
    console.error('Error general:', err);
    process.exit(1);
  }
}

main();
