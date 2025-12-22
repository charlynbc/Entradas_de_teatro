# 🎭 TODO LO QUE PUEDE HACER - Baco Teatro

Sistema completo de gestión y venta de entradas para teatro con arquitectura profesional.

---

## 📋 ÍNDICE

1. [Sistema de Usuarios y Roles](#sistema-de-usuarios-y-roles)
2. [Gestión de Grupos Teatrales](#gestión-de-grupos-teatrales)
3. [Gestión de Obras](#gestión-de-obras)
4. [Ensayos](#ensayos)
5. [Funciones (Shows)](#funciones-shows)
6. [Sistema de Tickets](#sistema-de-tickets)
7. [Reportes y Estadísticas](#reportes-y-estadísticas)
8. [Sistema de Autenticación](#sistema-de-autenticación)
9. [Subida de Archivos](#subida-de-archivos)
10. [Panel Web Público](#panel-web-público)

---

## 🔐 SISTEMA DE USUARIOS Y ROLES

### Tipos de Usuario
- **SUPER**: Usuario supremo con todos los permisos (único)
- **ADMIN**: Directores de grupos teatrales
- **VENDEDOR**: Actores que venden entradas
- **INVITADO**: Usuarios sin cuenta que compran entradas

### Funcionalidades por Rol

#### SUPER (Usuario Supremo)
- ✅ Crear/editar/eliminar cualquier usuario
- ✅ Crear/gestionar todos los grupos teatrales
- ✅ Acceso total a todas las obras y ensayos
- ✅ Ver todos los reportes financieros
- ✅ Aprobar/rechazar ventas reportadas
- ✅ Resetear contraseñas
- ✅ Administrar sistema completo

#### ADMIN (Director)
- ✅ Crear y gestionar su grupo teatral
- ✅ Agregar actores a su grupo
- ✅ Crear obras para su grupo
- ✅ Programar ensayos
- ✅ Crear funciones públicas
- ✅ Distribuir tickets entre sus actores
- ✅ Ver reportes de ventas de su grupo
- ✅ Aprobar ventas de sus actores
- ✅ Nombrar co-directores
- ✅ Gestionar asistencias a ensayos

#### VENDEDOR (Actor)
- ✅ Ver sus tickets asignados
- ✅ Reservar entradas para compradores
- ✅ Reportar ventas realizadas
- ✅ Ver su historial de ventas
- ✅ Generar códigos QR de sus tickets
- ✅ Marcar asistencias a ensayos
- ✅ Ver calendario de ensayos y funciones

#### INVITADO (Público)
- ✅ Ver cartelera de funciones
- ✅ Comprar entradas desde el sitio web
- ✅ Recibir entradas por email/WhatsApp
- ✅ Validar entrada con código QR

---

## 🎭 GESTIÓN DE GRUPOS TEATRALES

### Crear Grupo
```
POST /api/grupos
```
**Funcionalidad:**
- Crear un nuevo grupo teatral
- Asignar director principal
- Definir horarios de ensayo (día de semana + hora)
- Establecer vigencia (fecha inicio/fin)
- Estado: ACTIVO, PAUSADO, FINALIZADO

**Campos:**
- Nombre del grupo
- Descripción
- Director (cédula)
- Día de ensayo semanal
- Hora de inicio
- Fecha inicio/fin del grupo
- Estado

### Gestionar Miembros
```
POST /api/grupos/:id/miembros
GET /api/grupos/:id/miembros
DELETE /api/grupos/:id/miembros/:cedulaMiembro
```

**Funcionalidad:**
- Agregar actores al grupo
- Listar todos los miembros
- Asignar roles dentro del grupo (ACTOR, DIRECTOR como co-director)
- Marcar miembros como activos/inactivos
- Ver historial de incorporación

### Listar Grupos
```
GET /api/grupos
GET /api/grupos/:id
```

**Filtros disponibles:**
- Por director
- Por estado
- Vigentes en fecha actual
- Con obras en desarrollo
- Con próximas funciones

---

## 📚 GESTIÓN DE OBRAS

### Crear Obra
```
POST /api/obras
```

**Funcionalidad:**
- Vincular obra a un grupo teatral
- Definir información de la obra
- Estados: EN_DESARROLLO, LISTA, ARCHIVADA

**Campos:**
- Nombre de la obra
- Descripción
- Autor
- Género teatral
- Duración aproximada (minutos)
- Grupo al que pertenece
- Estado actual

### Ciclo de Vida de una Obra

#### EN_DESARROLLO
- Permite programar ensayos
- Aún no se pueden crear funciones públicas
- Trabajo en proceso

#### LISTA
- Obra preparada para presentarse
- Se pueden crear funciones públicas
- Sigue permitiendo ensayos

#### ARCHIVADA
- Obra finalizada
- Se mantiene el registro histórico
- No permite nuevos ensayos ni funciones

### Operaciones
```
GET /api/obras                    # Listar todas
GET /api/obras/grupo/:grupoId     # Por grupo
GET /api/obras/:id                # Detalle
PUT /api/obras/:id                # Actualizar
POST /api/obras/:id/archivar      # Archivar
DELETE /api/obras/:id             # Eliminar
```

---

## 🎵 ENSAYOS

### Programar Ensayo
```
POST /api/ensayos
```

**Funcionalidad:**
- Crear ensayo para una obra específica
- Definir fecha, hora y lugar
- Asignar duración
- Estados: PROGRAMADO, REALIZADO, CANCELADO

**Campos:**
- Obra (referencia)
- Fecha y hora
- Lugar
- Duración estimada
- Observaciones

### Gestión de Asistencias
```
POST /api/ensayos/:id/asistencia
GET /api/ensayos/:id/asistencias
```

**Funcionalidad:**
- Registrar quién asistió a cada ensayo
- Marcar llegadas tarde
- Agregar observaciones por actor
- Ver historial de asistencias
- Generar estadísticas de participación

### Listar Ensayos
```
GET /api/ensayos
GET /api/ensayos/obra/:obraId
GET /api/ensayos/grupo/:grupoId
```

**Filtros:**
- Por obra
- Por grupo
- Por rango de fechas
- Próximos ensayos
- Históricos

### Actualizar Estado
```
PATCH /api/ensayos/:id
```

**Transiciones válidas:**
- PROGRAMADO → REALIZADO (al finalizar)
- PROGRAMADO → CANCELADO (si se suspende)

---

## 🎪 FUNCIONES (SHOWS)

### Crear Función
```
POST /api/shows
```

**Funcionalidad:**
- Crear presentación pública de una obra
- Definir lugar, fecha, hora
- Establecer capacidad máxima
- Definir precio base de entrada
- Generar tickets automáticamente

**Campos:**
- Obra (nombre)
- Fecha y hora
- Lugar/teatro
- Capacidad total
- Precio base
- Foto (opcional)

### Gestionar Tickets de la Función
```
POST /api/shows/:id/assign-tickets
```

**Funcionalidad:**
- Distribuir tickets entre actores/vendedores
- Cada vendedor recibe tickets en estado STOCK_VENDEDOR
- El vendedor puede venderlos individualmente

### Cerrar Función
```
POST /api/shows/:id/cerrar
```

**Funcionalidad:**
- Marcar función como finalizada
- Impide modificaciones posteriores
- Consolida estadísticas finales

### Generar Reporte PDF
```
GET /api/shows/:id/pdf
```

**Funcionalidad:**
- Documento PDF completo de la función
- Lista de vendedores y sus ventas
- Totales recaudados
- Tickets usados vs. vendidos
- Estadísticas detalladas

### Listar Funciones
```
GET /api/shows                # Activas/futuras
GET /api/shows/concluidas     # Histórico
GET /api/shows/:id            # Detalle
```

**El público puede ver:**
- Cartelera de funciones próximas
- Información de obra y horario
- Disponibilidad de entradas
- Precio

---

## 🎫 SISTEMA DE TICKETS

### Estados del Ticket
1. **DISPONIBLE**: Recién creado, sin asignar
2. **STOCK_VENDEDOR**: Asignado a un actor para vender
3. **RESERVADO**: Actor reservó para un comprador (sin cobrar aún)
4. **REPORTADA_VENDIDA**: Actor reportó que cobró
5. **PAGADO**: Admin confirmó recepción del dinero
6. **USADO**: Entrada validada en la puerta del teatro

### Ciclo de Venta

#### 1. Distribución (Admin)
```
POST /api/shows/:id/assign-tickets
```
- Admin asigna X tickets a cada vendedor
- Tickets pasan a STOCK_VENDEDOR

#### 2. Reserva (Vendedor)
```
POST /api/tickets/asignar
```
- Vendedor pone nombre del comprador
- Pasa a RESERVADO
- Genera código QR único

#### 3. Reporte de Venta (Vendedor)
```
PATCH /api/tickets/:code
```
- Vendedor indica que cobró
- Pasa a REPORTADA_VENDIDA
- Queda pendiente de aprobación

#### 4. Aprobación (Admin)
```
POST /api/admin/aprobar-venta
```
- Admin confirma recepción de dinero
- Pasa a PAGADO
- Se contabiliza en caja

#### 5. Validación (Puerta)
```
GET /api/tickets/validar/:code
```
- Escaneo de QR al entrar
- Pasa a USADO
- No se puede usar dos veces

### Operaciones de Tickets

#### Ver Mis Tickets (Vendedor)
```
GET /api/tickets/mis-tickets
```
- Lista de todos los tickets asignados
- Filtrar por show
- Ver estados

#### Generar QR Individual
```
GET /api/tickets/:code/qr
```
- Código QR descargable
- Para enviar al comprador
- Contiene URL de validación

#### Validar Entrada
```
GET /api/tickets/validar/:code
```
**Respuestas:**
- ✅ Ticket válido → marca como USADO
- ❌ Ticket ya usado
- ❌ Ticket no encontrado

---

## 📊 REPORTES Y ESTADÍSTICAS

### Reportes por Obra
```
GET /api/reportes-obras/:obraId/estadisticas
```

**Información incluida:**
- Total de funciones realizadas
- Asistencia promedio
- Recaudación total
- Tickets vendidos vs. capacidad
- Mejor función (más asistencia)
- Ensayos realizados

### Reportes de Ventas por Show
```
GET /api/reportes/show/:showId
```

**Información incluida:**
- Resumen por vendedor:
  - Tickets asignados
  - Reservados
  - Vendidos y reportados
  - Pagados y aprobados
  - Monto a entregar
- Totales generales
- Porcentaje de ocupación
- Estado de cobranza

### Reportes Generales (Admin)
```
GET /api/reportes/general
```

**Dashboard completo:**
- Grupos activos
- Obras en desarrollo
- Próximas funciones
- Recaudación total del período
- Vendedores más efectivos
- Funciones con mayor éxito

### Reportes de Vendedor
```
GET /api/reportes/vendedor/:phone
```

**Información personal:**
- Historial de ventas
- Total recaudado
- Tickets pendientes de venta
- Dinero pendiente de entrega
- Estadísticas de conversión

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Login
```
POST /api/auth/login
```

**Métodos de autenticación:**
- Por cédula + contraseña
- Por teléfono + contraseña

**Respuesta:**
- Token JWT
- Información del usuario
- Rol y permisos

### Registro
```
POST /api/auth/register
```

**Funcionalidad:**
- Crear nueva cuenta de usuario
- Validación de campos
- Hash de contraseña automático
- Asignación de rol

### Cambio de Contraseña
```
POST /api/auth/change-password
```

**Validaciones:**
- Contraseña anterior correcta
- Nueva contraseña con requisitos mínimos
- Confirmación de nueva contraseña

### Verificar Token
```
GET /api/auth/me
```
- Validar token actual
- Obtener info de usuario logueado

---

## 📤 SUBIDA DE ARCHIVOS

### Subir Imagen
```
POST /api/upload
```

**Funcionalidad:**
- Subir foto de perfil de usuario
- Subir imagen de obra
- Subir foto de función
- Validación de tipo de archivo
- Redimensionamiento automático
- Almacenamiento en servidor

**Formatos aceptados:**
- JPG/JPEG
- PNG
- WebP

**Límites:**
- Tamaño máximo: 5 MB
- Resolución máxima: 2000x2000px

---

## 🌐 PANEL WEB PÚBLICO

### Frontend para Público General

#### Ver Cartelera
```
GET /
```

**Funcionalidad:**
- Lista de todas las funciones próximas
- Información de obra, fecha, lugar
- Precio de entrada
- Disponibilidad

**Diseño:**
- Responsive (móvil y desktop)
- Tema teatral profesional (rojo y dorado)
- Animaciones suaves
- Iconografía teatral

#### Reservar Entrada (Deshabilitado temporalmente)
```
POST /api/comprar
```

**Nota:** Por seguridad, la compra online directa está deshabilitada.
Los usuarios deben contactar a un vendedor.

**Mensaje al público:**
> "La venta online está momentáneamente deshabilitada. Por favor, contacte a un vendedor o adquiera su entrada en boletería."

---

## 🔧 FUNCIONALIDADES TÉCNICAS

### Base de Datos
- **Motor:** PostgreSQL 15
- **ORM:** Consultas SQL nativas con pg
- **Migraciones:** Schema SQL versionado
- **Backup:** Automático diario

### Seguridad
- **Autenticación:** JWT (JSON Web Tokens)
- **Passwords:** Bcrypt hash con salt
- **CORS:** Configurado para orígenes permitidos
- **Validación:** En cada endpoint crítico
- **Sanitización:** Prevención de SQL injection

### API REST
- **Formato:** JSON
- **Autenticación:** Bearer Token en header
- **Códigos de estado HTTP:** Estándar
- **Documentación:** Endpoints autoexplicativos

### Escalabilidad
- **Conexión a DB:** Pool de conexiones
- **Logging:** Registro de queries y errores
- **Performance:** Índices en columnas clave
- **Vistas:** Precomputadas para reportes

---

## 📱 ACCESO MÓVIL

### App React Native (Teatro-tickets-backend/public)
La aplicación cuenta con una versión móvil construida con:
- **React Native Web**
- **Expo**
- **Navegación por roles**

**Pantallas disponibles:**
- Login
- Dashboard por rol
- Mis tickets (vendedor)
- Escanear QR
- Historial de ventas
- Calendario de ensayos
- Información de funciones

---

## 🛠️ SCRIPTS DE ADMINISTRACIÓN

### Inicialización
```bash
npm run db:migrate-phone-fk    # Migración de base de datos
node setup-db.js               # Crear schema
node seed-minimo-init.js       # Datos iniciales
```

### Mantenimiento
```bash
node limpiar-db.js             # Limpiar datos de prueba
node scripts/reset-super-password.js  # Resetear password super
node scripts/limpiar-funciones-pasadas.js  # Limpiar funciones viejas
```

### Testing
```bash
node tests/test-super-usuario.js   # Test usuario supremo
node tests/test-director.js        # Test permisos director
node tests/test-vendedores.js      # Test sistema de ventas
node tests/test-invitados.js       # Test compra pública
```

---

## 🎯 CASOS DE USO PRINCIPALES

### 1. Director crea un nuevo grupo
1. Login como director
2. POST `/api/grupos` con datos del grupo
3. Agregar actores: POST `/api/grupos/:id/miembros`
4. Crear obra: POST `/api/obras`
5. Programar ensayos: POST `/api/ensayos`

### 2. Preparar una función
1. Marcar obra como LISTA
2. Crear show: POST `/api/shows`
3. Distribuir tickets: POST `/api/shows/:id/assign-tickets`
4. Notificar a vendedores

### 3. Vendedor vende entradas
1. Login como vendedor
2. Ver tickets: GET `/api/tickets/mis-tickets`
3. Reservar: PATCH `/api/tickets/:code` (agregar comprador)
4. Reportar venta: marcar como REPORTADA_VENDIDA
5. Enviar QR al comprador

### 4. Director aprueba ventas
1. Ver reportes: GET `/api/reportes/show/:showId`
2. Revisar tickets reportados
3. Aprobar: POST `/api/admin/aprobar-venta`
4. Marcar como PAGADO

### 5. Validación en puerta
1. Escanear QR del ticket
2. GET `/api/tickets/validar/:code`
3. Sistema verifica y marca como USADO
4. Permitir ingreso

---

## 🎨 CARACTERÍSTICAS DESTACADAS

### Sistema Virgen
- Se entrega sin datos precargados
- Solo existe el usuario supremo inicial
- Ideal para nueva instalación

### Multi-tenancy por Grupos
- Varios grupos teatrales independientes
- Cada director gestiona su grupo
- Obras y ensayos aislados por grupo

### Control de Dinero
- Seguimiento completo de ventas
- Reportes de deuda de vendedores
- Aprobación de admin requerida
- Conciliación automática

### Trazabilidad
- Historial de cambios de estado
- Timestamps en cada transición
- Quién vendió cada ticket
- Quién aprobó cada venta

### Automatización
- Generación de códigos únicos
- Creación de QR automática
- Cálculo de montos
- Reportes en tiempo real

---

## 📞 INTEGRACIONES FUTURAS (Planificadas)

- ✉️ Envío de entradas por email
- 📱 Envío por WhatsApp
- 💳 Pasarela de pago online
- 📧 Notificaciones automáticas
- 📊 Analytics y métricas avanzadas
- 🎫 Impresión de entradas físicas

---

## 🚀 RESUMEN EJECUTIVO

**Baco Teatro** es un sistema completo de gestión teatral que permite:

1. **Administrar grupos teatrales** con directores y actores
2. **Gestionar obras** desde desarrollo hasta archivo
3. **Programar y controlar ensayos** con asistencias
4. **Crear funciones públicas** con gestión de tickets
5. **Distribuir entradas** entre vendedores
6. **Controlar ventas y pagos** con trazabilidad completa
7. **Validar entradas** con códigos QR
8. **Generar reportes** financieros y estadísticos
9. **Ofrecer cartelera pública** con diseño profesional
10. **Controlar accesos** con sistema de roles y permisos

Todo en una sola plataforma, responsive, segura y escalable.

---

**Versión del Sistema:** 3.0  
**Última actualización:** Diciembre 2025  
**Base de Datos:** PostgreSQL 15  
**Framework:** Node.js + Express  
**Frontend:** HTML5 + CSS3 + JavaScript + React Native Web
