# 🚀 DEPLOYMENT GUIDE - BACÓ TEATRO

**Guía paso a paso para desplegar en producción**  
Backend: Render | Frontend: Netlify | Database: Render PostgreSQL

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- [ ] JWT_SECRET generado
- [ ] Tests pasan localmente
- [ ] BD limpia en staging
- [ ] .env.example actualizado
- [ ] Error handling verificado
- [ ] CORS configurado

---

## PARTE 1: BASE DE DATOS (Render PostgreSQL)

### Paso 1.1: Crear BD PostgreSQL en Render

1. Ir a https://render.com
2. Dashboard → New → PostgreSQL
3. Configurar:
   - **Name:** `teatro-postgres` (o similar)
   - **Database:** `teatro`
   - **User:** `postgres` (dejar default)
   - **Region:** Elegir closest (ej: Miami/São Paulo)
   - **Plan:** Free o Starter
4. Click **Create Database**
5. Esperar ~2 minutos a que esté lista
6. Copiar **Internal Database URL** (para app backend)

### Paso 1.2: Salvar Credenciales
```
DATABASE_URL: postgres://user:password@host:5432/teatro
```

---

## PARTE 2: BACKEND (Render Node.js)

### Paso 2.1: Preparar Repositorio

```bash
# 1. Asegurar que .env.example está actualizado
cat teatro-tickets-backend/.env.example

# Debe tener:
NODE_ENV=development
DATABASE_URL=postgres://user:pass@host/dbname
JWT_SECRET=cambiar_en_produccion_minimo_32_caracteres_aleatorios
FRONTEND_URL=http://localhost:3000
PORT=3000
```

### Paso 2.2: Crear Backend en Render

1. Ir a https://render.com
2. Dashboard → New → Web Service
3. Conectar repositorio GitHub
   - Seleccionar: `charlynbc/Entradas_de_teatro`
   - Branch: `main` (o el que uses)
4. Configurar Servicio:
   - **Name:** `teatro-backend`
   - **Runtime:** Node
   - **Build Command:** `cd teatro-tickets-backend && npm install`
   - **Start Command:** `cd teatro-tickets-backend && npm start`
   - **Plan:** Free (para testing) o Starter (recomendado)
5. Click **Advanced**

### Paso 2.3: Configurar Variables de Entorno

En **Environment Variables**:
```
DATABASE_URL = postgres://user:password@host:5432/teatro
JWT_SECRET = <GENERAR_ALEATORIO>
NODE_ENV = production
FRONTEND_URL = https://tu-frontend.com
BASE_URL = https://teatro-backend.onrender.com
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 2.4: Crear Servicio
- Click **Create Web Service**
- Esperar a que build termine (5-10 minutos)
- Verificar:
  ```bash
  curl https://teatro-backend.onrender.com/api
  # Debe retornar: {"ok":true,"name":"Baco Teatro API","version":"3.0.0"}
  ```

### Paso 2.5: Inicializar BD en Producción

Una vez que backend esté deployado:

```bash
# En tu máquina local:
export RENDER_URL="https://teatro-backend.onrender.com"

# 1. Inicializar schema
curl -X POST $RENDER_URL/api/db/init \
  -H "Authorization: Bearer <JWT_SUPER>"

# 2. Aplicar migraciones
curl -X POST $RENDER_URL/api/db/migrate \
  -H "Authorization: Bearer <JWT_SUPER>"

# 3. Crear usuario SUPER
curl -X POST $RENDER_URL/api/auth/create-super \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "TU_CEDULA",
    "nombre": "Tu Nombre",
    "password": "contraseña_segura"
  }'
```

**Alternativa:** SSH a Render y ejecutar:
```bash
npm run init-supremo
npm run db:migrate-phone-fk
```

---

## PARTE 3: FRONTEND (Netlify)

### Paso 3.1: Build Frontend

En VS Code, en `/baco-teatro-app/`:
```bash
# 1. Instalar dependencias
npm install

# 2. Build para producción
npm run build
# Crea carpeta: dist/

# 3. Verificar archivo config
cat src/api/client.js
# Debe tener: const API_URL = process.env.REACT_APP_API_URL || 'https://teatro-backend.onrender.com/api'
```

### Paso 3.2: Crear en Netlify

1. Ir a https://netlify.com
2. Conectar repositorio GitHub
   - Seleccionar: `charlynbc/Entradas_de_teatro`
3. Configurar:
   - **Base directory:** `baco-teatro-app`
   - **Build command:** `npm run build`
   - **Publish directory:** `baco-teatro-app/dist`
4. **Advanced Settings** → Environment Variables:
   ```
   REACT_APP_API_URL = https://teatro-backend.onrender.com/api
   REACT_APP_BASE_URL = https://baco-teatro.com (tu dominio)
   ```
5. Click **Deploy**

### Paso 3.3: Configurar Dominio Personalizado (Opcional)

En Netlify Dashboard:
- Site settings → Domain management → Add custom domain
- Apuntar DNS a Netlify (Netlify te da instrucciones)

---

## PARTE 4: VALIDAR DEPLOYMENT

### Checklist de Verificación

```bash
# 1. Backend accesible
curl https://teatro-backend.onrender.com/api
# ✅ {"ok":true,...}

# 2. BD conectada
curl https://teatro-backend.onrender.com/health
# ✅ {"status":"ok","database":"connected"}

# 3. Login funciona
curl -X POST https://teatro-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"111111","password":"super123"}'
# ✅ {"token":"eyJ...","user":{...}}

# 4. Frontend carga
open https://baco-teatro.com (o netlify preview)
# ✅ Página principal carga, login accesible

# 5. CORS funcionando
# En DevTools del navegador:
# ℹ️ Requests a /api deben tener header: Access-Control-Allow-Origin

# 6. JWT_SECRET no expuesto
curl https://teatro-backend.onrender.com/
# ❌ NO debe contener JWT_SECRET en respuesta
```

---

## PARTE 5: MONITOREO Y MANTENIMIENTO

### Logs

**Backend (Render):**
```
Dashboard → Service → Logs
```

**Frontend (Netlify):**
```
Deploys → View logs
```

### Escalabilidad

- **Backend:** Cambiar plan a "Standard" si muchos usuarios
- **BD:** Cambiar a "Standard" si más de 1GB datos
- **Frontend:** Netlify auto-escala

### Backups

**PostgreSQL en Render:**
1. Dashboard → Database → Backups
2. Crear backup manual antes de cambios críticos
3. Configurar backups automáticos (cada 24h)

### Monitoreo de Uptime (Recomendado)

```bash
# Usar servicio como UptimeRobot:
# - Monitor: https://teatro-backend.onrender.com/health
# - Intervalo: Cada 5 minutos
# - Alert si status != 200
```

---

## 🔧 TROUBLESHOOTING DEPLOYMENT

### Error: `DATABASE_URL` no configurada
```
Solución: En Render Web Service Environment Variables
Agregar: DATABASE_URL = <valor_copiado>
```

### Error: `ECONNREFUSED` a BD
```
Solución:
1. Verificar DATABASE_URL es correcta
2. Esperar a que BD Render esté activa (2+ minutos)
3. Reiniciar servicio: Service → Manual Deploy
```

### Error: `CORS blocked` desde frontend
```
Solución en .env backend:
FRONTEND_URL=https://tu-dominio-netlify.com
```

### Error: `JWT inválido` (401)
```
Verificar:
1. JWT_SECRET igual en backend
2. Token se envía en header: Authorization: Bearer <token>
3. Token no expirado (exp claim)
```

### Render App Crashes después de deploy
```
Verificar logs:
1. Ir a Service → Logs
2. Buscar "Error" o "throw"
3. Común: Database URL falta, puerto ocupado
4. Solución: npm install || falló, o BUILD_COMMAND mal
```

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────┐
│ Browser Cliente │
└────────┬────────┘
         │ HTTPS
         ▼
┌──────────────────────────┐
│  Frontend (Netlify)      │
│  baco-teatro.com         │
│  Hosting: static files   │
└────────┬─────────────────┘
         │ API requests
         ▼
┌──────────────────────────┐
│  Backend (Render Node)   │
│  teatro-backend.*        │
│  Port: 3000 → managed    │
│  ./teatro-tickets-backend│
└────────┬─────────────────┘
         │ SQL
         ▼
┌──────────────────────────┐
│  PostgreSQL (Render)     │
│  teatro-postgres         │
│  Host: *.render.internal │
└──────────────────────────┘
```

---

## 🚨 POST-DEPLOYMENT

### Inmediato (Primeras 24h)

1. **Testear flujo completo:**
   - Login SUPER
   - Crear grupo
   - Crear obra + función
   - Asignar stock
   - Reportar venta
   - Aprobar pago
   - Cierre grupo + liquidación

2. **Monitorear logs:**
   - Render logs cada hora
   - Buscar errores/warnings

3. **Verificar BD:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM funciones;
   SELECT COUNT(*) FROM tickets;
   -- Debe haber datos de test
   ```

### Semanal

- Revisar logs de errores
- Verificar uptime (debe ser >99%)
- Hacer backup manual antes de cambios

### Mensual

- Limpiar tickets anulados antiguos
- Verificar tamaño BD
- Review de seguridad (JWT_SECRET, CORS)

---

## 🔐 SEGURIDAD POST-DEPLOY

✅ Checklist:
- [ ] JWT_SECRET es aleatorio (no `teatro-baco-secret-2024`)
- [ ] NODE_ENV=production
- [ ] DATABASE_URL usa SSL (`?sslmode=require`)
- [ ] CORS restringido a FRONTEND_URL
- [ ] Error handling no expone stacks
- [ ] Logs no contienen datos sensibles
- [ ] HTTPS forzado en frontend
- [ ] Cookies + session seguras

---

## 📞 SOPORTE

Si algo falla:

1. **Render Support:** support@render.com
2. **Netlify Support:** support@netlify.com
3. **Local Testing:** Reproduce error en `npm run dev` local
4. **Logs:** `Render Logs` + `Netlify Deploy logs`

---

**Guía creada:** 2025-12-30  
**Última revisión:** 2025-12-30  
**Estatus:** ✅ Listo para producción
