# 🤖 PROMPT COPILOT — PASO 5: CUENTAS Y TRANSFERENCIAS

Copiá y pegá **tal cual** en Copilot Chat:

```
TAREA: Implementar sistema de cuentas bancarias y validación de pagos por transferencia

CONTEXTO:
Sistema Baco Teatro - gestión de entradas de teatro.
Actualmente los pagos son abstractos (no hay cuentas bancarias reales).
Necesitamos:
- Cuentas bancarias para grupos y funciones profesionales
- Comprobantes de transferencia
- Flujo de validación por directores
- Registro en caja SOLO después de validación

OBJETIVO:
Agregar gestión económica real:
- Actores pagan cuotas subiendo comprobantes
- Directores validan pagos
- Funciones profesionales tienen cuenta bancaria propia
- Ventas online usan cuenta de la función
- Todo ingreso a caja requiere validación previa

ESTRUCTURA A CREAR:

1. Migrations: 04-sistema-cuentas-transferencias.sql
   - Tabla: cuentas_bancarias
     * id, tipo_owner (GRUPO|FUNCION), owner_id
     * banco, titular, numero_cuenta, alias, moneda
     * activa, created_at
   
   - Tabla: comprobantes
     * id, tipo (CUOTA|TICKET), referencia_id
     * archivo_url, fecha_subida, subido_por
     * validado_por, fecha_validacion
     * estado (PENDIENTE|VALIDADO|RECHAZADO)
     * motivo_rechazo
   
   - Cambios en cuotas:
     * ADD COLUMN estado VARCHAR(30) DEFAULT 'PENDIENTE'
     * ADD COLUMN comprobante_id INTEGER
     * ADD COLUMN cuenta_id INTEGER
   
   - Cambios en tickets:
     * ADD COLUMN estado_pago VARCHAR(30) DEFAULT 'PENDIENTE'
     * ADD COLUMN comprobante_id INTEGER
     * ADD COLUMN cuenta_id INTEGER
     * ADD COLUMN medio_pago VARCHAR(20)
   
   - Cambios en funciones:
     * ADD COLUMN cuenta_id INTEGER
   
   - Cambios en grupos:
     * ADD COLUMN cuenta_id INTEGER
   
   - Cambios en caja:
     * ADD COLUMN comprobante_id INTEGER
     * ADD COLUMN validado_por VARCHAR(20)

2. services/cuentasBancariasService.js
   - crearCuenta(tipo, ownerId, datos)
     → Crea cuenta bancaria para grupo o función
   - obtenerCuentaGrupo(grupoId)
     → Retorna cuenta del grupo (para mostrar datos de transferencia)
   - obtenerCuentaFuncion(funcionId)
     → Retorna cuenta de función profesional
   - actualizarCuenta(cuentaId, datos)
   - desactivarCuenta(cuentaId)

3. services/comprobantesService.js
   - subirComprobante(tipo, referenciaId, archivo, subidoPor)
     → Guarda archivo (URL o filesystem)
     → Crea registro en tabla comprobantes
     → Estado = PENDIENTE
   - validarComprobante(comprobanteId, validador)
     → Cambia estado a VALIDADO
     → Registra validador y fecha
     → Si tipo=CUOTA: actualiza cuota.estado = PAGADA
     → Si tipo=TICKET: actualiza ticket.estado_pago = PAGADO
     → Registra ingreso en caja
   - rechazarComprobante(comprobanteId, motivo, validador)
     → Cambia estado a RECHAZADO
     → Registra motivo
   - obtenerComprobante(id)
   - obtenerComprobantesPendientes(tipo)

4. Actualizar services/cuotasService.js
   - pagarCuota(cuotaId, comprobante, actor)
     → Valida que cuota esté PENDIENTE
     → Sube comprobante via comprobantesService
     → Actualiza cuota:
       * estado = PENDIENTE_VALIDACION
       * comprobante_id = X
     → Retorna { success, mensaje }
   - obtenerCuotasActor(actorCedula)
     → Incluye estado y datos de cuenta bancaria del grupo

5. Actualizar services/ticketsService.js (si aplica)
   - Agregar estado_pago en consultas
   - Validar que ticket esté PAGADO antes de USADO

6. Actualizar services/cajaService.js
   - registrarIngresoCaja(..., comprobanteId, validadoPor)
     → Agrega campos nuevos
     → SOLO se llama después de validación

7. controllers/cuentas.controller.js
   - crearCuenta(req, res)
     → POST /cuentas
     → Body: { tipo_owner, owner_id, banco, titular, numero_cuenta, alias, moneda }
     → Valida autorización (SUPER, ADMIN, DIRECTOR)
   - obtenerCuentaGrupo(req, res)
     → GET /cuentas/grupo/:grupoId
   - obtenerCuentaFuncion(req, res)
     → GET /cuentas/funcion/:funcionId

8. controllers/comprobantes.controller.js
   - subirComprobante(req, res)
     → POST /comprobantes
     → Body: { tipo, referencia_id, archivo }
     → Usuario: req.user (ACTOR para cuotas, INVITADO para tickets)
   - validarComprobante(req, res)
     → PATCH /comprobantes/:id/validar
     → Valida autorización (SUPER, ADMIN, DIRECTOR)
   - rechazarComprobante(req, res)
     → PATCH /comprobantes/:id/rechazar
     → Body: { motivo }
   - obtenerComprobantesPendientes(req, res)
     → GET /comprobantes/pendientes?tipo=CUOTA|TICKET

9. routes/cuentas.routes.js
   - POST /cuentas (crear)
   - GET /cuentas/grupo/:id
   - GET /cuentas/funcion/:id
   - PATCH /cuentas/:id (actualizar)

10. routes/comprobantes.routes.js
    - POST /comprobantes (subir)
    - PATCH /comprobantes/:id/validar
    - PATCH /comprobantes/:id/rechazar
    - GET /comprobantes/pendientes

REGLAS CLAVE:

- Solo SUPER, ADMIN, DIRECTOR pueden crear cuentas bancarias
- Solo SUPER, ADMIN, DIRECTOR pueden validar/rechazar comprobantes
- Actor puede subir comprobante de cuota, NO puede validarlo
- Invitado puede subir comprobante de ticket, NO puede validarlo
- Ingreso a caja SOLO después de validación (comprobanteId es requerido)
- Si comprobante es rechazado, estado vuelve a PENDIENTE
- Función PROFESIONAL requiere cuenta bancaria (validar en creación)

FLUJOS A IMPLEMENTAR:

FLUJO 1: Pago de cuota
1. Actor llama POST /cuotas/:id/pagar con comprobante
2. Sistema:
   - Sube comprobante
   - Actualiza cuota.estado = PENDIENTE_VALIDACION
3. Director llama PATCH /comprobantes/:id/validar
4. Sistema:
   - Actualiza comprobante.estado = VALIDADO
   - Actualiza cuota.estado = PAGADA
   - Registra ingreso en caja

FLUJO 2: Compra online (profesional)
1. Invitado llama POST /public/comprar-ticket con comprobante
2. Sistema:
   - Reserva tickets
   - Sube comprobante
   - Actualiza ticket.estado_pago = PENDIENTE_VALIDACION
3. Director llama PATCH /comprobantes/:id/validar
4. Sistema:
   - Actualiza comprobante.estado = VALIDADO
   - Actualiza ticket.estado_pago = PAGADO
   - Genera QR
   - Registra ingreso en caja

MANEJO DE ARCHIVOS:
- Para desarrollo: guardar en filesystem (uploads/)
- Para producción: URL externa (Cloudinary, S3) - no implementar todavía
- comprobante.archivo_url puede ser:
  * Ruta relativa: /uploads/comprobantes/123.jpg
  * URL completa: https://cloudinary.com/.../123.jpg

VALIDACIONES:
- Cuenta bancaria: numero_cuenta no vacío, formato válido (opcional por ahora)
- Comprobante: archivo_url no vacío
- Estado de cuota/ticket debe estar en PENDIENTE antes de subir comprobante
- No se puede validar 2 veces el mismo comprobante

BACKWARD COMPATIBILITY:
- Cuotas sin comprobante (antiguas): estado = PAGADA directamente
- Tickets sin comprobante (ventas efectivo): medio_pago = EFECTIVO, estado_pago = PAGADO
- Funciones sin cuenta: independientes, funcionan como antes

DATABASE:
- Usar: query() function (ya existe en db.js)
- Transacciones: BEGIN, COMMIT, ROLLBACK (importante en validación)

RESPONSE FORMATS:
- POST /cuentas → 201 { success: true, cuenta: {...} }
- POST /comprobantes → 201 { success: true, comprobante: {...} }
- PATCH /comprobantes/:id/validar → 200 { success: true, message: 'Comprobante validado' }
- GET /comprobantes/pendientes → 200 { comprobantes: [...] }

ERROR HANDLING:
- Cuenta ya existe → 400 { error: 'Cuenta ya creada para este grupo/función' }
- No autorizado para validar → 403 { error: 'No autorizado' }
- Comprobante ya validado → 400 { error: 'Comprobante ya procesado' }

TESTS A CREAR:
1. Unit: cuentasBancariasService.crearCuenta()
2. Unit: comprobantesService.validarComprobante()
3. Integration: POST /cuentas
4. Integration: POST /comprobantes
5. Integration: PATCH /comprobantes/:id/validar
6. Verificar transacciones (si falla caja, rollback)

DELIVERABLES:
1. migrations/04-sistema-cuentas-transferencias.sql
2. services/cuentasBancariasService.js
3. services/comprobantesService.js
4. controllers/cuentas.controller.js
5. controllers/comprobantes.controller.js
6. routes/cuentas.routes.js
7. routes/comprobantes.routes.js
8. Actualizar cuotasService con pagarCuota()
9. Actualizar cajaService con validación

Responde con:
- Código para cada archivo (bloques completos)
- Explicación de cambios clave
- Cómo probar cada endpoint
- Comandos SQL para migration
```

---

## Cómo Usarlo

### 1. Abre Copilot Chat

```
VS Code → Ctrl+Shift+I
```

### 2. Copia el Prompt

Selecciona TODO el texto desde `TAREA:` hasta `Comandos SQL`

Copia (Ctrl+C)

### 3. Pega en Chat

En Copilot Chat, pega (Ctrl+V)

### 4. Envía

Presiona Enter

Espera 60-90 segundos (este es más largo)

### 5. Implementa

Copilot generará:
- 1 migration SQL
- 2 nuevos services
- 2 nuevos controllers
- 2 nuevos routes
- Actualizaciones en 3 services existentes

Copia cada bloque y pégalo en su archivo

### 6. Corre Migration

```bash
cd teatro-tickets-backend
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
psql $DATABASE_URL -f migrations/04-sistema-cuentas-transferencias.sql
```

### 7. Tests

```bash
npm test -- cuentas
npm test -- comprobantes
npm run test:integration
```

### 8. Prueba Manual

```bash
# Crear cuenta bancaria
curl -X POST http://localhost:3000/cuentas \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_owner": "GRUPO",
    "owner_id": 1,
    "banco": "Santander",
    "titular": "María Gómez",
    "numero_cuenta": "0123456789",
    "alias": "grupo.actores"
  }'

# Subir comprobante
curl -X POST http://localhost:3000/comprobantes \
  -H "Authorization: Bearer TOKEN" \
  -F "tipo=CUOTA" \
  -F "referencia_id=1" \
  -F "archivo=@comprobante.jpg"

# Validar comprobante
curl -X PATCH http://localhost:3000/comprobantes/1/validar \
  -H "Authorization: Bearer TOKEN"
```

---

## Validación Post-Implementación

- [ ] Migration corre sin errores
- [ ] Tablas creadas: cuentas_bancarias, comprobantes
- [ ] Campos agregados en: cuotas, tickets, funciones, grupos, caja
- [ ] Services nuevos: cuentasBancariasService, comprobantesService
- [ ] Controllers nuevos: cuentas, comprobantes
- [ ] Routes nuevas: /cuentas, /comprobantes
- [ ] Flujo cuota funciona: subir → validar → ingreso caja
- [ ] Flujo ticket funciona: subir → validar → ingreso caja
- [ ] Tests pasan
- [ ] Backward compatibility: funciones/cuotas antiguas funcionan

---

## Debugging

### Error 1: "Table already exists"

**Solución:**
```sql
-- Ver qué tablas existen
\dt

-- Borrar si es necesario (SOLO en desarrollo)
DROP TABLE IF EXISTS comprobantes CASCADE;
DROP TABLE IF EXISTS cuentas_bancarias CASCADE;

-- Correr migration de nuevo
```

### Error 2: "Cannot add foreign key"

**Solución:**
```sql
-- Verificar que tabla referenciada existe
SELECT * FROM cuentas_bancarias LIMIT 1;

-- Si no existe, correr migration en orden correcto
```

### Error 3: "Upload folder doesn't exist"

**Solución:**
```bash
mkdir -p teatro-tickets-backend/uploads/comprobantes
chmod 755 teatro-tickets-backend/uploads
```

---

## Próximo Paso

Una vez implementado:

1. ✅ Sistema de cuentas bancarias
2. ✅ Comprobantes de transferencia
3. ✅ Validación por directores
4. ⏳ UI para actores (pagar cuotas)
5. ⏳ UI para directores (validar pagos)
6. ⏳ UI para invitados (compra online)

---

**TIEMPO ESTIMADO:** 30-45 minutos (implementación + tests)

**COMPLEJIDAD:** Media-Alta (nuevas tablas, relaciones, validaciones)

**RESULTADO:** Gestión económica real, auditable, profesional ✅
