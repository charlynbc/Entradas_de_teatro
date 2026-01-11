# 🧠 PASO 6 — ARQUITECTURA DE PASARELA DE PAGOS

## 🎯 Objetivo

Diseñar una **arquitectura de pagos online** que:

- ✅ Soporte múltiples proveedores (MercadoPago, Stripe, PayPal)
- ✅ Mantenga control contable y auditoría
- ✅ NO dependa de una pasarela específica
- ✅ Conviva con efectivo, transferencias y pagos manuales
- ✅ Use webhooks para confirmación (nunca confíe en frontend)
- ✅ Registre en CAJA solo pagos confirmados

---

## 🚨 PROBLEMA HOY

### ❌ Sin pagos online

```
INVITADO quiere comprar ticket online
→ Sistema muestra datos bancarios
→ Invitado transfiere
→ Sube comprobante
→ Espera que director valide
→ ⏰ DEMORA: horas o días
```

**Problema:**
- Comprador debe esperar validación manual
- No hay confirmación inmediata
- No genera ticket al instante
- Mala experiencia de usuario

### ❌ Si integramos MercadoPago directo

```js
// MAL (acoplado)
ticketsController.js:
  createTicket() {
    // ...
    const mp = new MercadoPago(ACCESS_TOKEN);
    const payment = await mp.create(...);
    // ❌ lógica de negocio mezclada con pasarela
  }
```

**Problemas:**
- ❌ Acoplado a MercadoPago (imposible cambiar proveedor)
- ❌ Lógica de tickets conoce detalles de pago
- ❌ Sin abstracción (mañana quiero Stripe → reescribir todo)
- ❌ Sin trazabilidad clara
- ❌ Sin estados intermedios

---

## ✅ SOLUCIÓN: ORQUESTACIÓN DE PAGOS

### 🧠 Principio fundamental

> **"El sistema NO cobra.
> El sistema ORQUESTA cobros."**

**Separación de responsabilidades:**

```
PASARELA (MercadoPago)    → COBRA
SISTEMA (tu backend)       → REGISTRA + AUDITA + IMPACTA CAJA
```

### 🎯 Capa de abstracción

```
┌─────────────────────────────────────────┐
│         ticketsController.js            │  ← NO sabe de MercadoPago
│         cuotasController.js             │  ← NO sabe de pasarelas
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        pagosController.js               │  ← Orquesta pagos
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        PaymentProvider (interface)      │  ← Abstracción
├─────────────────────────────────────────┤
│  - MercadoPagoProvider                  │
│  - TransferenciaProvider                │
│  - EfectivoProvider                     │
│  - (futuro) StripeProvider              │
└─────────────────────────────────────────┘
```

---

## 📊 NUEVA ENTIDAD: INTENCIONES_PAGO

Esta es la **pieza central** del sistema de pagos.

### 🗄️ Schema

```sql
CREATE TABLE intenciones_pago (
  id SERIAL PRIMARY KEY,
  
  -- Qué se está pagando
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('TICKET', 'CUOTA')),
  referencia_id VARCHAR(100) NOT NULL,  -- ticket_code o cuota_id
  
  -- Cuánto y cómo
  monto DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  proveedor VARCHAR(50) NOT NULL CHECK (proveedor IN (
    'MERCADOPAGO',
    'TRANSFERENCIA',
    'EFECTIVO',
    'STRIPE',
    'PAYPAL'
  )),
  
  -- Estado del pago
  estado VARCHAR(20) NOT NULL DEFAULT 'CREADA' CHECK (estado IN (
    'CREADA',           -- Intención creada, no enviada a pasarela
    'PENDIENTE',        -- Enviada a pasarela, esperando confirmación
    'APROBADA',         -- Pago confirmado
    'RECHAZADA',        -- Pago rechazado
    'EXPIRADA'          -- Pago no completado en tiempo
  )),
  
  -- Datos de pasarela
  external_id VARCHAR(255),      -- ID de MercadoPago/Stripe
  init_url TEXT,                 -- URL de pago (para redirect)
  
  -- Metadatos
  metadata JSONB,                -- Datos adicionales del proveedor
  
  -- Auditoría
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  
  -- Índices
  UNIQUE(external_id, proveedor),
  INDEX idx_referencia (tipo, referencia_id),
  INDEX idx_estado (estado),
  INDEX idx_proveedor (proveedor)
);
```

### 🎯 Por qué es importante

**Trazabilidad total:**
- Cada peso tiene intención asociada
- Estados claros del ciclo de vida
- Soporte para múltiples proveedores
- Auditoría completa (quién, cuándo, cómo)

**Desacoplamiento:**
- Tickets/Cuotas no conocen detalles de pago
- Cambiar proveedor no afecta entidades core
- Fácil agregar nuevos métodos de pago

**Control:**
- Solo intenciones APROBADAS impactan CAJA
- Estados intermedios visibles
- Posibilidad de rollback/refund

---

## 🔄 FLUJOS COMPLETOS

### 1️⃣ PAGO ONLINE CON MERCADOPAGO (Ticket Profesional)

```
┌─────────────────────────────────────────┐
│ 1. INVITADO ve función profesional      │
│    GET /funciones/:id                   │
│    → Ve precio, disponibilidad          │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. INVITADO inicia compra               │
│    POST /api/pagos/iniciar              │
│    {                                    │
│      tipo: 'TICKET',                    │
│      funcionId: 123,                    │
│      proveedor: 'MERCADOPAGO'           │
│    }                                    │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. BACKEND crea intención               │
│    - Genera ticket (estado: RESERVADO)  │
│    - Crea intención_pago                │
│      * tipo: TICKET                     │
│      * referencia_id: ticket_code       │
│      * estado: CREADA                   │
│      * monto: función.precio            │
│      * proveedor: MERCADOPAGO           │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. BACKEND llama a MercadoPago          │
│    mercadopagoProvider.createPayment()  │
│    → MercadoPago devuelve:              │
│      * payment_id (external_id)         │
│      * init_point (URL de pago)         │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. BACKEND actualiza intención          │
│    - external_id = payment_id           │
│    - init_url = init_point              │
│    - estado = PENDIENTE                 │
│                                         │
│    RESPONDE a frontend:                 │
│    { init_url: "https://mp.com/..." }  │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 6. FRONTEND redirige a MercadoPago      │
│    window.location = init_url           │
│    → Usuario paga en sitio de MP        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 7. MERCADOPAGO procesa pago             │
│    Usuario ingresa tarjeta/etc          │
│    → MP autoriza o rechaza              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 8. MERCADOPAGO envía WEBHOOK            │
│    POST /api/pagos/webhook/mercadopago  │
│    {                                    │
│      id: payment_id,                    │
│      status: "approved",                │
│      ...firma...                        │
│    }                                    │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 9. BACKEND valida webhook               │
│    - Verifica firma MP (seguridad)      │
│    - Busca intención por external_id    │
│    - Valida monto y moneda              │
│    - Verifica estado de MP              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 10. BACKEND actualiza sistema           │
│     BEGIN TRANSACTION                   │
│     - intención.estado = APROBADA       │
│     - ticket.estado_pago = PAGADO       │
│     - ticket.estado = VALIDO (QR activo)│
│     - Registro en CAJA:                 │
│       * concepto: "Venta online"        │
│       * monto: ticket.precio            │
│       * intencion_id: ...               │
│       * validado_por: SYSTEM            │
│     COMMIT                              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 11. USUARIO recibe ticket               │
│     Email con QR + PDF                  │
│     Puede consultar en app              │
└─────────────────────────────────────────┘
```

**📌 Puntos críticos:**
- Frontend NUNCA marca ticket como pagado
- Backend SOLO confía en webhook firmado
- Caja recibe ingreso SOLO después de confirmación
- Transacción atómica (todo o nada)

---

### 2️⃣ PAGO POR TRANSFERENCIA (Manual)

```
┌─────────────────────────────────────────┐
│ 1. INVITADO inicia compra               │
│    POST /api/pagos/iniciar              │
│    { proveedor: 'TRANSFERENCIA' }       │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. BACKEND crea intención               │
│    - estado = PENDIENTE                 │
│    - NO hay external_id                 │
│    - NO hay init_url                    │
│                                         │
│    RESPONDE:                            │
│    {                                    │
│      cuentaBancaria: { ... },           │
│      referencia: ticket_code            │
│    }                                    │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. USUARIO transfiere manualmente       │
│    Va a su banco online                 │
│    Transfiere a cuenta indicada         │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. USUARIO sube comprobante             │
│    POST /api/comprobantes               │
│    { intencion_id, archivo }            │
│                                         │
│    → Vincula comprobante a intención    │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. DIRECTOR valida comprobante          │
│    PATCH /api/comprobantes/:id/validar  │
│                                         │
│    BEGIN TRANSACTION                    │
│    - comprobante.estado = VALIDADO      │
│    - intención.estado = APROBADA        │
│    - ticket.estado_pago = PAGADO        │
│    - Registro en CAJA                   │
│    COMMIT                               │
└─────────────────────────────────────────┘
```

**📌 Diferencia clave:**
- Mismo modelo (intenciones_pago)
- Distinto validador (humano vs webhook)
- Misma lógica de negocio (ticket → pagado → caja)

---

### 3️⃣ PAGO EN EFECTIVO (Venta Independiente)

```
┌─────────────────────────────────────────┐
│ 1. ACTOR vende ticket en mano          │
│    Recibe efectivo del comprador        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. ACTOR reporta venta                  │
│    POST /api/pagos/iniciar              │
│    { proveedor: 'EFECTIVO' }            │
│                                         │
│    BACKEND crea intención:              │
│    - estado = PENDIENTE                 │
│    - monto = reportado                  │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. DIRECTOR valida                      │
│    PATCH /intenciones/:id/aprobar       │
│                                         │
│    - intención.estado = APROBADA        │
│    - ticket.estado_pago = PAGADO        │
│    - Registro en CAJA                   │
└─────────────────────────────────────────┘
```

---

## 🏗️ ARQUITECTURA DE SERVICIOS

### 📁 Nueva estructura

```
teatro-tickets-backend/
├─ payments/
│  ├─ PaymentProvider.js          ← Clase abstracta (interface)
│  ├─ MercadoPagoProvider.js      ← Implementación MP
│  ├─ TransferenciaProvider.js    ← "Provider" para manual
│  └─ EfectivoProvider.js         ← "Provider" para efectivo
│
├─ services/
│  ├─ intencionesService.js       ← Lógica de intenciones
│  └─ pagosService.js             ← Orquestación de pagos
│
├─ controllers/
│  ├─ pagos.controller.js         ← Endpoints públicos
│  └─ webhooks.controller.js      ← Endpoints para pasarelas
│
└─ routes/
   ├─ pagos.routes.js
   └─ webhooks.routes.js
```

---

### 🧱 PaymentProvider (clase abstracta)

```js
// payments/PaymentProvider.js

/**
 * Interfaz para proveedores de pago
 * Cada provider debe implementar estos métodos
 */
export class PaymentProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Crea un pago en el proveedor
   * @param {Object} data - Datos del pago
   * @returns {Promise<{externalId, initUrl}>}
   */
  async createPayment(data) {
    throw new Error('createPayment() must be implemented');
  }

  /**
   * Maneja webhook del proveedor
   * @param {Object} payload - Datos del webhook
   * @returns {Promise<{status, externalId, amount}>}
   */
  async handleWebhook(payload) {
    throw new Error('handleWebhook() must be implemented');
  }

  /**
   * Valida firma del webhook (seguridad)
   * @param {Object} payload
   * @param {string} signature
   * @returns {boolean}
   */
  validateWebhookSignature(payload, signature) {
    throw new Error('validateWebhookSignature() must be implemented');
  }

  /**
   * Consulta estado de un pago
   * @param {string} externalId
   * @returns {Promise<{status, amount}>}
   */
  async getPaymentStatus(externalId) {
    throw new Error('getPaymentStatus() must be implemented');
  }
}
```

---

### 💳 MercadoPagoProvider

```js
// payments/MercadoPagoProvider.js

import { PaymentProvider } from './PaymentProvider.js';
import mercadopago from 'mercadopago';
import crypto from 'crypto';

export class MercadoPagoProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    mercadopago.configure({
      access_token: config.accessToken
    });
  }

  async createPayment({ title, description, amount, currency, intencionId }) {
    const preference = {
      items: [{
        title,
        description,
        unit_price: amount,
        quantity: 1,
        currency_id: currency
      }],
      external_reference: intencionId.toString(),
      notification_url: `${this.config.webhookBaseUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${this.config.frontendUrl}/pago-exitoso`,
        failure: `${this.config.frontendUrl}/pago-fallido`,
        pending: `${this.config.frontendUrl}/pago-pendiente`
      },
      auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      externalId: response.body.id,
      initUrl: response.body.init_point
    };
  }

  async handleWebhook(payload) {
    // MercadoPago envía el ID del pago en el webhook
    const paymentId = payload.data?.id;
    
    if (!paymentId) {
      throw new Error('Invalid webhook payload');
    }

    // Consultar estado real a MercadoPago (nunca confiar solo en webhook)
    const payment = await mercadopago.payment.findById(paymentId);

    return {
      status: this.mapMPStatus(payment.body.status),
      externalId: payment.body.external_reference,
      amount: payment.body.transaction_amount,
      currency: payment.body.currency_id,
      metadata: {
        mpPaymentId: payment.body.id,
        mpStatus: payment.body.status,
        mpPaymentMethod: payment.body.payment_method_id
      }
    };
  }

  validateWebhookSignature(payload, signature) {
    // MercadoPago firma webhooks con x-signature header
    const secret = this.config.webhookSecret;
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return computed === signature;
  }

  mapMPStatus(mpStatus) {
    const statusMap = {
      'approved': 'APROBADA',
      'rejected': 'RECHAZADA',
      'pending': 'PENDIENTE',
      'in_process': 'PENDIENTE',
      'cancelled': 'RECHAZADA',
      'refunded': 'RECHAZADA'
    };
    return statusMap[mpStatus] || 'PENDIENTE';
  }

  async getPaymentStatus(externalId) {
    const payment = await mercadopago.payment.findById(externalId);
    return {
      status: this.mapMPStatus(payment.body.status),
      amount: payment.body.transaction_amount
    };
  }
}
```

---

### 🔄 TransferenciaProvider (manual)

```js
// payments/TransferenciaProvider.js

import { PaymentProvider } from './PaymentProvider.js';

/**
 * Provider "fake" para transferencias manuales
 * No se comunica con ninguna API, solo estructura datos
 */
export class TransferenciaProvider extends PaymentProvider {
  async createPayment({ cuentaBancaria, monto, intencionId }) {
    // No hay external_id ni init_url
    // Solo devuelve info para mostrar al usuario
    return {
      externalId: null,
      initUrl: null,
      metadata: {
        instrucciones: {
          banco: cuentaBancaria.banco,
          titular: cuentaBancaria.titular,
          cuenta: cuentaBancaria.numero_cuenta,
          alias: cuentaBancaria.alias,
          monto: monto,
          referencia: `INT-${intencionId}`
        }
      }
    };
  }

  async handleWebhook(payload) {
    // Transferencias no tienen webhook
    // La validación es manual (comprobante)
    throw new Error('TransferenciaProvider does not support webhooks');
  }

  validateWebhookSignature(payload, signature) {
    return false; // No hay webhooks
  }

  async getPaymentStatus(externalId) {
    // Estado manejado manualmente
    throw new Error('Manual payment status check not supported');
  }
}
```

---

### 💰 EfectivoProvider

```js
// payments/EfectivoProvider.js

import { PaymentProvider } from './PaymentProvider.js';

/**
 * Provider para pagos en efectivo
 * Similar a transferencia: manual, sin API
 */
export class EfectivoProvider extends PaymentProvider {
  async createPayment({ monto, intencionId }) {
    return {
      externalId: null,
      initUrl: null,
      metadata: {
        instrucciones: {
          tipo: 'efectivo',
          monto: monto,
          referencia: `INT-${intencionId}`,
          nota: 'Pago reportado por vendedor, requiere validación'
        }
      }
    };
  }

  async handleWebhook(payload) {
    throw new Error('EfectivoProvider does not support webhooks');
  }

  validateWebhookSignature(payload, signature) {
    return false;
  }

  async getPaymentStatus(externalId) {
    throw new Error('Manual payment status check not supported');
  }
}
```

---

### 🎯 intencionesService.js

```js
// services/intencionesService.js

import db from '../db.js';

export const intencionesService = {
  /**
   * Crea una nueva intención de pago
   */
  async crearIntencion({ tipo, referenciaId, monto, moneda, proveedor, createdBy }) {
    const query = `
      INSERT INTO intenciones_pago 
        (tipo, referencia_id, monto, moneda, proveedor, estado, created_by)
      VALUES ($1, $2, $3, $4, $5, 'CREADA', $6)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      tipo,
      referenciaId,
      monto,
      moneda || 'ARS',
      proveedor,
      createdBy
    ]);
    
    return result.rows[0];
  },

  /**
   * Actualiza intención con datos de pasarela
   */
  async actualizarConDatosExternos(intencionId, { externalId, initUrl, metadata }) {
    const query = `
      UPDATE intenciones_pago
      SET 
        external_id = $1,
        init_url = $2,
        metadata = $3,
        estado = 'PENDIENTE',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [externalId, initUrl, metadata, intencionId]);
    return result.rows[0];
  },

  /**
   * Aprueba intención (después de webhook o validación manual)
   */
  async aprobarIntencion(intencionId, metadata = {}) {
    const query = `
      UPDATE intenciones_pago
      SET 
        estado = 'APROBADA',
        approved_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND estado = 'PENDIENTE'
      RETURNING *
    `;
    
    const result = await db.query(query, [metadata, intencionId]);
    return result.rows[0];
  },

  /**
   * Rechaza intención
   */
  async rechazarIntencion(intencionId, motivo) {
    const query = `
      UPDATE intenciones_pago
      SET 
        estado = 'RECHAZADA',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('motivo_rechazo', $1),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [motivo, intencionId]);
    return result.rows[0];
  },

  /**
   * Busca intención por external_id (para webhooks)
   */
  async buscarPorExternalId(externalId, proveedor) {
    const query = `
      SELECT * FROM intenciones_pago
      WHERE external_id = $1 AND proveedor = $2
    `;
    
    const result = await db.query(query, [externalId, proveedor]);
    return result.rows[0];
  },

  /**
   * Obtiene intención con todos sus datos
   */
  async obtenerIntencion(intencionId) {
    const query = `
      SELECT 
        ip.*,
        u.nombre as creador_nombre
      FROM intenciones_pago ip
      LEFT JOIN usuarios u ON ip.created_by = u.id
      WHERE ip.id = $1
    `;
    
    const result = await db.query(query, [intencionId]);
    return result.rows[0];
  }
};
```

---

## 🔐 SEGURIDAD (CRÍTICO)

### ⚠️ Reglas de oro para webhooks

1. **NUNCA confiar en el frontend**
   ```js
   // ❌ MAL
   app.post('/pago-exitoso', (req, res) => {
     const { ticketId } = req.body;
     markTicketAsPaid(ticketId); // ❌ frontend puede mentir
   });
   ```

2. **SIEMPRE validar firma del webhook**
   ```js
   // ✅ BIEN
   app.post('/webhook/mercadopago', (req, res) => {
     const signature = req.headers['x-signature'];
     if (!provider.validateWebhookSignature(req.body, signature)) {
       return res.status(401).json({ error: 'Invalid signature' });
     }
     // continuar...
   });
   ```

3. **SIEMPRE consultar estado a la pasarela**
   ```js
   // ✅ BIEN
   const webhookData = req.body;
   const realStatus = await provider.getPaymentStatus(webhookData.id);
   // usar realStatus, no webhookData.status
   ```

4. **NUNCA usar success_url para confirmar pagos**
   ```js
   // ❌ MAL
   app.get('/pago-exitoso', (req, res) => {
     markAsPaid(); // ❌ usuario puede ir a esta URL sin pagar
   });
   ```

5. **Validar monto y moneda**
   ```js
   // ✅ BIEN
   const intencion = await intencionesService.obtenerIntencion(id);
   if (webhookData.amount !== intencion.monto) {
     throw new Error('Amount mismatch');
   }
   ```

---

## 🎯 CONTROLLERS

### 📮 pagos.controller.js

```js
// controllers/pagos.controller.js

export const pagosController = {
  /**
   * POST /api/pagos/iniciar
   * Inicia un pago (ticket o cuota)
   */
  async iniciarPago(req, res) {
    const { tipo, referenciaId, proveedor } = req.body;
    const userId = req.user.id;

    // 1. Validar referencia (ticket o cuota existe)
    // 2. Crear intención de pago
    // 3. Obtener provider correspondiente
    // 4. Llamar a provider.createPayment()
    // 5. Actualizar intención con datos externos
    // 6. Devolver init_url (o instrucciones si es manual)
  },

  /**
   * GET /api/pagos/:id
   * Consulta estado de un pago
   */
  async consultarPago(req, res) {
    const { id } = req.params;
    // Devuelve intención + estado actual
  }
};
```

---

### 🪝 webhooks.controller.js

```js
// controllers/webhooks.controller.js

export const webhooksController = {
  /**
   * POST /api/webhooks/mercadopago
   * Recibe notificaciones de MercadoPago
   */
  async mercadopagoWebhook(req, res) {
    // 1. Validar firma
    // 2. Obtener provider
    // 3. Llamar a provider.handleWebhook()
    // 4. Buscar intención por external_id
    // 5. Aprobar/rechazar intención
    // 6. Impactar en tickets/cuotas
    // 7. Registrar en CAJA
    // 8. Responder 200 OK (importante para MP)
  }
};
```

---

## 📊 MIGRATION SQL

```sql
-- migrations/06-sistema-pagos-online.sql

-- 1. Crear tabla intenciones_pago
CREATE TABLE IF NOT EXISTS intenciones_pago (
  id SERIAL PRIMARY KEY,
  
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('TICKET', 'CUOTA')),
  referencia_id VARCHAR(100) NOT NULL,
  
  monto DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'ARS',
  proveedor VARCHAR(50) NOT NULL CHECK (proveedor IN (
    'MERCADOPAGO',
    'TRANSFERENCIA',
    'EFECTIVO',
    'STRIPE',
    'PAYPAL'
  )),
  
  estado VARCHAR(20) NOT NULL DEFAULT 'CREADA' CHECK (estado IN (
    'CREADA',
    'PENDIENTE',
    'APROBADA',
    'RECHAZADA',
    'EXPIRADA'
  )),
  
  external_id VARCHAR(255),
  init_url TEXT,
  metadata JSONB,
  
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

-- Índices
CREATE UNIQUE INDEX idx_intenciones_external ON intenciones_pago(external_id, proveedor)
  WHERE external_id IS NOT NULL;
CREATE INDEX idx_intenciones_referencia ON intenciones_pago(tipo, referencia_id);
CREATE INDEX idx_intenciones_estado ON intenciones_pago(estado);
CREATE INDEX idx_intenciones_proveedor ON intenciones_pago(proveedor);

-- 2. Agregar intencion_id a tickets
ALTER TABLE tickets 
  ADD COLUMN IF NOT EXISTS intencion_id INTEGER REFERENCES intenciones_pago(id);

-- 3. Agregar intencion_id a cuotas
ALTER TABLE cuotas
  ADD COLUMN IF NOT EXISTS intencion_id INTEGER REFERENCES intenciones_pago(id);

-- 4. Agregar intencion_id a caja
ALTER TABLE caja
  ADD COLUMN IF NOT EXISTS intencion_id INTEGER REFERENCES intenciones_pago(id);

-- 5. Índices de relación
CREATE INDEX idx_tickets_intencion ON tickets(intencion_id);
CREATE INDEX idx_cuotas_intencion ON cuotas(intencion_id);
CREATE INDEX idx_caja_intencion ON caja(intencion_id);
```

---

## ✅ REGLAS DE NEGOCIO

### 🎯 Estados y transiciones

```
CREADA → PENDIENTE → APROBADA → [impacto en CAJA]
                  ↘ RECHAZADA
                  ↘ EXPIRADA
```

### 🔒 Control de acceso

| Acción                  | Actor      | Director | Sistema |
| ----------------------- | ---------- | -------- | ------- |
| Crear intención         | ✅          | ✅        | ✅       |
| Ver intenciones propias | ✅          | ✅        | ✅       |
| Ver todas intenciones   | ❌          | ✅        | ✅       |
| Aprobar (manual)        | ❌          | ✅        | -       |
| Aprobar (webhook)       | ❌          | ❌        | ✅       |

### 💰 Registro en CAJA

**SOLO después de aprobación:**

```sql
INSERT INTO caja (
  funcion_id,
  monto,
  tipo_movimiento,
  concepto,
  intencion_id,
  validado_por
) VALUES (
  ...,
  intencion.monto,
  'INGRESO',
  'Pago online - ' || intencion.proveedor,
  intencion.id,
  CASE 
    WHEN intencion.proveedor = 'MERCADOPAGO' THEN NULL  -- sistema
    ELSE director_id                                     -- manual
  END
);
```

---

## 🧪 TESTING

### 1️⃣ Test de providers

```js
describe('MercadoPagoProvider', () => {
  it('crea preference correctamente', async () => {
    const provider = new MercadoPagoProvider(config);
    const result = await provider.createPayment({
      title: 'Ticket Test',
      amount: 1000,
      currency: 'ARS',
      intencionId: 123
    });
    
    expect(result.externalId).toBeDefined();
    expect(result.initUrl).toContain('mercadopago.com');
  });

  it('valida firma de webhook', () => {
    const provider = new MercadoPagoProvider(config);
    const payload = { data: { id: '123' } };
    const signature = generateValidSignature(payload);
    
    expect(provider.validateWebhookSignature(payload, signature)).toBe(true);
  });
});
```

### 2️⃣ Test de flujo completo

```js
describe('Flujo de pago online', () => {
  it('compra ticket con MercadoPago', async () => {
    // 1. Iniciar pago
    const response1 = await request(app)
      .post('/api/pagos/iniciar')
      .send({
        tipo: 'TICKET',
        funcionId: 1,
        proveedor: 'MERCADOPAGO'
      });
    
    expect(response1.body.initUrl).toBeDefined();
    const intencionId = response1.body.intencionId;

    // 2. Simular webhook de MP
    const webhookPayload = {
      data: { id: 'mp-payment-123' },
      status: 'approved'
    };
    
    const response2 = await request(app)
      .post('/api/webhooks/mercadopago')
      .send(webhookPayload)
      .set('x-signature', generateSignature(webhookPayload));
    
    expect(response2.status).toBe(200);

    // 3. Verificar intención aprobada
    const intencion = await intencionesService.obtenerIntencion(intencionId);
    expect(intencion.estado).toBe('APROBADA');

    // 4. Verificar ticket pagado
    const ticket = await ticketsService.obtenerTicket(intencion.referencia_id);
    expect(ticket.estado_pago).toBe('PAGADO');

    // 5. Verificar registro en caja
    const cajaEntry = await cajaService.buscarPorIntencion(intencionId);
    expect(cajaEntry).toBeDefined();
  });
});
```

---

## 📈 BENEFICIOS DE ESTA ARQUITECTURA

### ✅ Extensibilidad

Agregar nuevo proveedor = crear nueva clase:

```js
export class StripeProvider extends PaymentProvider {
  // implementar métodos
}
```

**Sin tocar:**
- ticketsController
- cuotasController
- pagosController (casi)
- Base de datos

---

### ✅ Testabilidad

```js
// Mock provider para tests
export class MockProvider extends PaymentProvider {
  async createPayment() {
    return { externalId: 'mock-123', initUrl: 'http://mock' };
  }
  
  async handleWebhook() {
    return { status: 'APROBADA' };
  }
}
```

---

### ✅ Mantenibilidad

Cambio en MercadoPago API:
- Solo modificar `MercadoPagoProvider.js`
- Resto del sistema sin cambios

---

### ✅ Auditoría

```sql
-- Ver todos los pagos de un ticket
SELECT 
  ip.*,
  u.nombre as iniciador
FROM intenciones_pago ip
JOIN usuarios u ON ip.created_by = u.id
WHERE ip.tipo = 'TICKET' AND ip.referencia_id = 'TKT-123';

-- Ver pagos por proveedor
SELECT proveedor, COUNT(*), SUM(monto)
FROM intenciones_pago
WHERE estado = 'APROBADA'
GROUP BY proveedor;
```

---

## 🚀 PRÓXIMOS PASOS

### Inmediato (PASO 6)

1. ✅ Leer este diagnóstico
2. ⏳ Ejecutar PROMPT-PASO-6-COPILOT.md
3. ⏳ Implementar providers base
4. ⏳ Implementar servicios
5. ⏳ Implementar controllers
6. ⏳ Run migration
7. ⏳ Tests unitarios
8. ⏳ Test de integración (mock)

### Siguiente (PASO 7)

1. Integración real con MercadoPago (credenciales)
2. Testing en sandbox de MP
3. Configurar webhooks públicos (ngrok o similar)
4. UI para pagos online
5. Testing end-to-end

---

## 📚 RECURSOS

- [MercadoPago Docs](https://www.mercadopago.com.ar/developers/es/docs)
- [MercadoPago SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks Best Practices](https://docs.mercadopago.com/developers/en/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)

---

## ✨ CONCLUSIÓN

Con esta arquitectura:

- ✅ **NO estás casado con MercadoPago**
- ✅ **El sistema orquesta, no ejecuta**
- ✅ **Trazabilidad completa (intenciones)**
- ✅ **Seguridad por diseño (webhooks validados)**
- ✅ **Extensible (nuevos providers = nueva clase)**
- ✅ **Testeable (mock providers)**
- ✅ **Mismo modelo para manual y automático**

**"No es MercadoPago.
Es arquitectura de pagos que usa MercadoPago."**

🎯 **Ahora sí: ejecutá PROMPT-PASO-6-COPILOT.md**
