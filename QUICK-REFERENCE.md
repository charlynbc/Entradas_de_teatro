# 📖 GUÍA DE REFERENCIA RÁPIDA - BACÓ TEATRO

**Cheat sheet para operaciones comunes**

---

## 🔧 SETUP INICIAL (Dev)

```bash
# 1. Clonar y entrar
git clone https://github.com/charlynbc/Entradas_de_teatro.git
cd Entradas_de_teatro

# 2. Instalar dependencias
cd teatro-tickets-backend && npm install
cd ../baco-teatro-app && npm install
cd ..

# 3. Configurar BD (Docker)
npm --prefix teatro-tickets-backend run db:start

# 4. Inicializar BD
npm --prefix teatro-tickets-backend run db:init
npm --prefix teatro-tickets-backend run db:migrate-phone-fk

# 5. Crear usuario SUPER
npm --prefix teatro-tickets-backend run init-super
# Input: Cédula, nombre, contraseña

# 6. Iniciar servidor
npm --prefix teatro-tickets-backend run dev
# Backend en: http://localhost:3000

# 7. En otra terminal: iniciar frontend
npm --prefix baco-teatro-app run dev
# Frontend en: http://localhost:5173 (o lo que diga)
```

---

## 🧪 TESTING

```bash
# Todos los tests
npm --prefix teatro-tickets-backend run test:all

# Tests específicos
npm --prefix tests run test:super-usuario
npm --prefix tests run test:director
npm --prefix tests run test:vendedores
npm --prefix tests run test:invitados
npm --prefix tests run test:actor-e2e  # FLUJO COMPLETO

# Tests con limpiar BD antes
npm --prefix teatro-tickets-backend run db:clean
npm --prefix teatro-tickets-backend run db:init
npm --prefix tests run test:all
```

---

## 🗄️ BASE DE DATOS

```bash
# Iniciar BD (Docker)
npm --prefix teatro-tickets-backend run db:start

# Parar BD
npm --prefix teatro-tickets-backend run db:stop

# Ver logs BD
docker logs -f teatro-postgres

# Conectar a BD (psql)
psql -h localhost -U postgres -d teatro -W
# Password: postgres

# Limpiar BD (borrar datos excepto SUPER)
npm --prefix teatro-tickets-backend run db:clean

# Reset completo
npm --prefix teatro-tickets-backend run db:stop
npm --prefix teatro-tickets-backend run db:start
npm --prefix teatro-tickets-backend run db:init
npm --prefix teatro-tickets-backend run db:migrate-phone-fk
```

---

## 🔐 SEGURIDAD

```bash
# Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verificar .env no tiene secrets públicos
grep -n "JWT_SECRET\|PASSWORD" teatro-tickets-backend/.env

# Validar sistema (script)
./scripts/validar-produccion.sh
```

---

## 🚀 DEPLOYMENT

```bash
# Backend (Render)
# 1. Crear Web Service desde repo
# 2. Environment variables:
#    DATABASE_URL=postgres://...
#    JWT_SECRET=<generar_aleatorio>
#    NODE_ENV=production
#    FRONTEND_URL=https://mi-frontend.com

# Frontend (Netlify)
# 1. Conectar repo (baco-teatro-app)
# 2. Build: npm run build
# 3. Publish: dist
# 4. Environment:
#    REACT_APP_API_URL=https://teatro-backend.onrender.com/api

# Validar deployment
curl https://teatro-backend.onrender.com/health
curl https://mi-frontend.netlify.app
```

---

## 📊 API ENDPOINTS

### Públicos (sin auth)
```
GET  /api/funciones/publicas       → Cartelera
GET  /public/funciones              → Alias
GET  /public/funciones/:id/vendedores → Contactos
```

### Auth
```
POST /api/auth/login                → Obtener token
GET  /api/auth/verificar            → Verificar token
```

### Grupos (SUPER, ADMIN)
```
POST /api/grupos                    → Crear
GET  /api/grupos                    → Listar
GET  /api/grupos/:id                → Detalle
PUT  /api/grupos/:id                → Actualizar
POST /api/grupos/:id/cerrar-definitivo → Cierre
GET  /api/grupos/:id/liquidacion    → Liquidación
GET  /api/grupos/:id/liquidacion/pdf → PDF
```

### Tickets (ACTOR vende, SUPER/ADMIN cobran)
```
GET  /api/tickets/mis-tickets       → Stock ACTOR
POST /api/tickets/asignar           → SUPER asigna
POST /api/tickets/transferir        → ACTOR transfiere
POST /api/tickets/reportar-venta    → VENDEDOR reporta
POST /api/tickets/:code/cobrar      → SUPER aprueba
GET  /api/tickets/validar/:code     → Validar QR
```

---

## 🔍 DEBUGGING

```bash
# Ver logs backend
tail -f logs/backend.log  # O revisar Render dashboard

# Ver logs frontend
console.log en DevTools

# Problemas de conexión
curl -v http://localhost:3000/api
# Debe retornar 200 con {"ok":true,...}

# JWT inválido
# Verificar:
# 1. Token en header: Authorization: Bearer <token>
# 2. JWT_SECRET igual en servidor
# 3. Token no expirado (exp claim)

# CORS blocked
# Verificar:
# 1. FRONTEND_URL configurado en .env
# 2. Headers en respuesta: Access-Control-Allow-Origin
# 3. Métodos permitidos

# BD no conecta
# 1. Verificar DATABASE_URL
# 2. Verificar BD está corriendo: docker ps
# 3. Logs: docker logs teatro-postgres
```

---

## 📁 ESTRUCTURA CLAVE

```
teatro-tickets-backend/
├─ index-v3-postgres.js      ← Servidor main
├─ routes/                    ← API routes
├─ controllers/               ← Lógica negocio
├─ middleware/                ← Auth, validations
├─ db/                        ← Schema, migrations
├─ .env.example               ← Template vars
└─ package.json               ← Dependencies

baco-teatro-app/
├─ App.js                     ← App main
├─ screens/                   ← Páginas
├─ contexts/                  ← State management
├─ api/client.js              ← API config
├─ public/                    ← HTML statics
└─ package.json               ← Dependencies
```

---

## 🔐 VARIABLES DE ENTORNO

```bash
# CRÍTICAS
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=<generar_aleatorio_32_chars>

# IMPORTANTES
NODE_ENV=development|production
FRONTEND_URL=http://localhost:3000 (o https://mi-dominio.com)

# OPCIONALES
PORT=3000
BASE_URL=http://localhost:3000
```

---

## 📋 CHECKLIST ANTES DE PRODUCCIÓN

- [ ] JWT_SECRET generado (aleatorio 32+)
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL configurado
- [ ] DATABASE_URL válido (SSL en prod)
- [ ] Migraciones ejecutadas
- [ ] Tests pasan (npm run test:all)
- [ ] BD integridad validada
- [ ] Logs configurados
- [ ] CORS restringido
- [ ] Error handling sin stacks

---

## 💡 TIPS Y TRUCOS

```bash
# Resetear contraseña SUPER
npm --prefix teatro-tickets-backend run reset-super-password

# Ver estadísticas BD
psql -h localhost -U postgres -d teatro -c "SELECT COUNT(*) FROM users"

# Limpiar tickets anulados antiguos
# (En implementación)

# Backup BD
pg_dump -h localhost -U postgres -d teatro > backup_teatro.sql

# Restaurar desde backup
psql -h localhost -U postgres -d teatro < backup_teatro.sql

# Generar reporte CSV
# (Disponible en /api/reportes/export)
```

---

## 🆘 SOS - PROBLEMAS COMUNES

```bash
# Error: "DATABASE_URL not found"
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro

# Error: "ECONNREFUSED localhost:5432"
npm --prefix teatro-tickets-backend run db:start

# Error: "Cannot find module"
npm install (en carpeta correcta)

# Error: "Migration failed"
npm --prefix teatro-tickets-backend run db:init
npm --prefix teatro-tickets-backend run db:migrate-phone-fk

# Frontend no conecta a API
Verificar REACT_APP_API_URL en .env
Verificar CORS en backend (.env FRONTEND_URL)

# Test falla
Limpiar BD: npm --prefix teatro-tickets-backend run db:clean
Re-inicializar: npm --prefix teatro-tickets-backend run db:init
Re-ejecutar test
```

---

## 📞 CONTACTO Y DOCS

- **README:** teatro-tickets-backend/README.md
- **Deploy:** DEPLOYMENT_GUIDE.md
- **Auditoría:** REPORTE-AUDITORIA-PRODUCCION.md
- **Estado:** ESTADO-PRODUCCION-FINAL.md
- **Email:** bacoteatro@montevideo.com.uy

---

**Última actualización:** 2025-12-30  
**Versión:** 3.0.0
