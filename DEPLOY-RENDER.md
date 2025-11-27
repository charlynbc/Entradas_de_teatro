# 🚀 DEPLOY COMPLETO EN RENDER - PASO A PASO

## 📋 PASOS A SEGUIR

### 1️⃣ CREAR POSTGRESQL EN RENDER

1. Ve a: **https://render.com** → Sign up con GitHub
2. Dashboard → **New +** → **PostgreSQL**
3. Configuración:
   - **Name**: `baco-teatro-db`
   - **Database**: `baco_teatro`
   - **User**: (se genera automático)
   - **Region**: `Oregon (US West)`
   - **PostgreSQL Version**: `15`
   - **Instance Type**: **FREE**
4. Click **Create Database**
5. **Esperar 2-3 minutos** hasta que esté "Available"

---

### 2️⃣ OBTENER URLs DE CONEXIÓN

Una vez creada la DB, en la página verás:

**External Database URL** (para ejecutar schema desde tu compu):
```
postgres://baco_teatro_user:xxx@dpg-xxxxx-a.oregon-postgres.render.com/baco_teatro
```

**Internal Database URL** (para el backend en Render):
```
postgres://baco_teatro_user:xxx@dpg-xxxxx-a/baco_teatro
```

📝 **COPIA AMBAS URLs** - las vas a necesitar

---

### 3️⃣ EJECUTAR SCHEMA.SQL EN LA BD

Desde tu terminal local o Codespaces:

```bash
# Ir a la carpeta del backend
cd /workspaces/Entradas_de_teatro/baco-teatro-backend

# REEMPLAZAR con tu External URL de Render
export DB_URL="postgres://baco_teatro_user:xxx@dpg-xxxxx-a.oregon-postgres.render.com/baco_teatro"

# Ejecutar schema
psql "$DB_URL" < schema.sql
```

**Si no tienes psql instalado**:
```bash
# Instalar psql
sudo apt update && sudo apt install postgresql-client -y

# Luego ejecutar el comando de arriba
psql "$DB_URL" < schema.sql
```

**Verificar que funcionó**:
```bash
psql "$DB_URL" -c "SELECT phone, name, role FROM users;"

# Debe mostrar:
#      phone       |    name     |  role
# ----------------+-------------+-------
#  +5491100000000 | Super Admin | ADMIN
```

---

### 4️⃣ PREPARAR BACKEND PARA DEPLOY

```bash
cd /workspaces/Entradas_de_teatro/baco-teatro-backend

# Asegurar que package.json tiene el start script
cat package.json | grep '"start"'
# Debe mostrar: "start": "node server.js"
```

**Commit y push a GitHub** (si no lo hiciste):
```bash
cd /workspaces/Entradas_de_teatro
git add .
git commit -m "Backend y app listos para deploy"
git push origin main
```

---

### 5️⃣ CREAR WEB SERVICE EN RENDER

1. Dashboard Render → **New +** → **Web Service**
2. **Connect GitHub** → Autorizar acceso
3. Buscar y seleccionar: **Entradas_de_teatro**
4. Configuración:

   **Basic:**
   - **Name**: `baco-teatro-backend`
   - **Region**: `Oregon (US West)` (mismo que la DB)
   - **Branch**: `main`
   - **Root Directory**: `baco-teatro-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   
   **Plan:**
   - **Instance Type**: `Free`

5. Click **Advanced** → **Add Environment Variable**

   Agregar estas variables:
   
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | [INTERNAL URL de PostgreSQL] |
   | `JWT_SECRET` | [Generar abajo] |
   | `PORT` | `3000` |
   | `NODE_ENV` | `production` |

6. Click **Create Web Service**
7. **Esperar 3-5 minutos** al primer deploy

---

### 6️⃣ GENERAR JWT_SECRET

Ejecutar en terminal:
```bash
openssl rand -hex 32
```

Copiar el resultado (algo como: `a1b2c3d4e5f6...`) y usarlo como `JWT_SECRET`

---

### 7️⃣ VERIFICAR QUE EL BACKEND FUNCIONA

Una vez deployed (verás "Live" en verde):

**URL de tu backend**:
```
https://baco-teatro-backend.onrender.com
```

**Probar health check**:
```bash
curl https://baco-teatro-backend.onrender.com/health
# Debe responder: {"status":"OK","timestamp":"..."}
```

**Probar login admin**:
```bash
curl -X POST https://baco-teatro-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491100000000","password":"admin123"}'

# Debe devolver:
# {"token":"eyJhbGc...","user":{"phone":"+5491100000000","role":"ADMIN","name":"Super Admin"}}
```

✅ Si ves el token → **BACKEND FUNCIONANDO EN PRODUCCIÓN**

---

### 8️⃣ ACTUALIZAR APP MÓVIL CON URL DE PRODUCCIÓN

```bash
cd /workspaces/Entradas_de_teatro/baco-teatro-app
```

Editar `api/api.js`:
```javascript
export const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://baco-teatro-backend.onrender.com';  // ← TU URL DE RENDER
```

**Commit y push**:
```bash
git add api/api.js
git commit -m "URL de producción configurada"
git push origin main
```

---

### 9️⃣ BUILD APK CON BACKEND REAL

```bash
cd /workspaces/Entradas_de_teatro/baco-teatro-app

eas build --platform android --profile production
```

Esperar 10-15 minutos → Descargar APK → ¡Listo! 🎉

---

## 🔧 TROUBLESHOOTING

### "psql: command not found"
```bash
sudo apt update && sudo apt install postgresql-client -y
```

### "Connection refused" al ejecutar schema
- Verificar que copiaste la **External URL** correcta
- Esperar que la DB en Render esté "Available" (verde)

### Backend en Render muestra error
- Ver logs: Dashboard Render → tu Web Service → Logs
- Verificar que `DATABASE_URL` sea la **Internal URL**
- Verificar que `JWT_SECRET` esté configurado

### App móvil no conecta
- Verificar URL en `api/api.js`
- Primera request puede tardar 30s (free tier "despierta")
- Ver errores con: `npx expo start` y chequear consola

---

## 📊 RESUMEN URLS

| Servicio | URL | Uso |
|----------|-----|-----|
| PostgreSQL External | `postgres://...@dpg-xxx-a.oregon...` | Ejecutar schema desde tu compu |
| PostgreSQL Internal | `postgres://...@dpg-xxx-a/...` | Variable `DATABASE_URL` en backend |
| Backend Render | `https://baco-teatro-backend.onrender.com` | API pública, usar en app móvil |

---

## ✅ CHECKLIST DEPLOY

- [ ] PostgreSQL creada en Render
- [ ] Schema ejecutado (usuario admin existe)
- [ ] JWT_SECRET generado
- [ ] Web Service creado con variables de entorno
- [ ] Backend deployed y "Live"
- [ ] Health check responde OK
- [ ] Login admin funciona
- [ ] URL actualizada en app móvil
- [ ] APK buildeado con backend real
- [ ] App instalada y testeada

---

¿Todo claro? ¡Empecemos! 🚀

