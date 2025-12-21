# 🎭 Arquitectura del Sistema Baco Teatro - Actualizada

**Fecha:** 21 de diciembre de 2025  
**Versión:** 2.0 (Refactorización VENDEDOR → ACTOR)

---

## 📐 Modelo Conceptual

### Roles del Sistema

1. **SUPER** - Usuario supremo con acceso completo
2. **ADMIN** - Director de teatro/grupo
3. **ACTOR** - Actor/Actriz que vende entradas (antes VENDEDOR)
4. **INVITADO** - Usuario con acceso limitado

### Jerarquía de Entidades

```
SUPER/ADMIN (Director)
    ↓ crea
GRUPO
    ↓ tiene
    ├── ACTORES (miembros del grupo)
    ├── HORARIO (día semanal + hora, ej: "Miércoles 21:00")
    ├── FECHA_INICIO / FECHA_FIN
    └── OBRA (por defecto "Baco", editable)
        ↓ genera
        FUNCIONES (shows)
            ↓ tiene
            ENTRADAS (tickets)
```

---

## 🎯 Flujo Principal

### 1. Creación de Grupo (por ADMIN/SUPER)

```javascript
{
  nombre: "Grupo Baco Primavera 2025",
  descripcion: "Grupo de teatro experimental",
  director_cedula: "48376669",
  dia_semana: "Miércoles",
  hora_inicio: "21:00",
  fecha_inicio: "2025-01-15",
  fecha_fin: "2025-06-15",
  estado: "ACTIVO"
}
```

**Lógica:**
- Al llegar `fecha_fin`, el grupo pasa automáticamente a `FINALIZADO`
- Los grupos finalizados no permiten agregar funciones nuevas

### 2. Obra por Defecto

Cada grupo al crearse obtiene automáticamente la obra **"Baco"**:

```javascript
{
  grupo_id: 1,
  nombre: "Baco",
  descripcion: "Obra por defecto - Editable por el director",
  autor: "Por definir",
  genero: "Drama",
  duracion_aprox: 120,
  estado: "LISTA"
}
```

**El director puede:**
- Editar nombre, descripción, autor, género
- Cambiar la obra asignada al grupo
- Mantener "Baco" o personalizarla

### 3. Agregar Actores/Actrices al Grupo

El director agrega miembros (rol ACTOR) al grupo:

```javascript
// Tabla: grupo_miembros
{
  grupo_id: 1,
  miembro_cedula: "22222222",  // Referencia a users con role='ACTOR'
  fecha_ingreso: "2025-01-15"
}
```

**Lógica:**
- Solo usuarios con `role='ACTOR'` pueden ser agregados
- Un actor puede estar en múltiples grupos
- Tabla de unión: `grupo_miembros`

### 4. Ensayos (por el Director)

```javascript
{
  grupo_id: 1,
  obra_id: 1,
  fecha_hora: "2025-02-10 21:00",
  duracion_minutos: 180,
  lugar: "Teatro Central",
  notas: "Ensayo general acto 1 y 2"
}
```

### 5. Funciones (Shows)

El director crea funciones que **aparecen en la pantalla de inicio de Baco**:

```javascript
{
  obra_id: 1,
  nombre: "Baco - Estreno",
  fecha_hora: "2025-03-01 20:00",
  direccion: "Teatro Municipal",
  precio: 500,
  cupos_totales: 100,
  cupos_disponibles: 100,
  estado: "activa"
}
```

**En la app:**
- La pantalla de inicio muestra todas las funciones activas
- Cualquier usuario puede ver las funciones
- Solo ADMIN/ACTOR pueden acceder a la gestión de entradas

### 6. Distribución de Entradas

El director distribuye entradas (tickets) a los actores:

```javascript
// POST /api/shows/:id/asignar
{
  actor_cedula: "22222222",
  cantidad: 10
}
```

**Resultado:**
```javascript
{
  show_id: 1,
  cedula_invitado: "temp_001",
  nombre_invitado: "Por asignar",
  whatsapp_invitado: "Por asignar",
  actor_phone: "099222222",  // antes: vendedor_phone
  estado: "STOCK_ACTOR",     // antes: STOCK_VENDEDOR
  monto_recaudado: 0
}
```

### 7. Control de Funciones

El director puede ver reportes:

#### Por función individual:
```
GET /api/reportes/shows/:id/resumen-por-actor
```

#### Por todas las funciones del grupo:
```
GET /api/reportes/grupos/:grupoId/resumen-general
```

Respuesta incluye:
- Total de entradas por actor
- Recaudación por actor
- Estado de pagos
- Deudores

---

## 🗄️ Cambios en Base de Datos

### Tabla `users`

```sql
ALTER TABLE users 
  DROP CONSTRAINT users_role_check;

UPDATE users 
  SET role = 'ACTOR' 
  WHERE role = 'VENDEDOR';

ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'INVITADO'));
```

### Tabla `tickets`

**Columnas afectadas:**
- `vendedor_phone` → permanece igual (FK a `users.phone`)
- Estados:
  - `STOCK_VENDEDOR` → `STOCK_ACTOR`
  - Los demás estados permanecen iguales

**Nota:** La columna `vendedor_phone` se mantiene por compatibilidad con FK existente, pero semánticamente representa `actor_phone`.

---

## 📱 Pantalla de Inicio (App Baco)

### Vista para Todos los Usuarios

```
┌─────────────────────────────────────┐
│  🎭 Baco Teatro                     │
│                                     │
│  📅 Funciones Próximas              │
│  ────────────────────────────       │
│  ┌───────────────────────────┐     │
│  │ Baco - Estreno            │     │
│  │ 📍 Teatro Municipal        │     │
│  │ 📅 Vie 1 Mar, 20:00       │     │
│  │ 💰 $500 - 45 cupos        │     │
│  └───────────────────────────┘     │
│  ┌───────────────────────────┐     │
│  │ Baco - Función Especial   │     │
│  │ 📍 Sala Experimental       │     │
│  │ 📅 Sáb 2 Mar, 19:00       │     │
│  │ 💰 $600 - 30 cupos        │     │
│  └───────────────────────────┘     │
└─────────────────────────────────────┘
```

**Lógica:**
- Muestra todas las `shows` con `estado = 'activa'`
- Ordenadas por `fecha_hora` ascendente
- Endpoint: `GET /api/shows/publicas`

---

## 🔄 Estados de Entradas (Tickets)

```
DISPONIBLE
    ↓ (director asigna a actor)
STOCK_ACTOR
    ↓ (actor reserva para invitado)
RESERVADO
    ↓ (actor confirma venta)
REPORTADA_VENDIDA
    ↓ (director confirma pago)
PAGADO
    ↓ (invitado ingresa al teatro)
USADA
```

**Estados especiales:**
- `CANCELADA` - Entrada cancelada
- `EXPIRADA` - Reserva no completada

---

## 📊 Reportes del Director

### 1. Dashboard General
```
GET /api/reportes/dashboard/director
```

Muestra:
- Total de funciones activas/pasadas
- Total de actores
- Recaudación total
- Entradas vendidas/pendientes

### 2. Resumen por Actor (Función Individual)
```
GET /api/reportes/shows/:showId/resumen-por-actor
```

Devuelve por cada actor:
- Stock asignado
- Entradas vendidas
- Monto recaudado
- Monto pagado al director
- Deuda pendiente

### 3. Resumen General del Grupo
```
GET /api/reportes/grupos/:grupoId/resumen-general
```

Consolida:
- Todas las funciones del grupo
- Totales por actor sumando todas las funciones
- Estado financiero global

---

## 🔐 Permisos por Rol

### SUPER
- ✅ Crear/Editar/Eliminar usuarios (todos los roles)
- ✅ Ver todos los grupos, obras, funciones
- ✅ Acceso a todos los reportes
- ✅ Gestión completa del sistema

### ADMIN (Director)
- ✅ Crear/Editar grupos (solo donde es director)
- ✅ Agregar/Remover actores de sus grupos
- ✅ Crear/Editar obras de sus grupos
- ✅ Crear/Editar ensayos
- ✅ Crear/Editar funciones
- ✅ Distribuir entradas a actores
- ✅ Ver reportes de sus funciones/grupos
- ❌ No puede ver datos de otros directores

### ACTOR
- ✅ Ver sus grupos asignados
- ✅ Ver entradas asignadas a él
- ✅ Reservar/Vender entradas de su stock
- ✅ Ver su historial de ventas
- ❌ No puede crear funciones
- ❌ No puede ver datos de otros actores

### INVITADO
- ✅ Ver funciones públicas
- ✅ Comprar entradas disponibles
- ✅ Ver sus compras
- ❌ Sin acceso a gestión

---

## 🚀 Cambios en el Código

### Backend - Archivos Afectados

1. **Base de Datos:**
   - `scripts/migracion-vendedor-a-actor.sql` ✅
   
2. **Controllers:**
   - `controllers/users.controller.js` - `listarVendedores()` → mantener compatible
   - `controllers/shows.controller.js` - `asignarEntradas()` - actualizar variable names
   - `controllers/reportes.controller.js` - `resumenPorVendedor()` → `resumenPorActor()`

3. **Services:**
   - `services/grupos.service.js` - mantener lógica, actualizar nombres

4. **Routes:**
   - `routes/users.routes.js` - agregar alias `/actores` → `/vendedores`
   - `routes/reportes.routes.js` - mantener `/resumen-por-vendedor` por compatibilidad

5. **Frontend (Expo App):**
   - Pantalla "Vendedores" → "Actores/Elenco"
   - Textos actualizados en toda la UI

---

## 📝 Notas de Migración

### Compatibilidad
- La columna `vendedor_phone` en `tickets` se mantiene (es una FK)
- Los endpoints mantienen nombres originales para no romper el frontend
- Se agregan alias nuevos gradualmente

### Testing Requerido
1. ✅ Migración de roles en BD
2. ⏳ Login con usuario ACTOR
3. ⏳ Crear grupo y asignar actores
4. ⏳ Distribuir entradas a actores
5. ⏳ Reportes por actor
6. ⏳ Funciones en pantalla de inicio

---

**Fin de la Documentación de Arquitectura v2.0**
