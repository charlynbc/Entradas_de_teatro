# 🎭 Baco Teatro Backend

Backend completo en **Node.js + Express + PostgreSQL** para sistema de tickets de teatro.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Crear base de datos
createdb baco_teatro
psql baco_teatro < schema.sql

# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev
```

## 📦 Stack

- **Node.js** con ES Modules
- **Express** 4.x
- **PostgreSQL** con pg
- **JWT** para autenticación
- **bcryptjs** para passwords
- **QRCode** para generar códigos QR

## 🗄️ Estructura

```
baco-teatro-backend/
├── server.js              # Servidor Express principal
├── db.js                  # Pool de conexión PostgreSQL
├── schema.sql             # Creación de tablas
├── config/
│   └── auth.js           # JWT + bcrypt + middlewares
├── utils/
│   └── generateCode.js   # Generar códigos de tickets
├── controllers/          # Lógica de negocio
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── shows.controller.js
│   ├── tickets.controller.js
│   └── reportes.controller.js
└── routes/               # Definición de endpoints
    ├── auth.routes.js
    ├── users.routes.js
    ├── shows.routes.js
    ├── tickets.routes.js
    └── reportes.routes.js
```

## 🔐 Variables de Entorno

Crear archivo `.env`:

```env
DATABASE_URL=postgres://usuario:password@localhost:5432/baco_teatro
JWT_SECRET=tu_secreto_super_seguro_aqui
PORT=3000
NODE_ENV=development
```

## 📡 API Endpoints

### Auth

- `POST /auth/login` - Login con teléfono + password
- `POST /auth/complete-register` - Completar registro (primera vez)

### Users (ADMIN only)

- `POST /users/create` - Crear usuario ADMIN o VENDEDOR

### Shows

- `GET /shows` - Listar funciones
- `POST /shows` - Crear función (ADMIN)
- `POST /shows/:id/generate` - Generar tickets (ADMIN)
- `POST /shows/:id/assign` - Asignar tickets a vendedor (ADMIN)

### Tickets

- `GET /tickets/show/:id` - Listar tickets de una función
- `GET /tickets/:code/qr` - Obtener QR de un ticket
- `POST /tickets/:code/reserve` - Reservar ticket (VENDEDOR)
- `POST /tickets/:code/report-sold` - Reportar venta (VENDEDOR)
- `POST /tickets/:code/approve` - Aprobar venta (ADMIN)
- `POST /tickets/:code/validate` - Validar ticket en entrada (ADMIN)

### Reportes (ADMIN only)

- `GET /reportes/show/:id/vendedores` - Ventas por vendedor
- `GET /reportes/show/:id/deudas` - Deudas de vendedores
- `GET /reportes/show/:id/resumen` - Resumen de función

## 🎟️ Estados de Tickets

1. **DISPONIBLE** - Generado, sin asignar
2. **STOCK_VENDEDOR** - Asignado a vendedor
3. **RESERVADO** - Reservado para comprador
4. **REPORTADA_VENDIDA** - Vendedor reportó venta (pendiente aprobación)
5. **PAGADO** - Admin aprobó venta (QR activo)
6. **USADO** - Validado en entrada

## 🔑 Roles

- **ADMIN** - Control total
- **VENDEDOR** - Solo sus tickets asignados

## 📝 Ejemplo de Uso

```bash
# 1. Login como admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491100000000","password":"admin123"}'

# Respuesta: { "token": "JWT_TOKEN", "user": {...} }

# 2. Crear función
curl -X POST http://localhost:3000/shows \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-12-31T20:00:00Z",
    "capacidad": 50,
    "base_price": 5000
  }'

# 3. Generar tickets
curl -X POST http://localhost:3000/shows/1/generate \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 50}'

# 4. Crear vendedor
curl -X POST http://localhost:3000/users/create \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+5491122334455",
    "role": "VENDEDOR"
  }'

# 5. Asignar tickets
curl -X POST http://localhost:3000/shows/1/assign \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendedorPhone": "+5491122334455",
    "cantidad": 10
  }'
```

## 🚀 Deploy en Render

1. Crear PostgreSQL Database en Render
2. Ejecutar `schema.sql` en la BD
3. Crear Web Service:
   - Build: `npm install`
   - Start: `npm start`
4. Configurar env vars:
   - `DATABASE_URL` (Internal URL de PostgreSQL)
   - `JWT_SECRET`
   - `PORT=3000`
   - `NODE_ENV=production`

## 🔒 Seguridad

- JWT con expiración de 7 días
- Passwords hasheados con bcrypt (10 rounds)
- Middleware de autenticación en todas las rutas protegidas
- Middleware de roles (ADMIN/VENDEDOR)
- CORS habilitado
- SSL en PostgreSQL para producción

## 📱 Integración con App Móvil

La app Expo debe configurar:

```javascript
const API_URL = "https://tu-backend.onrender.com";
```

Y enviar el token JWT en cada request:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

**Desarrollado para Baco Teatro 🎭**
