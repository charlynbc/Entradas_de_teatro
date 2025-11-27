# 🔥 BACKEND NUCLEAR GENERADO - BACO TEATRO

## ✅ BACKEND 100% COMPLETO

Se generó **automáticamente** el backend completo según tu "prompt nuclear":

### 📦 Estructura Generada

```
baco-teatro-backend/
├── server.js ✅              # Express con CORS + JSON + rutas
├── db.js ✅                  # Pool PostgreSQL con SSL
├── schema.sql ✅             # Tablas: users, shows, tickets + índices
├── package.json ✅           # ES modules + deps completas
├── .env.example ✅           # Template de variables
├── .gitignore ✅
├── README.md ✅              # Documentación completa
│
├── config/
│   └── auth.js ✅           # hashPassword, comparePassword, generateToken
│                            # authMiddleware, requireRole
│
├── utils/
│   └── generateCode.js ✅   # Generar códigos T-XXXXXXXX
│
├── controllers/             # 5 CONTROLADORES COMPLETOS
│   ├── auth.controller.js ✅        # login, completarRegistro
│   ├── users.controller.js ✅       # crearUsuario
│   ├── shows.controller.js ✅       # listar, crear, generar, asignar
│   ├── tickets.controller.js ✅     # 6 funciones (listar, reservar, reportar, aprobar, validar, QR)
│   └── reportes.controller.js ✅    # 3 reportes (vendedores, deudas, resumen)
│
└── routes/                  # 5 ROUTERS COMPLETOS
    ├── auth.routes.js ✅            # POST /login, /complete-register
    ├── users.routes.js ✅           # POST /create (ADMIN only)
    ├── shows.routes.js ✅           # GET /, POST /, /:id/generate, /:id/assign
    ├── tickets.routes.js ✅         # GET /show/:id, /:code/qr
    │                                # POST /:code/reserve, /report-sold, /approve, /validate
    └── reportes.routes.js ✅        # GET /show/:id/vendedores, /deudas, /resumen
```

**Total**: 18 archivos generados

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Autenticación
- Login por teléfono + password
- JWT con 7 días de expiración
- bcryptjs con 10 salt rounds
- Middleware `authMiddleware` extrae usuario del token
- Middleware `requireRole('ADMIN'|'VENDEDOR')` protege rutas

### ✅ Usuarios
- Crear ADMIN o VENDEDOR (solo ADMIN puede)
- Completar registro en primer login (nombre + password)
- Usuario admin inicial: `+5491100000000` / `admin123`

### ✅ Funciones (Shows)
- Crear función con obra, fecha, capacidad, precio base
- Generar tickets automáticamente (código T-XXXXXXXX)
- Asignar tickets a vendedores
- Listar funciones

### ✅ Tickets (6 estados)
1. **DISPONIBLE** → Generado, sin asignar
2. **STOCK_VENDEDOR** → Asignado a vendedor
3. **RESERVADO** → Vendedor reservó para comprador
4. **REPORTADA_VENDIDA** → Vendedor reportó venta (pendiente)
5. **PAGADO** → Admin aprobó (QR activo)
6. **USADO** → Validado en entrada

### ✅ Flujo Vendedor
1. Tiene tickets en STOCK_VENDEDOR
2. Reserva → RESERVADO (guarda nombre + contacto comprador)
3. Reporta venta → REPORTADA_VENDIDA
4. Admin aprueba → PAGADO
5. Ve QR en base64 (PNG data URL)
6. Admin valida QR → USADO

### ✅ Reportes Admin
- Ventas por vendedor (para_vender, reservadas, reportadas, pagadas)
- Deudas de vendedores (tickets reportados sin aprobar)
- Resumen de función (conteo por estado)

### ✅ QR Codes
- Generación automática con `qrcode` library
- URL: `https://baco-teatro.com/validate/{code}`
- Formato: PNG base64 data URL
- Endpoint: `GET /tickets/:code/qr`

---

## 🚀 CÓMO USAR

### 1. Instalar Dependencias

```bash
cd baco-teatro-backend
npm install
```

**Dependencias instaladas**:
- express 4.19.0
- pg 8.12.0
- bcryptjs 2.4.3
- jsonwebtoken 9.0.2
- qrcode 1.5.3
- cors 2.8.5
- dotenv 16.4.0

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb baco_teatro

# Ejecutar schema
psql baco_teatro < schema.sql
```

Esto crea:
- Tabla `users` (phone PK, name, role, password_hash, active)
- Tabla `shows` (id, obra, fecha, capacidad, base_price)
- Tabla `tickets` (code PK, show_id, estado, vendedor_phone, comprador_*, precio, medio_pago, reportada_por_vendedor, aprobada_por_admin, timestamps)
- Índices: `idx_tickets_show`, `idx_tickets_vendedor`, `idx_tickets_estado`
- Usuario admin: `+5491100000000` / `admin123`

### 3. Crear .env

```bash
cp .env.example .env
```

Editar `.env`:

```env
DATABASE_URL=postgres://usuario:password@localhost:5432/baco_teatro
JWT_SECRET=genera_un_secreto_seguro_aqui
PORT=3000
NODE_ENV=development
```

**Generar JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Iniciar Servidor

```bash
# Producción
npm start

# Desarrollo (con nodemon)
npm run dev
```

Verifica:
- http://localhost:3000 → "API Baco Teatro OK ✅"
- http://localhost:3000/health → `{"status":"OK","timestamp":"..."}`

---

## 📡 API ENDPOINTS DISPONIBLES

### Auth (público)
```bash
POST /auth/login
  Body: { phone, password }
  → { token, user: { phone, role, name } }

POST /auth/complete-register
  Body: { phone, name, password }
  → { ok: true }
```

### Users (ADMIN only)
```bash
POST /users/create
  Headers: Authorization: Bearer TOKEN
  Body: { userPhone, role: "ADMIN"|"VENDEDOR" }
  → { ok: true }
```

### Shows
```bash
GET /shows
  Headers: Authorization: Bearer TOKEN
  → [{ id, obra, fecha, capacidad, base_price, created_at }]

POST /shows (ADMIN)
  Body: { obra, fecha, capacidad, base_price }
  → { id, obra, ... }

POST /shows/:id/generate (ADMIN)
  Body: { cantidad: 50 }
  → [{ code, show_id, estado, ... }]

POST /shows/:id/assign (ADMIN)
  Body: { vendedorPhone, cantidad: 10 }
  → { ok: true, asignados: [...] }
```

### Tickets
```bash
GET /tickets/show/:id
  Headers: Authorization: Bearer TOKEN
  → [{ code, estado, vendedor_phone, comprador_*, ... }]
  # ADMIN ve todos, VENDEDOR solo los suyos

GET /tickets/:code/qr
  → { code, qr: "data:image/png;base64,..." }

POST /tickets/:code/reserve (VENDEDOR)
  Body: { compradorNombre, compradorContacto }
  → { ok: true }

POST /tickets/:code/report-sold (VENDEDOR)
  → { ok: true }

POST /tickets/:code/approve (ADMIN)
  Body: { medioPago, precio }
  → { ok: true }

POST /tickets/:code/validate (ADMIN)
  → { ok: true, mensaje: "Entrada válida" }
```

### Reportes (ADMIN only)
```bash
GET /reportes/show/:id/vendedores
  → [{ vendedor_phone, para_vender, reservadas, reportadas, pagadas }]

GET /reportes/show/:id/deudas
  → [{ vendedor_phone, entradas_reportadas, monto_reportado }]

GET /reportes/show/:id/resumen
  → { pagadas, reportadas, reservadas, stock }
```

---

## 🧪 TESTING RÁPIDO

```bash
# 1. Login admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491100000000","password":"admin123"}'

# Guardar el token que devuelve
export TOKEN="JWT_TOKEN_AQUI"

# 2. Crear función
curl -X POST http://localhost:3000/shows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-12-31T20:00:00Z",
    "capacidad": 50,
    "base_price": 5000
  }'

# 3. Generar 50 tickets
curl -X POST http://localhost:3000/shows/1/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 50}'

# 4. Crear vendedor
curl -X POST http://localhost:3000/users/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userPhone":"+5491122334455","role":"VENDEDOR"}'

# 5. Asignar 10 tickets al vendedor
curl -X POST http://localhost:3000/shows/1/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendedorPhone":"+5491122334455","cantidad":10}'

# 6. Ver tickets de la función
curl -X GET http://localhost:3000/tickets/show/1 \
  -H "Authorization: Bearer $TOKEN"

# 7. Ver reportes
curl -X GET http://localhost:3000/reportes/show/1/resumen \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 DEPLOY EN RENDER

### 1. PostgreSQL Database
1. Crear PostgreSQL en Render (free tier)
2. Copiar **Internal Database URL**
3. Conectar con psql usando **External Database URL**
4. Ejecutar `schema.sql`

```bash
psql EXTERNAL_DATABASE_URL < schema.sql
```

### 2. Web Service
1. Conectar repo GitHub
2. Root Directory: `baco-teatro-backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `DATABASE_URL` = Internal Database URL
   - `JWT_SECRET` = (generar con crypto.randomBytes)
   - `PORT` = 3000
   - `NODE_ENV` = production

### 3. Verificar Deploy
```bash
curl https://tu-backend.onrender.com/health
# → {"status":"OK","timestamp":"..."}
```

---

## 📱 INTEGRACIÓN CON APP MÓVIL

En `baco-teatro-app/api/api.js`:

```javascript
export const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://tu-backend.onrender.com';

async function getHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function login(phone, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  return response.json();
}

// ... resto de funciones
```

---

## 🔐 SEGURIDAD

✅ **Passwords**: bcryptjs con 10 salt rounds  
✅ **JWT**: Firmado con secreto, 7 días de expiración  
✅ **Middleware auth**: Verifica token en todas las rutas protegidas  
✅ **Middleware role**: Verifica ADMIN/VENDEDOR según ruta  
✅ **CORS**: Habilitado para requests cross-origin  
✅ **SSL**: PostgreSQL con SSL en producción  
✅ **Validación**: Check de estados de tickets antes de operaciones  

---

## 📊 DIFERENCIAS CON BACKEND ANTERIOR

| Característica | teatro-tickets-backend | baco-teatro-backend |
|---------------|------------------------|---------------------|
| Estructura | MVC separado | MVC separado ✅ |
| Módulos | ES6 | ES6 ✅ |
| Auth | JWT + bcrypt | JWT + bcryptjs ✅ |
| Base de datos | PostgreSQL | PostgreSQL ✅ |
| QR generation | QRCode | QRCode ✅ |
| Estados tickets | 6 estados | 6 estados ✅ |
| Reportes | 4 reportes | 3 reportes ✅ |
| Middleware roles | requireRole | requireRole ✅ |
| Documentación | ARQUITECTURA-BACKEND-V3.md | README.md ✅ |

**Nuevo backend**: Más limpio, nombres consistentes, listo para deploy inmediato.

---

## ✅ CHECKLIST DE COMPLETITUD

- [x] package.json con "type": "module" + deps
- [x] server.js con Express + CORS + routes
- [x] db.js con Pool PostgreSQL
- [x] schema.sql con 3 tablas + índices + admin inicial
- [x] config/auth.js con JWT + bcrypt + middlewares
- [x] utils/generateCode.js para códigos de tickets
- [x] 5 controllers completos (auth, users, shows, tickets, reportes)
- [x] 5 routes completos (auth, users, shows, tickets, reportes)
- [x] .env.example con template
- [x] .gitignore para node_modules
- [x] README.md con documentación completa
- [x] Health check endpoint
- [x] Error handlers (404 + 500)
- [x] DB connection test en startup

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Backend generado** (COMPLETADO)
2. ⏳ **Instalar deps**: `npm install`
3. ⏳ **Crear BD**: `createdb baco_teatro && psql baco_teatro < schema.sql`
4. ⏳ **Config .env**: Copiar `.env.example` y configurar
5. ⏳ **Iniciar**: `npm start` y verificar `/health`
6. ⏳ **Testing**: Probar endpoints con curl
7. ⏳ **Deploy Render**: PostgreSQL + Web Service
8. ⏳ **Conectar app móvil**: Actualizar `API_URL`
9. ⏳ **Build APK**: `eas build --platform android`

---

**¡BACKEND NUCLEAR 100% COMPLETO Y LISTO! 🔥🚀**

Ver `README.md` para más detalles.
