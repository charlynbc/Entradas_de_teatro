# 🎭 Sistema Baco Teatro v2.0 - Con Roles y Estados

## ✅ Implementado Completamente

### Sistema de Roles
- **ADMIN** (3 usuarios): Crean funciones, asignan tickets, marcan como pagado, validan en puerta
- **VENDEDOR** (actores): Reciben tickets, reservan, transfieren entre ellos

### Estados de Tickets
1. **DISPONIBLE**: Generado por admin, sin asignar
2. **STOCK_VENDEDOR**: Asignado a un vendedor, disponible para vender
3. **RESERVADO**: Vendedor encontró comprador, esperando pago
4. **PAGADO**: Admin recibió la plata, listo para validar
5. **USADO**: Validado en la puerta del teatro

---

## 📋 Modelo de Datos

### Usuario
```js
{
  id: 1,
  nombre: "Juan Pérez",
  email: "juan@baco.com",
  rol: "VENDEDOR",        // ADMIN o VENDEDOR
  activo: true
}
```

### Ticket
```js
{
  code: "T-A1B2C3D4",
  showId: 1,
  estado: "RESERVADO",    // DISPONIBLE | STOCK_VENDEDOR | RESERVADO | PAGADO | USADO
  qrCode: "data:image...",
  
  propietarioId: 5,       // Vendedor que TIENE el ticket
  vendedorId: 5,          // Vendedor que hizo la RESERVA/VENTA
  compradorNombre: "María López",
  compradorContacto: "099123456",
  medioPago: "PREX",
  monto: 400,
  
  createdAt: "...",
  reservadoAt: "...",
  pagadoAt: "...",
  usadoAt: "..."
}
```

---

## 🔐 Endpoints por Rol

### ADMIN (3 usuarios máx)

**Asignar tickets a vendedor:**
```bash
POST /api/shows/1/assign-tickets
{
  "vendedorId": 4,
  "cantidad": 10
}
```

**Buscar tickets (por código o comprador):**
```bash
GET /api/tickets/search?query=maria
```

**Marcar ticket como PAGADO:**
```bash
POST /api/tickets/T-ABC123/mark-paid
{
  "medioPago": "PREX",
  "monto": 400
}
```

**Validar en puerta (escaneo QR):**
```bash
POST /api/tickets/T-ABC123/validate
```

---

### VENDEDOR (actores)

**Ver mis tickets:**
```bash
GET /api/vendedores/4/tickets?showId=1
```

**Reservar ticket:**
```bash
POST /api/tickets/T-ABC123/reserve
{
  "vendedorId": 4,
  "compradorNombre": "María López",
  "compradorContacto": "099123456"
}
```

**Transferir a otro vendedor:**
```bash
POST /api/tickets/T-ABC123/transfer
{
  "vendedorOrigenId": 4,
  "vendedorDestinoId": 5
}
```

---

## 📊 Reportes

**Estadísticas de función:**
```bash
GET /api/shows/1/stats

Respuesta:
{
  "disponibles": 10,
  "enStockVendedor": 30,
  "reservados": 15,
  "pagados": 40,
  "usados": 5,
  "montoRecaudado": 16000,
  "porcentajeVendido": "45.00"
}
```

**Ventas por vendedor:**
```bash
GET /api/reportes/ventas?showId=1

Respuesta:
{
  "totalReservados": 15,
  "totalVendidos": 45,
  "montoTotal": 18000,
  "vendedores": [
    {
      "vendedorId": 4,
      "vendedorNombre": "Juan",
      "cantidadReservada": 3,
      "cantidadVendida": 10,
      "montoTotal": 4000
    }
  ]
}
```

---

## 🎯 Flujos Completos

### Flujo 1: Admin distribuye tickets

```bash
# 1. Crear función
curl -X POST http://localhost:3000/api/shows \
  -H "Content-Type: application/json" \
  -d '{"obra":"Romeo y Julieta","fecha":"2025-12-31 20:00","capacidad":100}'

# 2. Generar 100 tickets
curl -X POST http://localhost:3000/api/shows/1/generate-tickets \
  -H "Content-Type: application/json" \
  -d '{"cantidad":100}'

# 3. Crear vendedor
curl -X POST http://localhost:3000/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","email":"juan@teatro.com"}'

# 4. Asignar 30 tickets a Juan (vendedorId: 4)
curl -X POST http://localhost:3000/api/shows/1/assign-tickets \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":4,"cantidad":30}'
```

### Flujo 2: Vendedor reserva

```bash
# 1. Juan ve sus tickets
curl http://localhost:3000/api/vendedores/4/tickets?showId=1

# 2. Juan reserva uno para María
curl -X POST http://localhost:3000/api/tickets/T-ABC123/reserve \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":4,"compradorNombre":"María López","compradorContacto":"099123456"}'

# Ticket queda en estado RESERVADO
```

### Flujo 3: Admin cobra

```bash
# 1. Admin busca ticket reservado por Juan
curl "http://localhost:3000/api/tickets/search?query=maria"

# 2. Admin marca como pagado
curl -X POST http://localhost:3000/api/tickets/T-ABC123/mark-paid \
  -H "Content-Type: application/json" \
  -d '{"medioPago":"PREX","monto":400}'

# Ticket pasa a estado PAGADO
```

### Flujo 4: Validación en puerta

```bash
# Admin escanea QR del ticket
curl -X POST http://localhost:3000/api/tickets/T-ABC123/validate

# Respuestas posibles:
# ✅ PAGADO -> USADO: "Bienvenido al teatro"
# ❌ RESERVADO: "No cobrado, hablar con admin"
# ❌ STOCK_VENDEDOR: "Nunca fue vendido"
# ❌ USADO: "Ya fue usado"
```

### Flujo 5: Transferencia entre vendedores

```bash
# Juan tiene un ticket que no puede vender
# Se lo pasa a Ana (vendedorId: 5)

curl -X POST http://localhost:3000/api/tickets/T-XYZ789/transfer \
  -H "Content-Type: application/json" \
  -d '{"vendedorOrigenId":4,"vendedorDestinoId":5}'

# El ticket ahora aparece en el stock de Ana
```

---

## ⚠️ Reglas del Sistema

### Transiciones de Estado Válidas

```
DISPONIBLE --[Admin asigna]--> STOCK_VENDEDOR
STOCK_VENDEDOR --[Vendedor reserva]--> RESERVADO
RESERVADO --[Admin cobra]--> PAGADO
PAGADO --[Admin valida]--> USADO
```

### Prohibiciones

❌ **Vendedor NO puede:**
- Marcar tickets como PAGADO
- Validar tickets con QR
- Transferir tickets RESERVADOS
- Reservar tickets que no son suyos

❌ **Admin NO puede:**
- Reservar tickets en nombre de vendedores

❌ **Nadie puede:**
- Validar un ticket RESERVADO (primero debe cobrarse)
- Usar dos veces el mismo ticket
- Transferir tickets PAGADOS o USADOS

---

## 🧪 Script de Prueba Completo

Ver archivo `./test-sistema-v2.sh`

```bash
chmod +x test-sistema-v2.sh
./test-sistema-v2.sh
```

---

## 📱 Próximo Paso: App Móvil

Necesitamos actualizar la app con:

### Para ADMIN:
- Pantalla: Distribuir tickets
- Pantalla: Buscar y cobrar
- Pantalla: Escanear QR (ya existe, solo actualizar validación)

### Para VENDEDOR:
- Pantalla: Mis tickets
- Pantalla: Reservar ticket
- Pantalla: Transferir ticket

---

## 🎉 Ventajas del Nuevo Sistema

1. **Trazabilidad completa**: Se sabe quién tiene cada ticket en todo momento
2. **Control de pagos**: Admin es el único que cobra
3. **Flexibilidad**: Vendedores pueden pasarse tickets
4. **Seguridad**: No se puede validar sin haber pagado
5. **Reportes precisos**: Se sabe exactamente quién vendió qué y cuánto cobró

---

¡Sistema v2.0 listo para rockear! 🎭🍊
