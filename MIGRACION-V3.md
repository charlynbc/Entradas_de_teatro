# 🔄 Guía de Migración: v2.0 → v3.0

## ¿Qué cambió?

### v2.0 (in-memory)
- **Base de datos**: Guardaba todo en memoria (se perdía al reiniciar)
- **Usuario**: ID numérico (1, 2, 3...)
- **Estados**: 5 estados (DISPONIBLE → STOCK_VENDEDOR → RESERVADO → PAGADO → USADO)
- **Problema**: No rastreaba quién debe plata

### v3.0 (PostgreSQL)
- **Base de datos**: PostgreSQL persistente (Render o local)
- **Usuario**: Teléfono como ID (`+5491111111111`)
- **Estados**: 6 estados (agrega `REPORTADA_VENDIDA` entre RESERVADO y PAGADO)
- **Solución**: Rastrea exactamente quién debe plata con flags `reportada_por_vendedor` y `aprobada_por_admin`

---

## 📱 Cambio clave: REPORTADA_VENDIDA

**Flujo anterior (v2.0):**
```
RESERVADO → [vendedor cobra] → PAGADO
```
❌ Problema: No sabías si el vendedor te dio la plata

**Flujo nuevo (v3.0):**
```
RESERVADO 
  → [vendedor cobra y REPORTA] → REPORTADA_VENDIDA 
  → [admin recibe plata y APRUEBA] → PAGADO
```
✅ Solución: Ahora sabes quién te debe plata

---

## 🛠️ Pasos de migración

### 1️⃣ Configurar PostgreSQL

#### Opción A: Local (para desarrollo)
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE teatro_baco;
\q

# Ejecutar schema
psql -U postgres -d teatro_baco -f teatro-tickets-backend/schema.sql
```

#### Opción B: Render (para producción)
1. Ir a https://render.com
2. New → PostgreSQL
3. Name: `teatro-baco-db`
4. Copiar **Internal Database URL** (empieza con `postgres://...`)
5. En tu backend de Render, agregar variable de entorno:
   - Key: `DATABASE_URL`
   - Value: (pegar la URL copiada)

### 2️⃣ Inicializar base de datos

```bash
# Si usas Render
export DATABASE_URL="postgres://user:pass@host/database"

# Si es local
export DATABASE_URL="postgresql://postgres:password@localhost:5432/teatro_baco"

# Ejecutar schema
psql $DATABASE_URL -f teatro-tickets-backend/schema.sql
```

### 3️⃣ Cambiar el backend

```bash
cd teatro-tickets-backend

# Detener v2.0
# (Ctrl+C si está corriendo)

# Iniciar v3.0
node index-v3-postgres.js
```

Debería aparecer:
```
🎭 Servidor Baco Teatro v3.0 (PostgreSQL) en puerto 3000
🔗 Base de datos: Render (o Local)
✅ Conectado a PostgreSQL
✅ Tablas: users, shows, tickets
```

### 4️⃣ Crear usuarios iniciales

```bash
# Crear admin
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491122334455",
    "name": "Admin Principal",
    "role": "ADMIN"
  }'

# Crear vendedores
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5491155667788",
    "name": "Juan Vendedor",
    "role": "VENDEDOR"
  }'
```

---

## 🔐 Login ahora es con teléfono

### Antes (v2.0):
```javascript
// App mostraba lista de usuarios para elegir
<Picker>
  <Picker.Item label="Admin" value="1" />
  <Picker.Item label="Juan" value="2" />
</Picker>
```

### Ahora (v3.0):
```javascript
// Usuario ingresa su teléfono
<TextInput 
  placeholder="+54911..." 
  keyboardType="phone-pad"
  value={phone}
  onChangeText={setPhone}
/>
```

**Primera vez:**
1. Usuario ingresa teléfono → backend devuelve error "Primera vez"
2. App muestra pantalla para crear contraseña
3. Usuario crea contraseña → ya puede entrar

**Siguientes veces:**
1. Usuario ingresa teléfono + contraseña
2. Login exitoso

---

## 💰 Nuevo flujo de dinero

### Vendedor:
1. **Reservar**: `POST /api/tickets/{code}/reserve`
   - Cliente dice "quiero esta entrada"
   - Estado: `STOCK_VENDEDOR` → `RESERVADO`

2. **Reportar venta**: `POST /api/tickets/{code}/report-sold`
   - Vendedor cobra al cliente (efectivo, transferencia, etc)
   - Estado: `RESERVADO` → `REPORTADA_VENDIDA`
   - ⚠️ Ahora vendedor **le debe plata al admin**

### Admin:
3. **Aprobar pago**: `POST /api/tickets/{code}/approve-payment`
   - Vendedor le entrega la plata al admin
   - Estado: `REPORTADA_VENDIDA` → `PAGADO`
   - ✅ Ahora vendedor ya no debe nada

4. **Validar en puerta**: `POST /api/tickets/{code}/validate`
   - Cliente llega al teatro
   - Estado: `PAGADO` → `USADO`

---

## 📊 Nuevos endpoints financieros

### Ver quién debe plata en una función
```bash
GET /api/shows/{id}/deudores

# Respuesta:
{
  "show_id": 1,
  "total_deuda": 45000,
  "vendedores_deudores": [
    {
      "vendedor_nombre": "Juan",
      "vendedor_phone": "+5491155667788",
      "reportadas_vendidas": 3,
      "monto_reportado": 45000,
      "monto_aprobado": 0,
      "monto_debe": 45000
    }
  ]
}
```

### Resumen financiero de la función (admin)
```bash
GET /api/shows/{id}/resumen-admin

# Respuesta:
{
  "id": 1,
  "obra": "Hamlet",
  "disponibles": 20,
  "en_stock_vendedores": 10,
  "reservadas": 5,
  "reportadas_sin_aprobar": 3,  # ← vendedores deben plata
  "pagadas": 12,
  "usadas": 0,
  "recaudacion_teorica": 150000,  # lo que reportaron
  "recaudacion_real": 120000,     # lo que realmente recibiste
  "pendiente_aprobar": 30000      # diferencia = deuda
}
```

### Resumen por vendedor
```bash
GET /api/shows/{id}/resumen-por-vendedor

# Respuesta:
[
  {
    "vendedor_nombre": "Juan",
    "para_vender": 10,
    "reservadas": 2,
    "reportadas_vendidas": 3,  # ← le debe al admin
    "pagadas": 5,
    "monto_reportado": 45000,
    "monto_aprobado": 75000,
    "monto_debe": 0  # ya pagó todo
  }
]
```

---

## 🎯 Checklist de testing

Después de migrar, probar:

### Admin:
- [ ] Crear función con `base_price`
- [ ] Asignar tickets a vendedor (por teléfono)
- [ ] Buscar ticket por código o nombre
- [ ] Ver `/api/shows/{id}/resumen-admin`
- [ ] Ver `/api/shows/{id}/deudores`
- [ ] Aprobar pago de ticket `REPORTADA_VENDIDA`
- [ ] Validar ticket en puerta

### Vendedor:
- [ ] Login con teléfono + contraseña
- [ ] Ver mis tickets: `GET /api/vendedores/{phone}/tickets`
- [ ] Reservar ticket
- [ ] Reportar venta (con precio y medio de pago)
- [ ] Transferir ticket a otro vendedor

---

## 🚀 Deploy en Render

### Backend:
1. Conectar repo de GitHub a Render
2. New → Web Service
3. Build Command: `cd teatro-tickets-backend && npm install`
4. Start Command: `cd teatro-tickets-backend && node index-v3-postgres.js`
5. Agregar variable de entorno:
   - `DATABASE_URL`: (URL de tu PostgreSQL en Render)
   - `BASE_URL`: `https://tu-backend.onrender.com`

### App móvil:
```javascript
// src/services/api.js
const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://tu-backend.onrender.com';
```

---

## ⚠️ Diferencias importantes

| Aspecto | v2.0 | v3.0 |
|---------|------|------|
| **ID de usuario** | Numérico (1, 2, 3) | Teléfono (`+5491122334455`) |
| **Contraseña** | No tenía | bcrypt hash |
| **Estados** | 5 | 6 (agrega REPORTADA_VENDIDA) |
| **Crear función** | `{ obra, fecha, capacidad }` | `{ obra, fecha, capacidad, base_price }` |
| **Asignar tickets** | `{ vendedor_id }` | `{ vendedor_phone }` |
| **Marcar pagado** | Directo: `mark-paid` | Dos pasos: `report-sold` → `approve-payment` |
| **Persistencia** | Memoria (se pierde) | PostgreSQL (permanente) |

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Ver logs
sudo journalctl -u postgresql
```

### Error: "relation 'users' does not exist"
```bash
# Ejecutar schema nuevamente
psql $DATABASE_URL -f teatro-tickets-backend/schema.sql
```

### Error: "bcrypt not found"
```bash
cd teatro-tickets-backend
npm install
```

### Ver queries en tiempo real
El backend v3 loguea todas las queries en consola para debug.

---

## 📝 Resumen: 3 cambios principales

1. **Teléfono como ID**: Ya no más números, ahora `+5491122334455`
2. **REPORTADA_VENDIDA**: Nuevo estado que rastrea quién debe plata
3. **PostgreSQL**: Base de datos real que no se pierde

¡Listo para producción! 🎭💰
