# 🧠 MODELO MENTAL NUEVO - Sistema de Ventas de Tickets

## 📌 LA IDEA CLAVE (léelo varias veces)

> **"No todos los tickets nacen igual"**

Hoy el sistema trata toda venta igual. Eso causa confusión conceptual, mezcla de responsabilidades y código duplicado.

La solución: **Distinguir claramente el ORIGEN y FLUJO de cada venta.**

---

## 🎯 LOS TRES TIPOS DE VENTA

### 1️⃣ VENTA POR ACTOR (Independiente)

```
FLUJO:
┌─────────────────────────────────────────┐
│ OBRA = INDEPENDIENTE (teatro de grupo)  │
│ INVITADO = Amigo/público cercano        │
└─────────────────────────────────────────┘
                  ↓
        ACTOR (vendedor) compra
                  ↓
    Ticket pasa: DISPONIBLE → STOCK_ACTOR
                  ↓
     Actor reporta venta a director
                  ↓
    REPORTADA_VENDIDA → PAGADO (aprueba director)
                  ↓
            USADO (en puerta)
```

**Responsable:** ACTOR  
**Autoriza:** DIRECTOR (del grupo)  
**Registra:** BOLETERÍA (operativo)  

**Características:**
- Hay intermediario (actor)
- Proceso en 2 pasos (reporte + aprobación)
- Pago via transferencia manual
- Bajo volumen

---

### 2️⃣ VENTA ONLINE PÚBLICA (Profesional)

```
FLUJO:
┌─────────────────────────────────────────┐
│ OBRA = PROFESIONAL (teatro profesional) │
│ INVITADO = Cliente desconocido          │
└─────────────────────────────────────────┘
                  ↓
     INVITADO llena formulario web
     (nombre, email, teléfono)
                  ↓
  Sistema busca ticket DISPONIBLE
                  ↓
 Ticket pasa DIRECTAMENTE a PAGADO
         origen_venta = ONLINE
                  ↓
         Se registra en CAJA
                  ↓
         Se envía QR por email
                  ↓
              USADO (en puerta)
```

**Responsable:** SISTEMA (automático)  
**Validador:** DIRECTOR (ve reportes)  
**Sin intermediarios**  

**Características:**
- Sin actor intermediario
- Proceso automático (1 paso)
- Pago digital (futuro: Mercado Pago)
- Alto volumen esperado

---

### 3️⃣ COMPRA DE CORTESÍA (Admin)

```
FLUJO:
┌──────────────────────────────────┐
│ Invitación para personalidades   │
│ o personas especiales            │
└──────────────────────────────────┘
                  ↓
     DIRECTOR o ADMIN asigna
                  ↓
  Ticket pasa DIRECTAMENTE a PAGADO
      origen_venta = CORTESIA
                  ↓
         Se registra especial
         (auditoría clara)
                  ↓
              USADO (en puerta)
```

**Responsable:** DIRECTOR/ADMIN  
**Autoriza:** Quien genera  

---

## 📊 MATRIZ DE RESPONSABILIDADES

| Responsabilidad | ACTOR | DIRECTOR | ADMIN | SISTEMA | INVITADO |
|---|---|---|---|---|---|
| **Vende tickets** | ✅ (independiente) | ❌ | ❌ | ✅ (online) | ❌ |
| **Reporta venta** | ✅ | ❌ | ❌ | ✅ (automático) | ❌ |
| **Autoriza pago** | ❌ | ✅ | ✅ | ✅ (automático) | ❌ |
| **Registra en caja** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Compra directo** | ❌ | ❌ | ❌ | ❌ | ✅ (profesional) |
| **Ve reportes** | ✅ (propios) | ✅ (grupo) | ✅ (todos) | N/A | ❌ |
| **Cierra función** | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 🗂️ NUEVOS CAMPOS EN LA BD

### En `funciones`

```sql
ALTER TABLE funciones ADD COLUMN (
  tipo_funcion VARCHAR(20) DEFAULT 'INDEPENDIENTE' 
    CHECK (tipo_funcion IN ('INDEPENDIENTE', 'PROFESIONAL')),
  
  permite_compra_online BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX idx_funciones_tipo ON funciones(tipo_funcion);
CREATE INDEX idx_funciones_online ON funciones(permite_compra_online);
```

**Reglas:**
- `INDEPENDIENTE` → No hay compra online (actores venden)
- `PROFESIONAL` + `permite_compra_online=true` → INVITADO puede comprar

---

### En `tickets`

```sql
ALTER TABLE tickets ADD COLUMN (
  origen_venta VARCHAR(20) DEFAULT 'ACTOR'
    CHECK (origen_venta IN ('ACTOR', 'ONLINE', 'CORTESIA')),
  
  comprador_email VARCHAR(100),
  
  fecha_pago_sistema TIMESTAMP,
  
  comprador_cedula_sistema_id INT REFERENCES users(cedula) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_tickets_origen ON tickets(origen_venta);
CREATE INDEX idx_tickets_email ON tickets(comprador_email);
```

**Interpretación:**
- `ACTOR`: Vendido por actor, requiere aprobación
- `ONLINE`: Comprado directo por cliente web, ya pagado
- `CORTESIA`: Asignado por admin, cortesía

---

## 🎭 CÓMO SE VE EN FRONTEND

### Pantalla Pública (invitado sin login)

```html
<!-- Funciones PROFESIONALES con compra online -->
<div class="cartelera">
  <div class="funcion">
    <h3>La Tempestad - Act 2</h3>
    <p>📅 15 Feb 20:00</p>
    <p>📍 Sala Teatro</p>
    <p>💵 $300</p>
    
    <button class="btn-comprar">COMPRAR ENTRADA</button>
    <!-- Solo aparece si: es_profesional=true AND permite_compra_online=true -->
  </div>
</div>

<!-- Funciones INDEPENDIENTES: solo vendedores listados -->
<div class="funciones-independientes">
  <h2>Otras Funciones (Compra con actores)</h2>
  
  <div class="funcion">
    <h3>Obra del Grupo X</h3>
    <p>Contacta con vendedores de confianza ↓</p>
    
    <button class="btn-vendedores">
      Ver vendedores autorizados
    </button>
  </div>
</div>
```

### Modal de Compra (público)

```html
<form class="compra-ticket">
  <label>
    Nombre *
    <input name="nombre" required>
  </label>
  
  <label>
    Email *
    <input name="email" type="email" required>
  </label>
  
  <label>
    Teléfono *
    <input name="telefono" required>
  </label>
  
  <label>
    Cantidad *
    <input name="cantidad" type="number" min="1" required>
  </label>
  
  <button type="submit">Proceder al pago</button>
</form>

<!-- Después de submit:
  - Sistema busca tickets DISPONIBLES
  - Los marca PAGADO (origen_venta=ONLINE)
  - Envía email con QR
  - Muestra código de compra
-->
```

---

## 🖥️ ENDPOINTS NUEVO FLUJO

### Para INVITADO (público, sin auth)

```http
GET /api/public/funciones
Respuesta: {
  funciones: [
    {
      id: 5,
      nombre: "La Tempestad",
      fecha: "2025-02-15T20:00:00Z",
      precio: 300,
      disponibles: 45,
      tipo_funcion: "PROFESIONAL",
      permite_compra_online: true,
      boleteria_contacto: "+598..."
    }
  ]
}
```

```http
GET /api/public/funciones/:id/vendedores
# Solo si: tipo_funcion=INDEPENDIENTE
Respuesta: {
  vendedores: [
    {
      nombre: "Juan Pérez",
      telefono: "+598991234",
      vendidas: 3
    }
  ]
}
```

```http
POST /api/public/comprar-ticket (⭐ NUEVO)
Body: {
  funcionId: 5,
  nombre: "Carlos López",
  email: "carlos@example.com",
  telefono: "+598991234567",
  cantidad: 2
}

Respuesta: {
  success: true,
  compra_id: "COMP-20250115-001",
  tickets: [
    {
      code: "QR-XXXX-1",
      qr_data: "data:image/png;base64,..."
    },
    {
      code: "QR-XXXX-2",
      qr_data: "data:image/png;base64,..."
    }
  ],
  email_enviado: true,
  mensaje: "Entradas compradas. Revisa tu email para los códigos QR."
}
```

---

### Para ACTOR (autenticado)

```http
POST /api/tickets/estado
# Ya existe - sin cambios en flujo
# Solo para INDEPENDIENTE
Body: {
  ticketId: "T-001",
  estado: "RESERVADO" | "REPORTADA_VENDIDA"
}
```

```http
POST /api/tickets/cobrar
# Ya existe - sin cambios
# Director aprueba ventas reportadas
Body: {
  showId: 5,
  actorId: "1234567"
}
```

---

### Para DIRECTOR/ADMIN

```http
POST /api/tickets/cortesia (⭐ NUEVO)
# Asignar entrada de cortesía
Body: {
  funcionId: 5,
  comprador_nombre: "Personalidad XYZ",
  comprador_email: "importante@gov.uy",
  motivo: "Invitación especial"
}

Respuesta: {
  code: "CORT-XXXX",
  qr: "data:image/png;base64,..."
}
```

```http
PATCH /api/funciones/:id/configurar-compra
# Habilitar/deshabilitar compra online
Body: {
  permite_compra_online: true | false
}
```

---

## 🔄 MIGRACIÓN SEGURA (paso a paso)

### Fase 1: Preparación

```sql
-- 1. Agregar campos (non-breaking)
ALTER TABLE funciones ADD COLUMN tipo_funcion VARCHAR(20) DEFAULT 'INDEPENDIENTE';
ALTER TABLE funciones ADD COLUMN permite_compra_online BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN origen_venta VARCHAR(20) DEFAULT 'ACTOR';
ALTER TABLE tickets ADD COLUMN comprador_email VARCHAR(100);
```

### Fase 2: Populate histórico

```sql
-- 2. Los tickets existentes son de ACTOR
UPDATE tickets SET origen_venta = 'ACTOR' WHERE origen_venta = 'ACTOR';

-- 3. Las funciones existentes son INDEPENDIENTE
UPDATE funciones SET tipo_funcion = 'INDEPENDIENTE' WHERE tipo_funcion = 'ACTOR';
UPDATE funciones SET permite_compra_online = FALSE WHERE permite_compra_online IS NULL;
```

### Fase 3: Tests

- Ejecutar `test-completo.sh` (debe pasar 100%)
- Verificar vendedores por función aún funcionan
- Verificar reportes por actor aún funcionan

### Fase 4: Deploy de rutas públicas

- Agregar `POST /api/public/comprar-ticket`
- Test en staging
- Deploy a producción

### Fase 5: Habilitar compra online

- Marcar funciones `permite_compra_online = true` cuando esté lista

---

## 🎯 BENEFICIOS DE ESTE MODELO

### ✅ Para INVITADO

- Puede comprar **sin intermediario** (funciones profesionales)
- Compra **rápida y directa**
- Recibe QR **por email**
- Entrada **válida inmediatamente**

### ✅ Para ACTOR

- **Responsabilidades claras**: solo vende, reporta, transfiere
- **No participa** en ventas online
- **No confunde** sistemas internos

### ✅ Para DIRECTOR

- Ve **reportes claros**: qué vino de dónde
- Puede **habilitar/deshabilitar** compra online
- Tiene **auditoría completa** de origen

### ✅ Para SISTEMA

- **Código limpio**: cada flujo tiene su ruta
- **Extensible**: fácil agregar Mercado Pago después
- **Auditable**: cada venta registra origen
- **No rompe**: código antiguo sigue funcionando

---

## 🤖 CHECKLIST IMPLEMENTACIÓN

- [ ] Agregar campos a BD (migraciones)
- [ ] Crear `publicSales.controller.js`
- [ ] Crear ruta `POST /api/public/comprar-ticket`
- [ ] Crear ruta `POST /api/tickets/cortesia` (admin)
- [ ] Crear ruta `PATCH /api/funciones/:id/configurar-compra`
- [ ] Tests unitarios de cada flujo
- [ ] `test-completo.sh` debe pasar
- [ ] Documentación de endpoints
- [ ] Deploy gradual

---

## 🧩 ESTRUCTURA FINAL DE CARPETAS

```
teatro-tickets-backend/
├── controllers/
│   ├── tickets.controller.js          (mantener, solo ACTOR/DIRECTOR)
│   ├── publicSales.controller.js      (⭐ NUEVO - compra pública)
│   ├── courtesyTickets.controller.js  (⭐ NUEVO - cortesías)
│   └── public.controller.js           (actualizar con funciones)
│
├── services/
│   ├── ticketService.js               (lógica de tickets)
│   ├── publicSalesService.js          (⭐ NUEVO - lógica compra)
│   ├── courtesyService.js             (⭐ NUEVO - lógica cortesía)
│   └── ticketStateMachine.js          (validación de estados)
│
├── routes/
│   ├── tickets.routes.js              (mantener)
│   ├── public.routes.js               (actualizar con compra)
│   └── admin.routes.js                (agregar cortesía)
│
└── middleware/
    └── auth.middleware.js             (mantener)
```

---

## 📝 NOTAS IMPORTANTES

1. **No rompemos nada**: Los tickets de ACTOR siguen igual
2. **Backward compatible**: Sistema existente funciona igual
3. **Extensible**: Fácil agregar Mercado Pago en `publicSalesService.js`
4. **Auditable**: Cada ticket registra su origen
5. **Seguro**: INVITADO solo compra si `permite_compra_online=true`

---

**Próximo paso:** Generar prompt para Copilot 🤖
