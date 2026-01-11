# 💳 PROMPT COPILOT — PASO 6: ARQUITECTURA DE PASARELA DE PAGOS

> **⚠️ COPIA TODO ESTE ARCHIVO (desde TAREA hasta el final) y pégalo en Copilot Chat**

---

# TAREA

Diseña e implementa una **arquitectura de pasarela de pagos** con soporte para MercadoPago y múltiples proveedores.

## 🎯 Objetivo

Crear un sistema de pagos que:

1. **NO esté acoplado** a una pasarela específica
2. **Soporte múltiples proveedores**: MercadoPago, Transferencia, Efectivo (y futuros: Stripe, PayPal)
3. **Use webhooks** para confirmación de pagos (nunca confiar en frontend)
4. **Mantenga auditoría completa** mediante intenciones de pago
5. **Registre en CAJA solo pagos aprobados**
6. **Separe orquestación de lógica de negocio**

## 📦 DELIVERABLES

Debes crear estos 10 archivos:

### 1. Migration SQL

**Archivo:** `migrations/06-sistema-pagos-online.sql`

- Tabla `intenciones_pago` con campos:
  * `id`, `tipo` (TICKET/CUOTA), `referencia_id`
  * `monto`, `moneda`, `proveedor` (MERCADOPAGO/TRANSFERENCIA/EFECTIVO)
  * `estado` (CREADA/PENDIENTE/APROBADA/RECHAZADA/EXPIRADA)
  * `external_id`, `init_url`, `metadata` (JSONB)
  * `created_by`, `created_at`, `updated_at`, `approved_at`
- Agregar `intencion_id` a `tickets`, `cuotas`, `caja`
- Índices: external_id+proveedor, tipo+referencia_id, estado

### 2. PaymentProvider (clase abstracta)

**Archivo:** `teatro-tickets-backend/payments/PaymentProvider.js`

```js
export class PaymentProvider {
  constructor(config) { ... }
  
  async createPayment(data) {
    throw new Error('Must implement');
  }
  
  async handleWebhook(payload) {
    throw new Error('Must implement');
  }
  
  validateWebhookSignature(payload, signature) {
    throw new Error('Must implement');
  }
  
  async getPaymentStatus(externalId) {
    throw new Error('Must implement');
  }
}
```

### 3. MercadoPagoProvider

**Archivo:** `teatro-tickets-backend/payments/MercadoPagoProvider.js`

- Extiende `PaymentProvider`
- Implementa `createPayment()`: crea preference, devuelve `{externalId, initUrl}`
- Implementa `handleWebhook()`: valida firma, consulta estado a MP, devuelve `{status, externalId, amount}`
- Implementa `validateWebhookSignature()`: usa HMAC SHA256
- Implementa `getPaymentStatus()`: consulta pago por ID
- Usa SDK `mercadopago` (npm)
- Mapea estados MP a sistema: approved→APROBADA, rejected→RECHAZADA, pending→PENDIENTE

### 4. TransferenciaProvider

**Archivo:** `teatro-tickets-backend/payments/TransferenciaProvider.js`

- Extiende `PaymentProvider`
- `createPayment()`: devuelve `{externalId: null, initUrl: null, metadata: {instrucciones: {...}}}`
- `handleWebhook()`: lanza error (no soportado)
- Validación manual (comprobante)

### 5. EfectivoProvider

**Archivo:** `teatro-tickets-backend/payments/EfectivoProvider.js`

- Similar a `TransferenciaProvider`
- Para pagos en efectivo reportados por actores

### 6. intencionesService

**Archivo:** `teatro-tickets-backend/services/intencionesService.js`

```js
export const intencionesService = {
  crearIntencion({ tipo, referenciaId, monto, moneda, proveedor, createdBy }),
  actualizarConDatosExternos(intencionId, { externalId, initUrl, metadata }),
  aprobarIntencion(intencionId, metadata),
  rechazarIntencion(intencionId, motivo),
  buscarPorExternalId(externalId, proveedor),
  obtenerIntencion(intencionId)
}
```

### 7. pagosService

**Archivo:** `teatro-tickets-backend/services/pagosService.js`

```js
export const pagosService = {
  iniciarPago({ tipo, referenciaId, proveedor, userId }),
  procesarWebhook(proveedor, payload, signature),
  aprobarPagoYActualizarSistema(intencionId)
}
```

**Lógica de `iniciarPago()`:**

1. Validar que referencia existe (ticket o cuota)
2. Crear intención en estado CREADA
3. Obtener provider correspondiente
4. Llamar a `provider.createPayment()`
5. Actualizar intención con external_id + init_url
6. Cambiar estado a PENDIENTE
7. Devolver `{intencionId, initUrl, instrucciones}`

**Lógica de `procesarWebhook()`:**

1. Obtener provider
2. Validar firma: `provider.validateWebhookSignature()`
3. Llamar a `provider.handleWebhook()`
4. Buscar intención por external_id
5. Validar monto coincide
6. Si estado = APROBADA → llamar a `aprobarPagoYActualizarSistema()`
7. Si estado = RECHAZADA → rechazar intención

**Lógica de `aprobarPagoYActualizarSistema()`:**

```sql
BEGIN TRANSACTION;
  -- 1. Aprobar intención
  UPDATE intenciones_pago SET estado = 'APROBADA', approved_at = NOW();
  
  -- 2. Actualizar ticket o cuota
  IF tipo = 'TICKET' THEN
    UPDATE tickets SET estado_pago = 'PAGADO', intencion_id = ...;
  ELSE
    UPDATE cuotas SET estado = 'PAGADA', intencion_id = ...;
  END IF;
  
  -- 3. Registrar en CAJA
  INSERT INTO caja (funcion_id, monto, tipo_movimiento, concepto, intencion_id, validado_por);
COMMIT;
```

### 8. pagos.controller.js

**Archivo:** `teatro-tickets-backend/controllers/pagos.controller.js`

```js
export const pagosController = {
  // POST /api/pagos/iniciar
  async iniciarPago(req, res) {
    const { tipo, referenciaId, proveedor } = req.body;
    const userId = req.user.id;
    
    // Validaciones
    if (!['TICKET', 'CUOTA'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    
    // Llamar a pagosService
    const result = await pagosService.iniciarPago({
      tipo,
      referenciaId,
      proveedor,
      userId
    });
    
    res.json(result);
  },
  
  // GET /api/pagos/:id
  async consultarPago(req, res) {
    const { id } = req.params;
    const intencion = await intencionesService.obtenerIntencion(id);
    res.json(intencion);
  }
};
```

### 9. webhooks.controller.js

**Archivo:** `teatro-tickets-backend/controllers/webhooks.controller.js`

```js
export const webhooksController = {
  // POST /api/webhooks/mercadopago
  async mercadopagoWebhook(req, res) {
    const signature = req.headers['x-signature'];
    const payload = req.body;
    
    try {
      await pagosService.procesarWebhook('MERCADOPAGO', payload, signature);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }
};
```

### 10. Routes

**Archivos:**
- `teatro-tickets-backend/routes/pagos.routes.js`
- `teatro-tickets-backend/routes/webhooks.routes.js`

```js
// pagos.routes.js
import express from 'express';
import { pagosController } from '../controllers/pagos.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/iniciar', authMiddleware, pagosController.iniciarPago);
router.get('/:id', authMiddleware, pagosController.consultarPago);

export default router;

// webhooks.routes.js
import express from 'express';
import { webhooksController } from '../controllers/webhooks.controller.js';

const router = express.Router();

// NO requiere auth (es llamado por MercadoPago)
router.post('/mercadopago', webhooksController.mercadopagoWebhook);

export default router;
```

Registrar en `index-v3-postgres.js`:

```js
import pagosRoutes from './routes/pagos.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';

app.use('/api/pagos', pagosRoutes);
app.use('/api/webhooks', webhooksRoutes);
```

---

## 🔒 REGLAS CRÍTICAS

### 1. Seguridad de webhooks

**SIEMPRE:**
- Validar firma del webhook antes de procesar
- Consultar estado real a la pasarela (no confiar solo en webhook)
- Validar que monto coincide con intención
- Responder 200 OK incluso si hay error (para que pasarela no reintente)

**NUNCA:**
- Confiar en success_url del frontend
- Actualizar estado basado en callback de browser
- Procesar webhook sin validar firma

### 2. Estados y transiciones

```
CREADA → iniciarPago()
    ↓
PENDIENTE → esperando webhook o validación manual
    ↓
APROBADA → registrar en CAJA
    ↓
[solo después de APROBADA: ticket.estado_pago = PAGADO]
```

### 3. Registro en CAJA

**SOLO después de intención APROBADA:**

```js
await cajaService.registrarIngresoCaja({
  funcionId: ticket.funcion_id,
  monto: intencion.monto,
  tipoMovimiento: 'INGRESO',
  concepto: `Pago ${intencion.proveedor} - ${intencion.tipo}`,
  intencionId: intencion.id,
  validadoPor: intencion.proveedor === 'MERCADOPAGO' ? null : directorId
});
```

### 4. Proveedores y validación

| Proveedor      | Webhook | Validación     |
| -------------- | ------- | -------------- |
| MERCADOPAGO    | ✅ Sí    | Automática     |
| TRANSFERENCIA  | ❌ No    | Manual         |
| EFECTIVO       | ❌ No    | Manual         |
| STRIPE (futuro)| ✅ Sí    | Automática     |

### 5. Factory de providers

```js
// payments/providerFactory.js
import { MercadoPagoProvider } from './MercadoPagoProvider.js';
import { TransferenciaProvider } from './TransferenciaProvider.js';
import { EfectivoProvider } from './EfectivoProvider.js';

export function getProvider(proveedor) {
  switch (proveedor) {
    case 'MERCADOPAGO':
      return new MercadoPagoProvider({
        accessToken: process.env.MP_ACCESS_TOKEN,
        webhookSecret: process.env.MP_WEBHOOK_SECRET,
        webhookBaseUrl: process.env.WEBHOOK_BASE_URL,
        frontendUrl: process.env.FRONTEND_URL
      });
    case 'TRANSFERENCIA':
      return new TransferenciaProvider();
    case 'EFECTIVO':
      return new EfectivoProvider();
    default:
      throw new Error(`Provider ${proveedor} not supported`);
  }
}
```

Úsalo en servicios:

```js
import { getProvider } from '../payments/providerFactory.js';

const provider = getProvider(proveedor);
const result = await provider.createPayment(...);
```

---

## 🧪 VALIDACIONES

### Input validation (pagos.controller.js)

```js
// Validar tipo
if (!['TICKET', 'CUOTA'].includes(tipo)) {
  return res.status(400).json({ error: 'Tipo debe ser TICKET o CUOTA' });
}

// Validar proveedor
if (!['MERCADOPAGO', 'TRANSFERENCIA', 'EFECTIVO'].includes(proveedor)) {
  return res.status(400).json({ error: 'Proveedor no soportado' });
}

// Validar que referencia existe
if (tipo === 'TICKET') {
  const ticket = await ticketsService.obtenerTicket(referenciaId);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }
  if (ticket.estado_pago === 'PAGADO') {
    return res.status(400).json({ error: 'Ticket ya pagado' });
  }
}
```

### Webhook validation

```js
// 1. Validar firma
if (!provider.validateWebhookSignature(payload, signature)) {
  throw new Error('Invalid webhook signature');
}

// 2. Validar monto
const webhookData = await provider.handleWebhook(payload);
const intencion = await intencionesService.buscarPorExternalId(
  webhookData.externalId,
  proveedor
);

if (Math.abs(webhookData.amount - intencion.monto) > 0.01) {
  throw new Error('Amount mismatch');
}

// 3. Validar estado de intención
if (intencion.estado === 'APROBADA') {
  // Ya procesado, skip (idempotencia)
  return;
}
```

---

## 🎯 FLUJOS DETALLADOS

### Flujo 1: Pago con MercadoPago

```
1. Frontend llama POST /api/pagos/iniciar
   body: { tipo: 'TICKET', referenciaId: 'TKT-123', proveedor: 'MERCADOPAGO' }

2. Backend (pagosController):
   - Valida inputs
   - Llama pagosService.iniciarPago()

3. pagosService.iniciarPago():
   - Crea intención (estado: CREADA)
   - Obtiene MercadoPagoProvider
   - Llama provider.createPayment()
     → MP devuelve {externalId: 'mp-123', initUrl: 'https://...'}
   - Actualiza intención (estado: PENDIENTE, external_id, init_url)
   - Devuelve {intencionId: 1, initUrl: 'https://...'}

4. Frontend recibe respuesta:
   - Redirige usuario: window.location = initUrl

5. Usuario paga en MercadoPago

6. MercadoPago envía webhook:
   POST /api/webhooks/mercadopago
   headers: { x-signature: '...' }
   body: { data: { id: 'mp-payment-456' }, status: 'approved' }

7. Backend (webhooksController):
   - Llama pagosService.procesarWebhook('MERCADOPAGO', payload, signature)

8. pagosService.procesarWebhook():
   - Obtiene MercadoPagoProvider
   - Valida firma
   - Llama provider.handleWebhook(payload)
     → Provider consulta estado real a MP
     → Devuelve {status: 'APROBADA', externalId: 'mp-123', amount: 1000}
   - Busca intención por external_id
   - Valida monto
   - Si status = APROBADA: llama aprobarPagoYActualizarSistema()

9. aprobarPagoYActualizarSistema():
   BEGIN TRANSACTION
   - UPDATE intenciones_pago SET estado = 'APROBADA', approved_at = NOW()
   - UPDATE tickets SET estado_pago = 'PAGADO', intencion_id = 1
   - INSERT INTO caja (monto, concepto, intencion_id, validado_por = NULL)
   COMMIT

10. Backend responde 200 OK a webhook

11. Usuario vuelve al sitio (success_url) → ve ticket pagado
```

### Flujo 2: Pago por Transferencia

```
1. POST /api/pagos/iniciar
   body: { tipo: 'TICKET', referenciaId: 'TKT-123', proveedor: 'TRANSFERENCIA' }

2. pagosService.iniciarPago():
   - Crea intención (estado: CREADA)
   - Obtiene cuenta bancaria del grupo/función
   - Obtiene TransferenciaProvider
   - Llama provider.createPayment()
     → Devuelve {externalId: null, initUrl: null, metadata: {instrucciones: {...}}}
   - Actualiza intención (estado: PENDIENTE, metadata)
   - Devuelve {intencionId: 1, instrucciones: {banco, cuenta, alias, monto}}

3. Frontend muestra instrucciones:
   "Transferí $1000 a:
    Banco: XXX
    Cuenta: YYY
    Alias: teatro.tickets
    Luego subí el comprobante"

4. Usuario transfiere desde su banco

5. Usuario sube comprobante:
   POST /api/comprobantes
   body: { intencionId: 1, archivo: ... }
   → Vincula comprobante a intención

6. Director valida:
   PATCH /api/comprobantes/:id/validar
   
7. Backend:
   - Marca comprobante como VALIDADO
   - Llama pagosService.aprobarPagoYActualizarSistema(intencionId)
   - Mismo flujo que webhook: aprueba intención → paga ticket → registra caja
```

---

## 🌐 VARIABLES DE ENTORNO

Agregar a `.env`:

```bash
# MercadoPago
MP_ACCESS_TOKEN=TEST-123456789-...
MP_PUBLIC_KEY=TEST-abc123...
MP_WEBHOOK_SECRET=tu-secret-para-firmas

# URLs
WEBHOOK_BASE_URL=https://tu-dominio.com
FRONTEND_URL=https://tu-frontend.com

# Testing
MP_SANDBOX=true
```

---

## 📦 DEPENDENCIES

Agregar a `package.json`:

```json
{
  "dependencies": {
    "mercadopago": "^2.0.0"
  }
}
```

---

## ✅ TESTING

### 1. Test de provider

```js
// __tests__/payments/MercadoPagoProvider.test.js
import { MercadoPagoProvider } from '../../payments/MercadoPagoProvider.js';

describe('MercadoPagoProvider', () => {
  const provider = new MercadoPagoProvider({
    accessToken: 'TEST-123',
    webhookSecret: 'secret'
  });

  test('createPayment devuelve externalId e initUrl', async () => {
    const result = await provider.createPayment({
      title: 'Test Ticket',
      amount: 1000,
      currency: 'ARS',
      intencionId: 1
    });

    expect(result.externalId).toBeDefined();
    expect(result.initUrl).toContain('mercadopago');
  });

  test('validateWebhookSignature valida firma correcta', () => {
    const payload = { data: { id: '123' } };
    const signature = generateHMAC(payload, 'secret');

    expect(provider.validateWebhookSignature(payload, signature)).toBe(true);
  });
});
```

### 2. Test de servicio

```js
// __tests__/services/pagosService.test.js
import { pagosService } from '../../services/pagosService.js';

describe('pagosService', () => {
  test('iniciarPago crea intención y llama a provider', async () => {
    const result = await pagosService.iniciarPago({
      tipo: 'TICKET',
      referenciaId: 'TKT-123',
      proveedor: 'MERCADOPAGO',
      userId: 1
    });

    expect(result.intencionId).toBeDefined();
    expect(result.initUrl).toContain('http');
  });

  test('procesarWebhook aprueba intención con firma válida', async () => {
    const payload = createMockWebhook();
    const signature = generateValidSignature(payload);

    await pagosService.procesarWebhook('MERCADOPAGO', payload, signature);

    const intencion = await intencionesService.buscarPorExternalId('mp-123', 'MERCADOPAGO');
    expect(intencion.estado).toBe('APROBADA');
  });
});
```

### 3. Test de flujo completo

```js
// __tests__/integration/payment-flow.test.js
describe('Flujo completo de pago', () => {
  test('compra ticket con MercadoPago', async () => {
    // 1. Iniciar pago
    const res1 = await request(app)
      .post('/api/pagos/iniciar')
      .send({
        tipo: 'TICKET',
        referenciaId: 'TKT-123',
        proveedor: 'MERCADOPAGO'
      })
      .set('Authorization', `Bearer ${token}`);

    expect(res1.status).toBe(200);
    const { intencionId, initUrl } = res1.body;

    // 2. Simular webhook
    const webhookPayload = createApprovedWebhook('mp-123');
    const signature = generateSignature(webhookPayload);

    const res2 = await request(app)
      .post('/api/webhooks/mercadopago')
      .send(webhookPayload)
      .set('x-signature', signature);

    expect(res2.status).toBe(200);

    // 3. Verificar intención aprobada
    const intencion = await db.query('SELECT * FROM intenciones_pago WHERE id = $1', [intencionId]);
    expect(intencion.rows[0].estado).toBe('APROBADA');

    // 4. Verificar ticket pagado
    const ticket = await db.query('SELECT * FROM tickets WHERE ticket_code = $1', ['TKT-123']);
    expect(ticket.rows[0].estado_pago).toBe('PAGADO');

    // 5. Verificar registro en caja
    const caja = await db.query('SELECT * FROM caja WHERE intencion_id = $1', [intencionId]);
    expect(caja.rows.length).toBe(1);
  });
});
```

---

## 📊 RESPONSE FORMATS

### iniciarPago (MercadoPago)

```json
{
  "intencionId": 1,
  "estado": "PENDIENTE",
  "initUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456",
  "proveedor": "MERCADOPAGO"
}
```

### iniciarPago (Transferencia)

```json
{
  "intencionId": 2,
  "estado": "PENDIENTE",
  "proveedor": "TRANSFERENCIA",
  "instrucciones": {
    "banco": "Banco Nación",
    "titular": "Teatro XYZ",
    "cuenta": "1234567890",
    "alias": "teatro.tickets",
    "monto": 1000,
    "moneda": "ARS",
    "referencia": "INT-2"
  },
  "mensaje": "Transferí y luego subí el comprobante"
}
```

### consultarPago

```json
{
  "id": 1,
  "tipo": "TICKET",
  "referenciaId": "TKT-123",
  "monto": 1000,
  "moneda": "ARS",
  "proveedor": "MERCADOPAGO",
  "estado": "APROBADA",
  "externalId": "mp-payment-123",
  "createdAt": "2026-01-11T10:00:00Z",
  "approvedAt": "2026-01-11T10:05:00Z",
  "metadata": {
    "mpPaymentId": "123456",
    "mpStatus": "approved",
    "mpPaymentMethod": "credit_card"
  }
}
```

---

## 🔗 INTEGRACIONES

### Con sistema existente (PASO 5)

```js
// Mantener compatibilidad con comprobantes manuales

// Si intención es TRANSFERENCIA → requiere comprobante
if (intencion.proveedor === 'TRANSFERENCIA') {
  // Usuario sube comprobante
  const comprobante = await comprobantesService.subirComprobante({
    tipo: intencion.tipo,
    referenciaId: intencion.referencia_id,
    archivo: ...,
    subidoPor: userId
  });

  // Vincular comprobante a intención
  await db.query(
    'UPDATE intenciones_pago SET metadata = metadata || $1 WHERE id = $2',
    [{ comprobanteId: comprobante.id }, intencion.id]
  );
}

// Director valida comprobante → aprueba intención
await pagosService.aprobarPagoYActualizarSistema(intencionId);
```

---

## ✨ OUTPUT ESPERADO

Al finalizar deberías poder:

1. **Crear intención de pago** (POST /api/pagos/iniciar)
2. **Obtener URL de MercadoPago** (init_url)
3. **Simular webhook** (POST /api/webhooks/mercadopago)
4. **Ver intención aprobada** (estado = APROBADA)
5. **Ver ticket pagado** (estado_pago = PAGADO)
6. **Ver registro en caja** (con intencion_id)
7. **Soportar transferencia manual** (con comprobante)
8. **Soportar efectivo** (reportado por actor)

---

## 🚨 ERROR HANDLING

```js
// pagosService.js
try {
  const provider = getProvider(proveedor);
  const result = await provider.createPayment(...);
  // ...
} catch (error) {
  console.error('Error al crear pago:', error);
  
  // Marcar intención como fallida
  await db.query(
    'UPDATE intenciones_pago SET metadata = metadata || $1 WHERE id = $2',
    [{ error: error.message }, intencionId]
  );
  
  throw new Error('No se pudo iniciar el pago');
}

// webhooksController.js
try {
  await pagosService.procesarWebhook(...);
  res.status(200).json({ ok: true }); // SIEMPRE responder 200 a webhook
} catch (error) {
  console.error('Webhook error:', error);
  // Registrar error pero responder 200 para que pasarela no reintente
  res.status(200).json({ error: error.message });
}
```

---

## 🎯 CRITERIOS DE ÉXITO

- ✅ Migration crea tabla intenciones_pago
- ✅ PaymentProvider es clase abstracta
- ✅ MercadoPagoProvider implementa todos los métodos
- ✅ Webhook valida firma HMAC SHA256
- ✅ Webhook consulta estado real a MP (no confía solo en payload)
- ✅ Solo intenciones APROBADAS van a CAJA
- ✅ Transacción atómica: intención→ticket→caja (todo o nada)
- ✅ Soporta transferencia manual (comprobante)
- ✅ Soporta efectivo (reportado)
- ✅ Tests unitarios pasan
- ✅ Test de integración pasa

---

**🎯 Ahora genera el código siguiendo esta especificación.**
