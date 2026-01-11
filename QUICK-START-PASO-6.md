# ⚡ QUICK START — PASO 6: PASARELA DE PAGOS

## 🎯 Objetivo

Implementar arquitectura de pagos online en **30-45 minutos**.

---

## ✅ PRE-REQUISITOS

Antes de empezar:

- ✅ PASO 5 completado (cuentas bancarias y comprobantes)
- ✅ Base de datos corriendo
- ✅ Backend funcional
- ✅ Copilot Chat disponible (Ctrl+Shift+I)

---

## 🚀 8 PASOS RÁPIDOS

### 1️⃣ Abre Copilot Chat (10 seg)

```
VS Code → Ctrl+Shift+I
```

---

### 2️⃣ Copia el Prompt (20 seg)

**File:** `PROMPT-PASO-6-COPILOT.md`

**Selection:** TODO (Ctrl+A)

**Copy:** Ctrl+C

---

### 3️⃣ Pega en Chat (10 seg)

En Copilot Chat:

```
Ctrl+V
Enter
```

---

### 4️⃣ Espera (60-90 segundos)

Copilot generará 10 bloques de código:

1. Migration SQL
2. PaymentProvider.js
3. MercadoPagoProvider.js
4. TransferenciaProvider.js
5. EfectivoProvider.js
6. intencionesService.js
7. pagosService.js
8. pagos.controller.js
9. webhooks.controller.js
10. Routes (2 archivos)

---

### 5️⃣ Copia los Archivos (10-15 min)

**Bloque 1: Migration**

```bash
# Copiar SQL
→ Pegar en: teatro-tickets-backend/migrations/06-sistema-pagos-online.sql
```

**Bloque 2-5: Providers**

```bash
# Crear carpeta
mkdir teatro-tickets-backend/payments

# Copiar cada archivo:
→ payments/PaymentProvider.js
→ payments/MercadoPagoProvider.js
→ payments/TransferenciaProvider.js
→ payments/EfectivoProvider.js
```

**Bloque 6-7: Services**

```bash
→ services/intencionesService.js
→ services/pagosService.js
```

**Bloque 8-9: Controllers**

```bash
→ controllers/pagos.controller.js
→ controllers/webhooks.controller.js
```

**Bloque 10: Routes**

```bash
→ routes/pagos.routes.js
→ routes/webhooks.routes.js
```

**Actualizar index-v3-postgres.js:**

```js
// Agregar al final de las importaciones
import pagosRoutes from './routes/pagos.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

// Agregar después de otras rutas
app.use('/api/pagos', pagosRoutes);
app.use('/api/webhooks', webhooksRoutes);
```

---

### 6️⃣ Instala Dependencias (30 seg)

```bash
cd teatro-tickets-backend
npm install mercadopago
```

---

### 7️⃣ Corre Migration (30 seg)

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
psql $DATABASE_URL -f migrations/06-sistema-pagos-online.sql
```

**Verificar:**

```bash
psql $DATABASE_URL -c "\d intenciones_pago"
```

Deberías ver la tabla con campos: id, tipo, referencia_id, monto, proveedor, estado, external_id, etc.

---

### 8️⃣ Configura Variables de Entorno (1 min)

Edita `teatro-tickets-backend/.env`:

```bash
# MercadoPago (testing)
MP_ACCESS_TOKEN=TEST-1234567890-...
MP_PUBLIC_KEY=TEST-abc123...
MP_WEBHOOK_SECRET=tu-secret-para-firmas

# URLs
WEBHOOK_BASE_URL=https://tu-dominio.com
FRONTEND_URL=http://localhost:3000

# Testing
MP_SANDBOX=true
```

**⚠️ Para desarrollo:**
Usa credenciales de **TEST** de MercadoPago (no producción).

---

## 🧪 TESTS MANUALES (5 min)

### Test 1: Crear intención con MercadoPago

```bash
curl -X POST http://localhost:5000/api/pagos/iniciar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "tipo": "TICKET",
    "referenciaId": "TKT-001",
    "proveedor": "MERCADOPAGO"
  }'
```

**Respuesta esperada:**

```json
{
  "intencionId": 1,
  "estado": "PENDIENTE",
  "initUrl": "https://www.mercadopago.com.ar/checkout/...",
  "proveedor": "MERCADOPAGO"
}
```

---

### Test 2: Crear intención con Transferencia

```bash
curl -X POST http://localhost:5000/api/pagos/iniciar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "tipo": "TICKET",
    "referenciaId": "TKT-002",
    "proveedor": "TRANSFERENCIA"
  }'
```

**Respuesta esperada:**

```json
{
  "intencionId": 2,
  "estado": "PENDIENTE",
  "proveedor": "TRANSFERENCIA",
  "instrucciones": {
    "banco": "Banco Nación",
    "cuenta": "1234567890",
    "alias": "teatro.tickets",
    "monto": 1000
  }
}
```

---

### Test 3: Consultar estado

```bash
curl http://localhost:5000/api/pagos/1 \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta esperada:**

```json
{
  "id": 1,
  "tipo": "TICKET",
  "referenciaId": "TKT-001",
  "monto": 1000,
  "estado": "PENDIENTE",
  "proveedor": "MERCADOPAGO",
  "externalId": "mp-123",
  "initUrl": "https://..."
}
```

---

## 🐛 DEBUGGING RÁPIDO

### Error: "Provider MERCADOPAGO not supported"

**Causa:** providerFactory no está configurado

**Solución:**

```js
// Verificar que existe: payments/providerFactory.js
// Y está exportado correctamente
```

---

### Error: "MP_ACCESS_TOKEN not defined"

**Causa:** Variables de entorno no cargadas

**Solución:**

```bash
# Verificar .env existe
ls teatro-tickets-backend/.env

# Reiniciar backend
npm run dev
```

---

### Error: "Table intenciones_pago does not exist"

**Causa:** Migration no corrió

**Solución:**

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
psql $DATABASE_URL -f migrations/06-sistema-pagos-online.sql
```

---

## ✅ CHECKLIST FINAL (14 items)

### Archivos creados

- [ ] `migrations/06-sistema-pagos-online.sql`
- [ ] `payments/PaymentProvider.js`
- [ ] `payments/MercadoPagoProvider.js`
- [ ] `payments/TransferenciaProvider.js`
- [ ] `payments/EfectivoProvider.js`
- [ ] `payments/providerFactory.js`
- [ ] `services/intencionesService.js`
- [ ] `services/pagosService.js`
- [ ] `controllers/pagos.controller.js`
- [ ] `controllers/webhooks.controller.js`
- [ ] `routes/pagos.routes.js`
- [ ] `routes/webhooks.routes.js`

### Base de datos

- [ ] Migration corrió sin errores
- [ ] Tabla `intenciones_pago` existe
- [ ] Columnas `intencion_id` agregadas a `tickets`, `cuotas`, `caja`

### Backend

- [ ] Dependencia `mercadopago` instalada
- [ ] Variables de entorno configuradas
- [ ] Rutas registradas en `index-v3-postgres.js`
- [ ] Backend inicia sin errores

### Testing

- [ ] Test 1 (MercadoPago): devuelve `initUrl`
- [ ] Test 2 (Transferencia): devuelve `instrucciones`
- [ ] Test 3 (Consulta): devuelve intención

---

## ⏱️ TIME ESTIMATE

| Paso | Tiempo     |
| ---- | ---------- |
| 1-4  | 2-3 min    |
| 5    | 10-15 min  |
| 6-7  | 2-3 min    |
| 8    | 1-2 min    |
| 9    | 5 min      |
| **TOTAL** | **20-28 min** |

**+ 5-10 min** de debugging si hay errores = **25-40 min total**

---

## 🎯 LO QUE TENÉS AHORA

### ✅ Sistema de pagos online

- **3 proveedores** soportados (MercadoPago, Transferencia, Efectivo)
- **Abstracción completa** (fácil agregar Stripe, PayPal)
- **Webhooks seguros** (firma HMAC validada)
- **Auditoría total** (intenciones de pago rastreables)
- **Control contable** (solo pagos aprobados a CAJA)

### ✅ Arquitectura desacoplada

```
ticketsController → NO conoce MercadoPago
cuotasController → NO conoce pasarelas
pagosService → Orquesta pagos
PaymentProvider → Abstracción
MercadoPagoProvider → Implementación específica
```

### ✅ Flujos completos

1. **Pago online:** Intención → MercadoPago → Webhook → Aprobada → CAJA
2. **Transferencia:** Intención → Transferir → Comprobante → Validar → CAJA
3. **Efectivo:** Intención → Reportar → Validar → CAJA

---

## 🚀 PRÓXIMOS PASOS

### Inmediato

1. ✅ PASO 6 completado (arquitectura)
2. ⏳ Testing con sandbox de MercadoPago
3. ⏳ Configurar webhook público (ngrok o similar)
4. ⏳ Test end-to-end con pago real

### Siguiente (PASO 7)

1. UI para pagos online (frontend)
2. Dashboard de intenciones (director)
3. Reportes de pagos por proveedor
4. Refund/devoluciones (si aplica)

---

## 📊 COMANDOS ÚTILES

### Ver intenciones en DB

```bash
psql $DATABASE_URL -c "SELECT id, tipo, proveedor, estado, monto FROM intenciones_pago ORDER BY created_at DESC LIMIT 10;"
```

### Ver pagos aprobados

```bash
psql $DATABASE_URL -c "SELECT * FROM intenciones_pago WHERE estado = 'APROBADA';"
```

### Ver intenciones pendientes

```bash
psql $DATABASE_URL -c "SELECT * FROM intenciones_pago WHERE estado = 'PENDIENTE';"
```

### Ver caja con intenciones

```bash
psql $DATABASE_URL -c "
  SELECT 
    c.id,
    c.monto,
    c.concepto,
    ip.proveedor,
    ip.external_id
  FROM caja c
  JOIN intenciones_pago ip ON c.intencion_id = ip.id
  ORDER BY c.created_at DESC
  LIMIT 10;
"
```

---

## 🔗 RECURSOS

- [MercadoPago Docs](https://www.mercadopago.com.ar/developers/es/docs)
- [MercadoPago SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks Testing (ngrok)](https://ngrok.com/)
- [DIAGNOSTICO-PASO-6.md](DIAGNOSTICO-PASO-6.md) — Arquitectura completa

---

## ✨ VEREDICTO

**Si llegaste acá:**

✅ Sistema de pagos online funcional
✅ Arquitectura desacoplada y extensible
✅ Soporte para múltiples proveedores
✅ Webhooks seguros
✅ Auditoría completa

**"No es MercadoPago.
Es arquitectura de pagos que usa MercadoPago."**

🎯 **Listo para integrar cualquier pasarela.**
