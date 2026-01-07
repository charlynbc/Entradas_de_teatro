# REPORTE DE CUMPLIMIENTO vs PROMPT (BACO TEATRO)

Fecha: 30/12/2025

Este reporte verifica el sistema actual contra el contenido de `PROMPT.md` / `documentacion/PROMPT-MAESTRO.md`.

Convenciones:
- **OK**: cumple tal cual.
- **OK (compatibilidad)**: cumple el objetivo, pero la implementación usa alias/estados extra para no romper legacy.
- **GAP**: no coincide con el texto del prompt o falta cobertura.

---

## 1) Frontend intacto

- **OK**: no se modificó el frontend.
  - Evidencia práctica: no hay cambios bajo `baco-teatro-app/` en `git status`.

---

## 2) Regla absoluta: “solo entra PAGADO”

- **OK (crítico)**: el endpoint de scanner valida estrictamente `PAGADO`.
  - Archivo: `teatro-tickets-backend/controllers/tickets.controller.js`
  - Comportamiento:
    - Rechaza si el ticket no está en `PAGADO`.
    - Rechaza si el ticket está `USADO`.
    - Actualiza de forma **atómica** a `USADO` con `WHERE estado='PAGADO'` para evitar doble escaneo.

---

## 3) Seguridad / Auth / Roles

### 3.1 JWT “obligatorio”

- **OK (compatibilidad)**: el scanner no permite validar sin JWT válido, pero la ruta usa auth opcional para poder devolver 401/403 “prolijos” sin romper flows.
  - Archivo: `teatro-tickets-backend/routes/tickets.routes.js`
  - Nota: aunque `optionalAuthenticate` permite requests sin token, la validación corta con 401 si `req.user` no existe.

### 3.2 Roles “inmutables” (prompt) vs roles reales

- **OK (compatibilidad)**: el sistema usa roles canónicos `SUPER | ADMIN | ACTOR | INVITADO`.
- **GAP (texto del prompt)**: el prompt usa `VENDEDOR`, pero el backend canónico es `ACTOR`.
  - Mitigación: se normaliza `VENDEDOR -> ACTOR` y `SUPREMO -> SUPER`.
  - Archivo: `teatro-tickets-backend/services/users.service.js`

### 3.3 Scanner y permisos

- **OK**: solo `SUPER/ADMIN` pueden validar tickets.
- **OK**: `ADMIN` solo puede validar tickets de sus grupos.
  - Archivo: `teatro-tickets-backend/controllers/tickets.controller.js`

---

## 4) Estados de tickets

### 4.1 Estados “inmutables” del prompt

Prompt declara:
`DISPONIBLE, RESERVADO, VENDIDO, PAGADO, USADO, ANULADO`.

### 4.2 Estados reales soportados

- **OK (compatibilidad)**: el sistema soporta estados intermedios para el flujo real sin romper datos:
  - `STOCK_ACTOR` (stock del actor)
  - `REPORTADA_VENDIDA` (vendida reportada, aún no cobrada/aprobada)
  - `VENDIDO` (presente como alias soportado)
  - Archivo: `teatro-tickets-backend/schema.sql`

### 4.3 Regla crítica del prompt

- **OK**: el scanner acepta solo `PAGADO` (independientemente de estados intermedios).
  - Archivo: `teatro-tickets-backend/controllers/tickets.controller.js`

---

## 5) Backend / Endpoints / Compatibilidad

- **OK (compatibilidad)**: existen aliases para no romper frontends/tests legacy.
  - Ejemplos:
    - `GET /api/shows` como alias de funciones.
    - `/api/funciones/public` como alias adicional.
  - Archivos:
    - `teatro-tickets-backend/index-v3-postgres.js`
    - `teatro-tickets-backend/routes/funciones.routes.js`

---

## 6) SQL / Constraints / Auditoría

- **OK (compatibilidad)**: constraint de `tickets.estado` admite estados intermedios y `ANULADO`.
  - Archivo: `teatro-tickets-backend/schema.sql`

- **OK**: auditoría “best-effort” en tabla `ticket_movimientos` (si existe) para asignación/venta/pago/validación/anulación.
  - Archivo: `teatro-tickets-backend/controllers/tickets.controller.js`

---

## 7) Anulación con motivo

- **OK**: existe endpoint y requiere `motivo`.
- **OK**: no permite anular `USADO`.
- **OK**: `ADMIN` restringido por grupo.
  - Archivo: `teatro-tickets-backend/controllers/tickets.controller.js`

---

## 8) Resumen ejecutivo

- **Cumple lo central**: nadie puede entrar si el ticket no está `PAGADO`.
- **Cumple sin tocar frontend**: todos los cambios observados son backend/SQL/docs.
- **Diferencias vs prompt**: roles y estados se manejan con compatibilidad (`ACTOR` vs `VENDEDOR`, `STOCK_ACTOR/REPORTADA_VENDIDA`).

---

## 9) Recomendación (para alinear “texto” vs “realidad”)

Elegir una de estas estrategias:

1) **Actualizar el prompt (recomendado, menor riesgo)**
   - Declarar explícitamente: `VENDEDOR` es alias de `ACTOR`.
   - Declarar explícitamente estados intermedios permitidos por compatibilidad (`STOCK_ACTOR`, `REPORTADA_VENDIDA`).
   - Mantener la regla: “scanner solo `PAGADO`”.

2) **Forzar cumplimiento literal del prompt (más riesgoso)**
   - Implica migrar/normalizar estados intermedios a los “inmutables” sin romper datos ni pantallas legacy.
   - Requiere plan de migración y backfill (no recomendado sin ventana de QA y sin conocer todos los consumidores).
