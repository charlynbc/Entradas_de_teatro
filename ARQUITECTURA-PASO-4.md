# 🧠 PASO 4 — NUEVO MODELO MENTAL (clarísimo)

## La Regla Madre

```
╔════════════════════════════════════════════════════════════════╗
║  El controller NO decide.                                       ║
║  El controller SOLO coordina.                                   ║
╚════════════════════════════════════════════════════════════════╝
```

Bajo esta regla:

### ❌ El controller NO

- Define si un ticket puede pasar a PAGADO
- Sabe qué estados existen
- Escribe lógica contable
- Crea reglas de autorización
- Decide qué auditar
- Toca transacciones

### ✅ El controller SÍ

- Lee el request HTTP
- Valida formato (campos obligatorios)
- Llama al service correcto
- Responde HTTP
- Maneja errores de HTTP

---

## Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│  HTTP (req, res, status codes)          │
│  ↑                                       │
│  ┌─────────────────────────────────────┐│
│  │ CONTROLLERS                         ││  ← Solo HTTP
│  │ ├─ ticketsController.js             ││     (50 líneas)
│  │ ├─ publicSalesController.js         ││
│  │ └─ actorSalesController.js          ││
│  │     ↓ Delega TODO a services        ││
│  └─────────────────────────────────────┘│
│  ↓                                       │
│  ┌─────────────────────────────────────┐│
│  │ SERVICES (Lógica de negocio)        ││  ← Todo pasa por aquí
│  │ ├─ ticketService.js                 ││     (200+ líneas)
│  │ │  └─ changeTicketStatus()          ││
│  │ ├─ ticketStateMachine.js            ││
│  │ │  └─ canTransition()               ││
│  │ ├─ ticketAuditService.js            ││
│  │ │  └─ registrarMovimiento()         ││
│  │ └─ cajaService.js                   ││
│  │    └─ registrarIngresoCaja()        ││
│  │     ↓ Usan transacciones ACID       ││
│  └─────────────────────────────────────┘│
│  ↓                                       │
│  ┌─────────────────────────────────────┐│
│  │ DATABASE (facts of life)            ││  ← Source of truth
│  │ ├─ tickets (DISPONIBLE, PAGADO...)  ││
│  │ ├─ movimientos (auditoría)          ││
│  │ └─ caja (ingresos/egresos)          ││
│  │     + Transacciones Begin/Commit    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Flujo de 1 Request Real

```
REQUEST:
  POST /tickets/ABC123/status
  Body: { to: "PAGADO", motivo: "Pago recibido" }
  User: { cedula: "12345", role: "DIRECTOR" }

  ↓

1. CONTROLLER (50 líneas)
   if (!code || !to) return 400
   const ticket = await getTicket(code)
   if (!ticket) return 404
   
   ✓ Valida formato HTTP
   ✗ NO valida lógica

  ↓

2. SERVICE: ticketService.changeTicketStatus()
   
   a) Valida máquina de estados
      canTransition('RESERVADO', 'PAGADO') ✓
      
   b) Valida autorización
      if (to=PAGADO && !['SUPER','ADMIN'].includes(role))
        throw Error
      
   c) BEGIN TRANSACTION
   
   d) Cambia estado en BD
      UPDATE tickets SET estado = PAGADO
      
   e) Registra auditoría (via auditService)
      INSERT INTO movimientos
      
   f) Registra caja (via cajaService)
      INSERT INTO caja
      
   g) COMMIT TRANSACTION
   
   h) Return { success: true, ticket }

  ↓

3. CONTROLLER responde
   res.json({ success: true })

RESPONSE 200:
  { success: true }
```

---

## Separación de Responsabilidades

### 📋 Constants

**Archivo:** `constants/ticketStates.js`

```javascript
// Hechos inmutables del sistema
export const TICKET_STATES = {
  DISPONIBLE: 'DISPONIBLE',
  RESERVADO: 'RESERVADO',
  REPORTADA_VENDIDA: 'REPORTADA_VENDIDA',
  PAGADO: 'PAGADO',
  USADO: 'USADO',
  ANULADO: 'ANULADO'
};

export const TICKET_ORIGINS = {
  ACTOR: 'ACTOR',
  ONLINE: 'ONLINE',
  CORTESIA: 'CORTESIA'
};

export const ROLES = {
  SUPER: 'SUPER',
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  ACTOR: 'ACTOR',
  VENDEDOR: 'VENDEDOR',
  INVITADO: 'INVITADO'
};
```

✅ **Beneficio:** Definiciones en 1 lugar. Si cambias un estado, actualizas aquí.

---

### 🤖 State Machine

**Archivo:** `services/ticketStateMachine.js`

```javascript
import { TICKET_STATES as S } from '../constants/ticketStates.js';

// Transiciones válidas: de → [hacia]
const TRANSITIONS = {
  [S.DISPONIBLE]: [S.RESERVADO, S.ANULADO],
  [S.RESERVADO]: [S.REPORTADA_VENDIDA, S.ANULADO],
  [S.REPORTADA_VENDIDA]: [S.PAGADO, S.ANULADO],
  [S.PAGADO]: [S.USADO, S.ANULADO],
  [S.USADO]: [], // fin de línea
  [S.ANULADO]: []
};

export function canTransition(from, to) {
  if (!TRANSITIONS[from]) {
    throw new Error(`Estado inválido: ${from}`);
  }
  return TRANSITIONS[from].includes(to);
}

export function getValidTransitions(from) {
  return TRANSITIONS[from] || [];
}
```

✅ **Beneficio:** Máquina de estados centralizada. La lógica de transiciones existe en 1 archivo.

---

### 💼 Business Logic Service

**Archivo:** `services/ticketService.js`

```javascript
import { canTransition } from './ticketStateMachine.js';
import { registrarMovimiento } from './ticketAuditService.js';
import { registrarIngresoCaja } from './cajaService.js';
import { TICKET_STATES, ROLES } from '../constants/index.js';
import { query } from '../db.js';

export async function changeTicketStatus({
  ticket,
  to,
  user,
  motivo
}) {
  // Validar transición
  if (!canTransition(ticket.estado, to)) {
    throw new Error(
      `Transición no permitida: ${ticket.estado} → ${to}`
    );
  }

  // Validar autorización
  if (to === TICKET_STATES.PAGADO) {
    const authorized = [ROLES.SUPER, ROLES.ADMIN, ROLES.DIRECTOR]
      .includes(user.role);
    
    if (!authorized) {
      throw new Error('No autorizado para aprobar pagos');
    }
  }

  // Transacción ACID
  const client = await query('BEGIN');
  
  try {
    // 1. Cambiar estado
    await query(
      `UPDATE tickets 
       SET estado = $1, actualizado_en = NOW() 
       WHERE code = $2`,
      [to, ticket.code]
    );

    // 2. Registrar auditoría
    await registrarMovimiento({
      ticketCode: ticket.code,
      estadoAnterior: ticket.estado,
      estadoNuevo: to,
      realizadoPor: user.cedula,
      motivo
    });

    // 3. Registrar caja (si aplica)
    if (to === TICKET_STATES.PAGADO) {
      await registrarIngresoCaja({
        ticket,
        motivo
      });
    }

    await query('COMMIT');
    
    return { success: true };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
```

✅ **Beneficio:** Toda la inteligencia en un archivo. Service no sabe ni le importa HTTP.

---

### 📊 Audit Service

**Archivo:** `services/ticketAuditService.js`

```javascript
import { query } from '../db.js';

export async function registrarMovimiento({
  ticketCode,
  estadoAnterior,
  estadoNuevo,
  realizadoPor,
  motivo
}) {
  await query(
    `INSERT INTO movimientos 
     (ticket_code, estado_anterior, estado_nuevo, realizado_por, motivo)
     VALUES ($1, $2, $3, $4, $5)`,
    [ticketCode, estadoAnterior, estadoNuevo, realizadoPor, motivo]
  );
}

export async function obtenerMovimientos(ticketCode) {
  const result = await query(
    `SELECT * FROM movimientos 
     WHERE ticket_code = $1 
     ORDER BY creado_en DESC`,
    [ticketCode]
  );
  return result.rows;
}
```

✅ **Beneficio:** Auditoría es un service independiente. Si quieres cambiar cómo se audita, editas 1 archivo.

---

### 💰 Caja Service

**Archivo:** `services/cajaService.js`

```javascript
import { query } from '../db.js';

export async function registrarIngresoCaja({
  ticket,
  motivo
}) {
  await query(
    `INSERT INTO caja 
     (funcion_id, tipo_ingreso, monto, concepto, fecha)
     VALUES ($1, $2, $3, $4, NOW())`,
    [ticket.funcion_id, 'VENTA_TICKET', ticket.precio, motivo]
  );
}

export async function obtenerMovimientosCaja(funcionId) {
  const result = await query(
    `SELECT * FROM caja 
     WHERE funcion_id = $1 
     ORDER BY fecha DESC`,
    [funcionId]
  );
  return result.rows;
}
```

✅ **Beneficio:** Contabilidad es un service separado. Si falla la caja, el ticket se revierte (ROLLBACK).

---

### 🎮 Thin Controller

**Archivo:** `controllers/ticketsController.js`

```javascript
import { changeTicketStatus } from '../services/ticketService.js';
import { getTicketByCode } from '../queries/tickets.queries.js';

export async function updateTicketStatus(req, res) {
  try {
    const { code } = req.params;
    const { to, motivo } = req.body;

    // Validar formato HTTP
    if (!code || !to) {
      return res.status(400).json({
        error: 'Parámetros requeridos: code, to'
      });
    }

    // Obtener ticket
    const ticket = await getTicketByCode(code);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado'
      });
    }

    // Delegar TODO al service
    await changeTicketStatus({
      ticket,
      to,
      user: req.user,
      motivo: motivo || 'Sin motivo'
    });

    res.json({
      success: true,
      message: `Ticket actualizado a ${to}`
    });
  } catch (err) {
    // Manejo de errores
    const status = err.message.includes('No autorizado') ? 403 : 400;
    res.status(status).json({
      error: err.message
    });
  }
}
```

✅ **Beneficio:** Controller = 40 líneas. No sabe nada de máquina de estados, auditoría o caja.

---

## Antes vs Después (visual)

### ANTES

```
1 ARCHIVO (ticketsController.js)
  ├─ updateTicketStatus() [100+ líneas]
  │  ├─ Validación HTTP
  │  ├─ Query BD
  │  ├─ Máquina de estados (inline)
  │  ├─ Validación autorización
  │  ├─ UPDATE (cambio estado)
  │  ├─ INSERT (auditoría)
  │  ├─ INSERT (caja)
  │  └─ Response HTTP
  │
  ├─ changeTicketStatus() [duplicado en otro archivo]
  │  ├─ Máquina de estados (OTRA VEZ)
  │  ├─ Validación autorización (OTRA VEZ)
  │  ├─ UPDATE (OTRA VEZ)
  │  └─ ...
  │
  └─ otherFunction() [más lógica]

PROBLEMA: Todo mezclado, imposible testear, duplicación
```

### DESPUÉS

```
CONSTANTS
  constants/ticketStates.js [15 líneas]
    └─ TICKET_STATES, TICKET_ORIGINS, ROLES

SERVICES
  services/ticketStateMachine.js [30 líneas]
    └─ canTransition(), getValidTransitions()
    
  services/ticketService.js [100 líneas]
    └─ changeTicketStatus()  ← ÚNICA FUENTE
    
  services/ticketAuditService.js [30 líneas]
    └─ registrarMovimiento()
    
  services/cajaService.js [30 líneas]
    └─ registrarIngresoCaja()

CONTROLLERS
  controllers/ticketsController.js [40 líneas]
    └─ updateTicketStatus()
       ├─ Lee request
       ├─ Llama service
       └─ Responde HTTP

BENEFICIOS: Separación clara, testeable, mantenible, escalable
```

---

## Testing: Antes vs Después

### ANTES (sin service layer)

```javascript
// ❌ Imposible: necesito mocks de todo
describe('updateTicketStatus', () => {
  it('should change status', async () => {
    // Mock query function (5 veces: SELECT, UPDATE, INSERT, INSERT)
    const mockQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [{ estado: 'RESERVADO' }] }) // SELECT
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT movimientos
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT caja
      .mockResolvedValueOnce(null); // COMMIT

    // Mock req/res
    const req = {
      params: { code: 'ABC123' },
      body: { to: 'PAGADO' },
      user: { cedula: '123', role: 'ADMIN' }
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // ✅ Test
    await updateTicketStatus(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(5);
    expect(res.json).toHaveBeenCalled();
  });
});

// 30 líneas de setup para testear 100 líneas de código
```

### DESPUÉS (con service layer)

```javascript
// ✅ Unit test: sin BD, sin HTTP, solo lógica
describe('ticketService.changeTicketStatus', () => {
  it('should change status when transition is valid', async () => {
    const ticket = {
      code: 'ABC123',
      estado: 'RESERVADO',
      precio: 100,
      funcion_id: 1
    };
    const user = { cedula: '123', role: 'ADMIN' };

    const result = await changeTicketStatus({
      ticket,
      to: 'PAGADO',
      user,
      motivo: 'Test'
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid transition', async () => {
    const ticket = {
      estado: 'USADO' // No se puede cambiar de USADO
    };

    expect(() => changeTicketStatus({
      ticket,
      to: 'PAGADO'
    })).toThrow('Transición no permitida');
  });

  it('should reject unauthorized user', async () => {
    const ticket = { estado: 'REPORTADA_VENDIDA' };
    const user = { cedula: '123', role: 'VENDEDOR' }; // No autorizado

    expect(() => changeTicketStatus({
      ticket,
      to: 'PAGADO',
      user
    })).toThrow('No autorizado');
  });
});

// 5 líneas de setup. 3 tests claros. Corren en 50ms.
```

---

## Reglas de Oro (memoriza esto)

### 1️⃣ Controllers ≤ 50 líneas

Si tu controller tiene más de 50 líneas, **está haciendo demasiado**.

### 2️⃣ Services = Testeable sin HTTP

Si necesitas `req`/`res` para testear tu service, **está mal diseñado**.

### 3️⃣ Máquina de estados = 1 archivo

Si la máquina de estados existe en 2+ lugares, **hay duplicación**.

### 4️⃣ Transacciones = ACID completo

Si no hay BEGIN/COMMIT/ROLLBACK, **no es una transacción**.

### 5️⃣ Error ≠ Success

```javascript
// ❌ Mal
const result = await changeTicketStatus(...);
if (result.error) { ... }

// ✅ Bien
try {
  await changeTicketStatus(...);
} catch (error) {
  // error es claro
}
```

---

## Próximo Paso

→ Lee [PROMPT-PASO-4-COPILOT.md](PROMPT-PASO-4-COPILOT.md)

→ Ejecuta en Copilot Chat

→ Verifica con tests

---

**VEREDICTO:**

Este modelo mental es lo que hace equipos profesionales.

No es complicado.
Es **clarísimo**.

Vamos.
