# 🚀 Guía Completa - Sistema Baco Teatro

## ✅ Nuevas Funcionalidades Implementadas

### Backend (Node + Express)
- ✅ Modelo de vendedores (con alias, activo/inactivo)
- ✅ Generación automática de QR para cada ticket
- ✅ Endpoint de venta con datos completos (vendedor, comprador, medio de pago, monto)
- ✅ Reportes de ventas por vendedor y función
- ✅ CRUD completo de vendedores

### App Móvil (React Native + Expo)
- ✅ Navegación con pestañas (Venta, Validar, Reportes)
- ✅ Pantalla de registro de ventas
- ✅ Scanner de QR con cámara para validación
- ✅ Pantalla de reportes con estadísticas

---

## 📋 Cómo Probar Todo el Sistema

### 1️⃣ Preparar el Backend

```bash
# Terminal 1 - Levantar backend
cd teatro-tickets-backend
node index.js
# Debe decir: "Servidor escuchando en puerto 3000"
```

### 2️⃣ Crear Datos de Prueba

Abrí otra terminal y ejecutá estos comandos:

```bash
# Crear vendedores
curl -X POST http://localhost:3000/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","alias":"Elenco","activo":true}'

curl -X POST http://localhost:3000/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana García","alias":"Producción","activo":true}'

curl -X POST http://localhost:3000/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos López","alias":"Staff","activo":true}'

# Crear una función
curl -X POST http://localhost:3000/api/shows \
  -H "Content-Type: application/json" \
  -d '{"obra":"Romeo y Julieta","fecha":"2025-12-31 20:00","capacidad":50}'

# Generar 20 tickets con QR
curl -X POST http://localhost:3000/api/shows/1/generate-tickets \
  -H "Content-Type: application/json" \
  -d '{"cantidad":20}'
```

**Anotar algunos códigos de ticket** (ej: T-A1B2C3D4) que vas a usar en la app.

### 3️⃣ Configurar la App Móvil

#### Si vas a usar desde el celular:

1. En VS Code, panel **PORTS** → puerto 3000 → Click derecho → **Port Visibility** → **Public**
2. Copiar la URL pública (ej: `https://xxxx-3000.app.github.dev`)
3. Editar `baco-teatro-app/src/services/api.js`:

```js
export const API_URL = 'https://tu-url-publica-aqui.app.github.dev';
```

#### Si vas a usar en emulador (opcional):

Dejá `http://localhost:3000` como está.

### 4️⃣ Levantar la App Móvil

```bash
# Terminal 2
cd baco-teatro-app
npm start
```

Opciones:
- **Presiona `a`** para abrir en emulador Android (si tenés uno)
- **Escanea el QR con Expo Go** en tu celular (recomendado)

---

## 📱 Cómo Usar la App

### Pestaña 1: 💰 VENDER

**Flujo completo de venta:**

1. Ingresá un código de ticket (ej: `T-A1B2C3D4`)
2. Toca **Buscar**
3. Si el ticket está disponible, se muestra info
4. Completa el formulario:
   - **Vendedor**: Selecciona uno (Juan, Ana, Carlos)
   - **Nombre del comprador**: "María Rodríguez"
   - **Contacto**: "099 123 456" (opcional)
   - **Medio de pago**: Selecciona (EFECTIVO / TRANSFERENCIA / PREX / OTRO)
   - **Monto**: "400"
5. Toca **Registrar Venta**
6. ✅ El ticket queda marcado como PAGADO

**Probá vender 5-10 tickets** con diferentes vendedores y medios de pago.

---

### Pestaña 2: 📷 VALIDAR

**Flujo de validación con QR:**

1. Toca la pestaña **Validar**
2. Permite acceso a la cámara
3. **Apunta la cámara** a un código QR del ticket
   - (Por ahora no tenés QR físico, pero podés probar manualmente)
4. La app muestra:
   - Código del ticket
   - Estado actual
   - Nombre del comprador
5. Toca **Validar**
6. ✅ Si está PAGADO → "Ticket válido, bienvenido"
7. ❌ Si no está pagado o ya fue usado → Rechaza

**Para probar sin QR físico:**

Podés generar un QR en línea:
1. Andá a https://www.qr-code-generator.com/
2. Ingresa el código del ticket (ej: `T-A1B2C3D4`)
3. Descarga el QR
4. Abrilo en tu compu o imprimí
5. Escanealo con la app

---

### Pestaña 3: 📊 REPORTES

**Ver estadísticas de ventas:**

1. Toca la pestaña **Reportes**
2. Selecciona una función (Romeo y Julieta)
3. Ves:
   - **Total vendido**: X tickets
   - **Total recaudado**: $X
   - Por cada vendedor:
     - Cantidad vendida
     - Monto total
     - Promedio por ticket
4. **Pull to refresh** para actualizar

---

## 🧪 Casos de Prueba

### Caso 1: Venta Normal
```
1. Buscar ticket T-ABC123
2. Vendedor: Juan Pérez
3. Comprador: Pedro Gómez
4. Medio: EFECTIVO
5. Monto: 400
✅ Resultado: Ticket vendido
```

### Caso 2: Intentar Vender Ticket Ya Vendido
```
1. Buscar mismo ticket T-ABC123
❌ Resultado: "Ticket ya vendido"
```

### Caso 3: Validar Ticket Pagado
```
1. Escanear QR de T-ABC123
2. Confirmar validación
✅ Resultado: "Ticket válido"
3. Estado → USADO
```

### Caso 4: Intentar Validar Ticket Ya Usado
```
1. Escanear mismo QR T-ABC123
❌ Resultado: "Ticket ya usado"
```

### Caso 5: Intentar Validar Ticket No Pagado
```
1. Buscar ticket nuevo T-XYZ789 (sin vender)
2. Intentar validar
❌ Resultado: "Ticket no está pagado"
```

### Caso 6: Ver Reportes con Múltiples Vendedores
```
1. Vender 3 tickets con Juan
2. Vender 2 tickets con Ana
3. Vender 1 ticket con Carlos
4. Ir a Reportes
✅ Resultado: Tabla con ventas de cada uno
```

---

## 📊 Endpoints de Reportes

### Ver reporte de una función específica:
```bash
curl http://localhost:3000/api/reportes/ventas?showId=1
```

### Ver reporte general (todas las funciones):
```bash
curl http://localhost:3000/api/reportes/ventas
```

Respuesta ejemplo:
```json
[
  {
    "vendedorId": 1,
    "vendedorNombre": "Juan Pérez",
    "cantidadVendida": 5,
    "montoTotal": 2000
  },
  {
    "vendedorId": 2,
    "vendedorNombre": "Ana García",
    "cantidadVendida": 3,
    "montoTotal": 1200
  }
]
```

---

## 🎯 Modelo de Datos Completo

### Ticket
```js
{
  code: "T-A1B2C3D4",
  showId: 1,
  estado: "PAGADO",             // DISPONIBLE | PAGADO | USADO
  vendedorId: 1,                // Quién lo vendió
  compradorNombre: "Juan Pérez",
  compradorContacto: "099123456",
  medioPago: "PREX",            // EFECTIVO | TRANSFERENCIA | PREX | OTRO
  monto: 400,
  qrCode: "data:image/png;base64...",  // QR en base64
  pagadoAt: "2025-11-27T...",
  usadoAt: null,
  createdAt: "2025-11-27T..."
}
```

### Vendedor
```js
{
  id: 1,
  nombre: "Juan Pérez",
  alias: "Elenco",
  activo: true
}
```

---

## 🐛 Troubleshooting

### La app no se conecta al backend
1. Verifica que el backend esté corriendo
2. Verifica que el puerto 3000 esté público
3. Verifica la URL en `src/services/api.js`
4. Prueba abrir la URL en el navegador del celular

### La cámara no funciona
1. Permite permisos de cámara cuando lo pida
2. En Android: Configuración → Apps → Expo Go → Permisos → Cámara
3. Reinicia la app

### Error "Ticket no encontrado"
1. Verifica que el código esté bien escrito (MAYÚSCULAS)
2. Lista todos los tickets: `curl http://localhost:3000/api/shows/1/tickets`

### Los reportes están vacíos
1. Asegurate de haber **vendido** tickets (no solo generarlos)
2. Usa el endpoint `/tickets/:code/sell`, no `/pay`

---

## ✨ Próximos Pasos

Cuando todo esto funcione bien:

1. **Deploy en Render** (backend en producción)
2. **Login de administradores** (autenticación)
3. **PostgreSQL** (base de datos persistente)
4. **Descargar QR** (generar PDF con todos los tickets)
5. **Panel web** (administración desde navegador)

---

¡Todo listo para rockear! 🎭🍊
