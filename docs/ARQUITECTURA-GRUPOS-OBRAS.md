# 🎭 Arquitectura Grupos → Obras → Ensayos/Funciones

## Descripción General

El sistema implementa una jerarquía teatral de tres niveles que refleja el flujo de trabajo real de una compañía de teatro:

```
GRUPOS (Teatro/Compañía)
    ↓
OBRAS (Trabajo teatral)
    ↓
ENSAYOS + FUNCIONES (Preparación y presentación)
```

## Estructura Jerárquica

### 1. GRUPOS

Los **grupos** representan compañías teatrales o colectivos de teatro. Cada grupo tiene:

**Propiedades:**
- `nombre` - Nombre del grupo/compañía
- `descripcion` - Descripción del grupo
- `director_cedula` - Director principal del grupo
- `dia_semana` - Día fijo de clases (NO se puede cambiar después de creación)
- `hora_inicio` - Hora fija de inicio de clases (NO se puede cambiar)
- `fecha_inicio` / `fecha_fin` - Período de actividad del grupo
- `estado` - ACTIVO | ARCHIVADO

**Miembros:**
- Directores (rol: DIRECTOR) - Pueden ser ADMIN
- Actores (rol: ACTOR) - Usuarios con rol VENDEDOR
- Co-directores permitidos: Varios usuarios ADMIN pueden tener rol DIRECTOR en el mismo grupo

**Funcionalidades:**
- Crear/editar/archivar grupos
- Gestionar miembros (agregar/eliminar actores y directores)
- Visualizar todas las obras del grupo

### 2. OBRAS

Las **obras** son trabajos teatrales específicos que un grupo desarrolla. Cada obra pertenece a un grupo.

**Propiedades:**
- `grupo_id` - FK al grupo que desarrolla la obra
- `nombre` - Nombre de la obra teatral
- `descripcion` - Sinopsis de la obra
- `autor` - Autor de la obra
- `genero` - Drama, Comedia, Tragedia, etc.
- `duracion_aprox` - Duración aproximada en minutos
- `estado` - EN_DESARROLLO | LISTA | ARCHIVADA

**Ciclo de vida:**
1. **EN_DESARROLLO** - Obra en proceso de montaje
2. **LISTA** - Obra lista para presentar
3. **ARCHIVADA** - Obra finalizada/archivada

**Funcionalidades:**
- Crear/editar obras dentro de un grupo
- Marcar obra como "Lista" cuando está preparada
- Archivar obras finalizadas
- Desde una obra se crean ensayos y funciones

### 3. ENSAYOS

Los **ensayos** son prácticas preparatorias para una obra específica.

**Propiedades:**
- `obra_id` - FK a la obra que se ensaya
- `titulo` - Nombre descriptivo del ensayo
- `fecha` - Fecha del ensayo
- `hora_fin` - Hora de finalización
- `lugar` - Ubicación del ensayo
- `descripcion` - Detalles del ensayo (escenas, objetivos, etc.)

**Características:**
- Solo los directores del grupo pueden crear ensayos
- Los miembros del grupo pueden ver los ensayos
- Se muestran: próximos ensayos y ensayos pasados

### 4. FUNCIONES (Shows)

Las **funciones** son presentaciones públicas de una obra.

**Propiedades:**
- `obra_id` - FK a la obra que se presenta
- `obra` - Nombre de la obra (campo legacy, ahora se usa obra_id)
- `fecha` - Fecha de la función
- `lugar` - Teatro/ubicación de la función
- `capacidad` - Aforo total
- `base_price` - Precio base de las entradas

**Características:**
- Solo directores pueden crear funciones
- Al crear función se generan tickets automáticamente
- Los tickets se distribuyen entre los vendedores/actores
- Público invitado puede ver funciones futuras y comprar entradas

## Permisos y Roles

### Usuario SUPER (Supremo)
- ✅ Ve y gestiona TODO
- ✅ Puede crear/editar/eliminar grupos, obras, ensayos, funciones
- ✅ Acceso total a todas las funcionalidades

### Usuario ADMIN (Director)
- ✅ Puede crear grupos (se convierte en director)
- ✅ Puede ser co-director en otros grupos
- ✅ Ve solo sus grupos y grupos donde es co-director
- ✅ Crea obras, ensayos y funciones para sus grupos
- ✅ Gestiona miembros de sus grupos
- ✅ Distribuye tickets entre actores

### Usuario VENDEDOR (Actor)
- ✅ Ve solo los grupos donde es miembro
- ✅ Ve las obras de sus grupos
- ✅ Ve los ensayos de sus grupos
- ✅ Ve funciones de sus grupos
- ✅ Vende tickets que le fueron asignados
- ❌ No puede crear grupos, obras, ensayos ni funciones

### Usuario INVITADO (Público)
- ✅ Ve funciones futuras disponibles
- ✅ Puede comprar entradas
- ❌ No ve grupos, obras ni ensayos

## Base de Datos

### Tablas Principales

```sql
grupos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  director_cedula VARCHAR(20) FK → users.cedula,
  dia_semana VARCHAR(20) NOT NULL,  -- No modificable
  hora_inicio TIME NOT NULL,        -- No modificable
  fecha_inicio DATE,
  fecha_fin DATE,
  estado VARCHAR(20) DEFAULT 'ACTIVO'
)

grupo_miembros (
  grupo_id INT FK → grupos.id,
  miembro_cedula VARCHAR(20) FK → users.cedula,
  rol_en_grupo ENUM('DIRECTOR', 'ACTOR'),  -- Permite co-directores
  activo BOOLEAN DEFAULT TRUE,
  fecha_ingreso DATE,
  fecha_salida DATE,
  PRIMARY KEY (grupo_id, miembro_cedula)
)

obras (
  id SERIAL PRIMARY KEY,
  grupo_id INT FK → grupos.id,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  autor VARCHAR(255),
  genero VARCHAR(100),
  duracion_aprox INT,  -- minutos
  estado VARCHAR(20) DEFAULT 'EN_DESARROLLO'
)

ensayos_generales (
  id SERIAL PRIMARY KEY,
  obra_id INT FK → obras.id,  -- Antes era grupo_id
  titulo VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  hora_fin TIME,
  lugar VARCHAR(255),
  descripcion TEXT
)

shows (
  id SERIAL PRIMARY KEY,
  obra_id INT FK → obras.id,  -- Nuevo campo
  obra VARCHAR(255),           -- Campo legacy
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(255) NOT NULL,
  capacidad INT NOT NULL,
  base_price DECIMAL(10, 2)
)
```

### Vistas

**v_grupos_completos**: Grupos con miembros agregados y director
**v_obras_completas**: Obras con información del grupo y miembros
**v_ensayos_completos**: Ensayos con obra y grupo completo

## API Endpoints

### Grupos
```
POST   /api/grupos              - Crear grupo (ADMIN/SUPER)
GET    /api/grupos              - Listar grupos (filtrado por rol)
GET    /api/grupos/:id          - Obtener grupo
PUT    /api/grupos/:id          - Actualizar grupo
POST   /api/grupos/:id/archivar - Archivar grupo
POST   /api/grupos/:id/miembros - Agregar miembro
DELETE /api/grupos/:id/miembros/:cedula - Eliminar miembro
GET    /api/grupos/:id/actores-disponibles - Listar actores disponibles
```

### Obras
```
POST   /api/obras                   - Crear obra (DIRECTOR/SUPER)
GET    /api/obras                   - Listar obras (filtradas por rol)
GET    /api/obras/grupo/:grupoId    - Listar obras de grupo
GET    /api/obras/:id               - Obtener obra
PUT    /api/obras/:id               - Actualizar obra
DELETE /api/obras/:id               - Eliminar obra
POST   /api/obras/:id/archivar      - Archivar obra
```

### Ensayos
```
POST   /api/ensayos     - Crear ensayo (DIRECTOR/SUPER)
GET    /api/ensayos     - Listar ensayos (filtrados por rol)
GET    /api/ensayos/:id - Obtener ensayo
PUT    /api/ensayos/:id - Actualizar ensayo
DELETE /api/ensayos/:id - Eliminar ensayo
```

### Funciones (Shows)
```
POST   /api/shows     - Crear función con obra_id (DIRECTOR/SUPER)
GET    /api/shows     - Listar funciones
GET    /api/shows/:id - Obtener función
PUT    /api/shows/:id - Actualizar función
DELETE /api/shows/:id - Eliminar función
```

## Flujo de Trabajo Típico

1. **Director crea grupo**
   - Define día y hora de clases (permanentes)
   - Establece fecha de inicio/fin
   - Se convierte en director automáticamente

2. **Director agrega miembros**
   - Puede agregar actores (VENDEDOR)
   - Puede agregar co-directores (ADMIN)

3. **Director crea obra para el grupo**
   - Obra inicia en estado "EN_DESARROLLO"
   - Define nombre, autor, género, duración

4. **Director crea ensayos para la obra**
   - Programa fechas de ensayo
   - Define lugar y objetivos

5. **Director marca obra como "LISTA"**
   - Cuando la obra está lista para presentar

6. **Director crea funciones de la obra**
   - Define fecha, lugar, capacidad, precio
   - Se generan tickets automáticamente

7. **Director distribuye tickets entre actores**
   - Asigna entradas a vendedores
   - Actores venden sus entradas

8. **Público compra entradas**
   - Ve funciones disponibles
   - Compra y recibe PDF/QR

9. **Director archiva obra**
   - Cuando finaliza el ciclo de presentaciones

## Migración de Datos

La migración desde la arquitectura anterior (grupo → ensayo directo) se realizó automáticamente:

1. Se creó tabla `obras`
2. Se agregó columna `obra_id` a `shows` y `ensayos_generales`
3. Se agregó columna `rol_en_grupo` a `grupo_miembros`
4. Se creó una obra automática para cada grupo desde `grupos.obra_a_realizar`
5. Se migraron ensayos existentes a la primera obra del grupo
6. Se actualizaron todas las vistas

**Archivo de migración:** `teatro-tickets-backend/migracion-obras.sql`

## Ventajas del Nuevo Modelo

✅ **Refleja el flujo teatral real** - Grupos trabajan en múltiples obras simultáneamente
✅ **Co-directores permitidos** - Permite colaboración entre directores
✅ **Organización clara** - Ensayos y funciones están vinculados a la obra específica
✅ **Historial completo** - Cada obra mantiene su historial de ensayos y funciones
✅ **Escalabilidad** - Un grupo puede tener múltiples obras en diferentes estados
✅ **Mejor control** - Estados claros (EN_DESARROLLO, LISTA, ARCHIVADA)

## Compatibilidad

- ✅ Mantiene compatibilidad con funciones existentes
- ✅ `shows.obra` (campo legacy) se mantiene para no romper funcionalidad
- ✅ `shows.obra_id` es opcional (NULL permitido)
- ✅ Migración sin pérdida de datos
- ✅ Vistas actualizadas automáticamente
