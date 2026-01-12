console.log('📊 Admin dashboard cargado');

// Verificar autenticación
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
}

// ...existing code...

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
});