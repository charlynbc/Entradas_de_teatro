# 🏦 PASO 5 — SISTEMA DE CUENTAS Y TRANSFERENCIAS

## 🎯 El Problema Real (que acabamos de resolver conceptualmente)

Hoy el sistema trata el dinero como algo **abstracto**:

- "El actor vendió" → pero ¿dónde está la plata?
- "Cuota pagada" → ¿quién la recibió?
- "Ticket online" → ¿a qué cuenta fue?

**Esto no es gestión económica real. Es teatro.**

---

## 💡 La Solución (muy profesional)

> **El sistema no "cobra".  
> El sistema REGISTRA transferencias hacia cuentas bancarias.**

Esto cambia TODO:

- Ahora hay **cuentas bancarias** (entidades reales)
- Hay **comprobantes** (evidencia)
- Hay **validación** (alguien controla)
- Hay **trazabilidad** (auditoría completa)

---

## 🧠 Concepto Clave: CUENTAS

En el mundo real:

- Un **GRUPO** tiene una cuenta → cuotas van ahí
- Una **FUNCIÓN PROFESIONAL** tiene su cuenta → boletería va ahí
- Una **OBRA INDEPENDIENTE** usa cuentas informales (actor, director, etc)

📌 **El sistema registra TODO, valida TODO, traza TODO.**

---

## 🎭 Casos de Uso Reales

### Caso 1: CUOTA DE ACTOR

```
ACTOR debe cuota de $500
↓
Ve datos bancarios del GRUPO
↓
Transfiere $500 a esa cuenta
↓
Sube comprobante (foto/PDF)
↓
Estado = PENDIENTE_VALIDACION
↓
DIRECTOR valida comprobante
↓
Estado = PAGADA
↓
Ingreso registrado en CAJA del GRUPO
```

**Beneficios:**
- Actor NO marca como pagado (evita fraude)
- Director valida (control real)
- Caja refleja solo dinero validado (contabilidad correcta)

---

### Caso 2: VENTA ONLINE (PROFESIONAL)

```
FUNCIÓN PROFESIONAL tiene cuenta propia
↓
INVITADO quiere comprar
↓
Sistema muestra datos bancarios de la FUNCIÓN
↓
INVITADO transfiere
↓
Sube comprobante
↓
Ticket = PENDIENTE_VALIDACION
↓
DIRECTOR/ADMIN valida
↓
Ticket = PAGADO
↓
Ingreso a CAJA de la FUNCIÓN
```

**Beneficios:**
- Sin actores intermediarios
- Cuenta oficial de la obra
- Validación antes de confirmar
- Trazabilidad total

---

### Caso 3: VENTA INDEPENDIENTE (ACTOR)

```
OBRA INDEPENDIENTE (sin cuenta formal)
↓
ACTOR vende ticket
↓
Comprador paga:
  - Efectivo
  - Transferencia (a cuenta del actor/director)
↓
ACTOR reporta venta
↓
DIRECTOR valida pago
↓
Ticket = PAGADO
↓
Ingreso a CAJA de la FUNCIÓN
```

**Beneficios:**
- Flexibilidad (cualquier cuenta)
- Validación igual
- Caja igual

---

## 📊 Nuevo Modelo Mental

### ANTES (Hoy)

```
ACTOR vende → sistema marca PAGADO
CUOTA pagada → actor dice "pagué"
VENTA ONLINE → ???
```

**Problema:** No hay cuentas, no hay comprobantes, no hay validación

---

### DESPUÉS (PASO 5)

```
TODO PAGO:
1. Alguien transfiere a una CUENTA
2. Sube COMPROBANTE
3. Estado = PENDIENTE_VALIDACION
4. Director/Admin VALIDA
5. Estado = PAGADO
6. Ingreso a CAJA
```

**Resultado:** Contabilidad real, auditable, profesional

---

## 🗂️ Entidades Nuevas

### 1. CUENTAS_BANCARIAS

```
Representa: Cuenta bancaria real del sistema

Campos:
- id (PK)
- tipo_owner ENUM('GRUPO','FUNCION')
- owner_id (grupo_id o funcion_id)
- banco (nombre del banco)
- titular (nombre completo)
- numero_cuenta (CBU/CVU)
- alias (alias)
- moneda ('USD','UYU',etc)
- activa (boolean)
- created_at

Ejemplos:
- Cuenta del Grupo "Los Actores" → cuotas van ahí
- Cuenta de Función "Hamlet Pro" → tickets van ahí
```

---

### 2. COMPROBANTES

```
Representa: Evidencia de transferencia

Campos:
- id (PK)
- tipo ENUM('CUOTA','TICKET')
- referencia_id (cuota_id o ticket_id)
- archivo_url (S3, Cloudinary, filesystem)
- fecha_subida
- subido_por (cedula)
- validado_por (cedula del que aprobó)
- fecha_validacion
- estado ENUM('PENDIENTE','VALIDADO','RECHAZADO')
- motivo_rechazo (si aplica)
```

---

### 3. CAMBIOS EN CUOTAS

```sql
ALTER TABLE CUOTAS 
ADD COLUMN estado ENUM(
  'PENDIENTE',           -- Actor aún no pagó
  'PENDIENTE_VALIDACION', -- Actor subió comprobante
  'PAGADA',              -- Director validó
  'RECHAZADA'            -- Comprobante rechazado
);

ALTER TABLE CUOTAS ADD COLUMN comprobante_id;
ALTER TABLE CUOTAS ADD COLUMN cuenta_id; -- A qué cuenta debía pagar
```

---

### 4. CAMBIOS EN TICKETS

```sql
ALTER TABLE TICKETS
ADD COLUMN estado_pago ENUM(
  'PENDIENTE',            -- No pagado
  'PENDIENTE_VALIDACION', -- Comprobante subido
  'PAGADO'                -- Validado
);

ALTER TABLE TICKETS ADD COLUMN comprobante_id;
ALTER TABLE TICKETS ADD COLUMN cuenta_id; -- A qué cuenta se pagó
ALTER TABLE TICKETS ADD COLUMN medio_pago ENUM(
  'EFECTIVO',
  'TRANSFERENCIA',
  'MERCADOPAGO'  -- Para futuro
);
```

📌 `estado` del ticket (DISPONIBLE, RESERVADO, etc) sigue igual  
📌 `estado_pago` es NUEVO (flujo financiero)

---

### 5. CAMBIOS EN FUNCIONES

```sql
ALTER TABLE FUNCIONES ADD COLUMN cuenta_id; 
-- Si es PROFESIONAL, apunta a cuenta bancaria
```

---

### 6. CAMBIOS EN GRUPOS

```sql
ALTER TABLE GRUPOS ADD COLUMN cuenta_id;
-- Cuenta donde se pagan cuotas
```

---

## 🔄 Flujos Completos

### FLUJO A: DIRECTOR CREA GRUPO

```
1. Director crea grupo
2. Define:
   - Nombre grupo
   - Cuota mensual ($500)
   - Fecha límite (cada mes)
   - Cuenta bancaria:
     * Banco: Santander
     * Titular: María Gómez
     * CBU: 0123456789...
     * Alias: grupo.actores
3. Sistema crea:
   - GRUPO (tabla grupos)
   - CUENTA_BANCARIA (tabla cuentas_bancarias)
   - Vincula grupo.cuenta_id → cuenta.id
```

---

### FLUJO B: ACTOR PAGA CUOTA

```
1. Actor ve sus cuotas pendientes
2. Sistema muestra:
   - Monto: $500
   - Vencimiento: 15/02/2026
   - Cuenta:
     * Banco: Santander
     * Titular: María Gómez
     * CBU: 0123456789...
     * Alias: grupo.actores
3. Actor transfiere desde su banco
4. Actor sube comprobante (foto/PDF)
5. Sistema:
   - Crea COMPROBANTE
   - Actualiza CUOTA:
     * estado = PENDIENTE_VALIDACION
     * comprobante_id = X
6. Director recibe notificación (opcional)
7. Director valida:
   - Ve comprobante
   - Confirma monto
   - Confirma cuenta
   - Aprueba
8. Sistema:
   - Actualiza CUOTA:
     * estado = PAGADA
     * fecha_pago = NOW()
   - Actualiza COMPROBANTE:
     * estado = VALIDADO
     * validado_por = director.cedula
   - Registra en CAJA:
     * tipo = INGRESO
     * concepto = 'CUOTA'
     * monto = 500
     * grupo_id = X
```

---

### FLUJO C: DIRECTOR CREA FUNCIÓN PROFESIONAL

```
1. Director crea función PROFESIONAL
2. Define:
   - Obra: "Hamlet"
   - Fecha: 20/03/2026
   - Tipo: PROFESIONAL
   - Permite compra online: SÍ
   - Cuenta bancaria:
     * Banco: BROU
     * Titular: Teatro Solís
     * CBU: 9876543210...
     * Alias: hamlet.tickets
3. Sistema crea:
   - FUNCION (tabla funciones)
   - CUENTA_BANCARIA (si no existe)
   - Vincula funcion.cuenta_id → cuenta.id
```

---

### FLUJO D: INVITADO COMPRA ONLINE

```
1. INVITADO ve cartelera pública
2. Selecciona "Hamlet" (PROFESIONAL)
3. Cantidad: 2 tickets
4. Sistema muestra:
   - Total: $1,000
   - Cuenta:
     * Banco: BROU
     * Titular: Teatro Solís
     * CBU: 9876543210...
     * Alias: hamlet.tickets
5. INVITADO transfiere desde su banco
6. INVITADO sube comprobante
7. Sistema:
   - Crea COMPROBANTE
   - Reserva 2 tickets
   - Marca tickets:
     * estado = RESERVADO
     * estado_pago = PENDIENTE_VALIDACION
     * comprobante_id = X
     * medio_pago = TRANSFERENCIA
8. Director/Admin valida:
   - Ve comprobante
   - Confirma monto
   - Aprueba
9. Sistema:
   - Actualiza TICKETS:
     * estado_pago = PAGADO
   - Actualiza COMPROBANTE:
     * estado = VALIDADO
   - Registra en CAJA:
     * tipo = INGRESO
     * concepto = 'VENTA_ONLINE'
     * monto = 1000
     * funcion_id = X
   - Genera QR de cada ticket
   - Email confirmación (opcional)
```

---

### FLUJO E: ACTOR VENDE (INDEPENDIENTE)

```
1. ACTOR asignado a función INDEPENDIENTE
2. Vende ticket a comprador
3. Comprador paga:
   - Efectivo → Actor recibe
   - Transferencia → Actor da su cuenta/director
4. ACTOR reporta venta:
   - Medio: TRANSFERENCIA
   - (Opcional) Sube comprobante
5. Sistema:
   - Marca ticket:
     * estado = REPORTADA_VENDIDA
     * medio_pago = TRANSFERENCIA
     * (si hay comprobante) comprobante_id = X
6. Director valida pago
7. Sistema:
   - Marca ticket:
     * estado = PAGADO
   - Registra en CAJA
```

📌 Independiente = más flexible (cualquier cuenta)  
📌 Profesional = más formal (cuenta oficial)

---

## 🎯 Reglas de Negocio

### REGLA 1: Solo dinero validado va a CAJA

```javascript
// ❌ ANTES (mal)
if (ticket.estado === 'REPORTADA_VENDIDA') {
  registrarIngresoCaja(ticket);
}

// ✅ AHORA (bien)
if (ticket.estado_pago === 'PAGADO') {
  registrarIngresoCaja(ticket);
}
```

---

### REGLA 2: Comprobante obligatorio en PROFESIONAL

```javascript
if (funcion.tipo === 'PROFESIONAL' && !comprobante) {
  throw new Error('Comprobante obligatorio');
}
```

---

### REGLA 3: Director valida TODO

```javascript
// ACTOR no puede marcar como pagado
if (user.role === 'ACTOR') {
  throw new Error('No autorizado para validar pagos');
}

// DIRECTOR/ADMIN pueden
if (['SUPER','ADMIN','DIRECTOR'].includes(user.role)) {
  validarPago(comprobante);
}
```

---

### REGLA 4: Cuenta obligatoria en PROFESIONAL

```javascript
if (funcion.tipo === 'PROFESIONAL' && !funcion.cuenta_id) {
  throw new Error('Función profesional requiere cuenta bancaria');
}
```

---

## 📊 Cambios en CAJA

### ANTES

```javascript
// ❌ Ingreso sin validación
await registrarIngresoCaja({
  funcionId,
  monto,
  concepto: 'VENTA'
});
```

---

### DESPUÉS

```javascript
// ✅ Ingreso SOLO después de validación
await registrarIngresoCaja({
  funcionId,
  monto,
  concepto: 'VENTA_ONLINE',
  comprobanteId,
  validadoPor: director.cedula,
  fechaValidacion: NOW()
});
```

---

## 🧪 Testing (crítico)

### Test 1: Cuota sin comprobante

```javascript
const cuota = { estado: 'PENDIENTE' };
await expect(pagarCuota(cuota)).rejects.toThrow('Comprobante requerido');
```

---

### Test 2: Actor no puede validar

```javascript
const actor = { role: 'ACTOR' };
await expect(validarCuota(cuota, actor)).rejects.toThrow('No autorizado');
```

---

### Test 3: Caja solo con validados

```javascript
const ingreso = await getCajaFuncion(1);
// Verifica que SOLO tiene ingresos con estado_pago = PAGADO
```

---

## 🚨 Implicaciones (importantes)

### UI ACTOR

Nueva sección:
- **Mis Cuotas**
  - Pendientes
  - Para cada una:
    - Monto
    - Vencimiento
    - Datos bancarios del grupo
    - Botón: "Subir comprobante"

---

### UI DIRECTOR

Nueva sección:
- **Validar Pagos**
  - Cuotas pendientes validación
  - Tickets pendientes validación
  - Para cada uno:
    - Ver comprobante
    - Aprobar/Rechazar

---

### UI INVITADO (nuevo)

Flujo de compra:
1. Ver función
2. Seleccionar cantidad
3. Ver datos bancarios
4. Subir comprobante
5. Estado: "Pendiente validación"
6. Notificación cuando se valida

---

## 🎓 Arquitectura

### Servicios Nuevos

```
services/
├─ cuentasBancariasService.js
│  ├─ crearCuenta(tipo, ownerId, datos)
│  ├─ obtenerCuentaGrupo(grupoId)
│  └─ obtenerCuentaFuncion(funcionId)
│
├─ comprobantesService.js
│  ├─ subirComprobante(tipo, referenciaId, archivo)
│  ├─ validarComprobante(comprobanteId, validador)
│  ├─ rechazarComprobante(comprobanteId, motivo)
│  └─ obtenerComprobante(id)
│
├─ cuotasService.js (extendido)
│  ├─ pagarCuota(cuotaId, comprobante)
│  └─ validarPagoCuota(cuotaId, director)
│
└─ cajaService.js (extendido)
   └─ registrarIngresoCaja(..., comprobanteId, validadoPor)
```

---

## 🗃️ Migrations

```sql
-- MIGRATION 04: Sistema de cuentas y comprobantes

-- 1. Tabla cuentas bancarias
CREATE TABLE cuentas_bancarias (
  id SERIAL PRIMARY KEY,
  tipo_owner VARCHAR(20) NOT NULL CHECK(tipo_owner IN ('GRUPO','FUNCION')),
  owner_id INTEGER NOT NULL,
  banco VARCHAR(100) NOT NULL,
  titular VARCHAR(200) NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  alias VARCHAR(50),
  moneda VARCHAR(3) DEFAULT 'UYU',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla comprobantes
CREATE TABLE comprobantes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK(tipo IN ('CUOTA','TICKET')),
  referencia_id INTEGER NOT NULL,
  archivo_url TEXT NOT NULL,
  fecha_subida TIMESTAMP DEFAULT NOW(),
  subido_por VARCHAR(20) NOT NULL,
  validado_por VARCHAR(20),
  fecha_validacion TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','VALIDADO','RECHAZADO')),
  motivo_rechazo TEXT
);

-- 3. Cambios en cuotas
ALTER TABLE cuotas ADD COLUMN estado VARCHAR(30) DEFAULT 'PENDIENTE';
ALTER TABLE cuotas ADD COLUMN comprobante_id INTEGER REFERENCES comprobantes(id);
ALTER TABLE cuotas ADD COLUMN cuenta_id INTEGER REFERENCES cuentas_bancarias(id);

-- 4. Cambios en tickets
ALTER TABLE tickets ADD COLUMN estado_pago VARCHAR(30) DEFAULT 'PENDIENTE';
ALTER TABLE tickets ADD COLUMN comprobante_id INTEGER REFERENCES comprobantes(id);
ALTER TABLE tickets ADD COLUMN cuenta_id INTEGER REFERENCES cuentas_bancarias(id);
ALTER TABLE tickets ADD COLUMN medio_pago VARCHAR(20);

-- 5. Cambios en funciones
ALTER TABLE funciones ADD COLUMN cuenta_id INTEGER REFERENCES cuentas_bancarias(id);

-- 6. Cambios en grupos
ALTER TABLE grupos ADD COLUMN cuenta_id INTEGER REFERENCES cuentas_bancarias(id);

-- 7. Cambios en caja
ALTER TABLE caja ADD COLUMN comprobante_id INTEGER REFERENCES comprobantes(id);
ALTER TABLE caja ADD COLUMN validado_por VARCHAR(20);

-- 8. Índices
CREATE INDEX idx_cuentas_owner ON cuentas_bancarias(tipo_owner, owner_id);
CREATE INDEX idx_comprobantes_tipo ON comprobantes(tipo, referencia_id);
CREATE INDEX idx_comprobantes_estado ON comprobantes(estado);
```

---

## ✅ Checklist de Implementación

- [ ] Migration 04 (DB schema)
- [ ] Service: cuentasBancariasService
- [ ] Service: comprobantesService
- [ ] Controller: cuentas.controller
- [ ] Controller: comprobantes.controller
- [ ] Routes: /cuentas, /comprobantes
- [ ] Actualizar cuotasService
- [ ] Actualizar ticketsService
- [ ] Actualizar cajaService
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] UI: Dashboard Actor (cuotas)
- [ ] UI: Dashboard Director (validaciones)
- [ ] UI: Compra online (invitado)

---

## 🚀 Próximo Paso

Lee: [PROMPT-PASO-5-COPILOT.md](PROMPT-PASO-5-COPILOT.md)

Ejecuta en Copilot Chat

---

**CONCLUSIÓN:**

Esto **SÍ es gestión económica real**.

No es teatro.

Es **contabilidad auditable, profesional, escalable**.
