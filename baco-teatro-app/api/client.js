const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://baco-teatro-1jxj.onrender.com';

async function request(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.error || 'Error en la API');
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Tiempo de espera agotado');
      timeoutError.offline = true;
      throw timeoutError;
    }
    error.offline = true;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default request;
