# 🎫 SISTEMAS DE ENTRADAS - Explicación Técnica

## ⚠️ PROBLEMA IDENTIFICADO: Dualidad de Sistemas

El sistema actualmente tiene **DOS tablas diferentes** para gestionar entradas, lo que puede causar confusión y errores:

---

## 📊 Sistema A: Tabla `tickets` (Legacy/Antiguo)

### Características:
- **Ubicación:** Tabla `tickets` en PostgreSQL
- **Controlador:** `controllers/tickets.controller.js`
- **Rutas:** `/api/tickets/*`
- **Relación:** `funcion_id` → `funciones.id`

### Estados válidos:
```
DISPONIBLE → STOCK_ACTOR → RESERVADO → REPORTADA_VENDIDA → PAGADO → USADO
                    ↓
                 ANULADO
```

### Campos principales:
```javascript
{
  code: "T-123-0001",           // Código único
  funcion_id: 123,              // FK a funciones
  estado: "DISPONIBLE",         // Estado del ticket
  vendedor_phone: "+59899123456", // Teléfono del vendedor
  comprador_nombre: "Juan Pérez",
  comprador_contacto: "+59899654321",
  precio: 500,
  reservado_at: "2026-01-12T10:00:00Z",
  reportada_at: null,
  pagado_at: null,
  usado_at: null
}
```

### Flujo típico:
1. **Admin crea función** → Se generan N tickets en estado `DISPONIBLE`
2. **Admin asigna a vendedor** → Tickets pasan a `STOCK_ACTOR`
3. **Vendedor reserva** → `RESERVADO` (comprador provisional)
4. **Vendedor reporta venta** → `REPORTADA_VENDIDA` (venta pendiente de cobro)
5. **Director cobra** → `PAGADO` (venta confirmada)
6. **Scanner valida** → `USADO` (entrada utilizada)

### Usado en:
- Panel de vendedor (actor)
- Asignación de stock por director
- Reportes de ventas legacy

---

## 📊 Sistema B: Tabla `entradas_v2` (Nuevo)

### Características:
- **Ubicación:** Tabla `entradas_v2` en PostgreSQL
- **Controlador:** `controllers/entradasV2.controller.js`
- **Rutas:** `/api/entradas-v2/*`
- **Relación:** `funcion_id` → `funciones.id`

### Estados válidos:
```
sin_asignar → asignada → reservada → pronta → pagada → utilizada
                   ↓
            no_vendida (perdonada)
```

### Campos principales:
```javascript
{
  code: "E-123-0001",          // Código único (E = Entrada v2)
  funcion_id: 123,             // FK a funciones
  estado: "sin_asignar",       // Estado de la entrada
  actor_cedula: "12345678",    // Cédula del actor/vendedor
  creador_cedula: "87654321",  // Quien la creó
  reservante_nombre: "María López",
  reservante_telefono: "+59899111222",
  precio: 500,
  reservada_at: "2026-01-12T10:00:00Z",
  pagada_at: null,
  utilizada_at: null
}
```

### Flujo típico:
1. **Director crea función** → Se generan N entradas en `sin_asignar`
2. **Director asigna a actor** → `asignada`
3. **Actor/Invitado reserva** → `reservada`
4. **Actor marca pronta** → `pronta` (venta lista para cobrar)
5. **Director confirma pago** → `pagada`
6. **Scanner valida** → `utilizada`

### Usado en:
- Reservas públicas (invitados sin cuenta)
- Sistema nuevo de entradas
- Liquidaciones y reportes v2

---

## 🔄 ¿Cuál Sistema Usar?

### Usa `tickets` (Sistema A) si:
- ✅ Trabajas con funciones antiguas (antes de 2026)
- ✅ El código usa `/api/tickets/`
- ✅ Necesitas compatibilidad con tests legacy

### Usa `entradas_v2` (Sistema B) si:
- ✅ Creas funciones nuevas (2026+)
- ✅ Implementas reservas públicas
- ✅ Trabajas con el nuevo sistema de liquidaciones
- ✅ Quieres el flujo moderno con estado `pronta`

---

## 🔧 Recomendación Técnica

### Corto plazo (Funciona HOY):
Mantener ambos sistemas funcionando en paralelo:
- Funciones antiguas → `tickets`
- Funciones nuevas → `entradas_v2`

### Largo plazo (Ideal):
**Migrar todo a `entradas_v2`** porque:
1. Tiene mejor separación de estados
2. Soporta reservas públicas nativamente
3. Auditoría completa con `entradas_v2_logs`
4. Código más limpio y mantenible

### Código de migración sugerido:
```sql
-- Migrar tickets antiguos a entradas_v2
INSERT INTO entradas_v2 (
  code, funcion_id, estado, actor_cedula, precio, 
  reservante_nombre, reservante_telefono, 
  reservada_at, pagada_at, utilizada_at
)
SELECT 
  code,
  funcion_id,
  CASE estado
    WHEN 'DISPONIBLE' THEN 'sin_asignar'
    WHEN 'STOCK_ACTOR' THEN 'asignada'
    WHEN 'RESERVADO' THEN 'reservada'
    WHEN 'REPORTADA_VENDIDA' THEN 'pronta'
    WHEN 'PAGADO' THEN 'pagada'
    WHEN 'USADO' THEN 'utilizada'
    ELSE 'sin_asignar'
  END,
  (SELECT cedula FROM users WHERE phone = t.vendedor_phone LIMIT 1),
  precio,
  comprador_nombre,
  comprador_contacto,
  reservado_at,
  pagado_at,
  usado_at
FROM tickets t
WHERE NOT EXISTS (
  SELECT 1 FROM entradas_v2 e WHERE e.code = t.code
);
```

---

## 📝 Cambios Implementados HOY

### 1. Login mejorado
- ✅ Redirección correcta según rol (SUPER, ADMIN, ACTOR, INVITADO)
- ✅ Validación de usuario activo
- ✅ Manejo de roles desconocidos con fallback
- ✅ Logs en consola para debugging

### 2. Reservas clarificadas
- ✅ Comentarios en código explicando qué sistema usa cada endpoint
- ✅ Mejor mensaje de error cuando no hay stock
- ✅ Separación clara: vendedores usan `tickets`, invitados usan `entradas_v2`

### 3. Validaciones agregadas
- ✅ Usuario inactivo no puede loguearse
- ✅ Rol desconocido redirige a inicio (no error)
- ✅ Mensajes de error más descriptivos

---

## 🎯 Para Desarrolladores

### Crear nueva función con entradas:
```javascript
// Opción A: tickets (legacy)
POST /api/funciones
{
  "obra_id": 123,
  "fecha": "2026-01-20T20:00:00Z",
  "capacidad": 80
}
// → Crea automáticamente 80 tickets en estado DISPONIBLE

// Opción B: entradas_v2 (recomendado)
POST /api/funciones
// (igual que arriba)
// Luego:
POST /api/entradas-v2/funcion/123/generar
{
  "cantidad": 80,
  "precio": 500
}
```

### Asignar stock a vendedor:
```javascript
// Opción A: tickets
POST /api/tickets/asignar
{
  "funcion_id": 123,
  "vendedor_phone": "+59899123456",
  "cantidad": 10
}

// Opción B: entradas_v2
POST /api/entradas-v2/E-123-0001/asignar
{
  "actor_cedula": "12345678"
}
```

### Reserva pública (solo entradas_v2):
```javascript
POST /api/public/funciones/123/reservar
{
  "vendedor_cedula": "12345678",
  "nombre": "Invitado Apellido",
  "telefono": "+59899555666"
}
```

---

## 📞 Contacto

Si tienes dudas sobre qué sistema usar:
1. Revisa la fecha de la función (nueva → entradas_v2)
2. Consulta con el equipo de desarrollo
3. En caso de duda, usa `entradas_v2` (es el futuro)

---

**Última actualización:** 12 de enero de 2026  
**Estado:** Ambos sistemas operativos en paralelo
