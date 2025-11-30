const output = document.querySelector('#health-output');
const button = document.querySelector('#health-btn');

async function fetchHealth() {
  output.textContent = 'Consultando /health...';
  try {
    const response = await fetch('/health');
    const json = await response.json();
    output.textContent = JSON.stringify(json, null, 2);
  } catch (error) {
    output.textContent = `No se pudo obtener el estado: ${error.message}`;
  }
}

button?.addEventListener('click', fetchHealth);

fetchHealth();
