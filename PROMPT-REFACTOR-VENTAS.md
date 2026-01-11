# 🤖 PROMPT COPILOT - REFACTOR SISTEMA DE VENTAS

## 📌 Contexto Previo Completado

Se ha implementado:

✅ **Migraciones SQL** (`03-sistema-ventas-separadas.sql`)
- Campos: `funciones.tipo_funcion`, `funciones.permite_compra_online`
- Campos: `tickets.origen_venta`, `tickets.comprador_email`
- Tablas: `compras_publicas`, `tickets_cortesia`
- Vistas: `v_funciones_disponibles`, `v_ventas_por_origen`

✅ **Controller Público** (`publicSales.controller.js`)
- `comprarTicket()` - Compra directa de INVITADO
- `asignarCortesia()` - Cortesías por ADMIN
- `configurarCompraOnline()` - Habilitar/deshabilitar compra
- `obtenerDetallesCompra()` - Ver estado de compra

✅ **Rutas Públicas** (actualizadas `public.routes.js`)
- `POST /public/comprar-ticket` - Compra directa
- `POST /public/cortesia` - Asignar cortesía
- `PATCH /public/funciones/:id/configurar-compra` - Configurar

✅ **Documentación**
- `MODELO-MENTAL-VENTAS.md` - Modelo conceptual completo

---

## 🎯 PRÓXIMA FASE: REFACTOR DE RESPONSABILIDADES

### El Prompt Final para Copilot

Copia y ejecuta esto en tu sesión:

```text
# REFACTOR DE SISTEMA DE VENTAS - SEPARACIÓN DE RESPONSABILIDADES

## Estado Actual
Sistema Baco Teatro tiene 3 tipos de venta pero estaban mezcladas en ticketsController:
1. Venta por ACTOR (independiente) - necesita reporte + aprobación
2. Venta ONLINE (profesional) - directa, sin intermediario
3. Venta CORTESÍA (admin) - especial, auditada

## Cambios Completados
- ✅ Migraciones SQL: tipos de función, origen de venta
- ✅ Controller publicSales.js: compra, cortesía, configuración
- ✅ Rutas públicas: endpoints de compra y cortesía
- ✅ Documentación: modelo mental y flujos

## Tareas Pendientes de Refactor

1. ACTUALIZAR TICKETSCONTROLLER
   - Validar que solo ACTOR pueda usar endpoints de venta/reporte
   - Bloquear si es función PROFESIONAL
   - Registrar origen_venta='ACTOR' en los movimientos
   - Simplificar responsabilidades

2. CREAR SERVICIO publicSalesService.js
   - Extraer lógica de compra pública de controller
   - Funciones: comprarEntrada(), asignarCortesia()
   - Manejar transacciones atomicamente
   - Generar QR y preparar email (sin enviar)

3. CREAR MIDDLEWARE validateFunctionType.js
   - Verificar tipo_funcion vs rol del usuario
   - ACTOR solo en INDEPENDIENTE
   - INVITADO solo en PROFESIONAL
   - ADMIN en ambas

4. CREAR UTILIDAD emailService.js
   - Preparar template de compra confirmada
   - Preparar template de cortesía
   - NO ENVIAR (solo preparar, app decide si envía)

5. TESTS - test-ventas.js
   - Test flujo ACTOR: reporta → aprueba → cobra
   - Test flujo ONLINE: invitado compra directamente
   - Test flujo CORTESÍA: admin asigna
   - Test bloqueos: no permite venta cruzada

6. ACTUALIZAR DOCUMENTACIÓN
   - README.md: agregar diagrama de flujos
   - ENDPOINTS.md: documentar /public/comprar-ticket
   - MIGRATION_GUIDE.md: cómo migrar funciones a PROFESIONAL

## Implementación Segura

- Mantener ticketsController.js funcionando (backward compatible)
- Nuevos endpoints en publicSales* (no romper nada)
- Tests debe pasar 100%: npm test
- script test-completo.sh debe pasar

## No Hacer
- ❌ Eliminar código de ACTOR
- ❌ Romper flujo de reportes existentes
- ❌ Cambiar DB schema sin migración
- ❌ Enviar emails reales (solo preparar)

## Resultado Esperado

Una estructura de código donde:
- ACTOR tiene su propio flujo (venta → reporte → aprobación)
- INVITADO tiene su propio flujo (compra directa)
- ADMIN tiene su propio flujo (cortesía)
- SISTEMA maneja auditoría y estado

Responsabilidades claramente definidas, sin solapamiento.
```

---

## 🚀 CÓMO USAR EL PROMPT

### Opción 1: Chat Directo

```bash
# En VS Code, abre GitHub Copilot Chat
Ctrl+Shift+I (o Cmd+Shift+I en Mac)

# Pega el prompt anterior
# Copilot lo entiende y propone los cambios
```

### Opción 2: En Markdown

```bash
# Crea un archivo
REFACTOR-VENTAS-PROMPT.md

# Pega el contenido
# GitHub Copilot lo lee como contexto
```

### Opción 3: Con Contexto de Archivos

```bash
# Abre en VS Code:
# 1. controllers/publicSales.controller.js
# 2. routes/public.routes.js
# 3. MODELO-MENTAL-VENTAS.md

# Luego pega el prompt en Chat
# Copilot usa los archivos abiertos como contexto
```

---

## 📋 CHECKLIST POST-PROMPT

Una vez que Copilot entregue el código:

### Testing

- [ ] Ejecutar `npm run test`
- [ ] Ejecutar `./test-completo.sh`
- [ ] Verificar no hay errores de lint
- [ ] Verificar DB migrations funcionan

### Validación de Flujos

- [ ] **ACTOR puede**: vender (reportar), transferir, cobrar
- [ ] **ACTOR no puede**: comprar directo, asignar cortesía
- [ ] **INVITADO puede**: comprar en PROFESIONAL
- [ ] **INVITADO no puede**: ver funciones INDEPENDIENTE
- [ ] **ADMIN puede**: configurar tipo, asignar cortesía
- [ ] **Sistema registra**: origen_venta correctamente

### Código

- [ ] `publicSalesService.js` extrae lógica
- [ ] `validateFunctionType.js` middleware funciona
- [ ] `emailService.js` prepara templates
- [ ] `tickets.controller.js` simplificado
- [ ] Tests nuevos: `test-ventas.js`

### Documentación

- [ ] README.md actualizado con diagrama
- [ ] ENDPOINTS.md con nuevos endpoints
- [ ] MIGRATION_GUIDE.md con instrucciones

---

## 🎯 RESULTADO ESPERADO DESPUÉS

### Estructura de Carpetas

```
teatro-tickets-backend/
├── controllers/
│   ├── tickets.controller.js           (simplificado - solo ACTOR)
│   ├── publicSales.controller.js       (thin - solo HTTP)
│   ├── public.controller.js            (actualizado con tipos)
│   └── logs.controller.js              (sin cambios)
│
├── services/
│   ├── ticketService.js                (lógica ACTOR)
│   ├── publicSalesService.js           (⭐ NUEVO - lógica INVITADO)
│   ├── courtesyService.js              (⭐ NUEVO - lógica CORTESÍA)
│   ├── ticketStateMachine.js           (máquina de estados)
│   └── emailService.js                 (⭐ NUEVO - templates)
│
├── middleware/
│   ├── auth.middleware.js              (mantener)
│   └── validateFunctionType.js         (⭐ NUEVO - tipos función)
│
├── routes/
│   ├── tickets.routes.js               (simplificado)
│   ├── public.routes.js                (con nuevos endpoints)
│   └── admin.routes.js                 (con cortesía)
│
└── tests/
    └── test-ventas.js                  (⭐ NUEVO - flujos completos)
```

### Responsabilidades Cristalinas

```
ACTOR
└── venta-interna/
    ├── reservar
    ├── reportar venta
    └── transferir

INVITADO  
└── venta-online/
    └── comprar directamente

ADMIN
└── gestion-especial/
    ├── asignar cortesía
    └── configurar compra online

SISTEMA
└── auditoría/
    ├── registra origen_venta
    ├── valida estado
    └── genera QR
```

---

## 📝 NOTAS IMPORTANTES

### No Rompe Nada

El código existente sigue funcionando:
- ACTOR puede vender, reportar, cobrar (igual que hoy)
- Tests existentes pasan (backward compatible)
- DB migrations son non-breaking
- Rutas viejas no desaparecen

### Extensible

Fácil agregar después:
- Mercado Pago (en `publicSalesService.js`)
- Email real (en `emailService.js`)
- SMS (en `emailService.js`)
- Reportes de ventas por origen
- Dashboard de origen_venta

### Auditable

Todo se registra:
- Tabla `compras_publicas` - quién compró, cuándo, cuánto
- Tabla `tickets_cortesia` - quién asignó, por qué
- Campo `tickets.origen_venta` - de dónde vino
- Índices para queries rápidas

---

## ✅ LISTA FINAL

Después de ejecutar Copilot con el prompt:

- [ ] Copilot entiende el contexto (3 tipos de venta)
- [ ] Propone estructura limpia (servicios + middleware)
- [ ] Tests incluidos (flujos principales)
- [ ] Documentación generada
- [ ] Backward compatible (código viejo funciona)
- [ ] Listo para commit y deploy

---

## 🎉 RESULTADO

Un sistema donde:

✅ **ACTOR** tiene su propio mundo (venta interna)  
✅ **INVITADO** tiene su propio mundo (compra online)  
✅ **ADMIN** controla todo  
✅ **SISTEMA** audita y valida  

**Sin confusión, sin duplicación, sin responsabilidades mezcladas.**

---

**Próximo paso:** Ejecuta el prompt en Copilot Chat → Revisa cambios → Commit → Deploy 🚀
