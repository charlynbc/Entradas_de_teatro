# Guía de Despliegue en Render

Este documento describe cómo desplegar el sistema completo de Baco Teatro en Render con persistencia en PostgreSQL.

## 📋 Prerrequisitos

- Cuenta en [Render.com](https://render.com)
- Repositorio en GitHub con el código subido
- Rama `prototipo` lista para deploy

## 🗄️ Paso 1: Crear Base de Datos PostgreSQL

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `baco-teatro-db`
   - **Database:** `teatro_tickets`
   - **User:** (autogenerado)
   - **Region:** Elige la más cercana a tus usuarios
   - **Plan:** Free (para empezar)
4. Click en **"Create Database"**
5. Espera a que se cree (1-2 minutos)
6. **Copia la "Internal Database URL"** (la usarás en el siguiente paso)

## 🚀 Paso 2: Desplegar Backend (API)

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura el servicio:
   - **Name:** `baco-teatro-api`
   - **Region:** Misma que la base de datos
   - **Branch:** `prototipo`
   - **Root Directory:** `teatro-tickets-backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (para empezar)

4. **Variables de Entorno** (click en "Advanced" → "Add Environment Variable"):
   ```
   DATABASE_URL = [pegar la Internal Database URL del Paso 1]
   NODE_ENV = production
   JWT_SECRET = [generar un secret seguro, ej: openssl rand -base64 32]
   BASE_URL = [dejar vacío por ahora, lo completaremos después]
   ```

5. Click en **"Create Web Service"**
6. Espera a que se despliegue (3-5 minutos)
7. Una vez desplegado, **copia la URL** (ej: `https://baco-teatro-api.onrender.com`)
8. Edita la variable de entorno **BASE_URL** y pégala ahí
9. El servicio se reiniciará automáticamente

### Verificar que funciona:
- Abre: `https://tu-api.onrender.com/health`
- Deberías ver:
  ```json
  {
    "status": "ok",
    "storage": "postgresql",
    "database": "connected",
    "totals": {
      "users": 0,
      "shows": 0,
      "tickets": 0
    }
  }
  ```

## 🎨 Paso 3: Desplegar Frontend (Expo Web)

### Opción A: Static Site en Render (recomendado)

1. Primero, en tu máquina local, asegúrate de tener todas las dependencias:
   ```bash
   cd baco-teatro-app
   npm install
   ```

2. Genera el build web:
   ```bash
   npx expo export:web
   ```

3. Esto creará una carpeta `web-build` con archivos estáticos

4. En Render Dashboard, click en **"New +"** → **"Static Site"**
5. Configura:
   - **Name:** `baco-teatro-app`
   - **Branch:** `prototipo`
   - **Root Directory:** `baco-teatro-app`
   - **Build Command:** `npm install && npx expo export:web`
   - **Publish Directory:** `web-build`

6. **Variable de Entorno**:
   ```
   EXPO_PUBLIC_API_URL = https://tu-api.onrender.com
   ```

7. Click en **"Create Static Site"**

### Opción B: Servir desde el Backend (más simple) ⭐ RECOMENDADO

**Importante:** Asegúrate de que `@expo/vector-icons` esté instalado en el package.json del frontend.

1. Usa el script automatizado:
   ```bash
   cd baco-teatro-app
   chmod +x build-for-render.sh
   ./build-for-render.sh
   ```

   O manualmente:
   ```bash
   cd baco-teatro-app
   npm install
   npx expo export:web
   cp -r web-build ../teatro-tickets-backend/public
   ```

2. Commitea y pushea los cambios:
   ```bash
   cd ..
   git add -A
   git commit -m "build: Actualizar build web con iconos"
   git push origin prototipo
   ```

3. Render redespliegará automáticamente el backend con el frontend incluido

## 🔄 Paso 4: Crear Usuario Supremo Inicial

Una vez desplegado el backend, crea el primer usuario:

```bash
curl -X POST https://tu-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "admin",
    "nombre": "Administrador",
    "password": "tu-password-seguro",
    "rol": "supremo"
  }'
```

O usa Postman/Insomnia para hacer el request.

## 📊 Monitoreo y Logs

- **Logs del Backend:** En el dashboard del servicio web, pestaña "Logs"
- **Estado de la DB:** En el dashboard de PostgreSQL, pestaña "Info"
- **Métricas:** Render muestra uso de CPU/RAM automáticamente

## 🔧 Mantenimiento

### Actualizar el código:
1. Haz push a la rama `prototipo`
2. Render detecta los cambios y redespliega automáticamente

### Backup de la base de datos:
1. Ve al dashboard de PostgreSQL
2. Click en "Backups" (plan pago) o usa `pg_dump`:
   ```bash
   pg_dump [EXTERNAL_DATABASE_URL] > backup.sql
   ```

### Escalar:
- Si necesitas más recursos, upgradea a un plan pago desde el dashboard

## 🐛 Troubleshooting

### Los iconos no se muestran en Render:
- Verifica que `@expo/vector-icons` esté en `baco-teatro-app/package.json`
- Asegúrate de ejecutar `npm install` antes de `npx expo export:web`
- Regenera el build web y vuelve a desplegarlo
- Los iconos deben estar incluidos en la carpeta `web-build/static`

### El backend no se conecta a la DB:
- Verifica que `DATABASE_URL` esté configurada correctamente
- Usa la **Internal Database URL** (no la External)
- Revisa los logs del servicio

### El frontend no se comunica con el backend:
- Verifica que `EXPO_PUBLIC_API_URL` apunte a la URL correcta del backend
- Asegúrate de que CORS esté habilitado en el backend (ya configurado)

### Errores de "Cold Start":
- En el plan gratuito, Render apaga servicios inactivos después de 15 minutos
- La primera request después del apagado tomará 30-60 segundos (es normal)

## 💰 Costos

- **Plan Free:** Suficiente para desarrollo y pruebas
  - Backend: 750 horas/mes gratis
  - PostgreSQL: 90 días gratis, luego $7/mes
  - Static Site: Gratis ilimitado
  
- **Plan Starter ($7-25/mes):** Recomendado para producción
  - Sin "cold starts"
  - Más recursos
  - Backups automáticos

## 📚 Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [Render + Node.js](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL en Render](https://render.com/docs/databases)

---

**¡Listo!** Tu aplicación de Baco Teatro debería estar corriendo en producción con persistencia real en PostgreSQL.
