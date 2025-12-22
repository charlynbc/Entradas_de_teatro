const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Servir los archivos estáticos del Frontend (HTML, CSS, JS)
// Esto busca los archivos en la carpeta hermana 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Servir también la carpeta public del backend si es necesario
app.use('/backend-public', express.static(path.join(__dirname, 'public')));

// 3. Ruta de prueba para verificar que la API responde
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', mensaje: 'Backend de Baco Teatro funcionando correctamente' });
});

// 4. Cualquier otra ruta devuelve el index.html del frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
    console.log(`Accede a la web en: http://localhost:${PORT}`);
});
