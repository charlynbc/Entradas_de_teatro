# 🎭 PROMPT MAESTRO DEFINITIVO – SISTEMA BACO

## ESCUELA DE TEATRO · USUARIOS · GRUPOS · ENTRADAS · CUOTAS · MOBILE

---

## ROL DE LA IA

Sos una **IA senior full-stack** experta en:

* sistemas educativos
* escuelas de teatro
* apps mobile-first
* UX humano / comunitario
* refactor profundo y reconstrucción total

👉 **Conocés el proyecto BACO** y
👉 **YA EXISTE un index con identidad visual definida**.

---

## REGLA VISUAL ABSOLUTA

⚠️ **USAR EXACTAMENTE LOS COLORES, TIPOGRAFÍAS Y ESTILOS DEL INDEX DE BACO**

* No redefinir paleta
* No reinterpretar diseño
* No cambiar identidad
* Todas las pantallas de usuarios deben verse como una extensión natural del index

Todo debe sentirse **BACO**, no genérico.

---

## TAREA PRINCIPAL

👉 **RECONSTRUIR DESDE CERO TODO EL SISTEMA DE USUARIOS, ROLES Y PERMISOS**
👉 **CREAR TODO LO QUE FALTE**
👉 **MODIFICAR TODO LO QUE NO CUMPLA**

Si algo existe pero no cumple → **rehacerlo**
Si algo falta → **crearlo**
No pedir confirmaciones, ejecutar.

---

## CONCEPTO CENTRAL

🎭 BACO es:

* una **escuela de teatro**
* una **familia artística**
* una **comunidad humana**

El sistema debe ser:

* teatral
* cercano
* claro
* emocional
* 100% usable en celular

Nada corporativo.

---

## SISTEMA DE USUARIOS (DESDE CERO)

### IDENTIFICADOR

* **La CÉDULA es el ID único del usuario**
* Se usa para:
  * login
  * relaciones
  * permisos
* ❌ Nunca puede modificarse

---

### DATOS DEL USUARIO

Al crear un usuario se guardan:

* cédula (ID, inmutable)
* contraseña (por defecto: `admin`, siempre hasheada)
* nombre
* apellido
* fecha de nacimiento (formato: **DD/MM/YYYY**)
* edad (calculada automáticamente desde fecha de nacimiento)
* celular
* foto de perfil (estilo WhatsApp - circular)
  * default: símbolo/logo de BACO
* descripción personal (opcional)
* rol:
  * super
  * director
  * actor/actriz

---

### EDICIÓN DE DATOS

El usuario puede modificar:

* contraseña
* foto
* celular
* descripción personal

❌ No puede modificar:

* cédula
* rol
* fecha de nacimiento

---

## 📸 FOTOS DE USUARIO (ESTILO WHATSAPP)

### REGLA VISUAL OBLIGATORIA

Las fotos de usuario deben comportarse y verse **EXACTAMENTE** como una foto de perfil de WhatsApp.

### CARACTERÍSTICAS VISUALES

* Forma: **circular perfecta**
* Recorte automático (center-crop)
* Proporción 1:1
* Sin bordes cuadrados
* Sin marcos decorativos
* Sin sombras duras
* Tamaño grande en perfil propio
* Tamaño medio/pequeño en listas

👉 Visualmente debe sentirse:
**"es la cara de la persona"**, no un avatar genérico ni una tarjeta.

### COMPORTAMIENTO

Al subir una foto:
* se recorta automáticamente a formato circular
* se centra en el rostro

Si no hay foto subida:
* usar logo/símbolo de BACO
* también en formato circular

La foto se actualiza en tiempo real en:
* perfil
* grupos
* listas
* cumpleaños
* historial

### USOS DE LA FOTO

La foto circular del usuario se muestra en:

* perfil propio
* perfil de compañeros de grupo
* listados de integrantes
* saludo de cumpleaños
* vistas de grupos
* historial de funciones

### PRIVACIDAD

* Todos pueden ver la foto
* La descripción personal: **solo se muestra si el usuario la escribió**
* No mostrar datos sensibles junto a la foto

### MOBILE FIRST (CRÍTICO)

La foto debe verse clara en celular:
* No pixelada
* No deformada
* No cortada
* Optimizada para carga rápida

### REGLA FINAL

⚠️ **NO usar avatares cuadrados, tarjetas, cards con foto rectangular ni diseños tipo desktop.**
⚠️ **La referencia visual es WhatsApp, no LinkedIn.**

Si la foto no se parece a una foto de WhatsApp → **está mal**.

### OBJETIVO

Que al abrir el sistema, cualquier usuario sienta:
**"Estoy viendo a mis compañeros de teatro, no usuarios de una app."**

---

## PERFILES Y PRIVACIDAD

### PERFIL PROPIO

Ve todos sus datos.

### PERFIL DE OTRO USUARIO (COMPAÑERO DE GRUPO)

Solo mostrar:

* foto (circular, estilo WhatsApp)
* nombre
* apellido
* descripción (solo si el usuario la escribió)

Nada más.

---

## HISTORIAL PERSONAL

👉 **Todos los usuarios** pueden ver:

* historial de funciones en las que participaron
* orden cronológico (más reciente primero)
* formato: **DD/MM/YYYY**
* visual simple y clara
* solo lectura

---

## ROLES (HTML SEPARADO PARA CADA UNO)

---

### 👑 SUPER USUARIO (ÚNICO)

* Existe uno solo
* Control absoluto del sistema
* Puede:
  * crear / editar usuarios
  * ver todos los grupos
  * ver todas las funciones
  * escanear entradas
  * ver cuotas
  * ver gastos
  * ver balances
  * ver cumpleaños
  * **borrar todo el sistema si lo desea**

HTML propio · mobile-first · diseño BACO.

---

### 🎬 DIRECTOR

* Crea grupos
* Es dueño de sus grupos
* Puede:
  * agregar cualquier usuario al grupo
  * crear y editar obras
  * crear ensayos
  * crear funciones
  * definir precio de entradas
  * crear entradas
  * asignar entradas (incluido a sí mismo)
  * gestionar estados de entradas
  * crear gastos
  * ver balance económico
  * gestionar cuotas
  * escanear entradas

HTML propio · mobile-first · diseño BACO.

---

### 🎭 ACTOR / ACTRIZ (ESTUDIANTE)

* Ve sus grupos
* Ve ensayos
* Ve funciones
* Maneja **sus entradas**
* Cambia estado de **sus entradas**
* Ve **sus cuotas**
* Ve su historial de funciones

HTML propio · simple · humano · mobile-first · diseño BACO.

---

## GRUPOS

Un grupo tiene:

* nombre
* horario fijo (tipo materia de liceo)
* director (dueño)
* integrantes
* obra asociada
  * por defecto: "BACO" (editable luego)
* foto de grupo
  * default BACO
* ensayos
* funciones
* cuotas
* gastos

---

## ENSAYOS

* Creados por director
* Datos:
  * fecha (formato: **DD/MM/YYYY**)
  * hora (formato: **HH:MM**)
  * lugar
  * descripción
* Visibles solo para integrantes del grupo

---

## FUNCIONES

* Creadas por director o super
* Datos:
  * obra
  * fecha (formato: **DD/MM/YYYY**)
  * hora (formato: **HH:MM**)
  * lugar
  * precio de entrada
* Al crear una función:
  * se generan las entradas automáticamente

---

## ENTRADAS

### ESTADOS

1. sin asignar
2. asignada
3. reservada
4. pagada

* Los estados pueden volver hacia atrás
* El dueño de la entrada puede cambiar estados
* Director y super ven todas

### DATOS DE ENTRADA

* obra
* función
* fecha (formato: **DD/MM/YYYY**)
* hora (formato: **HH:MM**)
* lugar
* precio
* formato visual de entrada real de teatro

---

### INVITADOS

* El invitado puede:
  * reservar entrada
  * elegir vendedor
  * dejar nombre y celular
* El dueño de la entrada puede:
  * cargar esos datos manualmente

---

### ENVÍO Y ESCANEO

* Entrada puede enviarse por WhatsApp (PDF)
* Escaneo:
  * pagada → válida ✅
  * reservada → "entrada sin pagar" ⚠️
  * sin asignar / asignada → no válida ❌

Escanean:
* director
* super usuario

---

## CUOTAS (ESCUELA)

* Al agregar un actor a un grupo:
  * se crea automáticamente su cuota
* El director define:
  * monto
  * vencimiento (formato: **DD/MM/YYYY**)
* Estados:
  * al día
  * parcial
  * adeuda
* Actor solo ve
* Director gestiona
* Super controla todo

---

## GASTOS Y BALANCE

* Director carga gastos por función
* Tipos libres (flete, alquiler, técnica, etc.)
* El sistema calcula:
  * ingresos (entradas pagadas)
  * egresos (gastos)
  * balance final
* Visible para:
  * director (sus grupos)
  * super (todo)

---

## CUMPLEAÑOS (FAMILIA BACO)

* Si uno o más usuarios cumplen años:
  * mostrar cartel teatral global
* Mensaje cálido, artístico y humano
* Mostrar nombres y fotos (circulares, estilo WhatsApp)
* Si son varios → saludo colectivo
* Formato de fecha: **DD/MM**

---

## NAVEGACIÓN

* Menú distinto por rol
* Máximo 5 opciones
* Sin redundancias
* Todo visible
* Todo pensado para celular

---

## FORMATOS DE FECHA Y HORA

### VISUALIZACIÓN (FRONTEND)

* Fechas: **DD/MM/YYYY** (ej: 29/10/1991)
* Horas: **HH:MM** (ej: 20:30)
* Cumpleaños: **DD/MM** (ej: 29/10)

### ALMACENAMIENTO (BACKEND)

* Base de datos: formato ISO (YYYY-MM-DD) o DATE nativo
* Al mostrar al usuario: convertir a DD/MM/YYYY
* Al recibir del usuario: convertir de DD/MM/YYYY a formato interno

### CÁLCULOS

* Edad: calculada automáticamente desde fecha_nacimiento
* Cumpleaños: comparar día y mes con fecha actual
* Historial: ordenar por fecha descendente

---

## OBJETIVO FINAL

Entregar un sistema que:

* respete la identidad visual del index
* funcione perfecto en celular
* tenga lógica clara y coherente
* represente una escuela de teatro real
* sea humano, artístico y sólido
* esté listo para producción
* use formato de fechas latinoamericano (DD/MM/YYYY)
* muestre fotos circulares estilo WhatsApp

---

# 🧠 MODELO SQL FINAL – SISTEMA BACO

*(pensado para PostgreSQL, pero sirve casi igual para MySQL)*

---

## 👤 USUARIOS

```sql
CREATE TABLE usuarios (
    cedula VARCHAR(20) PRIMARY KEY,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('super', 'director', 'actor')),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    celular VARCHAR(30),
    foto_url TEXT,
    descripcion TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎭 GRUPOS

```sql
CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    horario_fijo VARCHAR(100),
    director_cedula VARCHAR(20) NOT NULL,
    obra_nombre VARCHAR(150) DEFAULT 'BACO',
    foto_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (director_cedula) REFERENCES usuarios(cedula)
);
```

---

## 👥 INTEGRANTES DE GRUPO

```sql
CREATE TABLE grupo_integrantes (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL,
    usuario_cedula VARCHAR(20) NOT NULL,
    rol_en_grupo VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (grupo_id, usuario_cedula),
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_cedula) REFERENCES usuarios(cedula)
);
```

---

## 🎬 ENSAYOS

```sql
CREATE TABLE ensayos (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar VARCHAR(200),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);
```

---

## 🎟️ FUNCIONES

```sql
CREATE TABLE funciones (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar VARCHAR(200) NOT NULL,
    precio_entrada NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);
```

---

## 🎫 ENTRADAS

```sql
CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,
    funcion_id INT NOT NULL,
    vendedor_cedula VARCHAR(20),
    estado VARCHAR(20) NOT NULL CHECK (
        estado IN ('sin_asignar', 'asignada', 'reservada', 'pagada')
    ),
    invitado_nombre VARCHAR(150),
    invitado_celular VARCHAR(30),
    precio NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcion_id) REFERENCES funciones(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_cedula) REFERENCES usuarios(cedula)
);
```

---

## 💸 GASTOS

```sql
CREATE TABLE gastos (
    id SERIAL PRIMARY KEY,
    funcion_id INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcion_id) REFERENCES funciones(id) ON DELETE CASCADE
);
```

---

## 📊 CUOTAS (ESCUELA)

```sql
CREATE TABLE cuotas (
    id SERIAL PRIMARY KEY,
    grupo_id INT NOT NULL,
    actor_cedula VARCHAR(20) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    vencimiento DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (
        estado IN ('al_dia', 'parcial', 'adeuda')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_cedula) REFERENCES usuarios(cedula)
);
```

---

## 🎂 CUMPLEAÑOS (no tabla extra)

👉 Se calculan desde: `fecha_nacimiento`

La lógica es de backend:

* comparar día y mes con hoy
* traer usuarios que cumplen
* mostrar cartel teatral global
* formato visual: **DD/MM**

---

## 📜 HISTORIAL DE FUNCIONES (vista lógica)

No hace falta tabla extra.
Se obtiene con:

* `grupo_integrantes`
* `funciones`
* `grupos`

Formato de visualización: **DD/MM/YYYY HH:MM**

---

## 🔐 NOTAS IMPORTANTES

* No hardcodear credenciales
* El usuario super se crea por seed seguro
* Todas las contraseñas van hasheadas (bcrypt)
* Todo acceso se valida por rol
* Todo debe respetar mobile-first
* Todo diseño hereda del index
* **Fechas en DB: formato DATE nativo**
* **Fechas en frontend: convertir a DD/MM/YYYY**
* **Fotos: siempre circulares, estilo WhatsApp**

---

# 🌱 SEED INICIAL (OBLIGATORIO)

👉 Este seed **no es opcional**, define el sistema base BACO.

## 👑 SUPER USUARIO (ÚNICO)

Viene por defecto en el sistema.
Puede:
* cambiar su contraseña
* borrar todo el sistema si lo desea

```sql
INSERT INTO usuarios (
    cedula,
    rol,
    nombre,
    apellido,
    fecha_nacimiento,
    celular,
    foto_url,
    descripcion,
    password_hash
) VALUES (
    '48376669',
    'super',
    'Charly',
    'Barrios',
    '1991-10-29',  -- Se mostrará como 29/10/1991
    NULL,
    '/assets/baco.png',
    'Guardián del teatro',
    '<HASH_DE_Teamomama91>'
);
```

⚠️ **IMPORTANTE:**
* El hash lo genera el backend (bcrypt o similar)
* **NO** hardcodear la contraseña en frontend
* Contraseña real: `Teamomama91`

---

## 🧪 DATOS DE PRUEBA MÍNIMOS

### Director de prueba

```sql
INSERT INTO usuarios VALUES (
    '11111111',
    'director',
    'Director',
    'Ejemplo',
    '1985-05-10',  -- Se mostrará como 10/05/1985
    '099000000',
    '/assets/baco.png',
    'Director apasionado',
    '<HASH_admin>',
    CURRENT_TIMESTAMP
);
```

### Actor de prueba

```sql
INSERT INTO usuarios VALUES (
    '22222222',
    'actor',
    'Actor',
    'Ejemplo',
    '2000-03-20',  -- Se mostrará como 20/03/2000
    '098000000',
    '/assets/baco.png',
    NULL,
    '<HASH_admin>',
    CURRENT_TIMESTAMP
);
```

---

# 📊 QUERIES CLAVE DEL SISTEMA

## 🎟️ RECAUDACIÓN POR FUNCIÓN

```sql
SELECT
    f.id AS funcion_id,
    TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
    SUM(e.precio) AS total_recaudado
FROM funciones f
JOIN entradas e ON e.funcion_id = f.id
WHERE e.estado = 'pagada'
GROUP BY f.id, f.fecha;
```

---

## 💸 GASTOS POR FUNCIÓN

```sql
SELECT
    funcion_id,
    SUM(monto) AS total_gastos
FROM gastos
GROUP BY funcion_id;
```

---

## ⚖️ BALANCE FINAL POR FUNCIÓN

```sql
SELECT
    f.id AS funcion_id,
    TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
    COALESCE(SUM(CASE WHEN e.estado = 'pagada' THEN e.precio END), 0)
    -
    COALESCE(SUM(g.monto), 0)
    AS balance
FROM funciones f
LEFT JOIN entradas e ON e.funcion_id = f.id
LEFT JOIN gastos g ON g.funcion_id = f.id
GROUP BY f.id, f.fecha;
```

---

## 🎭 ENTRADAS POR ACTOR

```sql
SELECT
    u.nombre,
    u.apellido,
    u.foto_url,
    COUNT(e.id) AS total_entradas,
    SUM(CASE WHEN e.estado = 'pagada' THEN e.precio ELSE 0 END) AS recaudado
FROM entradas e
JOIN usuarios u ON u.cedula = e.vendedor_cedula
GROUP BY u.cedula, u.nombre, u.apellido, u.foto_url;
```

---

## 🎂 USUARIOS QUE CUMPLEN AÑOS HOY

```sql
SELECT
    cedula,
    nombre,
    apellido,
    foto_url,
    TO_CHAR(fecha_nacimiento, 'DD/MM') AS cumpleanos,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento)) AS edad
FROM usuarios
WHERE EXTRACT(DAY FROM fecha_nacimiento) = EXTRACT(DAY FROM CURRENT_DATE)
AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE);
```

---

## 📚 HISTORIAL DE FUNCIONES DE UN USUARIO

```sql
SELECT
    TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
    TO_CHAR(f.hora, 'HH24:MI') AS hora,
    f.lugar,
    g.nombre AS grupo,
    g.obra_nombre,
    g.foto_url
FROM grupo_integrantes gi
JOIN grupos g ON g.id = gi.grupo_id
JOIN funciones f ON f.grupo_id = g.id
WHERE gi.usuario_cedula = '22222222'
ORDER BY f.fecha DESC, f.hora DESC;
```

---

## 💰 CUOTAS DE UN ACTOR

```sql
SELECT
    g.nombre AS grupo,
    c.monto,
    TO_CHAR(c.vencimiento, 'DD/MM/YYYY') AS vencimiento,
    c.estado
FROM cuotas c
JOIN grupos g ON g.id = c.grupo_id
WHERE c.actor_cedula = '22222222'
ORDER BY c.vencimiento ASC;
```

---

## 👥 INTEGRANTES DE UN GRUPO (CON FOTOS)

```sql
SELECT
    u.cedula,
    u.nombre,
    u.apellido,
    u.foto_url,
    u.descripcion,
    gi.rol_en_grupo
FROM grupo_integrantes gi
JOIN usuarios u ON u.cedula = gi.usuario_cedula
WHERE gi.grupo_id = 1
ORDER BY u.nombre, u.apellido;
```

---

# ✅ CHECKLIST DE PRUEBA REAL (DÍA DE FUNCIÓN)

## 🔐 LOGIN

* [ ] Super entra con cédula + contraseña
* [ ] Director entra
* [ ] Actor entra
* [ ] Cada uno ve **solo su HTML**

---

## 👥 USUARIOS

* [ ] Crear usuario nuevo
* [ ] Password por defecto = admin
* [ ] No se puede editar cédula
* [ ] No se puede editar fecha de nacimiento
* [ ] Foto default BACO funciona (circular)
* [ ] Foto subida se ve circular (estilo WhatsApp)
* [ ] Perfil de compañero muestra solo: foto, nombre, apellido, descripción
* [ ] Edad se calcula automáticamente

---

## 🎭 GRUPOS

* [ ] Director crea grupo
* [ ] Grupo tiene horario fijo
* [ ] Obra por defecto = BACO
* [ ] Agregar actor crea cuota automáticamente
* [ ] Foto de grupo visible (circular)
* [ ] Integrantes se ven con fotos circulares

---

## 🎬 ENSAYOS

* [ ] Crear ensayo
* [ ] Solo integrantes lo ven
* [ ] Fecha en formato DD/MM/YYYY
* [ ] Hora en formato HH:MM

---

## 🎟️ FUNCIONES

* [ ] Crear función
* [ ] Precio correcto
* [ ] Fecha en formato DD/MM/YYYY
* [ ] Hora en formato HH:MM
* [ ] Entradas generadas automáticamente

---

## 🎫 ENTRADAS

* [ ] Asignar entradas
* [ ] Cambiar estados
* [ ] Reservar con datos de invitado
* [ ] Volver estados hacia atrás
* [ ] Enviar PDF por WhatsApp
* [ ] Fecha y hora en formato correcto

---

## 📲 ESCANEO

* [ ] Pagada → válida ✅
* [ ] Reservada → "entrada sin pagar" ⚠️
* [ ] Asignada / sin asignar → no válida ❌
* [ ] Director escanea
* [ ] Super escanea

---

## 💸 ECONOMÍA

* [ ] Cargar gastos
* [ ] Ver recaudación
* [ ] Ver balance correcto
* [ ] Super ve todo
* [ ] Montos con 2 decimales

---

## 🎂 CUMPLEAÑOS

* [ ] Cartel aparece
* [ ] Mensaje teatral
* [ ] Varios usuarios juntos
* [ ] Fotos circulares visibles
* [ ] Formato DD/MM en fecha de cumpleaños

---

## 📱 MOBILE FIRST

* [ ] Todo funciona en celular
* [ ] Fotos se ven nítidas
* [ ] Fechas legibles
* [ ] Botones táctiles
* [ ] Sin scroll horizontal
* [ ] Carga rápida

---

## 📸 FOTOS CIRCULARES

* [ ] Perfil propio: foto circular grande
* [ ] Listas: fotos circulares pequeñas
* [ ] Grupos: fotos circulares
* [ ] Cumpleaños: fotos circulares
* [ ] Default BACO: circular
* [ ] Se parece a WhatsApp (no a LinkedIn)

---

# 🏁 CONCLUSIÓN

Con este **PROMPT MAESTRO DEFINITIVO** tenés:

✅ **Sistema completo de usuarios, roles y permisos**
✅ **Modelo SQL profesional y coherente**
✅ **Seed inicial con super usuario**
✅ **Queries optimizadas**
✅ **Formato de fechas latinoamericano (DD/MM/YYYY)**
✅ **Fotos circulares estilo WhatsApp**
✅ **Checklist de testing real**
✅ **Mobile-first como filosofía**
✅ **Identidad teatral y humana**

👉 **No hay zonas grises**
👉 **No hay ambigüedades**
👉 **No hay contradicciones**

🎭 **Este es el PROMPT MAESTRO FINAL Y TOTAL del Sistema BACO.**
