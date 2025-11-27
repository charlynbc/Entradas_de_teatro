# 🏗️ Arquitectura Backend v3.0 Refactorizada

## 📁 Estructura de carpetas

```
teatro-tickets-backend/
├── config/
│   └── auth.js                 # bcrypt + JWT (hashPassword, generateToken, verifyToken)
│
├── middleware/
│   └── auth.middleware.js      # authenticate() + requireRole('ADMIN'|'VENDEDOR')
│
├── controllers/
│   ├── auth.controller.js      # login, completarRegistro, verificarToken
│   ├── users.controller.js     # crearUsuario, listarUsuarios, listarVendedores
│   ├── shows.controller.js     # crearShow, listarShows, asignarTickets
│   ├── tickets.controller.js   # reservar, reportar, aprobar, QR, validar, buscar
│   └── reportes.controller.js  # resumenAdmin, deudores, resumenPorVendedor
│
├── routes/
│   ├── auth.routes.js          # /api/auth/*
│   ├── users.routes.js         # /api/users/*
│   ├── shows.routes.js         # /api/shows/*
│   ├── tickets.routes.js       # /api/tickets/*
│   └── reportes.routes.js      # /api/reportes/*
│
├── utils/
│   └── generateCode.js         # Generador de códigos T-XXXXXXXX
│
├── db.js                       # Pool de PostgreSQL (ES6 exports)
├── index-v3-refactored.js      # Servidor principal con todas las rutas
├── schema.sql                  # Base de datos completa
└── package.json                # type: "module" + dependencies
```

---

## 🔐 Sistema de Autenticación

### 1. Registro inicial (admin crea vendedor)

```bash
POST /api/users
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "phone": "+5491155667788",
  "name": "Juan Actor",
  "role": "VENDEDOR"
}
```

→ Usuario creado **sin password** (password_hash = NULL)

### 2. Primera vez (vendedor completa registro)

```bash
POST /api/auth/completar-registro
Content-Type: application/json

{
  "phone": "+5491155667788",
  "name": "Juan Pérez",
  "password": "miPassword123"
}
```

→ Devuelve JWT token

### 3. Login normal

```bash
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+5491155667788",
  "password": "miPassword123"
}
```

→ Devuelve:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "phone": "+5491155667788",
    "role": "VENDEDOR",
    "name": "Juan Pérez"
  }
}
```

### 4. Uso del token

Todas las rutas protegidas requieren:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El middleware `authenticate` decodifica el token y pone `req.user`:
```javascript
req.user = {
  phone: '+5491155667788',
  role: 'VENDEDOR',
  name: 'Juan Pérez'
}
```

---

## 🎭 Flujo completo de tickets

### Admin crea función
```bash
POST /api/shows
Authorization: Bearer <token_admin>

{
  "obra": "Hamlet",
  "fecha": "2024-03-15T20:00:00Z",
  "lugar": "Teatro Nacional",
  "capacidad": 100,
  "base_price": 15000
}
```

→ Se generan automáticamente 100 tickets en estado `DISPONIBLE` con QR

### Admin asigna tickets a actor
```bash
POST /api/shows/1/assign-tickets
Authorization: Bearer <token_admin>

{
  "vendedor_phone": "+5491155667788",
  "cantidad": 10
}
```

→ 10 tickets pasan a estado `STOCK_VENDEDOR`

### Actor ve sus tickets
```bash
GET /api/tickets/mis-tickets
Authorization: Bearer <token_actor>
```

→ Respuesta:
```json
{
  "vendedor_phone": "+5491155667788",
  "total": 10,
  "en_stock": 8,
  "reservadas": 2,
  "reportadas_vendidas": 0,
  "pagadas": 0,
  "tickets": [
    {
      "code": "T-A1B2C3D4",
      "estado": "STOCK_VENDEDOR",
      "obra": "Hamlet",
      "fecha": "2024-03-15T20:00:00Z",
      "qr_code": "data:image/png;base64,..."
    }
  ]
}
```

### Actor descarga QR
```bash
GET /api/tickets/T-A1B2C3D4/qr
Authorization: Bearer <token_actor>
```

→ Respuesta:
```json
{
  "code": "T-A1B2C3D4",
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**App móvil:**
- Muestra el QR en pantalla
- Permite guardar en galería
- Permite compartir por WhatsApp/Instagram/Email

### Actor reserva ticket para comprador
```bash
POST /api/tickets/T-A1B2C3D4/reserve
Authorization: Bearer <token_actor>

{
  "comprador_nombre": "María López",
  "comprador_contacto": "+5491199887766"
}
```

→ Estado: `STOCK_VENDEDOR` → `RESERVADO`

### Actor cobra y reporta venta
```bash
POST /api/tickets/T-A1B2C3D4/report-sold
Authorization: Bearer <token_actor>
```

→ Estado: `RESERVADO` → `REPORTADA_VENDIDA`
→ Flag `reportada_por_vendedor = TRUE`
→ **Ahora el actor le debe plata al admin**

### Admin ve quién le debe
```bash
GET /api/reportes/shows/1/deudores
Authorization: Bearer <token_admin>
```

→ Respuesta:
```json
{
  "show_id": 1,
  "total_deuda": 30000,
  "vendedores_deudores": [
    {
      "vendedor_phone": "+5491155667788",
      "vendedor_nombre": "Juan Pérez",
      "reportadas_vendidas": 2,
      "monto_reportado": 30000,
      "monto_aprobado": 0,
      "monto_debe": 30000
    }
  ]
}
```

### Admin aprueba pago (actor entregó la plata)
```bash
POST /api/tickets/T-A1B2C3D4/approve-payment
Authorization: Bearer <token_admin>

{
  "medio_pago": "Efectivo",
  "precio": 15000
}
```

→ Estado: `REPORTADA_VENDIDA` → `PAGADO`
→ Flag `aprobada_por_admin = TRUE`
→ **Actor ya no debe nada**

### Día de función: validar ticket en puerta
```bash
POST /api/tickets/T-A1B2C3D4/validate
Authorization: Bearer <token_admin>
```

→ Estado: `PAGADO` → `USADO`

---

## 📊 Endpoints de reportes

### Resumen general de función
```bash
GET /api/reportes/shows/1/resumen-admin
Authorization: Bearer <token_admin>
```

```json
{
  "id": 1,
  "obra": "Hamlet",
  "disponibles": 50,
  "en_stock_vendedores": 20,
  "reservadas": 5,
  "reportadas_sin_aprobar": 10,
  "pagadas": 15,
  "usadas": 0,
  "recaudacion_teorica": 375000,
  "recaudacion_real": 225000,
  "pendiente_aprobar": 150000
}
```

### Por vendedor
```bash
GET /api/reportes/shows/1/resumen-por-vendedor
Authorization: Bearer <token_admin>
```

```json
[
  {
    "vendedor_phone": "+5491155667788",
    "vendedor_nombre": "Juan Pérez",
    "para_vender": 8,
    "reservadas": 2,
    "reportadas_vendidas": 5,
    "pagadas": 5,
    "usadas": 0,
    "monto_reportado": 150000,
    "monto_aprobado": 75000,
    "monto_debe": 75000
  }
]
```

---

## 🎨 Protección de rutas

### Rutas públicas (sin auth):
- `GET /` - Info de la API
- `GET /health` - Health check
- `GET /validar/:code` - Página HTML para validar QR (día de función)

### Rutas con auth (sin restricción de rol):
- `POST /api/auth/login`
- `POST /api/auth/completar-registro`
- `GET /api/auth/verificar`
- `GET /api/tickets/:code/qr` - Cualquier usuario autenticado puede ver su QR

### Solo ADMIN:
- `POST /api/users` - Crear usuarios
- `GET /api/users` - Listar todos
- `DELETE /api/users/:phone` - Desactivar usuario
- `POST /api/shows` - Crear función
- `POST /api/shows/:id/assign-tickets` - Asignar tickets
- `POST /api/tickets/:code/approve-payment` - Aprobar pago
- `GET /api/tickets/search` - Buscar tickets
- `POST /api/tickets/:code/validate` - Validar en puerta
- `GET /api/reportes/*` - Todos los reportes

### Solo VENDEDOR:
- `GET /api/tickets/mis-tickets` - Ver mis tickets
- `POST /api/tickets/:code/reserve` - Reservar
- `POST /api/tickets/:code/report-sold` - Reportar venta
- `POST /api/tickets/:code/transfer` - Transferir a otro vendedor

### Ambos roles:
- `GET /api/users/vendedores` - Listar vendedores
- `GET /api/shows` - Listar funciones

---

## 🔥 Variables de entorno

### Desarrollo local:
```bash
# No es necesario configurar nada, usa defaults:
DATABASE_URL=postgresql://localhost:5432/baco_teatro
JWT_SECRET=teatro-baco-secret-2024
PORT=3000
BASE_URL=http://localhost:3000
```

### Producción (Render):
```bash
DATABASE_URL=postgres://user:pass@host.render.com/database
JWT_SECRET=un-secret-aleatorio-muy-largo-y-seguro-2024
PORT=10000
BASE_URL=https://teatro-backend.onrender.com
NODE_ENV=production
```

---

## 🚀 Cómo ejecutar

### 1. Instalar dependencias
```bash
cd teatro-tickets-backend
npm install
```

### 2. Configurar PostgreSQL
```bash
# Crear base de datos
createdb baco_teatro

# Ejecutar schema
psql -d baco_teatro -f schema.sql
```

### 3. Iniciar servidor
```bash
# Con defaults
node index-v3-refactored.js

# O con variables personalizadas
DATABASE_URL="postgresql://localhost:5432/baco_teatro" \
JWT_SECRET="mi-secret-super-secreto" \
node index-v3-refactored.js
```

→ Servidor corriendo en `http://localhost:3000`

---

## 📝 Testing con curl

### Crear admin (primera vez, sin auth)
```bash
# Primero insertar manualmente en la DB:
psql -d baco_teatro -c "
  INSERT INTO users (phone, name, role, password_hash) 
  VALUES ('+5491122334455', 'Admin Principal', 'ADMIN', NULL);
"

# Completar registro
curl -X POST http://localhost:3000/api/auth/completar-registro \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491122334455",
    "name": "Admin Principal",
    "password": "admin123"
  }'
```

→ Guarda el `token` que te devuelve

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491122334455",
    "password": "admin123"
  }'
```

### Crear función (con token)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/shows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-03-15T20:00:00Z",
    "lugar": "Teatro Nacional",
    "capacidad": 50,
    "base_price": 15000
  }'
```

---

## 🎯 Ventajas de esta arquitectura

### ✅ Separación de responsabilidades
- **Controladores**: Lógica de negocio
- **Rutas**: Solo configuración de endpoints
- **Middleware**: Autenticación/autorización reutilizable
- **Utils**: Funciones helper

### ✅ Seguridad
- **JWT**: Tokens con expiración (30 días)
- **bcrypt**: Hash de passwords con 10 salt rounds
- **Roles**: ADMIN y VENDEDOR con permisos diferentes
- **SQL injection**: Queries parametrizadas

### ✅ Mantenibilidad
- Cada archivo < 200 líneas
- Fácil agregar nuevos endpoints
- Fácil testear cada controlador por separado

### ✅ Escalabilidad
- PostgreSQL con Pool de conexiones
- SSL para Render
- Listo para agregar Redis/cache si es necesario

---

## 🐛 Debugging

### Ver todas las queries SQL
Las queries se loguean automáticamente en consola:
```
🔍 Query ejecutada { text: 'SELECT * FROM users WHERE phone = $1', duration: 12, rows: 1 }
```

### Verificar token JWT
```bash
curl http://localhost:3000/api/auth/verificar \
  -H "Authorization: Bearer $TOKEN"
```

### Verificar conexión a DB
```bash
curl http://localhost:3000/health
```

---

**🎭 Sistema Baco Teatro v3.0 - Backend refactorizado listo para producción**
