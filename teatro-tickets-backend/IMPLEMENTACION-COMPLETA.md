# 🎭 IMPLEMENTACIÓN COMPLETA - Baco Teatro Backend

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🔐 1. SISTEMA DE AUTENTICACIÓN COMPLETO

#### Endpoints Implementados:
- **POST /api/auth/login** - Login con cédula o teléfono + contraseña
- **POST /api/auth/register** - Registro de nuevos usuarios
- **POST /api/auth/completar-registro** - Completar registro si falta contraseña
- **POST /api/auth/change-password** - Cambiar contraseña (requiere contraseña actual)
- **GET /api/auth/verificar** - Verificar token JWT válido
- **GET /api/auth/me** - Obtener información del usuario actual

#### Características:
- ✅ Autenticación JWT
- ✅ Passwords hasheados con bcrypt
- ✅ Roles: SUPER, ADMIN, VENDEDOR, INVITADO
- ✅ Validación de permisos por rol

---

### 🎫 2. SISTEMA DE TICKETS COMPLETO

#### Estados del Ticket:
1. **DISPONIBLE** - Recién creado, sin asignar
2. **STOCK_VENDEDOR** - Asignado a vendedor
3. **RESERVADO** - Vendedor asignó comprador
4. **REPORTADA_VENDIDA** - Vendedor reportó venta, pendiente aprobación
5. **PAGADO** - Admin aprobó, dinero recibido
6. **USADO** - Entrada escaneada en puerta

#### Endpoints Implementados:
- **GET /api/tickets/mis-tickets** - Ver tickets asignados (vendedor)
- **POST /api/tickets/asignar** - Asignar tickets a vendedor
- **PATCH /api/tickets/:code/reservar** - Reservar ticket con nombre comprador
- **PATCH /api/tickets/:code/reportar-venta** - Reportar venta (vendedor cobra)
- **GET /api/tickets/:code/qr** - Generar código QR del ticket
- **GET /api/tickets/validar/:code** - Validar y marcar como USADO

#### Flujo Completo:
1. Admin crea función → genera tickets DISPONIBLE
2. Admin asigna a vendedor → STOCK_VENDEDOR
3. Vendedor reserva con comprador → RESERVADO
4. Vendedor cobra y reporta → REPORTADA_VENDIDA
5. Admin aprueba pago → PAGADO
6. Escaneo en puerta → USADO

---

### 👤 3. GESTIÓN DE VENTAS Y APROBACIONES

#### Endpoints Admin:
- **POST /api/admin/aprobar-venta** - Aprobar ventas reportadas (uno o varios tickets)
- **POST /api/admin/rechazar-venta** - Rechazar venta y devolver a estado anterior
- **GET /api/admin/ventas-pendientes** - Listar todas las ventas pendientes de aprobación
- **POST /api/admin/limpiar-db** - Limpiar base de datos (solo SUPER)
- **POST /api/admin/crear-show** - Crear función (ADMIN o SUPER)

#### Características:
- ✅ Aprobar múltiples ventas a la vez
- ✅ Rechazar ventas con motivo
- ✅ Ver total pendiente de aprobación
- ✅ Filtrar por función específica
- ✅ Trazabilidad completa (quién aprobó, cuándo)

---

### 🎭 4. GRUPOS TEATRALES

#### Endpoints Implementados:
- **POST /api/grupos** - Crear grupo teatral
- **GET /api/grupos** - Listar todos los grupos
- **GET /api/grupos/finalizados/lista** - Listar grupos finalizados
- **GET /api/grupos/:id** - Obtener grupo específico
- **PUT /api/grupos/:id** - Actualizar grupo
- **POST /api/grupos/:id/miembros** - Agregar miembro al grupo
- **DELETE /api/grupos/:id/miembros/:miembroCedula** - Eliminar miembro
- **GET /api/grupos/:id/actores-disponibles** - Listar actores disponibles
- **POST /api/grupos/:id/archivar** - Archivar grupo
- **POST /api/grupos/:id/finalizar** - Finalizar grupo con conclusión
- **GET /api/grupos/:id/pdf** - Generar PDF del grupo

#### Características:
- ✅ Horarios fijos de ensayo (día + hora)
- ✅ Período de vigencia (fecha inicio/fin)
- ✅ Director + co-directores
- ✅ Gestión de miembros activos/inactivos
- ✅ Estados: ACTIVO, PAUSADO, FINALIZADO

---

### 📚 5. OBRAS

#### Endpoints Implementados:
- **POST /api/obras** - Crear obra
- **GET /api/obras** - Listar todas las obras
- **GET /api/obras/grupo/:grupoId** - Obras por grupo
- **GET /api/obras/:id** - Detalle de obra
- **PUT /api/obras/:id** - Actualizar obra
- **POST /api/obras/:id/archivar** - Archivar obra
- **DELETE /api/obras/:id** - Eliminar obra

#### Estados:
- **EN_DESARROLLO** - Trabajo en proceso
- **LISTA** - Preparada para presentarse
- **ARCHIVADA** - Finalizada, registro histórico

---

### 🎵 6. ENSAYOS Y ASISTENCIAS

#### Endpoints de Ensayos:
- **POST /api/ensayos** - Crear ensayo
- **GET /api/ensayos** - Listar todos los ensayos
- **GET /api/ensayos/:id** - Obtener ensayo específico
- **PUT /api/ensayos/:id** - Actualizar ensayo
- **DELETE /api/ensayos/:id** - Eliminar ensayo

#### Endpoints de Asistencias (NUEVO ✨):
- **POST /api/ensayos/:id/asistencia** - Registrar asistencia de miembro
- **GET /api/ensayos/:id/asistencias** - Ver todas las asistencias del ensayo
- **GET /api/ensayos/miembro/:cedula/historial** - Historial de asistencias del miembro
- **GET /api/ensayos/grupo/:grupo_id/resumen** - Resumen de asistencias del grupo

#### Características de Asistencias:
- ✅ Registrar presencia/ausencia
- ✅ Marcar llegadas tarde con minutos
- ✅ Observaciones por actor
- ✅ Estadísticas automáticas:
  - Total registros
  - Presentes/Ausentes
  - Llegadas tarde
  - Promedio minutos tarde
  - Porcentaje de asistencia
- ✅ Vistas SQL optimizadas para reportes

---

### 🎪 7. FUNCIONES (SHOWS)

#### Endpoints Implementados:
- **POST /api/shows** - Crear función
- **GET /api/shows** - Listar funciones activas/futuras
- **GET /api/shows/concluidas** - Funciones históricas
- **GET /api/shows/:id** - Detalle de función
- **PATCH /api/shows/:id** - Actualizar función
- **POST /api/shows/:id/assign-tickets** - Distribuir tickets entre vendedores
- **POST /api/shows/:id/cerrar** - Cerrar función
- **GET /api/shows/:id/pdf** - Generar reporte PDF
- **DELETE /api/shows/:id** - Eliminar función

#### Características:
- ✅ Gestión de capacidad
- ✅ Precio base por entrada
- ✅ Foto de función
- ✅ Distribución automática de tickets
- ✅ Estados: ACTIVO, CONCLUIDO
- ✅ Reportes PDF completos

---

### 📊 8. REPORTES Y ESTADÍSTICAS

#### Endpoints Implementados:
- **GET /api/reportes/show/:showId** - Reporte de ventas por función
- **GET /api/reportes/vendedor/:phone** - Reporte individual de vendedor
- **GET /api/reportes/general** - Dashboard general del sistema
- **GET /api/reportes-obras/:obraId/estadisticas** - Estadísticas de obra

#### Información en Reportes:
- ✅ Resumen por vendedor (asignados, reservados, vendidos, pagados)
- ✅ Montos totales y pendientes
- ✅ Porcentaje de ocupación
- ✅ Recaudación total vs. pendiente
- ✅ Vendedores más efectivos
- ✅ Funciones con mayor éxito
- ✅ Ensayos realizados por obra
- ✅ Asistencia promedio

---

### 👥 9. USUARIOS

#### Endpoints Implementados:
- **POST /api/usuarios** - Crear usuario genérico
- **POST /api/usuarios/actores** - Crear actor/vendedor
- **POST /api/usuarios/directores** - Crear director (solo SUPER)
- **GET /api/usuarios** - Listar todos los usuarios
- **GET /api/usuarios/vendedores** - Listar solo vendedores
- **GET /api/usuarios/miembros** - Listar todos los miembros
- **DELETE /api/usuarios/:id** - Desactivar usuario
- **POST /api/usuarios/:id/reset-password** - Resetear contraseña (solo SUPER)

#### Roles y Permisos:
- **SUPER**: Control total del sistema
- **ADMIN**: Gestión de su grupo teatral
- **VENDEDOR**: Venta de entradas
- **INVITADO**: Compra de entradas

---

### 📤 10. SUBIDA DE ARCHIVOS

#### Endpoint Implementado:
- **POST /api/upload** - Subir imagen

#### Características:
- ✅ Foto de perfil de usuario
- ✅ Imagen de obra
- ✅ Foto de función
- ✅ Validación de tipo (JPG, PNG, WebP)
- ✅ Límite de tamaño: 5 MB
- ✅ Almacenamiento en servidor

---

## 🗄️ BASE DE DATOS

### Tablas Principales:
- `users` - Usuarios del sistema
- `shows` - Funciones teatrales
- `tickets` - Entradas para funciones
- `grupos` - Grupos teatrales
- `grupo_miembros` - Relación miembros-grupos
- `obras` - Obras teatrales
- `ensayos_generales` - Ensayos programados
- **`asistencias_ensayos`** - ✨ Registro de asistencias (NUEVO)

### Vistas SQL:
- `v_resumen_vendedor_show` - Resumen por vendedor y función
- `v_resumen_show_admin` - Resumen global de función
- `v_grupos_completos` - Grupos con información completa
- `v_obras_completas` - Obras con información del grupo
- `v_ensayos_completos` - Ensayos con obra y grupo
- **`v_resumen_asistencias_ensayo`** - ✨ Estadísticas de asistencias (NUEVO)
- **`v_historial_asistencias_miembro`** - ✨ Historial individual (NUEVO)

---

## 🚀 INSTALACIÓN Y USO

### Aplicar Migración de Asistencias:

```bash
# 1. Aplicar migración de asistencias
cd teatro-tickets-backend
node aplicar-migraciones.js

# 2. Iniciar servidor
npm run dev
```

### Iniciar Base de Datos y Backend:

```bash
# Usando las tareas configuradas:
# 1. DB: start postgres
# 2. DB: migrate phone+FK
# 3. Backend: dev (nodemon)
```

---

## 📝 EJEMPLOS DE USO

### 1. Flujo Completo de Venta:

```javascript
// Vendedor reserva ticket
PATCH /api/tickets/T-ABC123/reservar
{
  "comprador_nombre": "Juan Pérez",
  "comprador_contacto": "555-1234"
}

// Vendedor reporta venta
PATCH /api/tickets/T-ABC123/reportar-venta
{
  "precio": 15.00,
  "medio_pago": "efectivo"
}

// Admin aprueba venta
POST /api/admin/aprobar-venta
{
  "ticket_codes": ["T-ABC123"]
}

// Validar en puerta
GET /api/tickets/validar/T-ABC123
```

### 2. Registrar Asistencias:

```javascript
// Director registra asistencia
POST /api/ensayos/1/asistencia
{
  "miembro_cedula": "12345678",
  "asistio": true,
  "llego_tarde": true,
  "minutos_tarde": 15,
  "observaciones": "Llegó tarde por tráfico"
}

// Ver todas las asistencias
GET /api/ensayos/1/asistencias

// Historial de un actor
GET /api/ensayos/miembro/12345678/historial
```

---

## 🎯 CARACTERÍSTICAS DESTACADAS

✅ **Sistema Virgen** - Sin datos precargados, listo para producción
✅ **Multi-tenancy** - Múltiples grupos teatrales independientes
✅ **Control de Dinero** - Seguimiento completo de ventas y pagos
✅ **Trazabilidad** - Historial de todos los cambios
✅ **Automatización** - Generación de códigos QR, reportes automáticos
✅ **Seguridad** - JWT, bcrypt, validación de permisos
✅ **Escalabilidad** - Pool de conexiones, índices optimizados
✅ **Asistencias** - ✨ Control completo de asistencias a ensayos con estadísticas

---

## 📞 SOPORTE

Para más información, consulta la documentación completa en:
- [TODO-LO-QUE-PUEDE-HACER.md](TODO-LO-QUE-PUEDE-HACER.md)

---

**Versión del Sistema:** 3.0  
**Última actualización:** Diciembre 2025  
**Base de Datos:** PostgreSQL 15  
**Framework:** Node.js + Express  
**Estado:** ✅ COMPLETAMENTE IMPLEMENTADO
