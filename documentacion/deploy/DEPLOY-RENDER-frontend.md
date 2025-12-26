# Guía de Despliegue del Frontend en Render

Este documento describe cómo preparar y desplegar el frontend de Baco Teatro (Expo Web) en Render.

## 📋 Preparación Local

Antes de desplegar, asegúrate de tener el backend corriendo en Render y copia su URL.

### 1. Configurar Variable de Entorno

Crea un archivo `.env` en `/baco-teatro-app`:

```bash
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com
```

### 2. Probar el Build Localmente

```bash
cd baco-teatro-app
npm install
npx expo export:web
```

Esto generará una carpeta `web-build` con los archivos estáticos optimizados.

### 3. Probar Localmente (Opcional)

```bash
npx serve web-build
```

Abre http://localhost:3000 y verifica que funcione correctamente.

---

## 🚀 Opción 1: Desplegar como Static Site (Recomendado)

Esta opción es más rápida y usa CDN de Render.

### Paso 1: Crear Static Site en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Static Site"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `baco-teatro-app`
   - **Branch:** `prototipo`
   - **Root Directory:** `baco-teatro-app`
   - **Build Command:** `npm install && npx expo export:web`
   - **Publish Directory:** `web-build`

### Paso 2: Variables de Entorno

En "Advanced" → "Add Environment Variable":

```
EXPO_PUBLIC_API_URL = https://tu-backend.onrender.com
```

### Paso 3: Deploy

Click en **"Create Static Site"**. Render construirá y desplegará automáticamente.

Una vez completado, tendrás una URL como: `https://baco-teatro-app.onrender.com`

---

## 🔄 Opción 2: Servir desde el Backend

Esta opción simplifica el despliegue sirviendo todo desde un solo servicio.

### Paso 1: Build Local

```bash
cd baco-teatro-app
npm install
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com npx expo export:web
```

### Paso 2: Copiar al Backend

```bash
# Desde la raíz del proyecto
rm -rf teatro-tickets-backend/public
cp -r baco-teatro-app/web-build teatro-tickets-backend/public
```

### Paso 3: Commit y Push

```bash
git add teatro-tickets-backend/public
git commit -m "Add frontend build to backend"
git push origin prototipo
```

Render detectará los cambios y redespliegará automáticamente el backend con el frontend incluido.

Ahora puedes acceder al frontend en: `https://tu-backend.onrender.com`

---

## 📱 Configuración de App Móvil (Expo Go)

Si quieres que la app móvil también use el backend en producción:

### En desarrollo:

Crea `.env` local:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### En producción (Expo Go):

Actualiza `app.json` o `.env.production`:
```json
{
  "extra": {
    "apiUrl": "https://tu-backend.onrender.com"
  }
}
```

Y en el código:
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                Constants.expoConfig?.extra?.apiUrl || 
                'http://localhost:3000';
```

---

## 🔧 Actualizar el Frontend

### Si usas Static Site:
1. Haz cambios en el código
2. Commit y push a `prototipo`
3. Render rebuildeará automáticamente

### Si sirves desde el backend:
1. Haz cambios en el código
2. Genera nuevo build: `npx expo export:web`
3. Copia a backend: `cp -r web-build ../teatro-tickets-backend/public`
4. Commit y push

---

## 🐛 Troubleshooting

### Error: "Cannot connect to API"
- Verifica que `EXPO_PUBLIC_API_URL` esté correctamente configurada
- Asegúrate de que el backend esté corriendo: `https://tu-backend.onrender.com/health`
- Revisa la consola del navegador para ver errores de CORS

### Build falla en Render
- Verifica que `package.json` tenga todas las dependencias
- Revisa los logs de build en Render
- Asegúrate de que `expo export:web` funcione localmente primero

### Página en blanco después del deploy
- Verifica que `Publish Directory` sea `web-build`
- Revisa la consola del navegador (F12) para ver errores
- Asegúrate de que la variable `EXPO_PUBLIC_API_URL` esté configurada en Render

---

## ✅ Checklist de Deploy

- [ ] Backend desplegado y funcionando (`/health` responde OK)
- [ ] Variable `EXPO_PUBLIC_API_URL` configurada
- [ ] Build local funciona: `npx expo export:web`
- [ ] Static Site creado en Render (o archivos copiados al backend)
- [ ] Deploy completado sin errores
- [ ] Login funciona correctamente
- [ ] Todas las funciones principales funcionan

---

**¡Listo!** Tu frontend de Baco Teatro debería estar corriendo y conectado al backend en producción.
