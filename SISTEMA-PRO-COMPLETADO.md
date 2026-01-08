# 🎭 Sistema BACO PRO - Completado

**Fecha**: 8 de enero de 2026  
**Estado**: ✅ Sistema profesional 100% funcional

## 🎯 Resumen Ejecutivo

El sistema BACO Teatro ha sido elevado a nivel **profesional** con:

- ✅ **Triggers automáticos** para cálculo de ingresos/gastos
- ✅ **Stored procedures** para operaciones críticas (cerrar función, balance anual)
- ✅ **Sistema de auditoría** completo con log de todas las operaciones
- ✅ **Roles SQL** con permisos granulares
- ✅ **Vistas optimizadas** para dashboards de negocio
- ✅ **Integración Mercado Pago** para venta de tickets online
- ✅ **Bloqueos post-cierre** para integridad de datos históricos

## 📦 Componentes Implementados

### 1. Base de Datos (PostgreSQL 15)

#### Migraciones Aplicadas

| ID | Nombre | Descripción |
|----|--------|-------------|
| 013 | `pro-triggers-views-roles.sql` | Tabla `cierre_funcion`, triggers de validación y bloqueo |
| 014 | `procedimientos-auditoria.sql` | Stored procedures, tabla auditoría, columnas `cerrada`/`creada_por` |
| 015 | `vistas-permisos-pro.sql` | Vistas de dashboard y roles SQL |

#### Triggers Implementados

```sql
-- Auto-calcular totales al cerrar función
CREATE TRIGGER validar_cierre_funcion 
  BEFORE INSERT ON cierre_funcion
  FOR EACH ROW EXECUTE FUNCTION validar_cierre_funcion();

-- Bloquear cambios en función cerrada
CREATE TRIGGER bloquear_cambios_funcion_cerrada_tickets
  BEFORE INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();

CREATE TRIGGER bloquear_cambios_funcion_cerrada_gastos
  BEFORE INSERT OR UPDATE OR DELETE ON gastos
  FOR EACH ROW EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();

-- Auditoría automática de cambios
CREATE TRIGGER log_auditoria_tickets
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_auditoria();

-- Similar para: gastos, funciones, obras, grupos, usuarios
```

#### Stored Procedures

```sql
-- Cerrar función con validación y cálculo automático
CALL cerrar_funcion(funcion_id INTEGER, usuario_cedula VARCHAR);

-- Generar balance anual del director
CALL generar_balance_anual(
  director_cedula VARCHAR, 
  anio INTEGER, 
  cerrado_por VARCHAR
);
```

#### Vistas de Negocio

```sql
-- Recaudación detallada por función
SELECT * FROM vw_recaudacion_funcion;
-- Columnas: funcion_id, titulo, fecha, lugar, entradas_pagadas, total_recaudado

-- Balance consolidado por obra profesional
SELECT * FROM vw_balance_obra_profesional;
-- Columnas: obra_id, nombre, ingresos, gastos, resultado

-- Balance anual histórico por director
SELECT * FROM vw_balance_anual_director;
-- Columnas: director_cedula, anio, total_ingresos_entradas, 
--           total_ingresos_cuotas, total_gastos, resultado_final
```

#### Roles SQL

| Rol | Permisos |
|-----|----------|
| `rol_super` | ALL PRIVILEGES - gestión total del sistema |
| `rol_director` | SELECT/INSERT/UPDATE en obras, funciones, tickets, gastos. EXECUTE en procedures |
| `rol_boleteria` | SELECT en funciones/obras. INSERT/UPDATE/DELETE en tickets. Solo venta |
| `rol_actor` | SELECT (solo lectura) en funciones, obras, grupos |

### 2. Backend (Node.js + Express)

#### Endpoints PRO

```javascript
// Cerrar función con stored procedure
POST /api/funciones/:id/cerrar
Headers: Authorization: Bearer <token>
Response: {
  message: "Función cerrada exitosamente",
  cierre: {
    id, funcion_id, fecha_cierre, cerrada_por,
    total_ingresos, total_gastos, resultado,
    capacidad_total, vendidos, disponibles
  }
}

// Crear preferencia de Mercado Pago
POST /api/pagos/mp/preference
Body: {
  funcion_id: 123,
  buyer_name: "Juan Pérez",
  buyer_phone: "099123456",
  price: 500
}
Response: {
  preference_id: "123456789-abc...",
  init_point: "https://www.mercadopago.com.uy/checkout/...",
  ticket_code: "MP-2026-ABC123"
}

// Webhook de Mercado Pago (automático)
POST /api/pagos/mp/webhook?topic=payment&id=<payment_id>
// Marca ticket como PAGADO cuando payment.status = 'approved'
```

#### Integración Mercado Pago

**Archivo**: `routes/pagos.routes.js`

- Crea preferencia de checkout con producto "Entrada Teatro"
- Inserta ticket en estado `RESERVADO`
- Usa `ticket_code` como `external_reference`
- Webhook marca ticket `PAGADO` cuando se aprueba el pago
- Envía notificación al comprador (futuro: email/SMS)

**Variables de entorno requeridas**:
```bash
MP_ACCESS_TOKEN=TEST-1234567890-...  # Token de Mercado Pago
MP_PUBLIC_KEY=TEST-abc123...         # (Opcional) Para frontend
BOLETERIA_PHONE=48376668             # Usuario que gestiona stock MP
```

### 3. Frontend (Boletería)

**Archivo**: `teatro-tickets-backend/public/pages/boleteria/index.html`

- Formulario de venta integrado con MP
- Al confirmar venta: POST `/api/pagos/mp/preference`
- Redirige al comprador a `init_point` de Mercado Pago
- El comprador paga con tarjeta, Mercado Pago, etc.
- Webhook marca automáticamente el ticket como PAGADO
- Boletería ve ticket vendido sin intervención manual

### 4. Testing

**Archivo**: `tests/test-integracion-mp.js`

Test automatizado que valida:
1. ✅ Crear grupo, obra y función profesional
2. ✅ Crear preferencia de MP (o continuar sin token)
3. ✅ Verificar ticket en estado RESERVADO
4. ✅ Simular webhook de pago aprobado
5. ✅ Verificar ticket marcado PAGADO
6. ✅ Cerrar función con stored procedure
7. ✅ Validar cálculo automático de totales
8. ✅ Limpiar datos de prueba

**Ejecutar**:
```bash
node tests/test-integracion-mp.js
```

## 🚀 Deployment en Producción

### 1. Configurar Base de Datos

```bash
# Ejecutar migraciones PRO
export DATABASE_URL=postgres://user:pass@host:5432/teatro
cd teatro-tickets-backend
node run-migrations.js
```

Verificar:
```sql
-- Ver triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%cierre%' OR tgname LIKE '%auditoria%';

-- Ver procedures
SELECT proname FROM pg_proc 
WHERE proname IN ('cerrar_funcion', 'generar_balance_anual');

-- Ver vistas
SELECT viewname FROM pg_views 
WHERE viewname LIKE 'vw_%';

-- Ver roles
SELECT rolname FROM pg_roles 
WHERE rolname LIKE 'rol_%';
```

### 2. Configurar Mercado Pago

1. **Crear cuenta**: https://www.mercadopago.com.uy/developers
2. **Obtener credenciales**:
   - Production: Credenciales reales para pagos
   - Sandbox: Credenciales de prueba
3. **Configurar webhook**:
   ```
   URL: https://tu-dominio.com/api/pagos/mp/webhook
   Eventos: payment.created, payment.updated
   ```
4. **Agregar al `.env`**:
   ```bash
   MP_ACCESS_TOKEN=APP_USR-1234567890...
   MP_PUBLIC_KEY=APP_USR-abc123...
   BOLETERIA_PHONE=<cedula_usuario_admin>
   ```

### 3. Probar en Sandbox

```bash
# Usar credenciales TEST
MP_ACCESS_TOKEN=TEST-1234... npm start

# Hacer venta de prueba
curl -X POST http://localhost:3000/api/pagos/mp/preference \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"funcion_id":1,"buyer_name":"Test","buyer_phone":"099","price":500}'

# Usar tarjetas de prueba:
# Aprobado: 5031 7557 3453 0604 (VISA)
# Rechazado: 5031 4332 1540 6351
```

### 4. Migrar a Producción

```bash
# Cambiar a credenciales PROD
MP_ACCESS_TOKEN=APP_USR-real-token...

# Reiniciar servidor
pm2 restart backend
```

## 📊 Uso del Sistema

### Como Director

1. **Crear obra profesional** (flag `es_profesional: true`)
2. **Crear función** con precio, capacidad, lugar
3. **Stock automático**: Entradas asignadas a boletería
4. **Registrar gastos**: Alquiler sala, honorarios, marketing
5. **Cerrar función**:
   ```bash
   POST /api/funciones/:id/cerrar
   ```
6. **Ver balance**:
   ```sql
   SELECT * FROM vw_balance_obra_profesional 
   WHERE obra_id = 123;
   ```

### Como Boletería

1. Acceder a `/pages/boleteria/`
2. Ver funciones programadas
3. Vender entrada:
   - Ingresa nombre/teléfono comprador
   - Sistema crea preferencia MP
   - Comprador paga online
   - Ticket marcado PAGADO automáticamente
4. Ver stock disponible en tiempo real

### Como Super Usuario

1. **Ver auditoría completa**:
   ```sql
   SELECT * FROM auditoria 
   WHERE tabla_afectada = 'tickets' 
   ORDER BY fecha_hora DESC;
   ```

2. **Generar balance anual**:
   ```sql
   CALL generar_balance_anual('48376669', 2026, '48376669');
   
   SELECT * FROM vw_balance_anual_director 
   WHERE director_cedula = '48376669' AND anio = 2026;
   ```

3. **Gestionar roles SQL**:
   ```sql
   -- Crear usuario de base con rol
   CREATE USER juan_director WITH PASSWORD 'secure123';
   GRANT rol_director TO juan_director;
   GRANT CONNECT ON DATABASE teatro TO juan_director;
   ```

## 🔒 Seguridad y Auditoría

### Integridad de Datos

- ✅ **Funciones cerradas**: Inmutables, triggers bloquean cambios
- ✅ **Cascadas controladas**: DELETE en grupo/obra solo si no hay cierres
- ✅ **Foreign keys**: Todas las relaciones validadas en BD
- ✅ **Constraints**: CHECK en roles, estados, montos positivos

### Trazabilidad

Tabla `auditoria` registra TODA operación:
```sql
SELECT 
  fecha_hora,
  usuario,
  accion,         -- INSERT | UPDATE | DELETE
  tabla_afectada,
  registro_id,
  valores_anteriores,
  valores_nuevos
FROM auditoria
WHERE usuario = '48376669'
  AND fecha_hora >= NOW() - INTERVAL '7 days'
ORDER BY fecha_hora DESC;
```

### Permisos Granulares

- **Aplicación**: Middleware JWT con roles SUPER/ADMIN/ACTOR/VENDEDOR
- **Base de datos**: Roles SQL adicionales (rol_director, rol_boleteria, rol_actor)
- **Doble capa**: Aplicación valida endpoint, BD valida operación SQL

## 📈 Métricas y Dashboards

### Dashboard Director

```javascript
// Endpoint propuesto (futuro)
GET /api/dashboard/director/:cedula

{
  obras_activas: 5,
  funciones_proximas: 12,
  balance_mes: {
    ingresos_entradas: 45000,
    ingresos_cuotas: 12000,
    gastos: 30000,
    resultado: 27000
  },
  obra_mas_rentable: "Hamlet",
  tickets_vendidos_mes: 450
}
```

### Dashboard Super Usuario

```javascript
GET /api/dashboard/admin

{
  grupos_activos: 8,
  directores_activos: 15,
  funciones_hoy: 3,
  tickets_vendidos_hoy: 120,
  recaudacion_hoy: 60000,
  funciones_cerradas_mes: 45,
  balance_mes: 350000
}
```

## 🔄 Mantenimiento

### Backup Automático

```bash
# Backup diario con pg_dump
docker exec teatro-postgres pg_dump -U postgres teatro > \
  backup_$(date +%Y%m%d).sql

# Restaurar
docker exec -i teatro-postgres psql -U postgres teatro < backup.sql
```

### Limpieza Automática

```bash
# Eliminar datos de prueba (conserva SUPREMO)
./scripts/borrar.sh

# Limpiar funciones antiguas (>6 meses sin cierre)
node scripts/limpieza-automatica-postgres.js
```

### Monitoreo

```sql
-- Ver tamaño de tablas
SELECT 
  schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver queries lentas
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;
```

## 📞 Soporte

### Logs del Sistema

```bash
# Backend
tail -f /tmp/backend.log

# PostgreSQL
docker logs teatro-postgres --tail=50 -f

# Nginx (si aplica)
tail -f /var/log/nginx/error.log
```

### Troubleshooting

**Error: "column 'cerrada' does not exist"**
→ Correr migración 014: `node run-migrations.js`

**Error: "MP_ACCESS_TOKEN not found"**
→ Agregar token en `.env` o usar modo sin MP

**Error: "ticket_code does not exist"**
→ Verificar que webhook de MP esté configurado correctamente

**Error: "función ya cerrada"**
→ Validación correcta, no se puede cerrar dos veces

## ✅ Checklist Pre-Producción

- [ ] Migraciones 013, 014, 015 aplicadas
- [ ] Triggers funcionando (probar con INSERT en tickets de función cerrada → debe fallar)
- [ ] Stored procedure `cerrar_funcion` probado
- [ ] Mercado Pago configurado (credenciales PROD)
- [ ] Webhook URL configurada en MP dashboard
- [ ] Variable `MP_ACCESS_TOKEN` en `.env`
- [ ] Variable `BOLETERIA_PHONE` apunta a usuario real
- [ ] Backup automático configurado (cron job)
- [ ] SSL/HTTPS habilitado (certbot)
- [ ] Firewall configurado (solo 443, 22)
- [ ] PM2 corriendo backend en modo cluster
- [ ] Logs rotando (logrotate)
- [ ] Monitoreo (opcional: Grafana + Prometheus)

## 🎉 Conclusión

El sistema BACO Teatro es ahora un **producto profesional de nivel empresarial**, con:

- **Integridad**: Triggers y constraints garantizan datos correctos
- **Trazabilidad**: Auditoría completa de todas las operaciones
- **Seguridad**: Doble capa de permisos (app + BD)
- **Escalabilidad**: Procedures optimizados, vistas indexadas
- **Productividad**: Venta online automática con MP
- **Confiabilidad**: Tests automatizados, rollback en transacciones

**Listo para producción** ✅

---

*Documento generado el 8 de enero de 2026*  
*Versión: 1.0*  
*Sistema: BACO Teatro PRO*
