# 🎭 BACO TEATRO - ¿Qué hace cada parte del programa?

**Sistema Completo de Gestión Teatral**  
Versión: 3.0.0 (PostgreSQL)  
Fecha: Enero 2026

---

## 📋 ÍNDICE

1. [Resumen General](#resumen-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Base de Datos PostgreSQL](#base-de-datos-postgresql)
4. [Servidor Backend (Node.js/Express)](#servidor-backend)
5. [Frontend HTML/CSS/JavaScript](#frontend-htmlcssjavascript)
6. [Scripts y Automatizaciones](#scripts-y-automatizaciones)
7. [Sistema de Testing](#sistema-de-testing)
8. [Documentación](#documentación)

---

## 🎯 RESUMEN GENERAL

**Baco Teatro** es un sistema completo de gestión teatral que permite:

- ✅ **Gestionar grupos teatrales** con directores y actores
- ✅ **Administrar obras** y ensayos
- ✅ **Programar funciones** (presentaciones)
- ✅ **Vender entradas** con códigos QR únicos
- ✅ **Validar tickets** en la puerta
- ✅ **Generar reportes** y liquidaciones
- ✅ **Control de acceso por roles** (SUPER, ADMIN/Director, ACTOR/Vendedor, INVITADO)
- ✅ **Gestión financiera** (caja, gastos, cuotas, pagos)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                   │
│              Chrome, Firefox, Safari, etc.               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (HTML/CSS/JS)                  │
│  • Páginas estáticas servidas por Express               │
│  • JavaScript puro (sin frameworks)                      │
│  • Fetch API para comunicación con backend              │
│  • localStorage para JWT tokens                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│  • index-v3-postgres.js (servidor principal)             │
│  • Routes (endpoints organizados por módulo)             │
│  • Controllers (lógica de negocio)                       │
│  • Middleware (autenticación JWT)                        │
│  • Services (operaciones complejas)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ SQL Queries
                       ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                  │
│  • 15 tablas principales                                 │
│  • Relaciones con Foreign Keys                           │
│  • Índices para performance                              │
│  • Constraints para integridad                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ BASE DE DATOS POSTGRESQL

### Ubicación
- **Archivo:** `teatro-tickets-backend/db/init-v3-postgres.sql`
- **Conexión:** Via variable de entorno `DATABASE_URL`
- **Puerto:** 5432 (PostgreSQL estándar)

### Tablas Principales (15 tablas)

#### 1. **USERS** - Usuarios del sistema
```sql
Campos principales:
- cedula (PK): Identificador único del usuario
- name: Nombre completo
- apellido: Apellido
- role: SUPER | ADMIN | ACTOR | INVITADO
- password_hash: Contraseña encriptada (bcrypt)
- phone: Teléfono único
- email: Correo electrónico
- fecha_nacimiento: Fecha de nacimiento
- genero: masculino | femenino | otro
- foto_url: URL de foto de perfil
- active: Usuario activo/inactivo
- created_at: Fecha de creación
```

**¿Qué hace?**
- Almacena todos los usuarios del sistema
- Controla acceso mediante roles
- Gestiona credenciales de autenticación
- Permite perfiles personalizados con fotos

#### 2. **GRUPOS** - Grupos teatrales
```sql
Campos principales:
- id (PK): ID autoincremental
- nombre: Nombre del grupo
- descripcion: Descripción del grupo
- director_cedula (FK): Cédula del director principal
- dia_semana: Día de ensayo (Lunes, Martes...)
- hora_inicio: Hora de inicio de ensayos
- fecha_inicio: Fecha de inicio del grupo
- fecha_fin: Fecha de finalización
- obra_a_realizar: Obra que están montando
- estado: ACTIVO | INACTIVO | PAUSADO | ARCHIVADO
- foto_url: Foto del grupo
```

**¿Qué hace?**
- Organiza compañías teatrales
- Asigna director responsable
- Planifica horarios de ensayos
- Controla ciclo de vida del grupo

#### 3. **GRUPO_MIEMBROS** - Integrantes de grupos
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Referencia al grupo
- miembro_cedula (FK): Cédula del miembro
- rol_en_grupo: DIRECTOR | ACTOR
- joined_at: Fecha de ingreso
- fecha_salida: Fecha de salida (si aplica)
- activo: Si está activo en el grupo
```

**¿Qué hace?**
- Relaciona usuarios con grupos
- Permite múltiples directores (co-dirección)
- Registra historial de participación
- Controla actores activos vs históricos

#### 4. **OBRAS** - Obras de teatro
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Grupo que desarrolla la obra
- nombre: Título de la obra
- descripcion: Sinopsis
- autor: Autor/dramaturgo
- genero: Comedia, Drama, Musical...
- duracion_aprox: Duración en minutos
- estado: EN_DESARROLLO | LISTA | ARCHIVADA
```

**¿Qué hace?**
- Registra obras en desarrollo
- Vincula obras con grupos
- Controla estado de preparación
- Almacena información artística

#### 5. **ENSAYOS** - Ensayos programados
```sql
Campos principales:
- id (PK): ID autoincremental
- obra_id (FK): Obra que se ensaya
- fecha: Fecha y hora del ensayo
- lugar: Ubicación del ensayo
- notas: Observaciones
- asistentes: JSON con lista de asistentes
```

**¿Qué hace?**
- Programa sesiones de ensayo
- Controla asistencia de actores
- Organiza preparación de obras
- Permite notas del director

#### 6. **FUNCIONES** - Presentaciones públicas
```sql
Campos principales:
- id (PK): ID autoincremental
- obra_id (FK): Obra que se presenta
- fecha: Fecha y hora de la función
- lugar: Teatro/sala de presentación
- capacidad: Número de entradas totales
- precio_base: Precio por entrada
- foto_url: Afiche de la función
- estado: PROGRAMADA | CONFIRMADA | CANCELADA | REALIZADA
```

**¿Qué hace?**
- Programa funciones públicas
- Define capacidad y precios
- Controla disponibilidad
- Gestiona estados de funciones

#### 7. **TICKETS** - Entradas/boletos
```sql
Campos principales:
- code (PK): Código único del ticket (formato: FUNC-123-001)
- funcion_id (FK): Función asociada
- estado: DISPONIBLE | STOCK_ACTOR | STOCK_VENDEDOR | RESERVADO | 
         REPORTADA_VENDIDA | PAGADO | USADO | ANULADO
- vendedor_phone: Teléfono del vendedor asignado
- comprador_nombre: Nombre del comprador final
- comprador_contacto: Email o teléfono del comprador
- precio: Precio de venta
- medio_pago: efectivo | transferencia | mercadopago
- qr_code: Data URL del código QR
- reportada_por_vendedor: Si vendedor reportó la venta
- aprobada_por_admin: Si director cobró el dinero
- anulado_motivo: Razón de anulación
- created_at, reservado_at, reportada_at, pagado_at, usado_at: Timestamps
```

**¿Qué hace?**
- Genera entradas únicas con QR
- Asigna tickets a vendedores
- Registra ventas completas
- Controla flujo de dinero estricto
- Permite anulación con auditoría
- Valida entrada en puerta (scanner)

#### 8. **TICKET_MOVIMIENTOS** - Auditoría de tickets
```sql
Campos principales:
- id (PK): ID autoincremental
- tipo: ASIGNACION | RESERVA | VENTA_REPORTADA | PAGO_APROBADO | 
       TRANSFERENCIA | ANULACION | VALIDACION
- ticket_code (FK): Código del ticket
- desde_phone: Vendedor origen (en transferencias)
- hacia_phone: Vendedor destino
- estado_anterior: Estado previo
- estado_nuevo: Estado nuevo
- motivo: Razón del movimiento
- realizado_por: Usuario que ejecutó
- timestamp: Momento exacto
```

**¿Qué hace?**
- Audita cada cambio de ticket
- Registra transferencias entre vendedores
- Crea trazabilidad completa
- Permite investigar inconsistencias
- Cumple con requerimientos contables

#### 9. **REPORTES_OBRAS** - Reportes históricos
```sql
Campos principales:
- id (PK): ID autoincremental
- show_id: ID de la función (compat: funcion_id)
- nombre_obra: Nombre de la obra
- fecha_show: Fecha de la función
- director_id: Cédula del director
- total_tickets: Total de entradas
- tickets_vendidos: Cantidad vendida
- tickets_usados: Cantidad validada
- ingresos_totales: Dinero recaudado
- datos_vendedores: JSON con performance por vendedor
- datos_ventas: JSON con detalles
- fecha_generacion: Timestamp del reporte
```

**¿Qué hace?**
- Persiste reportes de funciones
- Almacena performance de vendedores
- Mantiene historial de ingresos
- Permite análisis retroactivo

#### 10. **CUOTAS** - Cuotas de actores
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Grupo al que pertenece
- actor_cedula (FK): Actor que debe pagar
- monto: Monto de la cuota
- concepto: Descripción (mensual, materiales...)
- fecha_vencimiento: Fecha límite de pago
- pagado: Si está pagado o pendiente
- fecha_pago: Cuándo se pagó
- metodo_pago: efectivo | transferencia
- created_at: Fecha de creación
```

**¿Qué hace?**
- Controla cuotas mensuales de actores
- Gestiona deudas de materiales/vestuario
- Registra pagos con fechas
- Permite seguimiento financiero

#### 11. **GASTOS** - Gastos del grupo
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Grupo que realiza el gasto
- concepto: Descripción del gasto
- monto: Cantidad gastada
- fecha: Fecha del gasto
- categoria: vestuario | escenografía | publicidad | otros
- responsable_cedula: Quien autorizó el gasto
- comprobante_url: Foto/PDF del comprobante
- created_at: Timestamp
```

**¿Qué hace?**
- Registra gastos de producción
- Categoriza egresos
- Almacena comprobantes
- Permite contabilidad detallada

#### 12. **CAJA** - Control de caja
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Grupo al que pertenece
- tipo_movimiento: INGRESO | EGRESO
- monto: Cantidad
- concepto: Descripción
- categoria: venta_tickets | cuota | gasto | otro
- referencia_id: ID relacionado (ticket, cuota, gasto)
- responsable_cedula: Usuario que registró
- fecha: Fecha del movimiento
- saldo_resultante: Saldo después del movimiento
```

**¿Qué hace?**
- Centraliza flujo de dinero
- Calcula saldo en tiempo real
- Relaciona con tickets/cuotas/gastos
- Permite balance financiero

#### 13. **PAGOS** - Pagos a proveedores/personal
```sql
Campos principales:
- id (PK): ID autoincremental
- grupo_id (FK): Grupo que realiza el pago
- concepto: Descripción
- monto: Cantidad
- beneficiario: Nombre del receptor
- fecha_pago: Cuándo se pagó
- metodo_pago: efectivo | transferencia | cheque
- comprobante_url: Evidencia del pago
- estado: PENDIENTE | PAGADO
```

**¿Qué hace?**
- Registra pagos a terceros
- Controla honorarios
- Gestiona proveedores
- Complementa sistema de gastos

#### 14. **NOTIFICACIONES** - Sistema de mensajes
```sql
Campos principales:
- id (PK): ID autoincremental
- tipo: GLOBAL | GRUPO | ROL | USUARIO
- grupo_id (FK): Si es para un grupo específico
- rol_destino: Si es para un rol (ADMIN, ACTOR...)
- cedula_destino: Si es para un usuario específico
- titulo: Título del mensaje
- mensaje: Contenido
- prioridad: ALTA | MEDIA | BAJA
- created_at: Timestamp
- expires_at: Cuándo expira
```

**¿Qué hace?**
- Envía mensajes a usuarios
- Permite notificaciones grupales
- Notifica por rol (todos los actores)
- Soporta prioridades y expiración

#### 15. **FOTOS_FUNCIONES** - Galería de fotos
```sql
Campos principales:
- id (PK): ID autoincremental
- funcion_id (FK): Función fotografiada
- url: URL de la imagen
- descripcion: Pie de foto
- subida_por: Usuario que subió
- created_at: Timestamp
```

**¿Qué hace?**
- Almacena galería de fotos
- Documenta funciones realizadas
- Permite historial visual
- Complementa marketing

### Relaciones clave (Foreign Keys)

```
USERS ←──┐
         ├── GRUPOS (director_cedula)
         │   └── GRUPO_MIEMBROS (grupo_id)
         │       └── USERS (miembro_cedula)
         │   └── OBRAS (grupo_id)
         │       └── ENSAYOS (obra_id)
         │       └── FUNCIONES (obra_id)
         │           └── TICKETS (funcion_id)
         │               └── TICKET_MOVIMIENTOS (ticket_code)
         │           └── FOTOS_FUNCIONES (funcion_id)
         │   └── CUOTAS (grupo_id, actor_cedula)
         │   └── GASTOS (grupo_id)
         │   └── CAJA (grupo_id)
         │   └── PAGOS (grupo_id)
         └── REPORTES_OBRAS (director_id)
```

---

## 🖥️ SERVIDOR BACKEND

### Ubicación principal
- **Archivo:** `teatro-tickets-backend/index-v3-postgres.js`
- **Puerto:** 3000 (configurable via `process.env.PORT`)
- **Framework:** Express.js

### ¿Qué hace el servidor?

1. **Inicializa la base de datos**
   - Crea tablas si no existen (`initializeDatabase()`)
   - Ejecuta migraciones pendientes
   - Crea usuario SUPER inicial (`initSupremo()`)
   - Inserta datos mínimos (`seedMinimo()`)

2. **Configura middlewares**
   - CORS para permitir peticiones del frontend
   - JSON parsing para recibir datos
   - Deshabilitación de caché en desarrollo
   - Servicio de archivos estáticos (HTML/CSS/JS/imágenes)

3. **Define rutas (Routes)**
   - Organiza endpoints por módulos
   - Aplica autenticación JWT donde corresponde
   - Valida roles y permisos

4. **Ejecuta lógica de negocio (Controllers)**
   - Procesa peticiones
   - Valida datos de entrada
   - Ejecuta consultas SQL
   - Devuelve respuestas JSON

### Rutas del Backend (API Endpoints)

#### **AUTH ROUTES** (`routes/auth.routes.js`)
```
POST /api/auth/login
  - Login con cédula y contraseña
  - Devuelve token JWT
  - Sin protección (público)

POST /api/auth/register
  - Registro de nuevo usuario
  - Hashea contraseña con bcrypt
  - Requiere rol SUPER para crear SUPER/ADMIN
```

#### **USERS ROUTES** (`routes/users.routes.js`)
```
GET /api/users
  - Lista todos los usuarios
  - Protegido: SUPER, ADMIN

GET /api/users/:cedula
  - Obtiene perfil de usuario
  - Protegido: SUPER, ADMIN, o el mismo usuario

PUT /api/users/:cedula
  - Actualiza usuario
  - Protegido: SUPER, ADMIN, o el mismo usuario

DELETE /api/users/:cedula
  - Elimina usuario
  - Protegido: SUPER

PUT /api/users/:cedula/password
  - Cambia contraseña
  - Protegido: el mismo usuario

GET /api/users/cumpleanos/semana
  - Lista cumpleaños de la semana
  - Protegido: todos los usuarios autenticados
```

#### **GRUPOS ROUTES** (`routes/grupos.routes.js`)
```
POST /api/grupos
  - Crea grupo teatral
  - Protegido: SUPER, ADMIN

GET /api/grupos
  - Lista grupos (filtrado por rol)
  - Protegido: todos

GET /api/grupos/:id
  - Detalle de grupo específico
  - Protegido: SUPER, ADMIN del grupo, miembros

PUT /api/grupos/:id
  - Actualiza grupo
  - Protegido: SUPER, director del grupo

DELETE /api/grupos/:id
  - Elimina grupo
  - Protegido: SUPER, director del grupo

POST /api/grupos/:id/miembros
  - Agrega actor al grupo
  - Protegido: SUPER, director del grupo

DELETE /api/grupos/:id/miembros/:cedula
  - Quita actor del grupo
  - Protegido: SUPER, director del grupo
```

#### **OBRAS ROUTES** (`routes/obras.routes.js`)
```
POST /api/obras
  - Crea obra
  - Protegido: SUPER, ADMIN del grupo

GET /api/obras
  - Lista obras (filtradas por acceso)
  - Protegido: todos

GET /api/obras/:id
  - Detalle de obra
  - Protegido: SUPER, ADMIN, miembros del grupo

PUT /api/obras/:id
  - Actualiza obra
  - Protegido: SUPER, director del grupo

DELETE /api/obras/:id
  - Elimina obra
  - Protegido: SUPER, director del grupo
```

#### **FUNCIONES ROUTES** (`routes/funciones.routes.js`)
```
POST /api/funciones
  - Crea función
  - Genera tickets automáticamente
  - Protegido: SUPER, ADMIN

GET /api/funciones
  - Lista funciones (públicas o privadas según rol)
  - PÚBLICO (sin autenticación)

GET /api/funciones/:id
  - Detalle de función
  - PÚBLICO

PUT /api/funciones/:id
  - Actualiza función
  - Protegido: SUPER, director del grupo

DELETE /api/funciones/:id
  - Cancela función
  - Protegido: SUPER, director del grupo

POST /api/funciones/:id/cerrar
  - Cierra función (marca como REALIZADA)
  - Protegido: SUPER, director del grupo
```

#### **TICKETS ROUTES** (`routes/tickets.routes.js`)
```
GET /api/tickets
  - Lista tickets (filtrados por rol)
  - Protegido: SUPER ve todos, ACTOR ve sus tickets

GET /api/tickets/:code
  - Detalle de ticket por código
  - PÚBLICO (para validación en puerta)

POST /api/tickets/generar
  - Genera tickets para función
  - Protegido: SUPER, ADMIN

POST /api/tickets/asignar
  - Asigna tickets a vendedor
  - Protegido: SUPER, ADMIN

POST /api/tickets/:code/reservar
  - Reserva ticket (comprador)
  - Protegido: ACTOR (vendedor)

POST /api/tickets/:code/reportar-venta
  - Vendedor reporta venta
  - Protegido: ACTOR asignado

POST /api/tickets/:code/aprobar-pago
  - Director cobra y marca como PAGADO
  - Protegido: SUPER, ADMIN del grupo

POST /api/tickets/:code/validar
  - Valida ticket en puerta (scanner QR)
  - Protegido: SUPER, ADMIN

POST /api/tickets/:code/anular
  - Anula ticket con motivo
  - Protegido: SUPER, ADMIN

POST /api/tickets/transferir
  - Transfiere tickets entre vendedores
  - Protegido: SUPER, ADMIN
```

#### **REPORTES ROUTES** (`routes/reportes.routes.js`)
```
GET /api/reportes/funcion/:funcionId
  - Genera reporte de ventas de función
  - Protegido: SUPER, ADMIN del grupo

GET /api/reportes/vendedor/:phone
  - Reporte de performance de vendedor
  - Protegido: SUPER, ADMIN, el mismo vendedor

GET /api/reportes/historico/:funcionId
  - Obtiene reporte persistido
  - Protegido: SUPER, ADMIN
```

#### **ENSAYOS ROUTES** (`routes/ensayos.routes.js`)
```
POST /api/ensayos
  - Programa ensayo
  - Protegido: SUPER, ADMIN del grupo

GET /api/ensayos
  - Lista ensayos (filtrados por acceso)
  - Protegido: todos

PUT /api/ensayos/:id
  - Actualiza ensayo
  - Protegido: SUPER, ADMIN

DELETE /api/ensayos/:id
  - Elimina ensayo
  - Protegido: SUPER, ADMIN
```

#### **CUOTAS ROUTES** (`routes/cuotas.routes.js`)
```
POST /api/cuotas
  - Crea cuota para actor
  - Protegido: SUPER, ADMIN

GET /api/cuotas
  - Lista cuotas (filtradas por rol)
  - Protegido: todos

POST /api/cuotas/:id/pagar
  - Marca cuota como pagada
  - Protegido: SUPER, ADMIN

DELETE /api/cuotas/:id
  - Elimina cuota
  - Protegido: SUPER, ADMIN
```

#### **GASTOS ROUTES** (`routes/gastos.routes.js`)
```
POST /api/gastos
  - Registra gasto
  - Protegido: SUPER, ADMIN

GET /api/gastos
  - Lista gastos del grupo
  - Protegido: SUPER, ADMIN, miembros

PUT /api/gastos/:id
  - Actualiza gasto
  - Protegido: SUPER, ADMIN

DELETE /api/gastos/:id
  - Elimina gasto
  - Protegido: SUPER, ADMIN
```

#### **CAJA ROUTES** (en `routes/contabilidad.routes.js`)
```
GET /api/caja/:grupoId
  - Obtiene movimientos de caja
  - Protegido: SUPER, ADMIN, miembros

GET /api/caja/:grupoId/saldo
  - Obtiene saldo actual
  - Protegido: SUPER, ADMIN

POST /api/caja/:grupoId/movimiento
  - Registra movimiento manual
  - Protegido: SUPER, ADMIN
```

#### **NOTIFICACIONES ROUTES** (en `routes/admin.routes.js`)
```
POST /api/notificaciones
  - Crea notificación
  - Protegido: SUPER, ADMIN

GET /api/notificaciones
  - Lista notificaciones para el usuario
  - Protegido: todos

DELETE /api/notificaciones/:id
  - Elimina notificación
  - Protegido: SUPER, creador
```

#### **PUBLIC ROUTES** (`routes/public.routes.js`)
```
GET /api/funciones/proximas
  - Lista próximas funciones públicas
  - PÚBLICO (sin autenticación)

GET /api/funciones/hoy
  - Funciones de hoy
  - PÚBLICO

GET /api/grupos/activos
  - Lista grupos activos
  - PÚBLICO
```

### Middleware de Autenticación

**Archivo:** `middleware/auth.js`

**¿Qué hace?**
- Extrae token JWT del header Authorization
- Verifica validez del token
- Decodifica cedula y rol
- Inyecta `req.user` con datos del usuario
- Permite validar roles específicos

**Uso:**
```javascript
router.get('/ruta-protegida', authenticateToken, (req, res) => {
  // req.user contiene: { cedula, role }
});

router.post('/ruta-admin', requireRoles(['SUPER', 'ADMIN']), (req, res) => {
  // Solo SUPER y ADMIN pueden acceder
});
```

### Controllers (Lógica de negocio)

Los controllers están en `controllers/` y separan la lógica HTTP de la lógica de negocio:

- **authController.js** - Login, registro, cambio de contraseñas
- **usersController.js** - CRUD de usuarios
- **gruposController.js** - CRUD de grupos, gestión de miembros
- **obrasController.js** - CRUD de obras
- **funcionesController.js** - CRUD de funciones, generación de tickets
- **ticketsController.js** - Gestión completa de tickets, ventas, validación
- **reportesController.js** - Generación de reportes y estadísticas

---

## 🌐 FRONTEND HTML/CSS/JAVASCRIPT

### Ubicación
- **Carpeta:** `teatro-tickets-backend/public/`
- **Servido por:** Express.js como archivos estáticos
- **Sin frameworks:** JavaScript puro (Vanilla JS)

### Estructura de Páginas HTML

#### **1. Páginas Públicas** (sin autenticación)

##### **index.html** - Página de inicio
**¿Qué hace?**
- Landing page del sistema
- Muestra información institucional
- Enlaces a funciones y login
- Carrusel de próximas funciones

##### **funciones-hoy.html** - Funciones de hoy
**¿Qué hace?**
- Lista funciones programadas para hoy
- Tarjetas con foto, obra, hora, lugar
- Precio y botón "Comprar entrada"
- Actualización en tiempo real

##### **proximas-funciones.html** - Próximas funciones
**¿Qué hace?**
- Calendario de funciones futuras
- Filtros por fecha, grupo, obra
- Vista de cuadrícula con detalles
- Links para compra de tickets

##### **sobre-baco.html** - Sobre nosotros
**¿Qué hace?**
- Historia de Baco Teatro
- Misión y visión
- Equipo fundador
- Información de contacto
- Email: bacoteatro@montevideo.com.uy
- Teléfono y redes sociales

##### **guia.html** - Cómo usar
**¿Qué hace?**
- Tutorial para usuarios
- Explicación de roles
- Flujo de compra de entradas
- Guía para vendedores
- FAQ (preguntas frecuentes)

##### **desarrollador.html** - Documentación técnica
**¿Qué hace?**
- Información para desarrolladores
- Endpoints de la API
- Ejemplos de uso
- Códigos de estado HTTP
- Estructura de respuestas JSON

#### **2. Autenticación**

##### **pages/auth/login.html** - Login
**¿Qué hace?**
- Formulario de login (cédula + contraseña)
- Autenticación via POST /api/auth/login
- Recibe token JWT
- Guarda token en localStorage
- Redirige según rol:
  - SUPER → `/pages/roles/super.html`
  - ADMIN → `/pages/roles/director.html`
  - ACTOR → `/pages/roles/actor.html`
  - INVITADO → `/pages/roles/super.html` (fallback)

#### **3. Dashboards por Rol**

##### **pages/roles/super.html** - Dashboard SUPER Usuario
**¿Qué hace?**
- **Panel principal:** Resumen con métricas globales
  - Total de usuarios activos
  - Grupos registrados
  - Obras en desarrollo
  - Funciones programadas
  - Tickets vendidos hoy

- **Gestión de Usuarios:**
  - Listar todos los usuarios
  - Crear nuevos usuarios (todos los roles)
  - Editar cualquier usuario
  - Desactivar/activar usuarios
  - Resetear contraseñas
  - Ver cumpleaños semanales

- **Gestión de Grupos:**
  - Listar todos los grupos
  - Crear nuevo grupo
  - Editar cualquier grupo
  - Ver miembros de cada grupo
  - Agregar/quitar directores y actores
  - Archivar/finalizar grupos
  - Subir fotos de grupo

- **Gestión de Obras:**
  - Listar todas las obras del sistema
  - Crear obras para cualquier grupo
  - Editar cualquier obra
  - Cambiar estado (EN_DESARROLLO, LISTA, ARCHIVADA)
  - Eliminar obras

- **Gestión de Funciones:**
  - Listar todas las funciones
  - Crear función para cualquier obra
  - Editar función
  - Cancelar función
  - Cerrar función (marcar como REALIZADA)
  - Ver estadísticas de ventas

- **Gestión de Tickets:**
  - Ver todos los tickets del sistema
  - Generar tickets para función
  - Asignar tickets a vendedores
  - Transferir tickets entre vendedores
  - Aprobar pagos (cobrar a vendedores)
  - Anular tickets con motivo
  - Validar tickets (scanner QR)
  - Ver reportes por vendedor

- **Notificaciones:**
  - Crear notificación global (todos los usuarios)
  - Crear notificación por grupo
  - Crear notificación por rol
  - Ver notificaciones recibidas
  - Eliminar notificaciones

- **Perfil Personal:**
  - Ver y editar su información
  - Cambiar contraseña
  - Subir foto de perfil
  - Ver frase teatral aleatoria del día

##### **pages/roles/director.html** - Dashboard Director (ADMIN)
**¿Qué hace?**
- **Panel principal:** Resumen de sus grupos
  - Grupos que dirige
  - Obras en desarrollo
  - Funciones programadas
  - Ventas del día

- **Mis Grupos:**
  - Listar grupos donde es director
  - Crear nuevo grupo
  - Editar sus grupos
  - Ver miembros actuales
  - Agregar actores
  - Quitar actores
  - Agregar co-directores
  - Subir foto del grupo

- **Obras:**
  - Listar obras de sus grupos
  - Crear nueva obra
  - Editar sus obras
  - Cambiar estado de obra
  - Archivar obra

- **Ensayos:**
  - Programar ensayos para sus obras
  - Ver calendario de ensayos
  - Editar/cancelar ensayos
  - Registrar asistencia

- **Funciones:**
  - Crear función para sus obras
  - Editar función
  - Cancelar función
  - Cerrar función después de realizada
  - Ver estadísticas de ventas

- **Boletería (Venta de Tickets):**
  - Generar tickets para función
  - Asignar tickets a vendedores (actores)
  - Transferir tickets entre vendedores
  - Aprobar pagos de vendedores
  - Ver reportes de ventas por vendedor
  - Descargar PDF de liquidación
  - Validar tickets en puerta (scanner QR)

- **Contabilidad:**
  - Ver caja del grupo (ingresos/egresos)
  - Registrar gastos
  - Gestionar cuotas de actores
  - Registrar pagos
  - Ver balance financiero
  - Exportar reporte contable

- **Notificaciones:**
  - Crear notificación para su grupo
  - Ver notificaciones recibidas

- **Perfil:**
  - Editar información personal
  - Cambiar contraseña
  - Subir foto de perfil

##### **pages/roles/actor.html** - Dashboard Actor (ACTOR/VENDEDOR)
**¿Qué hace?**
- **Panel principal:** Mis ventas de hoy
  - Tickets asignados disponibles
  - Tickets vendidos
  - Dinero a entregar al director
  - Próximos ensayos

- **Mis Grupos:**
  - Ver grupos donde participa
  - Ver información del grupo
  - Ver miembros del grupo
  - Ver próximos ensayos

- **Mis Tickets:**
  - Ver tickets asignados
  - Filtrar por función
  - Descargar tickets (PDF con QR)
  - Compartir por WhatsApp
  - Enviar por Email

- **Vender Ticket:**
  - Seleccionar ticket disponible
  - Ingresar datos del comprador:
    - Nombre completo
    - Email o teléfono
  - Elegir medio de pago (efectivo, transferencia)
  - Reportar venta
  - Enviar ticket al comprador (Email/WhatsApp)

- **Transferir Tickets:**
  - Seleccionar tickets a transferir
  - Elegir otro vendedor del grupo
  - Confirmar transferencia

- **Mis Ventas:**
  - Ver historial de ventas
  - Total vendido
  - Dinero pendiente de entrega
  - Tickets ya pagados al director

- **Mis Cuotas:**
  - Ver cuotas pendientes
  - Ver cuotas pagadas
  - Historial de pagos

- **Próximos Ensayos:**
  - Calendario de ensayos
  - Confirmar asistencia
  - Ver lugar y hora

- **Perfil:**
  - Editar información personal
  - Cambiar contraseña
  - Subir foto de perfil

#### **4. Páginas Específicas**

##### **pages/admin/grupos.html** - Lista de grupos
**¿Qué hace?**
- Muestra tabla de grupos
- Filtros por estado (ACTIVO, ARCHIVADO)
- Buscar por nombre
- Link a detalle de cada grupo

##### **pages/admin/grupo-detalle.html** - Detalle de grupo
**¿Qué hace?**
- Información completa del grupo
- Lista de directores
- Lista de actores
- Obras asociadas
- Funciones programadas
- Estadísticas del grupo
- Botones de acción (editar, archivar)

##### **pages/obra-profesional/boleteria.html** - Boletería de función
**¿Qué hace?**
- Vista completa de boletería para una función
- Generación masiva de tickets
- Asignación a vendedores
- Monitor en tiempo real:
  - Total de tickets
  - Disponibles
  - Asignados
  - Vendidos
  - Usados (validados)
- Barra de progreso visual
- Lista de vendedores con su performance
- Scanner QR para validación
- Botón para cerrar función

##### **pages/obra-profesional/balance.html** - Balance financiero
**¿Qué hace?**
- Resumen contable de función
- Ingresos por ventas de tickets
- Gastos de producción
- Balance neto (ganancia/pérdida)
- Distribución entre miembros
- Gráficos de torta (ingresos/gastos)
- Exportar PDF

### JavaScript en el Frontend

#### **js/auth.js** - Autenticación
**¿Qué hace?**
- Función `getToken()`: Obtiene JWT del localStorage
- Función `getUser()`: Decodifica token para obtener cedula y rol
- Función `logout()`: Elimina token y redirige a login
- Función `checkAuth()`: Verifica si hay sesión activa

#### **js/api.js** - Cliente API
**¿Qué hace?**
- Funciones wrapper para fetch API
- `get(url)`: GET request con autenticación
- `post(url, data)`: POST request
- `put(url, data)`: PUT request
- `del(url)`: DELETE request
- Todas incluyen header `Authorization: Bearer <token>`
- Manejo de errores centralizados

#### **js/utils.js** - Utilidades
**¿Qué hace?**
- `formatDate(date)`: Formatea fechas para mostrar
- `formatCurrency(amount)`: Formatea montos ($1,500)
- `generateQR(text)`: Genera código QR
- `showModal(title, message)`: Muestra modal de confirmación
- `showToast(message, type)`: Notificación temporal
- `validateEmail(email)`: Valida formato de email
- `validateCedula(cedula)`: Valida cédula uruguaya

#### **js/scanner.js** - Scanner QR
**¿Qué hace?**
- Activa cámara del dispositivo
- Lee código QR en tiempo real
- Extrae código del ticket
- Valida contra API
- Muestra resultado (válido/inválido/usado)
- Reproduce sonido de confirmación

### CSS (Estilos)

#### **css/main.css** - Estilos globales
**¿Qué hace?**
- Reset CSS y normalización
- Variables CSS (colores, fuentes, espaciados)
- Tipografía base
- Layout responsive
- Grid system
- Utilidades (margin, padding, text-align)

#### **css/dashboard.css** - Estilos de dashboards
**¿Qué hace?**
- Sidebar navigation
- Tarjetas (cards) de métricas
- Tablas responsivas
- Botones de acción
- Badges de estado
- Avatares de usuario

#### **css/forms.css** - Formularios
**¿Qué hace?**
- Inputs estilizados
- Selects personalizados
- Checkboxes y radios
- Validación visual (success/error)
- Labels flotantes

#### **css/modals.css** - Modales
**¿Qué hace?**
- Overlay semi-transparente
- Contenedor de modal centrado
- Animaciones de entrada/salida
- Botones de acción (guardar/cancelar)
- Responsive en móvil

---

## 🔧 SCRIPTS Y AUTOMATIZACIONES

### Ubicación
- **Carpeta:** `/scripts/`

### Scripts principales

#### **borrar.sh** - Limpieza de base de datos
**¿Qué hace?**
```bash
# Elimina TODOS los datos excepto:
# - Usuario SUPER (48376669)
# - Preserva estructura de tablas

# Uso:
./scripts/borrar.sh
```
- Conecta a PostgreSQL
- Ejecuta DELETE FROM en todas las tablas
- Mantiene usuario supremo intacto
- Útil para resetear sistema en desarrollo

#### **limpieza-automatica-postgres.js** - Limpieza programada
**¿Qué hace?**
```javascript
// Elimina automáticamente:
// - Funciones pasadas (más de 7 días)
// - Tickets de funciones eliminadas
// - Notificaciones expiradas
// - Reportes antiguos (más de 6 meses)

// Uso:
node scripts/limpieza-automatica-postgres.js
```
- Se puede ejecutar con cron job
- Mantiene DB limpia
- No afecta datos históricos importantes

#### **crear-datos-prueba.sh** - Datos de testing
**¿Qué hace?**
```bash
# Crea datos ficticios para testing:
# - 5 directores
# - 10 actores
# - 5 grupos
# - 10 obras
# - 20 funciones
# - 500 tickets

# Uso:
./scripts/crear-datos-prueba.sh
```

#### **crear-grupos-prueba.js** - Grupos de demostración
**¿Qué hace?**
```javascript
// Crea 5 grupos teatrales reales:
// - La Candela
// - Los Trágicos
// - Etapas
// - Máscaras Teatro
// - Baco
// Con obras y funciones para cada uno

// Uso:
node scripts/crear-grupos-prueba.js
```

#### **reset-super-password.js** - Resetear contraseña SUPER
**¿Qué hace?**
```javascript
// Resetea contraseña del usuario SUPER
// Contraseña por defecto: Teamomama91

// Uso:
node scripts/reset-super-password.js
```

---

## 🧪 SISTEMA DE TESTING

### Ubicación
- **Carpeta:** `/tests/`

### Tests disponibles

#### **test-integracion.sh** - Test completo E2E
**¿Qué hace?**
```bash
# Ejecuta suite completa de tests:
# 1. Verifica servidor activo
# 2. Test de endpoints públicos
# 3. Test de autenticación (3 roles)
# 4. Test de CRUD (grupos, obras, funciones)
# 5. Test de venta de tickets
# 6. Test de validación QR
# 7. Test de reportes

# Uso:
bash test-integracion.sh
```

#### **test-super-usuario.js** - Test rol SUPER
**¿Qué hace?**
```javascript
// Valida todas las operaciones de SUPER:
// - Crear usuarios de todos los roles
// - Gestionar cualquier grupo
// - Editar cualquier obra
// - Asignar tickets
// - Generar reportes globales
```

#### **test-director.js** - Test rol ADMIN
**¿Qué hace?**
```javascript
// Valida operaciones de director:
// - Crear su grupo
// - Crear obras para su grupo
// - Programar funciones
// - Generar tickets
// - Asignar a vendedores
// - Ver reportes de su grupo
// - No puede ver datos de otros grupos
```

#### **test-vendedores.js** - Test rol ACTOR
**¿Qué hace?**
```javascript
// Valida operaciones de vendedor:
// - Ver solo sus tickets asignados
// - Reportar ventas
// - Transferir tickets a compañero
// - No puede crear funciones
// - No puede asignar tickets
```

#### **test-invitados.js** - Test usuario INVITADO
**¿Qué hace?**
```javascript
// Valida restricciones de invitado:
// - Ver solo funciones públicas
// - No puede comprar tickets directamente
// - No accede a dashboards privados
```

---

## 📚 DOCUMENTACIÓN

### Archivos de documentación

#### **README.md** - Guía de inicio rápido
- Setup en 2 pasos
- Credenciales de prueba
- URLs principales
- Comandos básicos

#### **INICIO.md** - Resumen ejecutivo
- Estado del proyecto
- Checklist de completación
- Stack tecnológico
- Guía de deploy

#### **todo-lo-que-hace.md** - Funcionalidades completas
- Descripción por rol
- Flujos de trabajo
- Características técnicas
- Casos de uso

#### **DEPLOYMENT_GUIDE.md** - Guía de deploy
- Deploy en Render (backend)
- Deploy en Netlify (frontend)
- Variables de entorno
- Configuración de dominio

#### **GUIA-RAPIDA.md** - Referencia rápida
- Comandos frecuentes
- Solución de problemas
- Tips de desarrollo

#### **QUICK-REFERENCE.md** - Cheat sheet
- Endpoints principales
- Ejemplos de curl
- Códigos de error
- Formato de respuestas

---

## 🔄 FLUJOS DE TRABAJO PRINCIPALES

### 1. Creación de Grupo y Función

```
SUPER/DIRECTOR
    ↓
Crea GRUPO (nombre, horarios, director)
    ↓
Agrega ACTORES al grupo (vendedores)
    ↓
Crea OBRA (nombre, descripción, autor)
    ↓
Programa ENSAYOS (fechas, lugar)
    ↓
Cambia estado obra a "LISTA"
    ↓
Crea FUNCIÓN (fecha, lugar, capacidad, precio)
    ↓
Sistema genera TICKETS automáticamente (N tickets con QR único)
    ↓
FUNCIÓN LISTA PARA VENDER
```

### 2. Venta de Entradas

```
DIRECTOR
    ↓
Asigna tickets a VENDEDOR (actor del grupo)
    ↓
VENDEDOR
    ↓
Ve sus tickets en "Mis Tickets"
    ↓
Contacta comprador (fuera del sistema)
    ↓
Ingresa datos del comprador en el sistema
    ↓
Reporta venta (estado: REPORTADA_VENDIDA)
    ↓
Recibe dinero del comprador
    ↓
Envía ticket por Email/WhatsApp (con QR)
    ↓
DIRECTOR
    ↓
Vendedor entrega dinero al director
    ↓
Director marca ticket como PAGADO
    ↓
Dinero queda registrado en CAJA
```

### 3. Validación en Puerta

```
COMPRADOR llega al teatro con ticket (QR)
    ↓
DIRECTOR/PORTERO escanea QR con app
    ↓
Sistema valida:
  - ¿Ticket existe?
  - ¿Está pagado?
  - ¿No fue usado antes?
  - ¿Corresponde a esta función?
    ↓
SI TODO OK:
  - Marca ticket como USADO
  - Registra timestamp
  - Muestra ✅ VÁLIDO
  - Permite ingreso
    ↓
SI PROBLEMA:
  - Muestra ❌ INVÁLIDO
  - Indica motivo (no pagado, usado, etc.)
  - No permite ingreso
```

### 4. Liquidación Post-Función

```
FUNCIÓN REALIZADA
    ↓
DIRECTOR cierra función (botón "Cerrar Función")
    ↓
Sistema genera REPORTE automático:
  - Total de tickets generados
  - Total vendidos
  - Total usados (asistencia real)
  - Ingresos por vendedor
  - Comisiones
  - Balance neto
    ↓
Sistema actualiza CAJA:
  - Ingreso por ventas
  - Egreso por gastos de producción
  - Saldo resultante
    ↓
DIRECTOR descarga PDF de liquidación
    ↓
Sistema archiva reporte en BD (tabla reportes_obras)
```

---

## 🎯 RESUMEN DE ROLES Y PERMISOS

### SUPER USUARIO
- ✅ **TODO** lo que hacen otros roles
- ✅ Crear usuarios SUPER y ADMIN
- ✅ Ver/editar cualquier grupo, obra, función
- ✅ Acceso a todos los reportes del sistema
- ✅ Gestión global de notificaciones
- ✅ Resetear contraseñas de cualquier usuario

### DIRECTOR (ADMIN)
- ✅ Crear y gestionar **sus grupos**
- ✅ Agregar/quitar actores de sus grupos
- ✅ Crear obras y funciones para sus grupos
- ✅ Generar y asignar tickets
- ✅ Aprobar pagos de vendedores
- ✅ Validar tickets en puerta
- ✅ Ver reportes de **sus grupos**
- ✅ Gestión contable de sus grupos (caja, gastos, cuotas)
- ❌ NO puede ver datos de otros grupos
- ❌ NO puede crear usuarios SUPER

### ACTOR (VENDEDOR)
- ✅ Ver grupos donde participa
- ✅ Ver **solo sus tickets** asignados
- ✅ Reportar ventas de sus tickets
- ✅ Transferir tickets a compañeros del mismo grupo
- ✅ Ver sus propios reportes de ventas
- ✅ Ver y pagar sus cuotas
- ✅ Confirmar asistencia a ensayos
- ❌ NO puede crear funciones
- ❌ NO puede asignar tickets
- ❌ NO puede aprobar pagos
- ❌ NO puede validar tickets

### INVITADO
- ✅ Ver cartelera pública de funciones
- ✅ Comprar tickets (si implementado)
- ❌ NO accede a dashboards
- ❌ NO ve información interna de grupos

---

## 🔐 SEGURIDAD

### Medidas implementadas

1. **Autenticación JWT**
   - Token firmado con JWT_SECRET
   - Expiración configurable (24h default)
   - Renovación automática en cada request

2. **Bcrypt para contraseñas**
   - Hash con salt rounds = 10
   - Nunca se almacenan contraseñas en texto plano

3. **SQL Parameterizado**
   - Todas las queries usan parámetros preparados
   - Previene SQL Injection

4. **CORS Restringido**
   - Solo permite origen configurado (FRONTEND_URL)
   - Bloquea peticiones de dominios no autorizados

5. **Validación de Roles**
   - Middleware valida permisos antes de ejecutar acción
   - Usuarios solo acceden a datos permitidos

6. **Auditoría de Tickets**
   - Tabla ticket_movimientos registra CADA cambio
   - Trazabilidad completa para investigaciones

7. **HTTPS en Producción**
   - Render provee SSL/TLS automático
   - Cookies seguras (httpOnly, secure)

---

## 📊 TECNOLOGÍAS UTILIZADAS

### Backend
- **Node.js** v18+ - Runtime JavaScript
- **Express.js** v4 - Framework web
- **PostgreSQL** v15 - Base de datos relacional
- **JWT** - Autenticación con tokens
- **Bcrypt** - Hash de contraseñas
- **QRCode** - Generación de códigos QR
- **PDFKit** - Generación de PDF (reportes)

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos (Grid, Flexbox, Variables CSS)
- **JavaScript ES6+** - Lógica (Vanilla JS, sin frameworks)
- **Fetch API** - Comunicación con backend
- **LocalStorage** - Persistencia de sesión

### DevOps
- **Docker** - Contenedor para PostgreSQL local
- **Git** - Control de versiones
- **GitHub** - Repositorio remoto
- **Render** - Deploy de backend (producción)
- **VS Code** - Editor principal
- **Tasks.json** - Automatización de comandos

---

## 🎉 CONCLUSIÓN

**Baco Teatro** es un sistema completo y profesional que cubre todo el ciclo de gestión teatral:

✅ Desde la creación de un grupo hasta la liquidación post-función  
✅ Control estricto de dinero y auditoría completa  
✅ Interfaces simples para usuarios no técnicos  
✅ Arquitectura escalable y mantenible  
✅ Seguridad robusta con autenticación y roles  
✅ Testing completo y documentación exhaustiva  

**El sistema está listo para producción y puede ser usado por compañías teatrales reales.**

---

## 📞 CONTACTO

**Baco Teatro**  
Email: bacoteatro@montevideo.com.uy  
Sistema desarrollado en Uruguay 🇺🇾

---

**Última actualización:** Enero 2026  
**Versión:** 3.0.0 (PostgreSQL)  
**Autor:** Sistema Baco Teatro
