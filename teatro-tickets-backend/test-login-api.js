import fetch from 'node-fetch';

const API_URL = 'https://baco-teatro-1jxj.onrender.com';

async function testLogin() {
  console.log('🧪 Probando login en:', API_URL);
  console.log('📝 Credenciales: 48376669 / super123\n');

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: '48376669',
        password: 'super123'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);

    const data = await response.json();
    console.log('\n📦 Respuesta:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN EXITOSO');
      console.log('Token:', data.token?.substring(0, 30) + '...');
    } else {
      console.log('\n❌ LOGIN FALLIDO');
      console.log('Mensaje:', data.message || data.error);
    }

  } catch (error) {
    console.error('\n❌ Error en la petición:', error.message);
  }
}

testLogin();
