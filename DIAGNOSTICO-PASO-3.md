# 🔍 DIAGNÓSTICO PASO 3: SISTEMA DE VENTAS SEPARADAS

**Fecha**: Diciembre 2025  
**Contexto**: Post-grupos (PASO 2), necesidad de diferenciar tipos de venta  
**Problema**: Confusión entre ventas internas (ACTOR), ventas públicas (ONLINE) y cortesías (ADMIN)

---

## 📊 ESTADO INICIAL

### Lo que teníamos (post PASO-2)
- ✅ Sistema de grupos con miembros
- ✅ Roles diferenciados (SUPER/ADMIN/ACTOR)
- ✅ Sistema básico de tickets sin diferenciar origen
- ❌ No había distinción entre obra independiente vs profesional
- ❌ No había compra pública sin autenticación
- ❌ No había auditoría de cortesías

### Lo que faltaba
- ❌ 3 tipos de venta claramente diferenciados
- ❌ Campo `origen_venta` en tickets
- ❌ Tabla `compras_publicas` para auditoría
- ❌ Endpoint público de compra (sin auth)
- ❌ Configuración `permite_compra_online`
- ❌ Máquina de estados para tickets

---

## 🎯 OBJETIVO DEL PASO 3

**Implementar 3 flujos de venta separados**:

1. **VENTA INTERNA (ACTOR)**: Actores venden entradas de obras independientes, reportan venta, director aprueba pago
2. **VENTA ONLINE (INVITADO)**: Usuario público compra directamente obras profesionales con compra online habilitada
3. **CORTESÍA (ADMIN)**: Directores asignan cortesías con auditoría separada

---

## 🧩 DECISIONES ARQUITECTÓNICAS

### 1. Campo `origen_venta` en tickets

**Decisión**: Agregar enum `origen_venta` con valores 'ACTOR', 'ONLINE', 'CORTESIA'.

**Razón**: Permite diferenciar reportes, permisos y flujos de pago.

### 2. Campo `tipo_funcion` en funciones

**Decisión**: Enum 'INDEPENDIENTE' (obra de grupo) vs 'PROFESIONAL' (obra comercial).

**Razón**: Solo obras profesionales permiten compra online, independientes requieren venta por actor.

### 3. Tabla `compras_publicas` separada

**Decisión**: Auditoría de compras online en tabla aparte.

**Razón**: Facilita reportes financieros y tracking de ventas públicas sin mezclar con ventas internas.

### 4. Endpoint público sin autenticación

**Decisión**: `POST /public/comprar-ticket` no requiere JWT.

**Razón**: Permite que cualquier persona compre sin crear cuenta, simplifica UX.

### 5. Máquina de estados centralizada

**Decisión**: `ticketStateMachine.js` valida transiciones permitidas.

**Razón**: Previene estados inválidos, documenta flujo completo.

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Migración SQL: `03-sistema-ventas-separadas.sql`

```sql
ALTER TABLE funciones 
  ADD COLUMN tipo_funcion VARCHAR(20) DEFAULT 'INDEPENDIENTE',
  ADD COLUMN permite_compra_online BOOLEAN DEFAULT FALSE;

ALTER TABLE tickets
  ADD COLUMN origen_venta VARCHAR(20) DEFAULT 'ACTOR',
  ADD COLUMN comprador_email VARCHAR(255),
  ADD COLUMN fecha_pago_sistema TIMESTAMP;

CREATE TABLE compras_publicas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  comprador_nombre VARCHAR(100),
  comprador_email VARCHAR(255),
  funcion_id INT REFERENCES funciones(id),
  cantidad INT,
  monto_total NUMERIC(10,2),
  fecha_compra TIMESTAMP DEFAULT NOW()
);
```

### Controller público: `publicSales.controller.js`

- `comprarTicket()`: Compra directa sin auth
- `asignarCortesia()`: ADMIN asigna entrada gratis
- `configurarCompraOnline()`: Habilitar/deshabilitar compra
- `obtenerDetallesCompra()`: Ver compra por código

### Servicios refactorizados

- `ticketStateMachine.js`: Validar transiciones
- `ticketService.js`: Lógica de negocio extraída
- `tickets.controller.refactored.js`: Controller delgado

---

## 📊 MÉTRICAS

- Endpoints nuevos: 5
- Tablas nuevas: 2 (compras_publicas, tickets_cortesia)
- Campos nuevos: 5
- Servicios nuevos: 2
- Documentación: 4 archivos (1,350+ líneas)

---

## 🚧 LIMITACIONES

1. **Sin integración de pago real**: Solo marca como PAGADO, no cobra dinero
2. **Emails no enviados**: Lógica lista pero no configurada
3. **Sin límite de compras por email**: Usuario puede comprar ilimitado

---

**Estado**: ✅ COMPLETADO  
**Fecha**: Diciembre 2025
