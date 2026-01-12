const form = document.getElementById('loginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = '/admin-dashboard.html';
    } else {
      showMessage(data.error || 'Error en la autenticación', 'error');
    }
  } catch (error) {
    showMessage('Error de conexión', 'error');
  }
});

function showMessage(text, type = 'info') {
  message.textContent = text;
  message.className = `message ${type}`;
  message.style.display = 'block';
  setTimeout(() => message.style.display = 'none', 5000);
}
