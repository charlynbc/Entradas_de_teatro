# 🎭 PROMPT COPILOT — PASO 7: REDISEÑO DE PANTALLAS POR ROL

> **⚠️ COPIA TODO ESTE ARCHIVO (desde TAREA hasta el final) y pégalo en Copilot Chat**

---

# TAREA

Rediseña las pantallas del frontend para **separar responsabilidades por rol**.

## 🎯 Objetivo

Crear pantallas simples y claras donde:

1. **Cada rol ve solo lo que necesita**
2. **Una pantalla = una acción principal**
3. **Sin responsabilidades mezcladas**
4. **UX intuitiva sin explicar el sistema**
5. **Textos en lenguaje simple, no técnico**

## 📦 DELIVERABLES

Debes crear estos archivos HTML + CSS + JS:

### 1. Pantalla pública: Comprar ticket

**Archivo:** `frontend/public/comprar-ticket.html`

**Para:** Invitados (sin login)

**Muestra:**
- Obra (título, descripción)
- Función (fecha, hora, lugar)
- Precio
- Disponibilidad
- Medios de pago: MercadoPago, Transferencia

**Acción principal:**
- Botón "Pagar con MercadoPago"
- Botón "Pagar con Transferencia"

**Flujo:**
1. Usuario completa datos (nombre, email)
2. Selecciona medio de pago
3. Si MercadoPago: redirect a MP → paga → recibe ticket por email
4. Si Transferencia: ve datos bancarios → transfiere → sube comprobante → espera validación

**NO mostrar:**
- Estados internos (PENDIENTE_VALIDACION, etc.)
- Caja
- Actores
- Configuración

**Texto clave:**
```
"Tu entrada se enviará por email una vez confirmado el pago."
```

---

### 2. Actor: Mis cuotas

**Archivo:** `frontend/actor/mis-cuotas.html`

**Para:** Actores (con login)

**Muestra:**
- Grupo al que pertenece
- Lista de cuotas:
  * Monto, vencimiento
  * Estado: 🔴 Pendiente | 🟡 En validación | 🟢 Pagada
- Datos bancarios del grupo (banco, cuenta, CBU, alias)

**Acción principal:**
- Botón "Subir Comprobante de Pago"

**Flujo:**
1. Actor ve cuota pendiente
2. Ve datos bancarios para transferir
3. Transfiere desde su banco
4. Click "Subir comprobante"
5. Selecciona archivo (JPG, PNG, PDF)
6. Confirma → estado cambia a "En validación"
7. Espera aprobación del director

**NO mostrar:**
- Botón "Marcar como pagado"
- Caja del grupo
- Cuotas de otros actores
- Validación (es del director)

**Texto clave:**
```
"Transferí el monto indicado y subí el comprobante.
El director validará tu pago."
```

**API calls:**
```js
// GET /api/actores/:id/cuotas
// POST /api/comprobantes (con FormData)
```

---

### 3. Actor: Mis tickets

**Archivo:** `frontend/actor/mis-tickets.html`

**Para:** Actores (con login)

**Muestra:**
- Función (título, fecha)
- Tickets asignados
- Estado por ticket:
  * 🟢 Disponible
  * 🟡 Vendido (esperando validación)
  * ✅ Pagado
- Medio de pago usado

**Acción principal:**
- Botón "Reportar Venta" (solo en tickets disponibles)

**Flujo:**
1. Actor vende ticket en mano (recibe efectivo/transferencia)
2. Click "Reportar venta"
3. Modal: Selecciona medio de pago (Efectivo | Transferencia)
4. Confirma
5. Estado: Vendido (esperando validación)
6. Director valida
7. Estado: Pagado

**NO mostrar:**
- Botón "Validar" (es del director)
- Caja de la función
- Tickets de otros actores
- Configuración de precios

**Texto clave:**
```
"Reportá la venta después de recibir el pago.
El director validará para que se registre en caja."
```

**API calls:**
```js
// GET /api/actores/:id/tickets
// POST /api/pagos/iniciar { tipo: 'TICKET', proveedor: 'EFECTIVO' }
```

---

### 4. Director: Validar cuotas

**Archivo:** `frontend/director/validar-cuotas.html`

**Para:** Directores (con login)

**Muestra:**
- Lista de cuotas en validación
- Por cada cuota:
  * Actor, grupo
  * Monto, fecha
  * Comprobante (imagen/PDF)
- Filtros: Todos | Por grupo | Por actor

**Acción principal:**
- Botón "Aprobar"
- Botón "Rechazar"

**Flujo:**
1. Director ve lista de cuotas pendientes
2. Click en cuota para ver detalle
3. Ve comprobante subido por actor
4. Verifica transferencia
5. Decide:
   - Aprobar → cuota PAGADA + ingreso a CAJA + notificación a actor
   - Rechazar → cuota RECHAZADA + motivo + notificación a actor

**NO mostrar:**
- Su propia cuota (si es actor también)
- Botón "Vender ticket"

**Texto clave:**
```
"Validá el pago verificando el comprobante.
Al aprobar, el dinero se registra en caja."
```

**API calls:**
```js
// GET /api/cuotas/pendientes
// PATCH /api/comprobantes/:id/validar
// PATCH /api/comprobantes/:id/rechazar
```

---

### 5. Director: Validar pagos online

**Archivo:** `frontend/director/validar-pagos.html`

**Para:** Directores (con login)

**Muestra:**
- Tickets comprados online con transferencia (pendientes)
- Por cada ticket:
  * Comprador (nombre, email)
  * Función, monto
  * Comprobante
  * Cuenta destino
- Filtros: Todos | Por función

**Acción principal:**
- Botón "Aprobar"
- Botón "Rechazar"

**Flujo:**
1. Director ve pagos online pendientes
2. Click para ver detalle
3. Ve comprobante
4. Verifica transferencia a cuenta de función
5. Decide:
   - Aprobar → ticket PAGADO + envío QR por email + ingreso a CAJA
   - Rechazar → ticket RECHAZADO + notificación a comprador

**NO mostrar:**
- Pagos con MercadoPago (esos se aprueban automáticamente)

**Texto clave:**
```
"Verificá que el comprobante corresponda a la cuenta de la función."
```

**API calls:**
```js
// GET /api/intenciones/pendientes?tipo=TICKET&proveedor=TRANSFERENCIA
// PATCH /api/comprobantes/:id/validar
```

---

### 6. Director: Configuración financiera

**Archivo:** `frontend/director/configuracion-financiera.html`

**Para:** Directores (con login)

**Muestra:**
- Sección: Cuentas del grupo
- Sección: Cuentas por función profesional
- Por cada cuenta:
  * Tipo (Grupo | Función)
  * Banco, cuenta, CBU, alias
  * Estado: 🟢 Activa | 🔴 Inactiva

**Acción principal:**
- Botón "Nueva Cuenta Bancaria"
- Botones por cuenta: Editar | Desactivar

**Flujo:**
1. Director click "Nueva cuenta"
2. Modal:
   - Tipo: Grupo | Función profesional
   - Si Grupo: selecciona grupo
   - Si Función: selecciona función
   - Completa datos: banco, titular, cuenta, CBU, alias
3. Guarda
4. Actores/invitados ven esos datos al pagar

**Texto clave:**
```
"Configurá las cuentas donde se recibirán los pagos."
```

**API calls:**
```js
// GET /api/cuentas
// POST /api/cuentas { tipo, ownerId, banco, titular, cuenta, cbu, alias }
// PATCH /api/cuentas/:id
// DELETE /api/cuentas/:id (soft delete → inactiva)
```

---

### 7. Shared: Header dinámico

**Archivo:** `frontend/shared/header.html` (partial)

**Genera navegación según rol:**

**Actor:**
```html
<nav>
  <a href="/actor/mis-cuotas.html">Mis Cuotas</a>
  <a href="/actor/mis-tickets.html">Mis Tickets</a>
  <a href="#" onclick="logout()">Salir</a>
</nav>
```

**Director:**
```html
<nav>
  <a href="/director/validar-cuotas.html">Validar Cuotas</a>
  <a href="/director/validar-pagos.html">Validar Pagos</a>
  <a href="/director/configuracion-financiera.html">Configuración</a>
  <a href="/director/reportes.html">Reportes</a>
  <a href="#" onclick="logout()">Salir</a>
</nav>
```

**Invitado:**
```html
<nav>
  <a href="/public/funciones.html">Ver Funciones</a>
</nav>
```

---

### 8. Shared: API Client

**Archivo:** `frontend/shared/api.js`

```js
const API = {
  baseURL: 'http://localhost:5000/api',
  
  async get(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('API Error');
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
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  
  async uploadFile(endpoint, file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('archivo', file);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error('Upload Error');
    return response.json();
  },
  
  async patch(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }
};
```

---

### 9. Shared: Estilos base

**Archivo:** `frontend/shared/styles.css`

```css
/* Colores por estado */
.estado-pendiente {
  color: #e74c3c; /* Rojo */
  font-weight: bold;
}

.estado-validacion {
  color: #f39c12; /* Amarillo */
  font-weight: bold;
}

.estado-pagado {
  color: #27ae60; /* Verde */
  font-weight: bold;
}

/* Botones */
.btn-primary {
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-success {
  background: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-success:hover {
  background: #229954;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger:hover {
  background: #c0392b;
}

/* Cards */
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: #2c3e50;
  color: white;
  padding: 15px 20px;
}

header nav a {
  color: white;
  text-decoration: none;
  margin-right: 20px;
  font-weight: 500;
}

header nav a:hover {
  text-decoration: underline;
}
```

---

## 🔒 REGLAS CRÍTICAS

### 1. Una pantalla, una acción

Cada HTML debe tener **UNA acción principal obvia**.

**✅ BIEN:**
- `comprar-ticket.html` → Acción: Comprar
- `mis-cuotas.html` → Acción: Subir comprobante
- `validar-cuotas.html` → Acción: Aprobar/Rechazar

**❌ MAL:**
- `dashboard.html` con 10 botones diferentes

---

### 2. Texto simple, no técnico

**✅ BIEN:**
```html
<p>Tu entrada se enviará por email una vez confirmado el pago.</p>
<p class="estado-validacion">🟡 En validación</p>
```

**❌ MAL:**
```html
<p>El ticket quedará en estado PENDING_APPROVAL_STAGE_2 hasta que el webhook de MercadoPago confirme la transacción mediante HMAC SHA256.</p>
```

---

### 3. Estados visibles solo cuando importan

**Actor ve:**
- Pendiente
- En validación
- Pagada

**Invitado NO ve:**
- PENDIENTE_VALIDACION_DIRECTOR_APPROVAL

---

### 4. Separación estricta por rol

**Actor puede:**
- Ver sus cuotas
- Ver sus tickets
- Subir comprobantes
- Reportar ventas

**Actor NO puede:**
- Validar pagos
- Ver caja
- Configurar cuentas

**Director puede:**
- Validar cuotas
- Validar pagos
- Configurar cuentas
- Ver reportes

**Director NO puede (en estas pantallas):**
- Vender tickets directamente
- Subir comprobantes como actor

---

### 5. Carga dinámica según rol

```js
// En cada página protegida
window.onload = async () => {
  const userRole = localStorage.getItem('userRole');
  
  // Verificar que el rol puede acceder a esta página
  if (window.location.pathname.includes('/actor/') && userRole !== 'actor') {
    window.location = '/login.html';
    return;
  }
  
  if (window.location.pathname.includes('/director/') && userRole !== 'director') {
    window.location = '/login.html';
    return;
  }
  
  // Cargar datos
  await cargarDatos();
};
```

---

## 🎯 ESTRUCTURA HTML BASE

Cada página debe seguir este template:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título | Teatro Sistema</title>
  <link rel="stylesheet" href="/shared/styles.css">
</head>
<body>
  <!-- Header dinámico -->
  <header id="main-header"></header>
  
  <!-- Contenido principal -->
  <main class="container">
    <h1>Título de la Pantalla</h1>
    
    <!-- Contenido específico -->
    <div id="content">
      <!-- Carga dinámica con JS -->
    </div>
  </main>
  
  <!-- Scripts -->
  <script src="/shared/api.js"></script>
  <script src="/shared/utils.js"></script>
  <script src="./script.js"></script>
</body>
</html>
```

---

## 🧪 VALIDACIONES

### Input validation (frontend)

```js
// Ejemplo: Subir comprobante
document.getElementById('form-comprobante').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const archivo = document.getElementById('archivo').files[0];
  
  // Validar archivo existe
  if (!archivo) {
    alert('Seleccioná un archivo');
    return;
  }
  
  // Validar formato
  const formatsPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!formatsPermitidos.includes(archivo.type)) {
    alert('Formato no permitido. Usá JPG, PNG o PDF.');
    return;
  }
  
  // Validar tamaño (max 5MB)
  if (archivo.size > 5 * 1024 * 1024) {
    alert('El archivo es muy grande. Máximo 5MB.');
    return;
  }
  
  // Subir
  try {
    const response = await API.uploadFile('/comprobantes', archivo);
    alert('Comprobante subido correctamente');
    window.location.reload();
  } catch (error) {
    alert('Error al subir comprobante');
  }
});
```

---

## 🎨 COMPONENTES REUTILIZABLES

### Card de cuota

```html
<div class="card">
  <h3>Cuota: Enero 2026</h3>
  <p>Monto: <strong>$500</strong></p>
  <p>Vencimiento: 31/01/2026</p>
  <p class="estado-pendiente">🔴 Pendiente</p>
  
  <div class="cuenta-bancaria">
    <h4>🏦 Datos para transferir:</h4>
    <p>Banco: Nación</p>
    <p>Cuenta: 1234567890</p>
    <p>Alias: teatro.grupo</p>
    <p>CBU: 0110123456789012345678</p>
  </div>
  
  <button class="btn-primary" onclick="subirComprobante(1)">
    Subir Comprobante de Pago
  </button>
</div>
```

---

### Card de ticket (actor)

```html
<div class="card">
  <h3>Ticket #001</h3>
  <p>Función: Esperando a Godot - 20/01/2026</p>
  <p>Precio: $800</p>
  <p class="estado-pendiente">🟢 Disponible</p>
  
  <button class="btn-primary" onclick="reportarVenta('TKT-001')">
    Reportar Venta
  </button>
</div>
```

---

### Card de validación (director)

```html
<div class="card">
  <h3>🟡 Cuota: Enero 2026</h3>
  <p>Actor: <strong>Juan Pérez</strong></p>
  <p>Grupo: Compañía Teatro Abierto</p>
  <p>Monto: <strong>$500</strong></p>
  <p>Subido: 10/01/2026 - 14:30</p>
  
  <div>
    <a href="/uploads/comprobantes/123.jpg" target="_blank">
      📎 Ver Comprobante
    </a>
  </div>
  
  <div style="margin-top: 15px;">
    <button class="btn-success" onclick="aprobarCuota(1)">
      ✅ Aprobar
    </button>
    <button class="btn-danger" onclick="rechazarCuota(1)">
      ❌ Rechazar
    </button>
  </div>
</div>
```

---

## 📱 RESPONSIVE

Todas las pantallas deben ser responsive:

```css
/* Mobile first */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .card {
    padding: 15px;
  }
  
  header nav a {
    display: block;
    margin: 10px 0;
  }
  
  .btn-primary,
  .btn-success,
  .btn-danger {
    width: 100%;
    margin: 5px 0;
  }
}
```

---

## 🔗 NAVEGACIÓN ENTRE PANTALLAS

### Desde actor

```
mis-cuotas.html
├─ Click "Subir comprobante"
├─ Modal/formulario
├─ Submit
└─ Reload → ve "En validación"

mis-tickets.html
├─ Click "Reportar venta"
├─ Modal: selecciona medio de pago
├─ Submit
└─ Reload → ve "Vendido"
```

### Desde director

```
validar-cuotas.html
├─ Click "Aprobar"
├─ Confirma
└─ Cuota desaparece de lista (ya pagada)

validar-pagos.html
├─ Click "Aprobar"
├─ Confirma
└─ Pago desaparece de lista (ya validado)
```

---

## ✅ TESTING CHECKLIST

Cada pantalla debe pasar estos tests:

**Test 1: Acción principal obvia**
- ¿Cuál es la acción principal de esta pantalla?
- Respuesta debe ser inmediata y única

**Test 2: Rol correcto**
- ¿Esta pantalla es para actor, director o invitado?
- Solo ese rol debe poder acceder

**Test 3: Sin confusión**
- ¿El usuario sabe qué hacer sin leer instrucciones largas?
- Textos cortos, botones claros

**Test 4: Estados claros**
- Estados visibles: ¿son relevantes para el usuario?
- ¿Usa lenguaje simple o técnico?

**Test 5: Responsive**
- ¿Funciona en mobile?
- ¿Botones son clickeables en pantalla pequeña?

---

## 🚨 ERROR HANDLING

```js
// Ejemplo: Manejo de errores al aprobar cuota
async function aprobarCuota(cuotaId) {
  if (!confirm('¿Aprobar esta cuota?')) return;
  
  try {
    await API.patch(`/comprobantes/${cuotaId}/validar`, {});
    alert('Cuota aprobada correctamente');
    window.location.reload();
  } catch (error) {
    alert('Error al aprobar cuota. Intentá nuevamente.');
    console.error(error);
  }
}
```

---

## 📊 OUTPUT ESPERADO

Al finalizar deberías tener:

1. **6 páginas HTML funcionales**
   - public/comprar-ticket.html
   - actor/mis-cuotas.html
   - actor/mis-tickets.html
   - director/validar-cuotas.html
   - director/validar-pagos.html
   - director/configuracion-financiera.html

2. **Componentes compartidos**
   - shared/header.html
   - shared/styles.css
   - shared/api.js
   - shared/utils.js

3. **JavaScript por página**
   - Carga de datos desde API
   - Manejo de formularios
   - Validaciones frontend
   - Navegación

4. **UX mejorada**
   - Cada rol ve solo lo necesario
   - Acción clara por pantalla
   - Textos simples
   - Sin estados técnicos

---

## 🎯 CRITERIOS DE ÉXITO

- ✅ Actor solo ve: cuotas y tickets propios
- ✅ Director solo ve: validaciones y configuración
- ✅ Invitado solo ve: compra de tickets
- ✅ Una acción clara por pantalla
- ✅ Sin estados técnicos visibles
- ✅ Textos en lenguaje simple
- ✅ Navegación intuitiva por rol
- ✅ Responsive (mobile y desktop)
- ✅ Integración con backend existente
- ✅ Sin mezclar responsabilidades

---

**🎯 Ahora genera el código HTML/CSS/JS siguiendo esta especificación.**
