# 🤖 PASO 4 — PROMPT EXACTO PARA COPILOT

Copiá y pegá **tal cual** en Copilot Chat (Ctrl+Shift+I):

```
TAREA: Refactor del ticketsController siguiendo Clean Architecture

CONTEXTO:
Sistema Baco Teatro - gestión de entradas de teatro.
Hoy ticketsController hace demasiado (100+ líneas):
- Valida HTTP
- Valida máquina de estados (inline)
- Cambia estado en BD
- Registra auditoría
- Registra caja
Todo en 1 función.

OBJETIVO:
Separar responsabilidades usando Service Layer:
- Controllers = solo HTTP
- Services = lógica de negocio
- Constants = definiciones centrales
- Transacciones ACID en services

ESTRUCTURA NUEVA A CREAR:

1. constants/ticketStates.js
   - Definiciones inmutables: TICKET_STATES, TICKET_ORIGINS, ROLES
   
2. services/ticketStateMachine.js
   - Máquina de estados centralizada
   - Funciones: canTransition(from, to), getValidTransitions(from)
   - Evita transiciones inválidas

3. services/ticketAuditService.js
   - registrarMovimiento(ticketCode, estadoAnterior, estadoNuevo, realizadoPor, motivo)
   - obtenerMovimientos(ticketCode)

4. services/cajaService.js
   - registrarIngresoCaja(ticket, motivo)
   - obtenerMovimientosCaja(funcionId)

5. services/ticketService.js
   - changeTicketStatus(ticket, to, user, motivo)
     → Valida máquina de estados
     → Valida autorización por rol
     → BEGIN TRANSACTION
     → UPDATE tickets
     → Registra movimiento (via auditService)
     → Registra caja (via cajaService)
     → COMMIT o ROLLBACK
   - Importa: ticketStateMachine, ticketAuditService, cajaService

6. controllers/ticketsController.js (refactorizado)
   - updateTicketStatus(req, res)
     → Valida solo formato HTTP
     → Obtiene ticket
     → Delega TODO al ticketService.changeTicketStatus()
     → Responde HTTP
     → Máximo 50 líneas

REGLAS CLAVE:

- Controllers NO saben de máquina de estados
- Controllers NO tocan transacciones
- Services retornan valores, no res.json()
- Services lanzan Error() para problemas
- Transacciones ACID completas: BEGIN/COMMIT/ROLLBACK
- Si falla auditoría → ROLLBACK todo
- Si falla caja → ROLLBACK todo
- Constants en 1 lugar (constants/ticketStates.js)

DATABASE:
- Usar: query() function (ya existe en db.js)
- Tablas: tickets, movimientos, caja
- Transacciones: BEGIN, COMMIT, ROLLBACK

AUTORIZACIÓN POR ROL (hardcodeado hoy):
- Para cambiar a PAGADO: SUPER, ADMIN, DIRECTOR
- Para cambiar a USADO: SUPER, ADMIN
- Para ANULAR: SUPER, ADMIN

MANEJO DE ERRORES:
- Transición inválida → Error('Transición no permitida...')
- No autorizado → Error('No autorizado para...')
- BD error → dejar que se lance el error (ROLLBACK automático)
- Controller captura error → 400 o 403 según tipo

RESPUESTA HTTP:
- 200: { success: true, message: 'Ticket actualizado a PAGADO' }
- 400: { error: 'Transición no permitida...' }
- 403: { error: 'No autorizado...' }
- 404: { error: 'Ticket no encontrado' }

EJEMPLOS DE USO (en controller):

// Antes (❌):
await updateTicketStatus(req, res);

// Después (✅):
const result = await changeTicketStatus({
  ticket,
  to: 'PAGADO',
  user: req.user,
  motivo: 'Pago recibido'
});
res.json({ success: true });

TESTS QUE DEBEN PASAR:

1. Unit: ticketStateMachine
   ✓ canTransition válida
   ✓ canTransition inválida
   ✓ getValidTransitions retorna array

2. Unit: ticketService.changeTicketStatus
   ✓ cambiar estado válido
   ✓ rechazar transición inválida
   ✓ rechazar no autorizado
   ✓ registra auditoría
   ✓ registra caja
   ✓ ROLLBACK si auditoría falla

3. Integration: POST /tickets/:code/status
   ✓ cambiar estado 200
   ✓ transición inválida 400
   ✓ no autorizado 403
   ✓ ticket no existe 404

BACKWARD COMPATIBILITY:
- ✓ BD schema NO cambia
- ✓ Routes NO cambian
- ✓ Response format compatible
- ✓ Tests antiguos deben pasar

DELIVERABLES:
1. constants/ticketStates.js
2. services/ticketStateMachine.js
3. services/ticketAuditService.js
4. services/cajaService.js
5. services/ticketService.js (el grande)
6. controllers/ticketsController.js (refactorizado)

Responde con:
- Código para cada archivo (bloque de código)
- Explicación de cambios clave
- Cómo actualizar las rutas (si es necesario)
- Comandos para testear
```

---

## Cómo Usarlo

### Opción 1: EN VS CODE (Recomendado)

```bash
1. Abre VS Code
2. Ctrl+Shift+I → Abre Copilot Chat
3. Pega el PROMPT COMPLETO (desde "TAREA:" hasta "Comandos para testear")
4. Espera respuesta
5. Copilot generará 6 archivos con código listo
```

### Opción 2: En GitHub (si prefieres UI web)

```bash
1. Ve a https://github.com/copilot/chat
2. Pega el prompt
3. Copilot responde
4. Copia el código
5. Pégalo en archivos locales
```

### Opción 3: En Codespaces (tu workspace actual)

```bash
1. En VS Code (Codespaces)
2. Ctrl+Shift+I
3. Pega prompt
4. Los archivos generados cópialo a:
   - teatro-tickets-backend/constants/ticketStates.js
   - teatro-tickets-backend/services/ticketStateMachine.js
   - etc.
```

---

## Qué Esperar

### Copilot te dirá:

**Archivo 1: constants/ticketStates.js**
```javascript
export const TICKET_STATES = {
  DISPONIBLE: 'DISPONIBLE',
  // ...
};
```

**Archivo 2: services/ticketStateMachine.js**
```javascript
export function canTransition(from, to) {
  // ...
}
```

**Archivo 3-6: Todos los services y controller**

Verás código estructurado y claro.

---

## Validación Post-Copilot

Después que Copilot genere el código, haz esto:

### 1️⃣ Verifica archivos creados

```bash
ls -la teatro-tickets-backend/constants/
ls -la teatro-tickets-backend/services/
ls -la teatro-tickets-backend/controllers/ticketsController.js
```

### 2️⃣ Verifica sintaxis

```bash
cd teatro-tickets-backend
node -c constants/ticketStates.js
node -c services/ticketStateMachine.js
node -c services/ticketService.js
```

### 3️⃣ Corre tests (si existen)

```bash
npm test -- ticketService
npm test -- ticketsController
```

### 4️⃣ Prueba endpoint

```bash
# Cambiar ticket a PAGADO
curl -X PATCH http://localhost:3000/tickets/ABC123/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"to":"PAGADO","motivo":"Test"}'
```

### 5️⃣ Verifica BD

```bash
# Conectarse a Postgres
psql -U postgres -d teatro -c "SELECT * FROM tickets LIMIT 1;"
psql -U postgres -d teatro -c "SELECT * FROM movimientos LIMIT 5;"
psql -U postgres -d teatro -c "SELECT * FROM caja LIMIT 5;"
```

---

## Debugging (si Copilot falla)

### Problema 1: "No sé qué import usar"

**Solución:** Agrégale al prompt:

```
IMPORTS QUE EXISTEN:
- query() desde '../db.js'
- middleware auth en '../middleware/auth.js'
- models en '../models/' (si existen)
```

### Problema 2: "No entiendo la estructura de BD"

**Solución:** Agrégale al prompt:

```
ESTRUCTURA BD:
- tickets: code, estado, funcion_id, precio, creado_en, actualizado_en
- movimientos: ticket_code, estado_anterior, estado_nuevo, realizado_por, motivo, creado_en
- caja: funcion_id, tipo_ingreso, monto, concepto, fecha
```

### Problema 3: "El código generado tiene errores"

**Solución:** 
1. Copia el error
2. Pregunta a Copilot: "Este error: [pegar error] ¿cómo lo arreglo?"
3. Copilot lo corrige

---

## Plan A→B→C Si Algo Falla

### PLAN A: Copilot genera perfecto

```
✅ Copia archivos
✅ npm test
✅ npm run dev
✅ Prueba endpoint
✅ git commit
✅ git push
```

### PLAN B: Copilot falla en parte

```
❌ Copilot no entiende
→ Dale más contexto:
  - Pega la función actual (ticketsController.updateTicketStatus)
  - Pega la estructura de BD (CREATE TABLE tickets...)
  - Repite prompt con ese contexto
```

### PLAN C: Necesitas ayuda

```
Si Copilot genera código pero:
- No compila
- Los tests fallan
- La lógica es incorrecta

→ Pregunta a Copilot: "El código que generaste está roto, arréglalo"
→ Copilot itera
```

---

## Checklist Pre-Commit

Antes de hacer commit, verifica esto:

- [ ] Controllers < 50 líneas
- [ ] Services no importan Express
- [ ] Máquina de estados existe en 1 archivo
- [ ] Transacciones tienen COMMIT/ROLLBACK
- [ ] Tests pasan
- [ ] No hay duplicación de lógica
- [ ] Constants centralizados
- [ ] Backward compatibility ✓
- [ ] Errores son claros
- [ ] Auditoría se registra

---

## Git Commit Pattern

```bash
git add teatro-tickets-backend/constants/
git add teatro-tickets-backend/services/ticketStateMachine.js
git add teatro-tickets-backend/services/ticketService.js
git add teatro-tickets-backend/services/ticketAuditService.js
git add teatro-tickets-backend/services/cajaService.js
git add teatro-tickets-backend/controllers/ticketsController.js

git commit -m "🧠 PASO 4: Refactor arquitectura ticketsController

- Service Layer: separación de responsabilidades
- ticketStateMachine: máquina de estados centralizada
- ticketService: toda lógica de negocio en 1 lugar
- ticketAuditService: auditoría independiente
- cajaService: contabilidad independiente
- Controllers: solo HTTP, < 50 líneas

Beneficios:
- Testeable sin BD
- DRY: máquina de estados en 1 archivo
- Transacciones ACID completas
- Escalable: agregar estados es trivial
- Backward compatible 100%"

git push origin main
```

---

## Próximos Pasos Después

1. ✅ Copilot genera código
2. ✅ Tests pasan
3. ⏳ Refactor de `publicSalesController` (si queda tiempo)
4. ⏳ Refactor de `actorSalesController` (siguiente sesión)
5. ⏳ Documentar en README.md

---

## 🎯 RESUMEN

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Copia prompt | Prompt en clipboard |
| 2 | Pega en Copilot | Chat abierto |
| 3 | Enter | Copilot genera código |
| 4 | Copia archivos | 6 archivos creados |
| 5 | Tests | npm test ✅ |
| 6 | Commit | git push |
| 7 | Deploy | Producción actualizada |

---

**RECUERDA:**

Este prompt es **exacto y ejecutable**.

Si Copilot no genera bien → dale más contexto (pega la función actual).

Si generó bien → es porque **tu prompt fue claro**.

Vamos.

---

**Última actualización:** 2026-01-11  
**Versión:** 1.0  
**Estado:** Listo para ejecutar en Copilot
