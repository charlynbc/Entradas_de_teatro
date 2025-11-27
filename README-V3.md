# 🎭 Sistema Baco Teatro v3.0 - PostgreSQL + Control Financiero

## 🎯 ¿Qué hace este sistema?

Sistema **completo** de gestión de entradas de teatro con:
- 👥 **Usuarios por teléfono**: Ya no más IDs numéricos, ahora con auth real
- 💰 **Control de deudas**: Sabe exactamente quién le debe plata a quién
- 📊 **Reportes financieros**: Cuánto vendió cada vendedor, cuánto falta cobrar
- 🎫 **6 estados de ticket**: Desde disponible hasta usado, pasando por "reportada vendida"
- 📱 **App React Native**: iOS y Android desde el mismo código
- 🗄️ **PostgreSQL persistente**: En Render o local, no se pierde nada

---

## 🔥 Cambios principales vs v2.0

| Característica | v2.0 | v3.0 |
|----------------|------|------|
| **Base de datos** | In-memory (se pierde) | PostgreSQL (persistente) |
| **Usuario** | ID: 1, 2, 3... | Teléfono: +5491122334455 |
| **Login** | Picker sin password | Teléfono + contraseña (bcrypt) |
| **Estados** | 5 estados | 6 estados (+ REPORTADA_VENDIDA) |
| **Control $** | ❌ No sabés quién debe | ✅ Sabés exactamente quién debe |
| **Reportes** | ❌ Manual | ✅ Vistas SQL automáticas |

---

## 💰 El flujo financiero (lo más importante)

### Antes (v2.0) - Problemático:
```
RESERVADO → [vendedor cobra] → PAGADO
```
**Problema**: ¿El vendedor ya te dio la plata? No sabías.

### Ahora (v3.0) - Controlado:
```
RESERVADO 
  → [vendedor cobra cliente] → REPORTADA_VENDIDA (vendedor DEBE plata)
  → [vendedor entrega $ admin] → PAGADO (deuda saldada)
```

**Ventajas:**
- ✅ Admin ve lista de vendedores que deben plata
- ✅ Sabe cuánto falta cobrar por función
- ✅ Puede aprobar pagos individualmente
- ✅ Reportes automáticos de recaudación

---

## 📁 Estructura del proyecto

```
/teatro-tickets-backend/
  ├── schema.sql              ← Base de datos (tablas + vistas)
  ├── db.js                   ← Conexión PostgreSQL
  ├── index-v3-postgres.js    ← Backend v3.0 (este usar)
  ├── index.js                ← Backend v2.0 (legacy)
  └── package.json

/baco-teatro-app/             ← App móvil React Native
  ├── src/
  │   ├── screens/            ← 8 pantallas (Login, Admin, Vendedor)
  │   ├── services/api.js     ← Llamadas HTTP al backend
  │   └── navigation/         ← Navegación por roles
  └── package.json

MIGRACION-V3.md               ← Guía paso a paso para migrar
README-V3.md                  ← Este archivo
```

---

## 🚀 Quick Start

### 1️⃣ Instalar PostgreSQL local

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE teatro_baco;
\q

# Ejecutar schema
cd teatro-tickets-backend
psql -U postgres -d teatro_baco -f schema.sql
```

### 2️⃣ Iniciar backend

```bash
cd teatro-tickets-backend

# Si no instalaste las dependencias
npm install

# Configurar DB local
export DATABASE_URL="postgresql://postgres:password@localhost:5432/teatro_baco"

# Iniciar servidor
node index-v3-postgres.js
```

Deberías ver:
```
🎭 Servidor Baco Teatro v3.0 (PostgreSQL) en puerto 3000
🔗 Base de datos: Local
✅ Conectado a PostgreSQL
✅ Tablas: users, shows, tickets
```

### 3️⃣ Crear usuarios

```bash
# Admin
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491122334455",
    "name": "Admin Teatro",
    "role": "ADMIN"
  }'

# Vendedor
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491155667788",
    "name": "Juan Vendedor",
    "role": "VENDEDOR"
  }'
```

### 4️⃣ Crear función de prueba

```bash
curl -X POST http://localhost:3000/api/shows \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-02-20T20:00:00Z",
    "lugar": "Teatro Nacional",
    "capacidad": 50,
    "base_price": 15000
  }'
```

### 5️⃣ Probar app móvil

```bash
cd baco-teatro-app

# Instalar dependencias
npm install

# iOS
npx expo start --ios

# Android
npx expo start --android
```

**Nota**: Actualizar `src/services/api.js` con la IP de tu backend:
```javascript
const API_URL = 'http://192.168.1.XXX:3000'; // Tu IP local
```

---

## 🗄️ Base de datos

### Tablas principales

**users** (Usuarios)
- `phone` (PK): `+5491122334455`
- `name`: "Juan Pérez"
- `role`: `ADMIN` o `VENDEDOR`
- `password_hash`: bcrypt hash
- `active`: `TRUE`/`FALSE`

**shows** (Funciones)
- `id` (PK): 1, 2, 3...
- `obra`: "Hamlet"
- `fecha`: `2024-02-20T20:00:00Z`
- `lugar`: "Teatro Nacional"
- `capacidad`: 50
- `base_price`: 15000.00

**tickets** (Entradas)
- `code` (PK): "T-A1B2C3D4"
- `show_id` (FK): → shows.id
- `vendedor_phone` (FK): → users.phone
- `estado`: `DISPONIBLE`, `STOCK_VENDEDOR`, `RESERVADO`, `REPORTADA_VENDIDA`, `PAGADO`, `USADO`
- `comprador_nombre`: "María López"
- `precio`: 15000.00
- `medio_pago`: "Efectivo"
- `reportada_por_vendedor`: `TRUE`/`FALSE`
- `aprobada_por_admin`: `TRUE`/`FALSE`
- `qr_code`: "data:image/png;base64,..."

### Vistas (reportes automáticos)

**v_resumen_vendedor_show** (por vendedor y función)
```sql
SELECT * FROM v_resumen_vendedor_show WHERE show_id = 1;
```
Devuelve:
- `vendedor_nombre`, `vendedor_phone`
- `para_vender`: tickets en stock
- `reservadas`: reservados sin reportar
- `reportadas_vendidas`: reportados pero no aprobados ← **LE DEBE AL ADMIN**
- `pagadas`: aprobadas por admin
- `usadas`: ya validadas en puerta
- `monto_reportado`: lo que dice que vendió
- `monto_aprobado`: lo que realmente entregó
- `monto_debe`: diferencia (deuda)

**v_resumen_show_admin** (resumen de función)
```sql
SELECT * FROM v_resumen_show_admin WHERE id = 1;
```
Devuelve:
- `disponibles`, `en_stock_vendedores`, `reservadas`
- `reportadas_sin_aprobar`: ← **TOTAL QUE TE DEBEN**
- `pagadas`, `usadas`
- `recaudacion_teorica`: lo que reportaron los vendedores
- `recaudacion_real`: lo que efectivamente recibiste
- `pendiente_aprobar`: diferencia (deuda total)

---

## 🔌 API Endpoints

### Autenticación

**POST /api/auth/login**
```json
{
  "phone": "+5491122334455",
  "password": "mi_password"
}
```
→ Devuelve: `{ phone, name, role }`

**POST /api/auth/set-password** (primera vez)
```json
{
  "phone": "+5491122334455",
  "password": "nueva_password"
}
```

### Usuarios

**GET /api/usuarios** - Listar todos  
**POST /api/usuarios** - Crear admin o vendedor  
**GET /api/vendedores** - Solo vendedores

### Funciones

**GET /api/shows** - Listar funciones  
**POST /api/shows** - Crear función  
**GET /api/shows/:id/resumen-admin** - Resumen financiero  
**GET /api/shows/:id/resumen-por-vendedor** - Por cada vendedor  
**GET /api/shows/:id/deudores** - Quién debe plata  

### Tickets (Admin)

**POST /api/shows/:id/assign-tickets** - Asignar a vendedor  
**POST /api/tickets/:code/approve-payment** - Aprobar pago ← **NUEVO v3**  
**POST /api/tickets/:code/validate** - Validar en puerta  
**GET /api/tickets/search?q=T-ABC** - Buscar por código/nombre

### Tickets (Vendedor)

**GET /api/vendedores/:phone/tickets** - Mis tickets  
**POST /api/tickets/:code/reserve** - Reservar para cliente  
**POST /api/tickets/:code/report-sold** - Reportar que vendí ← **NUEVO v3**  
**POST /api/tickets/:code/transfer** - Transferir a otro vendedor

---

## 🎬 Flujo completo de ejemplo

### 1. Admin crea función
```bash
POST /api/shows
{ "obra": "Hamlet", "fecha": "2024-02-20T20:00", "capacidad": 50, "base_price": 15000 }
```
→ Se crean 50 tickets en estado `DISPONIBLE`

### 2. Admin asigna 10 tickets a Juan
```bash
POST /api/shows/1/assign-tickets
{ "vendedor_phone": "+5491155667788", "cantidad": 10 }
```
→ 10 tickets pasan a `STOCK_VENDEDOR` (Juan)

### 3. Juan reserva para María
```bash
POST /api/tickets/T-A1B2C3D4/reserve
{ "vendedor_phone": "+5491155667788", "comprador_nombre": "María López" }
```
→ Estado: `STOCK_VENDEDOR` → `RESERVADO`

### 4. Juan cobra a María y reporta la venta
```bash
POST /api/tickets/T-A1B2C3D4/report-sold
{ 
  "vendedor_phone": "+5491155667788",
  "precio": 15000,
  "medio_pago": "Efectivo"
}
```
→ Estado: `RESERVADO` → `REPORTADA_VENDIDA`  
→ **Juan ahora le debe $15.000 al admin**

### 5. Admin ve quién le debe plata
```bash
GET /api/shows/1/deudores
```
→ Respuesta:
```json
{
  "show_id": 1,
  "total_deuda": 15000,
  "vendedores_deudores": [
    {
      "vendedor_nombre": "Juan Vendedor",
      "reportadas_vendidas": 1,
      "monto_debe": 15000
    }
  ]
}
```

### 6. Juan le entrega la plata al admin
**En persona**, Juan le da los $15.000 al admin.

Admin aprueba en el sistema:
```bash
POST /api/tickets/T-A1B2C3D4/approve-payment
```
→ Estado: `REPORTADA_VENDIDA` → `PAGADO`  
→ **Juan ya no debe nada**

### 7. María llega al teatro
Admin escanea QR o busca por código:
```bash
POST /api/tickets/T-A1B2C3D4/validate
```
→ Estado: `PAGADO` → `USADO`  
→ María puede entrar ✅

---

## 📊 Casos de uso financieros

### ¿Cuánto vendió Juan en la función 1?
```bash
GET /api/shows/1/resumen-por-vendedor

# Buscar en la respuesta:
{
  "vendedor_nombre": "Juan Vendedor",
  "monto_reportado": 150000,  # Lo que dice que vendió
  "monto_aprobado": 120000,   # Lo que ya entregó
  "monto_debe": 30000         # Lo que todavía debe
}
```

### ¿Cuánta plata tengo confirmada para esta función?
```bash
GET /api/shows/1/resumen-admin

{
  "recaudacion_real": 450000,     # Lo que YA recibiste
  "pendiente_aprobar": 75000,     # Lo que falta cobrar
  "recaudacion_teorica": 525000   # Total reportado
}
```

### ¿Qué vendedores me deben?
```bash
GET /api/shows/1/deudores

{
  "total_deuda": 75000,
  "vendedores_deudores": [
    { "vendedor_nombre": "Juan", "monto_debe": 30000 },
    { "vendedor_nombre": "Pedro", "monto_debe": 45000 }
  ]
}
```

---

## 🚀 Deploy en Render

### PostgreSQL:
1. Render → New → PostgreSQL
2. Name: `teatro-baco-db`
3. Copiar **Internal Database URL**

### Backend:
1. Render → New → Web Service
2. Connect GitHub repo
3. **Build Command**: `cd teatro-tickets-backend && npm install`
4. **Start Command**: `cd teatro-tickets-backend && node index-v3-postgres.js`
5. **Environment Variables**:
   - `DATABASE_URL`: (pegar URL de PostgreSQL)
   - `BASE_URL`: `https://tu-backend.onrender.com`
   - `PORT`: 3000

6. Después del deploy, ejecutar schema:
```bash
# Desde tu máquina local
export DATABASE_URL="postgres://..."  # URL de Render
psql $DATABASE_URL -f teatro-tickets-backend/schema.sql
```

### App móvil:
```javascript
// src/services/api.js
const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://tu-backend.onrender.com';
```

**Build para producción**:
```bash
cd baco-teatro-app

# Android
eas build --platform android

# iOS
eas build --platform ios
```

---

## 🔧 Troubleshooting

### Backend no conecta a PostgreSQL
```bash
# Verificar que la variable de entorno está bien
echo $DATABASE_URL

# Debe ser algo como:
# postgresql://user:pass@host:5432/database
# o
# postgres://user:pass@host:5432/database
```

### App no se conecta al backend
1. Backend en local → usar IP local: `http://192.168.1.XXX:3000`
2. Backend en Render → usar HTTPS: `https://tu-backend.onrender.com`
3. **NO** usar `localhost` en la app, solo funciona en web

### "Ticket no se puede reportar"
Verificar estado:
- Solo se pueden reportar tickets en estado `RESERVADO`
- Flujo correcto: `STOCK_VENDEDOR` → `RESERVADO` → `REPORTADA_VENDIDA`

### "No puedo aprobar pago"
Verificar estado:
- Solo se pueden aprobar tickets en estado `REPORTADA_VENDIDA`
- El vendedor debe haber llamado a `report-sold` primero

---

## 📈 Métricas de negocio

Con v3.0 podés responder:

✅ **¿Cuánto vendimos total?**
```sql
SELECT SUM(precio) FROM tickets WHERE estado IN ('PAGADO', 'USADO');
```

✅ **¿Cuánto falta cobrar a los vendedores?**
```sql
SELECT SUM(precio) FROM tickets 
WHERE reportada_por_vendedor = TRUE AND aprobada_por_admin = FALSE;
```

✅ **¿Qué vendedor vende más?**
```sql
SELECT vendedor_phone, COUNT(*) as vendidas 
FROM tickets 
WHERE estado IN ('PAGADO', 'USADO')
GROUP BY vendedor_phone 
ORDER BY vendidas DESC;
```

✅ **¿Cuántas entradas quedan para vender?**
```sql
SELECT COUNT(*) FROM tickets WHERE estado = 'DISPONIBLE';
```

---

## 📚 Documentación adicional

- **MIGRACION-V3.md**: Guía detallada para migrar desde v2.0
- **teatro-tickets-backend/schema.sql**: Schema comentado con toda la lógica
- **INSTRUCCIONES-*.md**: 5 guías paso a paso de v2.0 (base para v3)

---

## 🎯 Resumen: ¿Por qué v3.0?

| Feature | Beneficio |
|---------|-----------|
| **PostgreSQL** | No se pierde nada, producción real |
| **Teléfono como ID** | Más profesional, fácil de recordar |
| **REPORTADA_VENDIDA** | Control total de quién debe plata |
| **Vistas SQL** | Reportes automáticos sin código extra |
| **bcrypt** | Seguridad real en contraseñas |
| **Render deploy** | Un click y está online |

---

**🎭 Sistema Baco Teatro v3.0 - Listo para producción**

¿Preguntas? Ver `MIGRACION-V3.md` o revisar el código en `schema.sql` y `index-v3-postgres.js` que tienen comentarios detallados.
