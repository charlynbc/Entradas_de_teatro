# BACÓ Teatro - Sistema de Gestión de Entradas 🎭

**Backend Node.js + Express + PostgreSQL**  
Sistema profesional de gestión teatral: grupos, obras, funciones, tickets, ventas, liquidación.

**Versión:** 3.0.0 (PostgreSQL)  
**Estado:** ✅ Producción-Ready (con auditoría)  
**Último Update:** 2025-12-30

---

## 📋 CARACTERÍSTICAS PRINCIPALES

✅ **Gestión de Grupos Teatrales**
- Crear/editar/finalizar grupos con directores
- Asignar miembros (directores, actores)
- Cierre definitivo con liquidación

✅ **Gestión de Obras y Funciones**
- Crear obras por grupo
- Programar funciones (fecha, hora, lugar, precio)
- Estados: PROGRAMADA, CONFIRMADA, REALIZADA, CANCELADA

✅ **Sistema de Tickets**
- Generar tickets con código QR único
- Estados completos: DISPONIBLE → STOCK_ACTOR → STOCK_VENDEDOR → REPORTADA_VENDIDA → PAGADO → USADO/ANULADO
- Auditoría de movimientos (ticket_movimientos)

✅ **Flujo de Ventas**
- ACTOR asigna stock a vendedores
- VENDEDOR reporta ventas (cantidad, medio de pago, comprador)
- SUPER/ADMIN aprueba pagos
- Auditoría de cada transacción

✅ **Liquidación de Grupos**
- Cierre irreversible con validaciones
- PDF liquidación con totales por vendedor
- Snapshot de estado financiero

✅ **Control de Acceso Basado en Roles**
- **SUPER:** Acceso total, gestión de usuarios y configuración
- **ADMIN:** Gestión de grupos, validación de entradas
- **ACTOR:** Vendedor/gestor de grupo, asignación de stock
- **INVITADO:** Comprador de entradas (público)

✅ **Auditoría Completa**
- Tabla `ticket_movimientos` con todos los cambios
- Trazabilidad de quién, cuándo, qué acción
- Especialmente ventas y pagos

---

## 🔧 STACK TÉCNICO

| Componente | Detalle |
|-----------|---------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **BD** | PostgreSQL 15+ |
| **Auth** | JWT (Bearer tokens) |
| **Hash** | bcrypt |
| **QR** | qrcode (tickets) |
| **PDF** | pdfkit (liquidaciones) |
| **Upload** | multer (fotos grupos) |

---

## 🚀 QUICK START - DESARROLLO

### 1. Requisitos
```bash
- Node.js 18+
- PostgreSQL 15+
- Docker (opcional, para BD)
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar .env
```bash
cp .env.example .env

# Editar .env con valores locales:
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
JWT_SECRET=tu-secret-aleatorio-32-chars
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. Inicializar BD
```bash
# Con Docker (crea BD vacía):
npm run db:start

# Con BD existente:
npm run db:init        # Crear schema base
npm run db:migrate-phone-fk  # Aplicar migraciones (requerido)
```

### 5. Crear Usuario SUPER
```bash
npm run init-super
# Input: Cédula, nombre, contraseña
```

### 6. Iniciar Servidor
```bash
npm run dev              # Con nodemon (desarrollo)
npm start              # Producción
npm run debug          # Con inspect (puerto 9229)
```

**Servidor disponible en:** `http://localhost:3000`  
**API disponible en:** `http://localhost:3000/api`

---

## 📚 ENDPOINTS PRINCIPALES

### 🔓 Públicos (sin autenticación)
```
GET  /api/funciones/publicas       → Cartelera para INVITADOS
GET  /public/funciones             → Alias
GET  /public/funciones/:id/vendedores → Contactos vendedores
```

### 🔐 Privados (requieren JWT)

#### Autenticación
```
POST /api/auth/login               → Obtener token
GET  /api/auth/verificar           → Verificar token actual
```

#### Grupos (SUPER, ADMIN)
```
POST /api/grupos                   → Crear grupo
GET  /api/grupos                   → Listar grupos
GET  /api/grupos/:id               → Obtener grupo detalle
PUT  /api/grupos/:id               → Actualizar grupo
POST /api/grupos/:id/directores    → Agregar director
POST /api/grupos/:id/cerrar-definitivo → Cierre + liquidación
GET  /api/grupos/:id/liquidacion   → Obtener liquidación
GET  /api/grupos/:id/liquidacion/pdf → PDF liquidación
```

#### Funciones (SUPER, ADMIN crean; INVITADO lee públicas)
```
GET  /api/funciones                → Listar (protegidas + públicas)
POST /api/funciones                → Crear (SUPER, ADMIN)
GET  /api/funciones/:id            → Detalle
PUT  /api/funciones/:id            → Actualizar (SUPER, ADMIN)
```

#### Tickets (ACTOR vende, SUPER/ADMIN cobran)
```
GET  /api/tickets/mis-tickets      → Stock del ACTOR
POST /api/tickets/asignar          → SUPER asigna a ACTOR
POST /api/tickets/transferir       → ACTOR transfiere a VENDEDOR
POST /api/tickets/reportar-venta   → VENDEDOR reporta venta
POST /api/tickets/:code/cobrar     → SUPER aprueba pago
GET  /api/tickets/validar/:code    → Validar en puerta (QR)
```

#### Reportes (SUPER, ADMIN)
```
GET  /api/reportes/vendedor        → Ventas del usuario
GET  /api/reportes/grupo/:id       → Reporte por grupo
GET  /api/reportes/funcion/:id     → Reporte por función
```

---

## 🔑 VARIABLES DE ENTORNO

```bash
# Base de datos (REQUERIDO)
DATABASE_URL=postgres://user:pass@host:5432/dbname

# JWT (CRÍTICO: cambiar en producción)
JWT_SECRET=<generar_aleatorio_32_caracteres>

# Servidor
PORT=3000
NODE_ENV=development|production

# Frontend (para CORS)
FRONTEND_URL=http://localhost:3000

# Base URL API (opcional)
BASE_URL=http://localhost:3000
```

### Generar JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ MIGRACIONES

Todas las migraciones en `db/migrations/`:

| Migration | Descripción |
|-----------|-------------|
| `007-ticket-auditoria-anulacion.sql` | Auditoría y anulación de tickets |

**Ejecutar migraciones:**
```bash
npm run db:migrate-phone-fk
```

---

## 🧪 TESTING

### Tests Disponibles
```bash
npm run test:super                 # SUPER usuario
npm run test:director              # DIRECTOR grupo
npm run test:vendedores            # VENDEDORES
npm run test:invitados             # INVITADOS
npm run test:actor-e2e             # E2E ACTOR (flujo completo)
npm run test:all                   # Todos
```

### Test E2E Completo (Recomendado)
```bash
# 1. Asegurar BD limpia:
npm run db:clean

# 2. Inicializar:
npm run db:init
npm run db:migrate-phone-fk
npm run init-super

# 3. Ejecutar E2E:
npm run test:actor-e2e
```

**Esperado:** ✅ Crear grupo → Crear obra → Asignar stock → Reportar venta → Aprobar pago → Cierre grupo → Validar liquidación

---

## 🔒 SEGURIDAD (CRÍTICO)

### ✅ Implementado
- [x] JWT authentication en todos los endpoints privados
- [x] Middleware `requireRole` para control de acceso
- [x] Bcrypt para password hashing (no plaintext)
- [x] SQL parameterizado (no SQL injection)
- [x] CORS configurado por domain
- [x] Auditoría de movimientos de tickets

### ⚠️ ANTES DE PRODUCCIÓN
1. **JWT_SECRET:** Cambiar a valor aleatorio 32+ caracteres
   ```bash
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **NODE_ENV:** Establecer a `production`
   ```bash
   NODE_ENV=production
   ```

3. **FRONTEND_URL:** Establecer a tu dominio
   ```bash
   FRONTEND_URL=https://tu-dominio.com
   ```

4. **DATABASE_URL:** Usar host seguro con SSL
   ```bash
   DATABASE_URL=postgres://user:pass@prod-host/dbname?sslmode=require
   ```

5. **Error Handling:** Producción no expone stack traces
   ```javascript
   // ✅ Correcto
   res.status(500).json({ error: 'Internal server error' });
   ```

---

## 📊 SCHEMA BD

```
users
├─ cedula (PK)
├─ name, role (SUPER, ADMIN, ACTOR, INVITADO)
├─ password_hash, phone

grupos
├─ id (PK)
├─ nombre, director_cedula (FK users)
├─ estado (ACTIVO, FINALIZADO)
├─ fecha_inicio, fecha_fin

obras
├─ id (PK)
├─ grupo_id (FK grupos)
├─ nombre

funciones
├─ id (PK)
├─ obra_id (FK obras)
├─ fecha, hora, lugar, precio_base
├─ estado (PROGRAMADA, CONFIRMADA, etc)

tickets
├─ code (PK, único)
├─ funcion_id (FK funciones)
├─ estado (DISPONIBLE, STOCK_ACTOR, STOCK_VENDEDOR, REPORTADA_VENDIDA, PAGADO, USADO, ANULADO)
├─ vendedor_phone, precio, medio_pago
├─ comprador_nombre, comprador_contacto

ticket_movimientos (auditoría)
├─ id (PK)
├─ ticket_code (FK tickets)
├─ tipo (ASIGNACION, RESERVA, VENTA_REPORTADA, PAGO_APROBADO, etc)
├─ desde_phone, hacia_phone

grupo_miembros
├─ grupo_id, miembro_cedula
├─ rol_en_grupo (DIRECTOR, ACTOR)
```

---

## 🐛 TROUBLESHOOTING

### Error: `DATABASE_URL no está configurado`
```bash
# Solución:
export DATABASE_URL=postgres://...
```

### Error: `ECONNREFUSED localhost:5432`
```bash
# Solución: Iniciar BD PostgreSQL
npm run db:start  # O: docker run -d ... postgres:15
```

### Error: `JWT inválido` (401)
```bash
# Verificar:
1. Token presente en header: Authorization: Bearer <token>
2. JWT_SECRET coincide en servidor y cliente
3. Token no expirado
```

### Error: `CORS blocked`
```bash
# Solución: Verificar FRONTEND_URL en .env
FRONTEND_URL=https://tu-dominio-frontend.com
```

### No hay BD después de `npm run db:init`
```bash
# Solución: Asegurar que docker BD está corriendo
docker ps | grep postgres
# Si no: npm run db:start
```

---

## 📖 DOCUMENTACIÓN ADICIONAL

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Guía paso a paso para Render + Netlify
- [REPORTE-AUDITORIA-PRODUCCION.md](../REPORTE-AUDITORIA-PRODUCCION.md) — Auditoría de seguridad y checklist
- [ARCHITECTURE.md](../docs/ARQUITECTURA-GRUPOS-OBRAS.md) — Diagrama entidades
- [TESTING.md](../docs/testing/) — Guía de pruebas

---

## 🤝 CONTRIBUIR

1. Crear rama: `git checkout -b feature/tu-feature`
2. Hacer cambios
3. Ejecutar tests: `npm test`
4. Push + PR

---

## 📋 CHECKLIST ANTES DE PRODUCCIÓN

- [ ] JWT_SECRET generado (32+ caracteres)
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL configurado
- [ ] DATABASE_URL válido (SSL en prod)
- [ ] Migraciones ejecutadas (`db:migrate-phone-fk`)
- [ ] Tests pasan (`npm run test:all`)
- [ ] Error handling sin stack traces
- [ ] Logs configurados (syslog/CloudWatch)
- [ ] Backup strategy definida
- [ ] Monitoreo + alertas (opcional)

---

**Preparado por:** GitHub Copilot | Claude Haiku 4.5  
**Contacto:** bacoteatro@montevideo.com.uy


El servidor se levantará en `http://localhost:3000`

## Endpoints

### Healthcheck
```
GET /
```

### Funciones

**Crear función**
```bash
POST /api/shows
Content-Type: application/json

{
  "obra": "Hamlet",
  "fecha": "2025-12-24 21:00",
  "capacidad": 100
}
```

**Listar funciones**
```bash
GET /api/shows
```

**Generar tickets para una función**
```bash
POST /api/shows/:id/generate-tickets
Content-Type: application/json

{
  "cantidad": 10
}
```

**Ver tickets de una función**
```bash
GET /api/shows/:id/tickets
```

### Tickets

**Consultar un ticket**
```bash
GET /api/tickets/:code
```

**Marcar ticket como pagado**
```bash
POST /api/tickets/:code/pay
```

**Validar ticket (en puerta del teatro)**
```bash
POST /api/tickets/:code/validate
```

## Estados de tickets

- `DISPONIBLE`: Ticket generado pero no pagado
- `PAGADO`: Ticket pagado, listo para validar
- `USADO`: Ticket ya validado en la puerta

## Credenciales Iniciales

### Usuario Supremo
- **Cédula:** `48376669`
- **Password:** `Teamomama91`
- **Rol:** SUPER

⚠️ Cambiar inmediatamente en producción.

## Deploy en Render

1. Conectar repositorio a Render
2. Configurar como Web Service
3. Build Command: `npm install`
4. Variables de entorno:
   - `DATABASE_URL`: URL de PostgreSQL
   - `JWT_SECRET`: Secret para tokens JWT
   - `NODE_ENV`: `production`
5. Para build con frontend: usar script `build-for-render.sh` en baco-teatro-app
4. Start Command: `npm start`
5. Render asignará automáticamente el PORT

---

Desarrollado para gestión de entradas de teatro 🎫
