# GAPS: PROMPT vs SISTEMA REAL (compatibilidad)

Fecha: 30/12/2025

Este documento lista diferencias entre el texto del prompt y el comportamiento real del sistema, indicando el impacto y la recomendación.

---

## GAP 1: Roles (`VENDEDOR` vs `ACTOR`)

### Qué dice el prompt

- Rol inmutable: `VENDEDOR`.

### Qué hace el sistema

- Rol canónico en DB/JWT: `ACTOR`.
- Se acepta alias legacy:
  - `VENDEDOR` → `ACTOR`
  - `SUPREMO` → `SUPER`
  - Implementación: `teatro-tickets-backend/services/users.service.js`

### Impacto

- **Bajo**: es una diferencia nominal. Mantener alias evita romper frontends/tests/documentación.

### Recomendación

- **Actualizar el prompt**: declarar explícitamente que `VENDEDOR` es alias de `ACTOR`.

---

## GAP 2: Estados “inmutables” vs estados intermedios reales

### Qué dice el prompt

Estados inmutables:
`DISPONIBLE, RESERVADO, VENDIDO, PAGADO, USADO, ANULADO`.

### Qué hace el sistema

Estados reales soportados (además de los anteriores):
- `STOCK_ACTOR`: tickets asignados a un actor para vender.
- `REPORTADA_VENDIDA`: el actor reporta venta; todavía no está aprobado/cobrado por admin.

Fuente: `teatro-tickets-backend/schema.sql`

### Impacto

- **Medio**: estos estados sostienen el flujo de “control de caja” (dinero en mano del actor vs dinero en caja).

### Recomendación

- **Actualizar el prompt** para permitir explícitamente estados intermedios “de compatibilidad”, manteniendo la regla central:
  - “El scanner solo acepta `PAGADO`”.

---

## GAP 3: “JWT obligatorio” vs ruta con auth opcional

### Qué dice el prompt

- “JWT obligatorio”.

### Qué hace el sistema

- La ruta del scanner usa `optionalAuthenticate`, pero la acción de validar corta con 401/403 si no hay usuario o el rol no es `SUPER/ADMIN`.
  - Fuente: `teatro-tickets-backend/routes/tickets.routes.js` + `teatro-tickets-backend/controllers/tickets.controller.js`

### Impacto

- **Nulo en seguridad**: no se puede validar sin token.
- **Positivo en UX/compatibilidad**: permite respuestas consistentes sin romper consumers.

### Recomendación

- Mantener esta implementación y ajustar el prompt para decir: “JWT obligatorio para validar/operar acciones sensibles; algunas rutas pueden aceptar requests sin token solo para devolver errores controlados”.

---

## Propuesta de enmienda mínima al prompt (texto sugerido)

Copiar/pegar como bloque adicional en el prompt si querés alineación estricta “documento ↔ sistema”:

### Roles (compatibilidad)

- `VENDEDOR` es alias legacy de `ACTOR` (rol canónico en DB/JWT).
- `SUPREMO` es alias legacy de `SUPER`.

### Estados (compatibilidad)

- Estados intermedios permitidos por compatibilidad (sin cambiar la regla central):
  - `STOCK_ACTOR` (stock asignado)
  - `REPORTADA_VENDIDA` (venta reportada, pendiente de cobro/aprobación)

### Regla crítica (se mantiene)

- Scanner/puerta: **solo acepta `PAGADO`** y marca `USADO` de forma atómica.
