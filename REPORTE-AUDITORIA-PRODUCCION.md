# REPORTE AUDITORÍA PRODUCCIÓN - BACO TEATRO
**Fecha:** 2025-12-30  
**Auditor:** Arquitecto Frontend/Backend Senior  
**Estatus:** 🟡 CRÍTICAS IDENTIFICADAS - REQUIERE ACCIÓN ANTES DE PRODUCCIÓN

---

## 📊 RESUMEN EJECUTIVO

| Sección | Estado | Críticas | Alerta |
|---------|--------|----------|--------|
| 1. IDENTIDAD INSTITUCIONAL | ✅ OK | 0 | - |
| 2. ROLES Y PERMISOS | ✅ OK | 0 | - |
| 3. NAVEGACIÓN FRONTEND | ✅ OK | 0 | - |
| 4. FLUJO TEATRAL | ✅ OK | 0 | - |
| 5. VENTAS Y DINERO | 🔄 INCOMPLETO | 2 | Liquidación sin testing E2E |
| 6. LIQUIDACIÓN/CIERRE | 🟡 VALIDAR | 1 | `cerrarGrupoDefinitivo` sin test |
| 7. SEGURIDAD | 🟡 PARCIAL | 3 | JWT_SECRET, CORS, Error Handling |
| 8. BASE DE DATOS | 🟡 PENDIENTE | 2 | Integridad FK, Orphaned data |
| 9. CONFIG PRODUCCIÓN | 🔴 CRÍTICA | 2 | NODE_ENV, JWT_SECRET públicos |
| 10. DEPLOY | 🟡 VALIDAR | 1 | Domain + SSL no confirmados |
| 11. PRUEBAS FINALES | 🟡 PENDIENTE | 3 | E2E ACTOR, DIRECTOR, liquidación |
| 12. DOCUMENTACIÓN | 🟡 PENDIENTE | 1 | README actualizado con env vars |

**Bloqueadores de Producción:** 3  
**Advertencias:** 6  
**Total Issues:** 14

---

## ✅ VALIDADAS Y CORRECTAS

### 1. IDENTIDAD INSTITUCIONAL
- [x] Descripción BACO Teatro actualizada (sobre-baco.html)
- [x] Email: `bacoteatro@montevideo.com.uy` en 6 páginas
- [x] Información de directores (Bouzas, Nieves)
- [x] Historial La Candela
- [x] Sin cambios de diseño CSS/layout ✓

### 2. ROLES Y PERMISOS
- [x] Roles definidos: SUPER, ADMIN, ACTOR, INVITADO
- [x] Middleware `authenticate` aplicado en todas las rutas privadas
- [x] Middleware `requireRole` protege endpoints según rol
- [x] Rutas públicas: `/api/funciones/publicas`, `/public/funciones`, `/public/funciones/:id/vendedores`
- [x] Rutas privadas:
  - `/api/grupos/*` → SUPER, ADMIN
  - `/api/tickets/*` → ACTOR (venta), SUPER/ADMIN (cobro)
  - `/api/reportes/*` → SUPER, ADMIN
  - `/api/obras/*` → SUPER, ADMIN

### 3. NAVEGACIÓN FRONTEND
- [x] 28 HTML consolidados
- [x] Login route unificado: `/pages/auth/login.html` en 12 archivos
- [x] Eliminadas rutas redundantes:
  - `actor.html` → alias a `/pages/dashboards/actor.html`
  - `director.html` → alias a `/pages/dashboards/director.html`
  - `proximas-funciones.html` → alias a `funciones.html`
  - `pages/admin/grupos.html` → link a `../grupos/listar-grupos.html`
  - `pages/admin/grupo-detalle.html` → link a `../grupos/ver-grupo.html`

### 4. FLUJO TEATRAL
**Cadena completa validada:**
```
ACTOR crea GRUPO → asigna DIRECTORes
DIRECTOR crea OBRA en GRUPO → define FUNCIONES
INVITADO ve FUNCIONES públicas
ACTOR recibe TICKETS STOCK → asigna a VENDEDORES
VENDEDOR vende TICKETs (STOCK_VENDEDOR) → REPORTA_VENTA
SUPER/ADMIN aprueban PAGO → PAGADO
INVITADO valida TICKET en puerta (QR) → USADO
DIRECTOR cierra GRUPO → LIQUIDACIÓN_FINAL
```

**Funciones identificadas:**
- `crearGrupo`, `finalizarGrupo`, `cerrarGrupoDefinitivo` ✓
- `crearObra`, `listarObras`, `actualizarObra` ✓
- `crearFuncion`, `actualizarFuncion`, `listarFunciones` ✓
- `asignarTickets`, `reportarVenta`, `cobrarTicket`, `anularTicket` ✓
- `validarTicket`, `transferirTicket` ✓

---

## 🟡 CRÍTICAS IDENTIFICADAS

### 7. SEGURIDAD 🔴 CRÍTICA

#### ⚠️ ISSUE #1: JWT_SECRET Hardcodeado
- **Ubicación:** `.env.example:12`
- **Valor actual:** `JWT_SECRET=teatro-baco-secret-2024`
- **Severidad:** CRÍTICA
- **Riesgo:** Secreto expuesto en repositorio público → Anyone puede falsificar JWTs
- **Solución:**
  ```bash
  # .env.example
  JWT_SECRET=<CAMBIAR_EN_PRODUCCION_-_Mínimo_32_caracteres>
  
  # En Render/producción:
  JWT_SECRET=<generar_aleatorio_32_chars>
  ```
- **Action Required:** ✅ Antes de ANY deploy público
- **Status:** 🔴 BLOQUEADOR

#### ⚠️ ISSUE #2: CORS No Configurado para Producción
- **Ubicación:** `index-v3-postgres.js:31` → `app.use(cors())`
- **Problema:** `cors()` sin configuración = ACEPTA TODO origen
- **Severidad:** ALTA
- **Solución:**
  ```javascript
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));
  ```
- **Status:** 🟡 REQUERIDO ANTES DE PRODUCCIÓN

#### ⚠️ ISSUE #3: Error Handling - Stack Traces Expuestos
- **Ubicación:** Múltiples controllers (tickets, grupos, reportes, etc.)
- **Problema:** `console.error(error)` registra stacks internos; en producción no deben exponerse al cliente
- **Severidad:** MEDIA
- **Solución:**
  ```javascript
  // Producción:
  console.error('Internal error:', error.message); // Log interno, no stack
  res.status(500).json({ error: 'Internal server error' }); // Response genérico
  ```
- **Status:** 🟡 RECOMENDADO

---

### 8. BASE DE DATOS 🟡 PENDIENTE

#### ⚠️ ISSUE #4: Validar Integridad de FK
- **Queries a ejecutar:**
  ```sql
  -- Orphaned tickets (FK broken)
  SELECT COUNT(*) FROM tickets WHERE funcion_id NOT IN (SELECT id FROM funciones);
  
  -- Orphaned obras (FK broken)
  SELECT COUNT(*) FROM obras WHERE grupo_id NOT IN (SELECT id FROM grupos);
  
  -- Orphaned funciones (FK broken)
  SELECT COUNT(*) FROM funciones WHERE obra_id NOT IN (SELECT id FROM obras);
  
  -- Orphaned grupo_miembros (FK broken)
  SELECT COUNT(*) FROM grupo_miembros WHERE grupo_id NOT IN (SELECT id FROM grupos);
  
  -- Tickets con vendedor_phone que no existe en users
  SELECT COUNT(*) FROM tickets t 
  WHERE t.vendedor_phone IS NOT NULL 
  AND t.vendedor_phone NOT IN (SELECT phone FROM users WHERE phone IS NOT NULL);
  ```
- **Expected Result:** Todos retornen 0
- **Status:** 🔄 PENDIENTE (requiere DB live)

#### ⚠️ ISSUE #5: Migraciones Aplicadas
- **Última migración:** `007-ticket-auditoria-anulacion.sql`
- **Tablas creadas:** `ticket_movimientos` (auditoría)
- **Campos añadidos:** `anulado_motivo`, `anulado_at` en tickets
- **Estados válidos:** `DISPONIBLE, STOCK_ACTOR, STOCK_VENDEDOR, RESERVADO, REPORTADA_VENDIDA, PAGADO, USADO, ANULADO`
- **Status:** ✅ VERIFICADA
- **Action:** Ejecutar `npm run db:migrate-phone-fk` antes de iniciar

---

### 9. CONFIG PRODUCCIÓN 🔴 CRÍTICA

#### ⚠️ ISSUE #6: NODE_ENV No Configurado
- **Ubicación:** `.env.example:17`
- **Valor actual:** `NODE_ENV=development`
- **Problema en Producción:**
  - Cache deshabilitado (línea 40-45): pierde performance
  - Logs sin compresión
  - Error handling verbose
- **Solución:**
  ```
  # .env.example
  NODE_ENV=production
  
  # En desarrollo local:
  NODE_ENV=development
  ```
- **Status:** 🟡 REQUERIDO PARA DEPLOY

#### ⚠️ ISSUE #7: DATABASE_URL Sin Validación
- **Ubicación:** `index-v3-postgres.js:55-58`
- **Problema:** Valida que exista pero no que sea válida (podría ser con typo)
- **Solución:**
  ```javascript
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL inválida (debe ser postgres://...)');
  }
  ```
- **Status:** 🟡 RECOMENDADO

---

### 5. VENTAS Y DINERO 🔄 INCOMPLETO

#### ⚠️ ISSUE #8: Flujo Venta Sin Testing E2E
- **Cadena:** ACTOR asigna STOCK → VENDEDOR reporta venta → ADMIN aprueba pago
- **Controllers:** `asignarTickets`, `reportarVenta`, `cobrarTicket` definidos
- **Validaciones:** Precios unitarios (`precio_base`) en funciones, no en tickets individuales
- **Falta:** Test que valide:
  1. ACTOR tiene TICKETS STOCK_ACTOR
  2. VENDEDOR transfiere STOCK_VENDEDOR
  3. VENDEDOR reporta VENTA (con `comprador_nombre`, `precio`, `medio_pago`)
  4. SUPER/ADMIN aprueba (PAGADO)
  5. PDF liquidación incluye totales cobrados
- **Status:** 🟡 REQUERIDO ANTES DE PRODUCCIÓN

---

### 6. LIQUIDACIÓN/CIERRE 🟡 VALIDAR

#### ⚠️ ISSUE #9: Cierre Definitivo Sin Reversión
- **Función:** `cerrarGrupoDefinitivo` en `grupos.controller.js`
- **Comportamiento:** Cambia `estado` a `FINALIZADO` (irreversible)
- **Falta:** 
  - Validación que todos los TICKETS sean PAGADO/USADO/ANULADO (no hay REPORTADA_VENDIDA)
  - PDF liquidación debe contener:
    - Total entradas = COUNT(PAGADO + USADO)
    - Total dinero = SUM(precio) de PAGADO
    - Desglose por vendedor
    - Fecha/hora cierre + firma digital (opcional)
- **Test needed:**
  ```javascript
  // Intentar cerrar con TICKETS en estado REPORTADA_VENDIDA → debe fallar
  // Cerrar exitosamente → generar PDF
  // Intentar cerrar de nuevo → debe fallar (ya FINALIZADO)
  ```
- **Status:** 🟡 REQUERIDO VALIDATION

---

### 10. DEPLOY 🟡 VALIDAR

#### ⚠️ ISSUE #10: Domain + SSL No Confirmados
- **Frontend:** ¿Netlify? ¿Vercel? ¿Custom domain?
- **Backend:** ¿Render? ¿Railway? URL pública?
- **SSL:** ¿HTTPS configurado?
- **Status:** 🟡 PENDIENTE DE CONFIRMACIÓN

---

### 11. PRUEBAS FINALES 🟡 PENDIENTE

#### ⚠️ ISSUE #11: E2E Tests Incompletos
- **Tests existentes:**
  - `tests/test-super-usuario.js` ✓
  - `tests/test-director.js` ✓
  - `tests/test-vendedores.js` ✓
  - `tests/test-invitados.js` ✓
- **Falta:**
  1. **ACTOR completo:** Crear grupo → asignar STOCK → transferir STOCK → reportar venta
  2. **Liquidación real:** Cierre grupo → generar PDF → validar totales
  3. **Casos de error:** Intentar cerrar con STOCK_VENDEDOR, intentar validar TICKET PAGADO dos veces, etc.
- **Status:** 🟡 REQUERIDO

#### ⚠️ ISSUE #12: Performance Testing
- **No validado:**
  - Tiempo promedio de queries (especialmente liquidación con muchos tickets)
  - Manejo de concurrencia (múltiples vendedores reportando en paralelo)
  - Validación de tickets (escaneo QR masivo en función concurrida)
- **Status:** 🟡 RECOMENDADO

---

### 12. DOCUMENTACIÓN 🟡 PENDIENTE

#### ⚠️ ISSUE #13: README No Actualizado
- **Falta:**
  1. Guía de **environment variables** (todas las requeridas)
  2. **Deploy steps** (Render backend, Netlify frontend, custom domain)
  3. **Database setup** (cómo crear BD, migraciones, seed)
  4. **Testing** (cómo ejecutar tests, casos principales)
  5. **Roles y permisos** (tabla clara de qué cada rol puede hacer)
  6. **Troubleshooting** (JWT inválido, DB no conecta, etc.)
- **Archivo:** `/workspaces/Entradas_de_teatro/teatro-tickets-backend/README.md`
- **Status:** 🟡 REQUERIDO

#### ⚠️ ISSUE #14: Guía de Deployment
- **Falta:** Archivo `DEPLOYMENT_GUIDE.md` con steps exactos:
  1. Crear BD PostgreSQL en host
  2. Exportar vars en .env
  3. `npm run db:init` o `npm run db:migrate-phone-fk`
  4. `npm start` o deploy en Render
- **Status:** 🟡 RECOMENDADO

---

## 📋 PLAN DE REMEDIACIÓN

### 🔴 BLOQUEADORES (Hacer Primero)
1. [ ] **ISSUE #1:** Cambiar `JWT_SECRET` a valor generado (no hardcodeado)
2. [ ] **ISSUE #6:** Configurar `NODE_ENV=production` en .env de producción
3. [ ] **ISSUE #2:** Configurar CORS con `FRONTEND_URL`

### 🟡 CRÍTICO ANTES DE DEPLOY (Hacer Segundo)
4. [ ] **ISSUE #8:** Crear test E2E completo: ACTOR → venta → cobro → liquidación
5. [ ] **ISSUE #9:** Validar `cerrarGrupoDefinitivo` no permite estado inconsistente
6. [ ] **ISSUE #4:** Ejecutar queries FK en BD de staging, verificar todas = 0
7. [ ] **ISSUE #10:** Confirmar dominio + SSL antes de go-live

### 🟡 ANTES DE ENTREGA (Hacer Tercero)
8. [ ] **ISSUE #13:** Escribir README completo con env vars y deploy steps
9. [ ] **ISSUE #3:** Configurar error handling para producción (sin stack traces)
10. [ ] **ISSUE #5:** Documentar migraciones en MIGRATION_LOG.md
11. [ ] **ISSUE #14:** Crear DEPLOYMENT_GUIDE.md

---

## ✅ CHECKLIST FINAL PRODUCCIÓN

```bash
[ ] 1. JWT_SECRET actualizado (32+ chars, aleatorio)
[ ] 2. NODE_ENV=production en .env
[ ] 3. CORS configurado para FRONTEND_URL específica
[ ] 4. DATABASE_URL válida (PostgreSQL 15+)
[ ] 5. Port correcto en ENV
[ ] 6. Error handling sin stack traces
[ ] 7. Tests E2E pasan (ACTOR, DIRECTOR, venta, liquidación)
[ ] 8. Migraciones ejecutadas (007-ticket-auditoria-anulacion.sql)
[ ] 9. BD integridad validada (0 orphaned FKs)
[ ] 10. Dominio + SSL confirmados
[ ] 11. README con env vars y deploy steps
[ ] 12. Logs configurados para syslog/CloudWatch
[ ] 13. Backup strategy definida
[ ] 14. Monitoring/alertas configuradas (opcional pero recomendado)
```

---

## 🎯 SIGUIENTE PASO

1. **Ahora:** Remediar BLOQUEADORES (#1, #6, #2)
2. **Después:** Ejecutar ISSUE #8 (E2E test venta completa)
3. **Luego:** Validar BD y desplegar a staging
4. **Final:** Crear README + deploy guide, go-live

**Estimado:** 4-6 horas para estar 🟢 PRODUCCIÓN LISTA

---

**Preparado por:** GitHub Copilot | Claude Haiku 4.5  
**Fecha:** 2025-12-30 12:00 UTC
