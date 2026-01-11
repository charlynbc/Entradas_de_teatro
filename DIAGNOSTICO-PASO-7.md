# 🎭 PASO 7 — REDISEÑO DE PANTALLAS POR ROL

## 🎯 Objetivo

Separar pantallas del frontend para que:

- ✅ Cada rol vea **solo lo que necesita**
- ✅ Una pantalla = **una acción clara**
- ✅ Sin responsabilidades mezcladas
- ✅ UX intuitiva (sin explicar el sistema)
- ✅ Flujos directos (sin confusión)

---

## 🚨 PROBLEMA HOY

### ❌ Pantallas mezcladas

```
// Situación actual (hipotética)
dashboard.html
├─ Actor ve: cuotas + tickets + ventas + pagos
├─ Director ve: TODO mezclado con acciones de actor
├─ Invitado: no tiene pantalla dedicada
└─ Resultado: nadie sabe qué hacer exactamente
```

**Problemas:**
- Pantallas con 5+ acciones diferentes
- Actor ve opciones que no puede usar
- Director se confunde entre validar y vender
- Invitado compra con flujo de actor
- Estados internos visibles para usuarios finales

### ❌ Ejemplo concreto

```html
<!-- MAL: Todo mezclado -->
<div class="dashboard">
  <h2>Panel</h2>
  
  <!-- Actor -->
  <section>
    <button>Vender ticket</button>
    <button>Pagar cuota</button>
  </section>
  
  <!-- Director -->
  <section>
    <button>Validar pagos</button>
    <button>Ver caja</button>
  </section>
  
  <!-- ❌ ¿Cuál es la acción principal? ¿Qué rol está usando esto? -->
</div>
```

---

## ✅ SOLUCIÓN: SEPARACIÓN POR ROL

### 🧠 Principio fundamental

> **"Una pantalla, una acción, un rol."**

**Cada pantalla debe:**
- Tener UNA acción principal clara
- Servir a UN rol específico
- NO explicar el sistema (debe ser obvia)
- NO mezclar responsabilidades

---

## 📁 NUEVA ESTRUCTURA

```
frontend/
├─ public/
│  └─ comprar-ticket.html        ← Invitados (sin login)
│
├─ actor/
│  ├─ mis-cuotas.html            ← Pagar cuotas
│  └─ mis-tickets.html           ← Vender tickets
│
├─ director/
│  ├─ validar-cuotas.html        ← Aprobar cuotas
│  ├─ validar-pagos.html         ← Aprobar pagos online
│  ├─ configuracion-financiera.html ← Cuentas bancarias
│  └─ reportes.html              ← Ver caja
│
└─ shared/
   ├─ header.html                ← Navegación por rol
   ├─ styles.css                 ← Estilos base
   └─ utils.js                   ← Funciones comunes
```

---

## 👤 1️⃣ INVITADO — COMPRA ONLINE

### Pantalla: `public/comprar-ticket.html`

**Propósito:** Comprar ticket de función profesional

**Muestra:**
- Obra (título, descripción)
- Función (fecha, hora, lugar)
- Precio
- Disponibilidad
- Medios de pago: MercadoPago, Transferencia

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Pagar con MercadoPago]       │
│   [Pagar con Transferencia]     │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Usuario ve función
2. Completa datos (nombre, email)
3. Selecciona medio de pago
4. Si MercadoPago:
   → Redirect a MP
   → Paga
   → Recibe ticket por email
5. Si Transferencia:
   → Ve datos bancarios
   → Transfiere
   → Sube comprobante
   → Espera validación
```

**Lo que NO ve:**
- ❌ Estado PENDIENTE_VALIDACION
- ❌ Caja
- ❌ Otros tickets
- ❌ Actores

**Texto clave:**
```
"Tu entrada se enviará por email una vez confirmado el pago."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  🎭 Obra: "Hamlet"                         │
│  📅 Función: 15/01/2026 - 20:00hs          │
│  📍 Lugar: Teatro Nacional                 │
│  💰 Precio: $1,500                         │
│  ✅ Disponibles: 45 de 50                  │
├────────────────────────────────────────────┤
│  📝 Tus datos:                             │
│  Nombre: [____________]                    │
│  Email:  [____________]                    │
├────────────────────────────────────────────┤
│  💳 Medio de pago:                         │
│  ○ MercadoPago (tarjeta débito/crédito)   │
│  ○ Transferencia bancaria                 │
├────────────────────────────────────────────┤
│         [  COMPRAR ENTRADA  ]              │
└────────────────────────────────────────────┘
```

---

## 🎭 2️⃣ ACTOR — PAGO DE CUOTAS

### Pantalla: `actor/mis-cuotas.html`

**Propósito:** Pagar cuotas del grupo

**Muestra:**
- Grupo al que pertenece
- Cuotas pendientes/pagadas
- Monto, vencimiento
- Estado:
  * 🔴 Pendiente
  * 🟡 En validación
  * 🟢 Pagada
- Datos bancarios del grupo

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Subir Comprobante de Pago]   │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Actor ve cuota pendiente
2. Ve datos bancarios:
   - Banco: XXX
   - Cuenta: YYY
   - Alias: teatro.grupo
   - CBU: ZZZ
3. Transfiere desde su banco
4. Click "Subir comprobante"
5. Selecciona archivo
6. Confirma
7. Estado cambia a "En validación"
8. Espera aprobación del director
```

**Lo que NO ve:**
- ❌ Botón "Marcar como pagado"
- ❌ Caja del grupo
- ❌ Cuotas de otros actores
- ❌ Validación (eso es del director)

**Texto clave:**
```
"Transferí el monto indicado y subí el comprobante.
El director validará tu pago."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  🎭 Grupo: "Compañía Teatro Abierto"       │
│  👤 Actor: Juan Pérez                      │
├────────────────────────────────────────────┤
│  📋 MIS CUOTAS                             │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Cuota: Enero 2026                    │ │
│  │ Monto: $500                          │ │
│  │ Vencimiento: 31/01/2026              │ │
│  │ Estado: 🔴 Pendiente                 │ │
│  │                                      │ │
│  │ 🏦 Datos para transferir:            │ │
│  │ Banco: Nación                        │ │
│  │ Cuenta: 1234567890                   │ │
│  │ Alias: teatro.grupo                  │ │
│  │ CBU: 0110123456789012345678          │ │
│  │                                      │ │
│  │ [ Subir Comprobante de Pago ]        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Cuota: Diciembre 2025                │ │
│  │ Monto: $500                          │ │
│  │ Estado: 🟢 Pagada                    │ │
│  │ Validado: 05/12/2025                 │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 🎟️ 3️⃣ ACTOR — VENTA DE TICKETS

### Pantalla: `actor/mis-tickets.html`

**Propósito:** Vender tickets de función independiente

**Muestra:**
- Tickets asignados
- Estado:
  * 🟢 Disponible
  * 🟡 Vendido (esperando validación)
  * ✅ Pagado
- Función, precio
- Medio de pago usado

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Reportar Venta]               │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Actor vende ticket en mano
2. Recibe efectivo/transferencia del comprador
3. Click "Reportar venta"
4. Selecciona medio de pago:
   - Efectivo
   - Transferencia
5. Confirma
6. Estado: Vendido (esperando validación)
7. Director valida
8. Estado: Pagado
9. Dinero entra a CAJA
```

**Lo que NO ve:**
- ❌ Validar su propia venta
- ❌ Caja de la función
- ❌ Tickets de otros actores
- ❌ Configuración de precios

**Texto clave:**
```
"Reportá la venta después de recibir el pago.
El director validará para que se registre en caja."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  🎟️ MIS TICKETS - Función "Esperando a Godot"│
│  📅 Fecha: 20/01/2026 - 21:00hs            │
│  📍 Teatro Independiente                   │
│  💰 Precio: $800                           │
├────────────────────────────────────────────┤
│  TICKETS ASIGNADOS: 10                     │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Ticket #001                          │ │
│  │ Estado: 🟢 Disponible                │ │
│  │ [ Reportar Venta ]                   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Ticket #002                          │ │
│  │ Estado: 🟡 Vendido - En validación   │ │
│  │ Medio: Efectivo                      │ │
│  │ Reportado: 10/01/2026                │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Ticket #003                          │ │
│  │ Estado: ✅ Pagado                    │ │
│  │ Medio: Transferencia                 │ │
│  │ Validado: 09/01/2026                 │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 👔 4️⃣ DIRECTOR — VALIDAR CUOTAS

### Pantalla: `director/validar-cuotas.html`

**Propósito:** Aprobar/rechazar pagos de cuotas

**Muestra:**
- Lista de cuotas en validación
- Actor, grupo
- Monto, fecha
- Comprobante (imagen/PDF)
- Acciones: Aprobar / Rechazar

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Aprobar]    [Rechazar]        │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Director ve lista de cuotas pendientes
2. Click en cuota para ver detalle
3. Ve comprobante subido por actor
4. Verifica transferencia
5. Decide:
   A) Aprobar:
      - Cuota = PAGADA
      - Ingreso a CAJA
      - Notificación a actor
   B) Rechazar:
      - Cuota = RECHAZADA
      - Motivo (opcional)
      - Notificación a actor
```

**Lo que NO ve:**
- ❌ Su propia cuota (si es actor también)
- ❌ Botón "Vender ticket" (eso es en otra pantalla)

**Texto clave:**
```
"Validá el pago verificando el comprobante.
Al aprobar, el dinero se registra en caja."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  👔 VALIDAR CUOTAS PENDIENTES              │
│  🔍 Filtros: [Todos] [Grupo] [Actor]       │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 🟡 Cuota: Enero 2026                 │ │
│  │ Actor: Juan Pérez                    │ │
│  │ Grupo: Compañía Teatro Abierto       │ │
│  │ Monto: $500                          │ │
│  │ Subido: 10/01/2026 - 14:30          │ │
│  │                                      │ │
│  │ 📎 Comprobante:                      │ │
│  │ [Ver Imagen]                         │ │
│  │                                      │ │
│  │ [ ✅ Aprobar ]  [ ❌ Rechazar ]      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 🟡 Cuota: Enero 2026                 │ │
│  │ Actor: María García                  │ │
│  │ Grupo: Grupo Experimental            │ │
│  │ Monto: $300                          │ │
│  │ Subido: 09/01/2026 - 10:15          │ │
│  │                                      │ │
│  │ [ ✅ Aprobar ]  [ ❌ Rechazar ]      │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 👔 5️⃣ DIRECTOR — VALIDAR PAGOS ONLINE

### Pantalla: `director/validar-pagos.html`

**Propósito:** Aprobar/rechazar pagos de tickets por transferencia

**Muestra:**
- Tickets comprados online con transferencia
- Comprador (nombre, email)
- Función, monto
- Comprobante
- Cuenta destino
- Estado: Pendiente validación

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Aprobar]    [Rechazar]        │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Director ve pagos online pendientes
2. Click para ver detalle
3. Ve comprobante
4. Verifica transferencia a cuenta de función
5. Decide:
   A) Aprobar:
      - Ticket = PAGADO
      - Envío de QR por email
      - Ingreso a CAJA
   B) Rechazar:
      - Ticket = RECHAZADO
      - Notificación a comprador
```

**Lo que NO ve:**
- ❌ Pagos con MercadoPago (esos se aprueban automáticamente)

**Texto clave:**
```
"Verificá que el comprobante corresponda a la cuenta de la función."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  👔 VALIDAR PAGOS ONLINE                   │
│  🔍 Filtros: [Todos] [Transferencia]       │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ 🟡 Ticket: TKT-2026-001              │ │
│  │ Comprador: Carlos López              │ │
│  │ Email: carlos@email.com              │ │
│  │ Función: Hamlet - 15/01/2026         │ │
│  │ Monto: $1,500                        │ │
│  │ Medio: Transferencia                 │ │
│  │ Cuenta: Teatro Nacional - Pro        │ │
│  │ Subido: 11/01/2026 - 16:00          │ │
│  │                                      │ │
│  │ 📎 Comprobante:                      │ │
│  │ [Ver Imagen]                         │ │
│  │                                      │ │
│  │ [ ✅ Aprobar ]  [ ❌ Rechazar ]      │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 👔 6️⃣ DIRECTOR — CONFIGURACIÓN FINANCIERA

### Pantalla: `director/configuracion-financiera.html`

**Propósito:** Gestionar cuentas bancarias

**Muestra:**
- Cuentas bancarias del grupo
- Cuentas bancarias por función profesional
- Estado: Activa / Inactiva
- Datos: Banco, cuenta, CBU, alias

**Acción principal:**
```
┌─────────────────────────────────┐
│   [Nueva Cuenta Bancaria]        │
└─────────────────────────────────┘
```

**Flujo:**

```
1. Director crea cuenta bancaria
2. Asigna a:
   - Grupo (para cuotas)
   - Función profesional (para ventas online)
3. Completa datos:
   - Banco, titular, cuenta, CBU, alias
4. Guarda
5. Actores/invitados ven esos datos al pagar
```

**Lo que NO ve:**
- ❌ Balance de cuentas (eso es en reportes)

**Texto clave:**
```
"Configurá las cuentas donde se recibirán los pagos."
```

---

### Wireframe conceptual

```
┌────────────────────────────────────────────┐
│  👔 CONFIGURACIÓN FINANCIERA               │
│  [ + Nueva Cuenta Bancaria ]               │
├────────────────────────────────────────────┤
│  🏦 CUENTAS DEL GRUPO                      │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Grupo: Compañía Teatro Abierto       │ │
│  │ Banco: Nación                        │ │
│  │ Cuenta: 1234567890                   │ │
│  │ Alias: teatro.grupo                  │ │
│  │ Estado: 🟢 Activa                    │ │
│  │ [ Editar ] [ Desactivar ]            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  🎭 CUENTAS POR FUNCIÓN PROFESIONAL        │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │ Función: Hamlet - 15/01/2026         │ │
│  │ Banco: Galicia                       │ │
│  │ Cuenta: 9876543210                   │ │
│  │ Alias: teatro.hamlet                 │ │
│  │ Estado: 🟢 Activa                    │ │
│  │ [ Editar ] [ Desactivar ]            │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 🧠 REGLAS UX CRÍTICAS

### 1. Una pantalla, una acción

**✅ BIEN:**
```html
<h1>Validar Cuotas</h1>
<button>Aprobar</button>
<button>Rechazar</button>
```

**❌ MAL:**
```html
<h1>Panel General</h1>
<button>Validar cuotas</button>
<button>Ver caja</button>
<button>Crear función</button>
<button>Asignar tickets</button>
<!-- ¿Cuál es la acción principal? -->
```

---

### 2. Sin estados internos visibles

**✅ BIEN:**
```
Estado: En validación
```

**❌ MAL:**
```
Estado: PENDIENTE_VALIDACION_DIRECTOR_APROBACION_STAGE_2
```

---

### 3. Texto claro, no técnico

**✅ BIEN:**
```
"Tu entrada se enviará por email una vez confirmado el pago."
```

**❌ MAL:**
```
"El ticket quedará en estado PENDING_APPROVAL hasta que el 
webhook de MercadoPago confirme la transacción."
```

---

### 4. Guiar sin explicar

**✅ BIEN:**
```
Pantalla: "Subir Comprobante"
Botón: [Seleccionar archivo]
Texto: "Formatos: JPG, PNG, PDF"
```

**❌ MAL:**
```
Pantalla: "Sistema de Validación de Pagos"
Texto: "Este módulo permite a los actores subir comprobantes
de pago que luego serán validados por el director quien
decidirá si aprobar o rechazar basándose en..."
```

---

## 📱 NAVEGACIÓN POR ROL

### Header compartido (`shared/header.html`)

**Actor ve:**
```
┌────────────────────────────────────┐
│ 🎭 Teatro Sistema                  │
│ [Mis Cuotas] [Mis Tickets]  [Salir]│
└────────────────────────────────────┘
```

**Director ve:**
```
┌─────────────────────────────────────────┐
│ 🎭 Teatro Sistema                       │
│ [Validar Cuotas] [Validar Pagos]        │
│ [Configuración] [Reportes]  [Salir]     │
└─────────────────────────────────────────┘
```

**Invitado ve:**
```
┌────────────────────────────────────┐
│ 🎭 Teatro Sistema                  │
│ [Ver Funciones]                    │
└────────────────────────────────────┘
```

---

## 🎨 ESTILOS CONSISTENTES

### Colores por estado

```css
/* Estados de pago */
.estado-pendiente {
  color: #e74c3c; /* Rojo */
}

.estado-validacion {
  color: #f39c12; /* Amarillo */
}

.estado-pagado {
  color: #27ae60; /* Verde */
}

/* Botones primarios */
.btn-primary {
  background: #3498db; /* Azul */
}

.btn-success {
  background: #27ae60; /* Verde */
}

.btn-danger {
  background: #e74c3c; /* Rojo */
}
```

---

## 🔄 FLUJOS COMPLETOS

### FLUJO 1: Invitado compra ticket online

```
1. GET /public/comprar-ticket.html?funcionId=123
   → Ve función, precio, medios de pago

2. Completa datos (nombre, email)

3. Selecciona "MercadoPago"

4. POST /api/pagos/iniciar
   {
     tipo: 'TICKET',
     funcionId: 123,
     proveedor: 'MERCADOPAGO',
     compradorNombre: 'Juan',
     compradorEmail: 'juan@email.com'
   }

5. Recibe response:
   {
     intencionId: 1,
     initUrl: 'https://mercadopago.com/...'
   }

6. Frontend: window.location = initUrl

7. Usuario paga en MercadoPago

8. Webhook aprueba intención

9. Email automático con QR al comprador

10. Fin
```

---

### FLUJO 2: Actor paga cuota

```
1. GET /actor/mis-cuotas.html
   → Ve cuotas pendientes con datos bancarios

2. Actor transfiere desde su banco

3. Click "Subir comprobante"

4. Selecciona archivo

5. POST /api/comprobantes
   {
     tipo: 'CUOTA',
     cuotaId: 456,
     archivo: File
   }

6. Backend:
   - Sube archivo a /uploads/comprobantes/
   - Crea comprobante vinculado a cuota
   - Cuota.estado = 'PENDIENTE_VALIDACION'

7. Frontend actualiza: "En validación"

8. Espera (director valida en otra pantalla)

9. Director aprueba en /director/validar-cuotas.html

10. Cuota.estado = 'PAGADA'

11. Notificación a actor: "Cuota aprobada"

12. Fin
```

---

### FLUJO 3: Actor vende ticket

```
1. GET /actor/mis-tickets.html
   → Ve tickets disponibles

2. Actor vende en mano (recibe efectivo)

3. Click "Reportar venta"

4. Modal:
   - Medio de pago: [Efectivo] [Transferencia]
   - Confirmar

5. POST /api/pagos/iniciar
   {
     tipo: 'TICKET',
     ticketCode: 'TKT-001',
     proveedor: 'EFECTIVO'
   }

6. Backend:
   - Crea intención (estado: PENDIENTE)
   - Ticket.estado = 'VENDIDO'

7. Frontend: "Venta reportada, esperando validación"

8. Director valida en /director/validar-pagos.html
   (o pantalla específica para ventas independientes)

9. Director aprueba

10. Ticket.estado_pago = 'PAGADO'

11. Registro en CAJA

12. Fin
```

---

## 📊 COMPARACIÓN ANTES/DESPUÉS

### ❌ ANTES (Mezclado)

```
dashboard.html (todos los roles)
├─ 10 botones diferentes
├─ Actor ve opciones de director
├─ Director ve opciones de actor
├─ Estados técnicos visibles
├─ Invitado usa flujo de actor
└─ Confusión general
```

**Resultado:** Nadie sabe qué hacer

---

### ✅ DESPUÉS (Separado)

```
public/comprar-ticket.html (invitado)
└─ 1 acción: Comprar

actor/mis-cuotas.html (actor)
└─ 1 acción: Subir comprobante

actor/mis-tickets.html (actor)
└─ 1 acción: Reportar venta

director/validar-cuotas.html (director)
└─ 1 acción: Aprobar/Rechazar

director/validar-pagos.html (director)
└─ 1 acción: Aprobar/Rechazar

director/configuracion-financiera.html (director)
└─ 1 acción: Crear/editar cuenta
```

**Resultado:** Cada quien sabe exactamente qué hacer

---

## 🧪 TESTING UX

### Test 1: Invitado compra ticket

**Pregunta:** ¿Cuál es la acción principal?
**Respuesta esperada:** "Comprar entrada"

**Pregunta:** ¿Qué pasa después de pagar?
**Respuesta esperada:** "Recibo la entrada por email"

---

### Test 2: Actor paga cuota

**Pregunta:** ¿Qué debo hacer?
**Respuesta esperada:** "Transferir y subir el comprobante"

**Pregunta:** ¿Puedo marcarla como pagada yo mismo?
**Respuesta esperada:** "No, el director la valida"

---

### Test 3: Director valida cuota

**Pregunta:** ¿Qué veo en esta pantalla?
**Respuesta esperada:** "Cuotas esperando mi validación"

**Pregunta:** ¿Puedo vender tickets desde acá?
**Respuesta esperada:** "No, eso está en otra pantalla"

---

## 🚀 IMPLEMENTACIÓN

### Tecnologías

- **HTML5** (semántico)
- **CSS3** (sin frameworks pesados)
- **JavaScript vanilla** (sin React/Vue si no es necesario)
- **Fetch API** (llamadas al backend)
- **Shared components** (header, footer)

---

### Estructura de archivos

```
frontend/
├─ index.html                     ← Landing page
├─ public/
│  └─ comprar-ticket.html
├─ actor/
│  ├─ mis-cuotas.html
│  └─ mis-tickets.html
├─ director/
│  ├─ validar-cuotas.html
│  ├─ validar-pagos.html
│  ├─ configuracion-financiera.html
│  └─ reportes.html
├─ shared/
│  ├─ header.html
│  ├─ footer.html
│  ├─ styles.css
│  ├─ utils.js
│  └─ api.js                      ← Fetch wrappers
└─ assets/
   ├─ logo.png
   └─ icons/
```

---

## 📚 COMPONENTES COMPARTIDOS

### API Client (`shared/api.js`)

```js
// Wrapper para todas las llamadas al backend
const API = {
  baseURL: 'http://localhost:5000/api',
  
  async get(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },
  
  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async uploadFile(endpoint, file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('archivo', file);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  }
};
```

---

### Header dinámico (`shared/header.html`)

```html
<header id="main-header">
  <!-- Se carga dinámicamente según rol -->
</header>

<script>
  // Cargar header según rol del usuario
  const userRole = localStorage.getItem('userRole');
  
  const headers = {
    actor: `
      <nav>
        <a href="/actor/mis-cuotas.html">Mis Cuotas</a>
        <a href="/actor/mis-tickets.html">Mis Tickets</a>
        <a href="#" onclick="logout()">Salir</a>
      </nav>
    `,
    director: `
      <nav>
        <a href="/director/validar-cuotas.html">Validar Cuotas</a>
        <a href="/director/validar-pagos.html">Validar Pagos</a>
        <a href="/director/configuracion-financiera.html">Configuración</a>
        <a href="/director/reportes.html">Reportes</a>
        <a href="#" onclick="logout()">Salir</a>
      </nav>
    `,
    invitado: `
      <nav>
        <a href="/public/funciones.html">Ver Funciones</a>
      </nav>
    `
  };
  
  document.getElementById('main-header').innerHTML = headers[userRole] || '';
</script>
```

---

## ✅ CRITERIOS DE ÉXITO

- ✅ Actor solo ve: cuotas y tickets propios
- ✅ Director solo ve: validaciones y configuración
- ✅ Invitado solo ve: compra de tickets
- ✅ Una acción clara por pantalla
- ✅ Sin estados técnicos visibles
- ✅ Textos en lenguaje simple
- ✅ Navegación intuitiva
- ✅ Responsive (mobile-friendly)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Leer este diagnóstico
2. ⏳ Ejecutar PROMPT-PASO-7-COPILOT.md
3. ⏳ Crear pantallas HTML
4. ⏳ Estilos CSS
5. ⏳ JavaScript para interacciones
6. ⏳ Integrar con backend (ya existente)
7. ⏳ Testing UX con usuarios reales

---

## ✨ CONCLUSIÓN

**El problema no era el código backend.**
**El problema era UX mezclada.**

Con esta separación:

- ✅ Cada rol sabe qué hacer
- ✅ Las pantallas son obvias
- ✅ No hay confusión
- ✅ El sistema se explica solo
- ✅ Mantenimiento más fácil

**"No es teatro con pantallas.
Es experiencia de usuario profesional."**

🎯 **Ahora sí: ejecutá PROMPT-PASO-7-COPILOT.md**
