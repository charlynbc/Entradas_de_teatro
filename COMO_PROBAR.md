# 🚀 Guía Rápida - Probar el Sistema Completo

## ✅ Estado Actual

El sistema **Baco Teatro** está listo con:

1. ✅ **Backend funcionando** en puerto 3000
2. ✅ **App móvil creada** con diseño Baco
3. ✅ **Colores configurados**: Naranja `#C84A1B` + Blanco + Negro

---

## 📱 Opción 1: Probar con la App Móvil (Recomendado)

### Paso 1: Hacer público el puerto del backend

1. En VS Code, abre el panel **PORTS** (abajo)
2. Busca el puerto `3000`
3. Click derecho → **Port Visibility** → **Public**
4. Copia la URL (algo como `https://xxxx-3000.app.github.dev`)

### Paso 2: Configurar la app

Edita `baco-teatro-app/App.js` línea 14:

```js
const API_URL = 'https://tu-url-aqui.app.github.dev';
```

### Paso 3: Generar tickets de prueba

En terminal:

```bash
# Crear una función
curl -X POST https://tu-url-aqui.app.github.dev/api/shows \
  -H "Content-Type: application/json" \
  -d '{"obra":"Romeo y Julieta","fecha":"2025-12-31 20:00","capacidad":50}'

# Generar 10 tickets para la función ID 1
curl -X POST https://tu-url-aqui.app.github.dev/api/shows/1/generate-tickets \
  -H "Content-Type: application/json" \
  -d '{"cantidad":10}'

# Anotar uno de los códigos (ej: T-A1B2C3D4)

# Marcarlo como PAGADO
curl -X POST https://tu-url-aqui.app.github.dev/api/tickets/T-A1B2C3D4/pay
```

### Paso 4: Levantar la app

```bash
cd baco-teatro-app
npm start
```

### Paso 5: Probar en tu celular

1. Instala **Expo Go** desde Play Store
2. Escanea el QR que aparece en la terminal
3. La app se abrirá con el diseño naranja Baco
4. Ingresa el código del ticket (ej: `T-A1B2C3D4`)
5. Dale a **Validar ticket**
6. Deberías ver "✅ Ticket válido, bienvenido 🕺"

---

## 💻 Opción 2: Probar con Script Automático (solo backend)

Si solo querés probar el backend sin la app móvil:

```bash
cd /workspaces/Entradas_de_teatro
./test-sistema.sh
```

Esto hace todo el flujo automáticamente:
1. Crea una función
2. Genera 5 tickets
3. Marca uno como pagado
4. Lo valida
5. Intenta validarlo de nuevo (debe fallar)

---

## 🔍 Verificar que todo esté funcionando

### Backend
```bash
curl http://localhost:3000
# Debería responder: "API Teatro Tickets OK"
```

### Ver funciones creadas
```bash
curl http://localhost:3000/api/shows
```

### Ver tickets de una función
```bash
curl http://localhost:3000/api/shows/1/tickets
```

---

## 🎨 Pantalla de la App

La app tiene:
- **Header naranja** con logo "Baco teatro"
- **Franja blanca vertical** (estilo logo)
- Campo de texto para ingresar código
- **Botón naranja** "Validar ticket"
- Mensajes informativos sobre próximas funciones

---

## 🐛 Troubleshooting

### La app no se conecta al backend

1. Verifica que el puerto 3000 esté **público** en Codespaces
2. Verifica la URL en `App.js` (debe incluir `https://`)
3. Prueba abrir la URL del backend en el navegador de tu celular

### El backend no responde

```bash
# Ver si está corriendo
curl http://localhost:3000

# Si no responde, levantarlo de nuevo
cd teatro-tickets-backend
node index.js
```

### Error "Ticket no válido"

1. Verifica que el ticket esté marcado como **PAGADO**
2. Verifica que no haya sido usado antes
3. Verifica que el código sea correcto (distingue mayúsculas)

---

## 📋 Próximos Pasos

1. **Deploy en Render**: Subir el backend a producción
2. **Escaneo QR**: Agregar cámara para leer QR codes
3. **Login Admin**: Pantalla de autenticación
4. **Lista de Funciones**: Ver todas las obras disponibles
5. **PostgreSQL**: Migrar de memoria a base de datos real

---

¿Todo funcionando? ¡A rockear! 🎭🍊
