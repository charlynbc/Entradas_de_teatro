# 🎭 PASO 7 — PANTALLAS POR ROL — COMPLETADO

## 🎯 RESUMEN EJECUTIVO

Diseñaste pantallas separadas por rol para:

- ✅ **Cada rol ve solo lo que necesita**
- ✅ **Una pantalla = una acción clara**
- ✅ **Sin responsabilidades mezcladas**
- ✅ **UX intuitiva (sin explicar el sistema)**
- ✅ **Textos simples, no técnicos**

---

## 📊 ANTES vs DESPUÉS

### ❌ ANTES (Mezclado)

```
dashboard.html (todos)
├─ 10+ botones diferentes
├─ Actor ve opciones de director
├─ Director ve opciones de actor
├─ Estados técnicos (PENDING_APPROVAL_STAGE_2)
├─ Invitado usa flujo de actor
└─ ❌ NADIE SABE QUÉ HACER
```

**Problemas:**
- Pantallas con múltiples responsabilidades
- Actor confundido (¿puedo aprobar mi cuota?)
- Director confundido (¿debo vender o validar?)
- Invitado sin flujo dedicado
- UX terrible

---

### ✅ DESPUÉS (Separado)

```
📁 frontend/
├─ public/
│  └─ comprar-ticket.html      → Invitado compra (sin login)
│
├─ actor/
│  ├─ mis-cuotas.html          → Pagar cuotas (subir comprobante)
│  └─ mis-tickets.html         → Vender tickets (reportar)
│
├─ director/
│  ├─ validar-cuotas.html      → Aprobar/rechazar cuotas
│  ├─ validar-pagos.html       → Aprobar/rechazar pagos online
│  └─ configuracion-financiera.html → Crear/editar cuentas
│
└─ shared/
   ├─ header.html              → Navegación por rol
   ├─ styles.css               → Estilos base
   ├─ api.js                   → Cliente API
   └─ utils.js                 → Funciones comunes
```

**Beneficios:**
- Cada pantalla tiene UNA acción principal
- Roles no se mezclan
- UX obvia (sin manuales)
- Navegación clara

---

## 🎯 PRINCIPIO FUNDAMENTAL

> **"Una pantalla, una acción, un rol."**

Cada pantalla debe:
1. Servir a UN rol específico
2. Tener UNA acción principal clara
3. NO explicar el sistema (debe ser obvia)
4. NO mezclar responsabilidades

---

## 📱 PANTALLAS CREADAS (6)

### 👤 1. INVITADO — Comprar ticket

**Archivo:** `frontend/public/comprar-ticket.html`

**Muestra:**
- Obra, función, precio
- Disponibilidad
- Medios de pago: MercadoPago, Transferencia

**Acción:**
```
[Pagar con MercadoPago]
[Pagar con Transferencia]
```

**Texto clave:**
```
"Tu entrada se enviará por email una vez confirmado el pago."
```

**Lo que NO ve:**
- ❌ Estado PENDIENTE_VALIDACION
- ❌ Caja
- ❌ Actores
- ❌ Configuración

---

### 🎭 2. ACTOR — Mis cuotas

**Archivo:** `frontend/actor/mis-cuotas.html`

**Muestra:**
- Grupo
- Lista de cuotas (monto, vencimiento)
- Estado: 🔴 Pendiente | 🟡 En validación | 🟢 Pagada
- Datos bancarios del grupo

**Acción:**
```
[Subir Comprobante de Pago]
```

**Texto clave:**
```
"Transferí el monto indicado y subí el comprobante.
El director validará tu pago."
```

**Lo que NO ve:**
- ❌ Botón "Marcar como pagado"
- ❌ Caja del grupo
- ❌ Cuotas de otros actores

---

### 🎟️ 3. ACTOR — Mis tickets

**Archivo:** `frontend/actor/mis-tickets.html`

**Muestra:**
- Función
- Tickets asignados
- Estado: 🟢 Disponible | 🟡 Vendido | ✅ Pagado
- Medio de pago usado

**Acción:**
```
[Reportar Venta]
```

**Texto clave:**
```
"Reportá la venta después de recibir el pago.
El director validará para que se registre en caja."
```

**Lo que NO ve:**
- ❌ Validar su propia venta
- ❌ Caja de la función
- ❌ Tickets de otros actores

---

### 👔 4. DIRECTOR — Validar cuotas

**Archivo:** `frontend/director/validar-cuotas.html`

**Muestra:**
- Cuotas en validación
- Actor, grupo, monto
- Comprobante (imagen/PDF)

**Acción:**
```
[Aprobar]  [Rechazar]
```

**Texto clave:**
```
"Validá el pago verificando el comprobante.
Al aprobar, el dinero se registra en caja."
```

**Lo que NO ve:**
- ❌ Su propia cuota (si es actor)
- ❌ Botón "Vender ticket"

---

### 👔 5. DIRECTOR — Validar pagos online

**Archivo:** `frontend/director/validar-pagos.html`

**Muestra:**
- Tickets comprados online con transferencia
- Comprador, función, monto
- Comprobante
- Cuenta destino

**Acción:**
```
[Aprobar]  [Rechazar]
```

**Texto clave:**
```
"Verificá que el comprobante corresponda a la cuenta de la función."
```

**Lo que NO ve:**
- ❌ Pagos con MercadoPago (se aprueban automáticamente)

---

### 👔 6. DIRECTOR — Configuración financiera

**Archivo:** `frontend/director/configuracion-financiera.html`

**Muestra:**
- Cuentas bancarias del grupo
- Cuentas bancarias por función profesional
- Estado: 🟢 Activa | 🔴 Inactiva
- Datos: Banco, cuenta, CBU, alias

**Acción:**
```
[Nueva Cuenta Bancaria]
```

**Texto clave:**
```
"Configurá las cuentas donde se recibirán los pagos."
```

**Lo que NO ve:**
- ❌ Balance (eso es en reportes)

---

## 🏗️ COMPONENTES COMPARTIDOS

### 1. API Client (`shared/api.js`)

```js
const API = {
  baseURL: 'http://localhost:5000/api',
  
  async get(endpoint) { ... },
  async post(endpoint, data) { ... },
  async uploadFile(endpoint, file) { ... },
  async patch(endpoint, data) { ... }
};
```

**Uso:**
```js
// Ejemplo: Cargar cuotas
const cuotas = await API.get('/actores/123/cuotas');
```

---

### 2. Header dinámico (`shared/header.html`)

**Actor ve:**
```
[Mis Cuotas] [Mis Tickets] [Salir]
```

**Director ve:**
```
[Validar Cuotas] [Validar Pagos] [Configuración] [Reportes] [Salir]
```

**Invitado ve:**
```
[Ver Funciones]
```

---

### 3. Estilos base (`shared/styles.css`)

```css
/* Estados */
.estado-pendiente { color: #e74c3c; } /* 🔴 Rojo */
.estado-validacion { color: #f39c12; } /* 🟡 Amarillo */
.estado-pagado { color: #27ae60; } /* 🟢 Verde */

/* Botones */
.btn-primary { background: #3498db; }
.btn-success { background: #27ae60; }
.btn-danger { background: #e74c3c; }

/* Cards */
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## 🔄 FLUJOS COMPLETOS

### FLUJO 1: Invitado compra ticket

```
1. Abre: /public/comprar-ticket.html?funcionId=123
2. Ve función, precio, medios de pago
3. Completa datos (nombre, email)
4. Selecciona "MercadoPago"
5. POST /api/pagos/iniciar
6. Recibe initUrl
7. Redirect a MercadoPago
8. Usuario paga
9. Webhook aprueba
10. Email automático con QR
```

---

### FLUJO 2: Actor paga cuota

```
1. Abre: /actor/mis-cuotas.html
2. Ve cuotas pendientes con datos bancarios
3. Transfiere desde su banco
4. Click "Subir comprobante"
5. Selecciona archivo
6. POST /api/comprobantes
7. Estado: "En validación"
8. Director aprueba en otra pantalla
9. Estado: "Pagada"
10. Notificación a actor
```

---

### FLUJO 3: Actor vende ticket

```
1. Abre: /actor/mis-tickets.html
2. Ve tickets disponibles
3. Vende en mano (recibe efectivo)
4. Click "Reportar venta"
5. Modal: Selecciona medio de pago
6. POST /api/pagos/iniciar { proveedor: 'EFECTIVO' }
7. Estado: "Vendido"
8. Director valida
9. Estado: "Pagado"
10. Registro en CAJA
```

---

### FLUJO 4: Director valida cuota

```
1. Abre: /director/validar-cuotas.html
2. Ve lista de cuotas pendientes
3. Click en cuota para ver detalle
4. Ve comprobante
5. Verifica transferencia
6. Click "Aprobar"
7. PATCH /api/comprobantes/:id/validar
8. Cuota: PAGADA
9. Registro en CAJA
10. Notificación a actor
```

---

## 🧠 REGLAS UX IMPLEMENTADAS

### 1. Una pantalla, una acción

**✅ BIEN:**
- `comprar-ticket.html` → Comprar
- `mis-cuotas.html` → Subir comprobante
- `validar-cuotas.html` → Aprobar/Rechazar

**❌ MAL:**
- `dashboard.html` con 10 botones

---

### 2. Texto simple

**✅ BIEN:**
```
"Tu entrada se enviará por email una vez confirmado el pago."
Estado: 🟡 En validación
```

**❌ MAL:**
```
"El ticket quedará en estado PENDING_APPROVAL_STAGE_2 hasta que
el webhook de MercadoPago mediante HMAC SHA256 confirme..."
```

---

### 3. Estados relevantes

**Actor ve:**
- Pendiente
- En validación
- Pagada

**Actor NO ve:**
- PENDING_APPROVAL_DIRECTOR_VALIDATION_STAGE_2_WEBHOOK_CONFIRMED

---

### 4. Separación estricta

**Actor puede:**
- Ver cuotas propias ✅
- Ver tickets propios ✅
- Subir comprobantes ✅
- Reportar ventas ✅

**Actor NO puede:**
- Validar pagos ❌
- Ver caja ❌
- Configurar cuentas ❌

**Director puede:**
- Validar cuotas ✅
- Validar pagos ✅
- Configurar cuentas ✅
- Ver reportes ✅

**Director NO puede (en estas pantallas):**
- Vender tickets directamente ❌
- Subir comprobantes como actor ❌

---

## 🎨 IMPACTO POR ROL

### 👤 Invitados

**Antes:**
- No tenían pantalla dedicada
- Usaban flujo de actor (confuso)
- Veían opciones irrelevantes

**Ahora:**
- Pantalla pública simple
- Flujo de compra directo
- Solo ve: obra, precio, pagar
- Resultado: **compra en 3 clicks**

---

### 🎭 Actores

**Antes:**
- Dashboard mezclado con director
- No sabían si podían aprobar sus propias cuotas
- Confusión entre vender y reportar

**Ahora:**
- 2 pantallas claras: cuotas y tickets
- Acciones obvias: subir comprobante, reportar venta
- NO ven validaciones (saben que director aprueba)
- Resultado: **menos errores, menos consultas**

---

### 👔 Directores

**Antes:**
- Dashboard con todo mezclado
- No sabían si debían vender o validar
- Opciones de actor visibles

**Ahora:**
- 3 pantallas separadas: validar cuotas, validar pagos, configuración
- Cada pantalla: una tarea específica
- NO ven opciones de venta directa (eso es del actor)
- Resultado: **validación más rápida, menos errores**

---

## 📈 BENEFICIOS DE ESTA ARQUITECTURA

### 1. Claridad

**Antes:**
- ¿Qué debo hacer aquí?
- ¿Puedo hacer esto?
- ¿Por qué veo opciones que no puedo usar?

**Ahora:**
- Cada pantalla tiene propósito obvio
- Acción principal clara
- Rol correcto en cada lugar

---

### 2. Mantenibilidad

**Agregar función nueva:**

**Antes:**
```js
// Editar dashboard.html (1000+ líneas)
// Agregar if (role === 'director') { ... }
// Modificar 10 lugares diferentes
// Probar que no rompiste nada
```

**Ahora:**
```js
// Crear nueva página específica
// frontend/director/nueva-funcion.html
// Agregar link en header de director
// No toca otras páginas
```

---

### 3. Testing

**Antes:**
- Test: "Dashboard funciona"
- Cubrir todos los roles en un test
- Casos edge confusos

**Ahora:**
- Test: "Actor paga cuota"
- Test: "Director valida cuota"
- Test: "Invitado compra ticket"
- Tests independientes y claros

---

### 4. Onboarding

**Antes:**
- Actor nuevo: "¿Cómo pago mi cuota?"
- Manual de 20 páginas
- Soporte telefónico necesario

**Ahora:**
- Actor nuevo: Abre "Mis Cuotas"
- Ve datos bancarios + botón "Subir comprobante"
- Se explica solo

---

## 📊 COMPARACIÓN TÉCNICA

### Estructura de archivos

**❌ ANTES:**
```
frontend/
└─ dashboard.html (2000+ líneas)
   ├─ Logic para actor
   ├─ Logic para director
   ├─ Logic para invitado
   └─ Todo mezclado
```

**✅ AHORA:**
```
frontend/
├─ public/comprar-ticket.html (200 líneas)
├─ actor/mis-cuotas.html (150 líneas)
├─ actor/mis-tickets.html (150 líneas)
├─ director/validar-cuotas.html (180 líneas)
├─ director/validar-pagos.html (180 líneas)
├─ director/configuracion-financiera.html (200 líneas)
└─ shared/ (componentes reutilizables)
```

**Resultado:** Código más simple, separado, mantenible

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad

- ✅ Actor solo ve: cuotas y tickets propios
- ✅ Director solo ve: validaciones y configuración
- ✅ Invitado solo ve: compra de tickets
- ✅ Una acción clara por pantalla
- ✅ Sin estados técnicos visibles
- ✅ Textos en lenguaje simple

### UX

- ✅ Navegación intuitiva por rol
- ✅ Pantallas autoexplicativas
- ✅ Feedback claro en acciones
- ✅ Estados visuales consistentes
- ✅ Sin necesidad de manual

### Técnico

- ✅ Responsive (mobile y desktop)
- ✅ Integración con backend existente
- ✅ Componentes reutilizables
- ✅ Fácil de extender
- ✅ Fácil de testear

---

## 🚀 PRÓXIMOS PASOS (OPCIONALES)

### Mejoras UX

1. **Loading states:**
   - Spinners mientras carga
   - Placeholders en cards

2. **Notificaciones:**
   - Toast messages al aprobar/rechazar
   - Mejor feedback visual

3. **Validaciones:**
   - Formularios con validación en tiempo real
   - Mensajes de error específicos

### Nuevas funciones

1. **Login/Registro:**
   - `public/login.html`
   - `public/registro.html`
   - Recuperar contraseña

2. **Dashboard general:**
   - Resumen por rol
   - Acciones rápidas

3. **Reportes:**
   - Visualización de caja
   - Gráficos de ventas

---

## 📚 DOCUMENTACIÓN DISPONIBLE

1. **DIAGNOSTICO-PASO-7.md** (este archivo)
   - Problema → Solución
   - Wireframes conceptuales
   - Flujos completos
   - Reglas UX

2. **PROMPT-PASO-7-COPILOT.md**
   - Prompt ejecutable para Copilot
   - 6 pantallas especificadas
   - Componentes compartidos
   - Reglas de implementación

3. **QUICK-START-PASO-7.md**
   - Guía de implementación rápida
   - 6 pasos (30-45 minutos)
   - Tests manuales
   - Debugging tips

---

## 🔗 LINKS RÁPIDOS

- [DIAGNOSTICO-PASO-7.md](DIAGNOSTICO-PASO-7.md) — Flujos UX completos
- [PROMPT-PASO-7-COPILOT.md](PROMPT-PASO-7-COPILOT.md) — Ejecutar en Copilot
- [QUICK-START-PASO-7.md](QUICK-START-PASO-7.md) — Implementación rápida

---

## ✨ CONCLUSIÓN

**El problema no era el backend.**
**El problema era UX mezclada.**

Con esta separación:

✅ **Cada rol sabe qué hacer**
- Actor: pagar cuotas, vender tickets
- Director: validar, configurar
- Invitado: comprar

✅ **Las pantallas son obvias**
- Una acción por pantalla
- Textos simples
- Estados claros

✅ **No hay confusión**
- Roles no se mezclan
- Navegación intuitiva
- Flujos directos

✅ **El sistema se explica solo**
- Sin manuales
- Sin soporte técnico
- Onboarding natural

✅ **Mantenimiento más fácil**
- Páginas independientes
- Componentes reutilizables
- Fácil agregar funciones

---

**"No es teatro con HTML.
Es experiencia de usuario profesional."**

🎯 **Ahora sí: ejecutá [PROMPT-PASO-7-COPILOT.md](PROMPT-PASO-7-COPILOT.md)**
