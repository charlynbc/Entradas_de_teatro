-- ========================================
-- BACO TEATRO - SCHEMA v3.0 con PostgreSQL
-- ========================================

-- 1. USUARIOS (cedula como ID único)
CREATE TABLE users (
  cedula         VARCHAR(20) PRIMARY KEY,   -- número de cédula
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('SUPER', 'ADMIN', 'VENDEDOR', 'INVITADO')),
  password_hash TEXT,                       -- NULL si es invitado
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  -- agregado para relacionar tickets con vendedores
  phone         VARCHAR(20),
  -- género del usuario (masculino, femenino, otro)
  genero        VARCHAR(20) DEFAULT 'otro'
);

-- Índice único opcional para phone si se usa como identificador de login
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);

-- Usuario Super (único) - password por defecto: admin123
-- Tipos de usuario: SUPER (único), ADMIN (directores), VENDEDOR (actores), INVITADO (sin login)
INSERT INTO users (cedula, name, role, password_hash, phone, active) VALUES
  ('48376669', 'Super Usuario', 'SUPER', '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e', '48376669', TRUE)
ON CONFLICT (cedula) DO UPDATE SET role = 'SUPER', password_hash = '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e';

-- 2. FUNCIONES (shows vinculados a obras)
CREATE TABLE shows (
  id           SERIAL PRIMARY KEY,
  obra_id      INT REFERENCES obras(id) ON DELETE SET NULL,  -- Vinculado a obra del grupo
  obra         VARCHAR(200) NOT NULL,                         -- Nombre de la obra
  fecha        TIMESTAMP NOT NULL,
  lugar        VARCHAR(200),
  capacidad    INT NOT NULL,
  base_price   NUMERIC(10,2) NOT NULL,   -- precio base por entrada
  foto_url     TEXT,                      -- Foto específica de esta función
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shows_fecha ON shows(fecha);
CREATE INDEX idx_shows_obra_id ON shows(obra_id);

-- 3. TICKETS
CREATE TABLE tickets (
  code                    VARCHAR(50) PRIMARY KEY,  -- T-XXXXXXXX
  show_id                 INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  
  -- ESTADOS:
  -- DISPONIBLE: recién creado, sin asignar
  -- STOCK_VENDEDOR: asignado a un actor
  -- RESERVADO: actor puso nombre de comprador pero no cobró
  -- REPORTADA_VENDIDA: actor dice "cobré", admin aún no aprobó
  -- PAGADO: admin confirmó que recibió la plata
  -- USADO: entrada validada en puerta
  estado                  VARCHAR(20) NOT NULL CHECK (
                            estado IN ('DISPONIBLE', 'STOCK_VENDEDOR', 'RESERVADO', 
                                       'REPORTADA_VENDIDA', 'PAGADO', 'USADO')
                          ) DEFAULT 'DISPONIBLE',
  
  -- Propietario
  vendedor_phone          VARCHAR(20) REFERENCES users(phone),
  
  -- Comprador
  comprador_nombre        VARCHAR(150),
  comprador_contacto      VARCHAR(150),
  
  -- Dinero
  precio                  NUMERIC(10,2),           -- precio efectivo (puede diferir de base_price)
  medio_pago              VARCHAR(50),
  
  -- Control de plata
  reportada_por_vendedor  BOOLEAN NOT NULL DEFAULT FALSE,  -- actor dice "vendí esto"
  aprobada_por_admin      BOOLEAN NOT NULL DEFAULT FALSE,  -- admin confirma pago recibido
  
  -- QR code (data URL)
  qr_code                 TEXT,
  
  -- Timestamps
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  reservado_at            TIMESTAMP,
  reportada_at            TIMESTAMP,
  pagado_at               TIMESTAMP,
  usado_at                TIMESTAMP
);

CREATE INDEX idx_tickets_show ON tickets(show_id);
CREATE INDEX idx_tickets_vendedor ON tickets(vendedor_phone);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_comprador ON tickets(comprador_nombre);

-- 4. VISTA: Resumen por vendedor y función
CREATE VIEW v_resumen_vendedor_show AS
SELECT
  t.show_id,
  s.obra,
  s.fecha,
  t.vendedor_phone,
  u.name AS vendedor_nombre,
  
  -- Conteos
  COUNT(*) FILTER (WHERE t.estado = 'STOCK_VENDEDOR') AS para_vender,
  COUNT(*) FILTER (WHERE t.estado = 'RESERVADO') AS reservadas,
  COUNT(*) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') AS reportadas_vendidas,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) AS pagadas,
  COUNT(*) FILTER (WHERE t.estado = 'USADO') AS usadas,
  
  -- Dinero
  SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO') 
           THEN COALESCE(t.precio, s.base_price) 
           ELSE 0 END) AS monto_reportado,
  
  SUM(CASE WHEN t.aprobada_por_admin 
           THEN COALESCE(t.precio, s.base_price) 
           ELSE 0 END) AS monto_aprobado,
  
  SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
           THEN COALESCE(t.precio, s.base_price) 
           ELSE 0 END) AS monto_debe
           
FROM tickets t
JOIN shows s ON s.id = t.show_id
LEFT JOIN users u ON u.phone = t.vendedor_phone
WHERE t.vendedor_phone IS NOT NULL
GROUP BY t.show_id, s.obra, s.fecha, t.vendedor_phone, u.name;

-- 5. VISTA: Resumen global por función (para admin)
CREATE VIEW v_resumen_show_admin AS
SELECT
  s.id,
  s.obra,
  s.fecha,
  s.capacidad,
  s.base_price,
  
  -- Conteos de tickets
  COUNT(t.code) AS total_generados,
  COUNT(*) FILTER (WHERE t.estado = 'DISPONIBLE') AS disponibles,
  COUNT(*) FILTER (WHERE t.estado = 'STOCK_VENDEDOR') AS en_stock_vendedores,
  COUNT(*) FILTER (WHERE t.estado = 'RESERVADO') AS reservadas,
  COUNT(*) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') AS reportadas_sin_aprobar,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) AS pagadas,
  COUNT(*) FILTER (WHERE t.estado = 'USADO') AS usadas,
  
  -- Dinero
  SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')
           THEN COALESCE(t.precio, s.base_price)
           ELSE 0 END) AS recaudacion_teorica,
  
  SUM(CASE WHEN t.aprobada_por_admin
           THEN COALESCE(t.precio, s.base_price)
           ELSE 0 END) AS recaudacion_real,
  
  SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
           THEN COALESCE(t.precio, s.base_price)
           ELSE 0 END) AS pendiente_aprobar

FROM shows s
LEFT JOIN tickets t ON t.show_id = s.id
GROUP BY s.id, s.obra, s.fecha, s.capacidad, s.base_price;

-- 6. GRUPOS (para clases de teatro)
CREATE TABLE grupos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  director_cedula   VARCHAR(20) NOT NULL REFERENCES users(cedula),  -- creador y director del grupo
  
  -- Horario fijo de clases (NO se puede cambiar)
  dia_semana        VARCHAR(20) NOT NULL CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  hora_inicio       TIME NOT NULL,
  
  -- Período del grupo
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE NOT NULL,
  
  -- Obra que trabajarán
  obra_a_realizar   VARCHAR(200),
  
  -- Estado
  estado            VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVO', 'ARCHIVADO')) DEFAULT 'ACTIVO',
  
  -- Foto del grupo (elenco)
  foto_url          TEXT,
  
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grupos_director ON grupos(director_cedula);
CREATE INDEX idx_grupos_estado ON grupos(estado);
CREATE INDEX idx_grupos_fecha_fin ON grupos(fecha_fin);

-- 7. MIEMBROS DE GRUPOS (relación many-to-many, incluye directores)
CREATE TABLE grupo_miembros (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  miembro_cedula  VARCHAR(20) NOT NULL REFERENCES users(cedula),
  rol_en_grupo    VARCHAR(20) NOT NULL CHECK (rol_en_grupo IN ('DIRECTOR', 'ACTOR')) DEFAULT 'ACTOR',
  
  fecha_ingreso   TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_salida    TIMESTAMP,           -- NULL si sigue activo
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  
  UNIQUE(grupo_id, miembro_cedula)     -- Un miembro no puede estar duplicado en un grupo
);

CREATE INDEX idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX idx_grupo_miembros_miembro ON grupo_miembros(miembro_cedula);
CREATE INDEX idx_grupo_miembros_activo ON grupo_miembros(activo);

-- 8. VISTA: Grupos con información completa
CREATE VIEW v_grupos_completos AS
SELECT
  g.id,
  g.nombre,
  g.descripcion,
  g.director_cedula,
  u.name AS director_nombre,
  g.dia_semana,
  g.hora_inicio,
  g.fecha_inicio,
  g.fecha_fin,
  g.obra_a_realizar,
  g.estado,
  g.created_at,
  g.updated_at,
  
  -- Contar miembros activos
  COUNT(gm.id) FILTER (WHERE gm.activo = TRUE) AS miembros_activos,
  
  -- Lista de miembros activos
  json_agg(
    json_build_object(
      'cedula', um.cedula,
      'nombre', um.name,
      'genero', um.genero,
      'fecha_ingreso', gm.fecha_ingreso
    ) ORDER BY um.name
  ) FILTER (WHERE gm.activo = TRUE) AS miembros
  
FROM grupos g
JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
LEFT JOIN users um ON um.cedula = gm.miembro_cedula
GROUP BY g.id, g.nombre, g.descripcion, g.director_cedula, u.name, 
         g.dia_semana, g.hora_inicio, g.fecha_inicio, g.fecha_fin, 
         g.obra_a_realizar, g.estado, g.created_at, g.updated_at;

-- 9. OBRAS (creadas por grupos)
CREATE TABLE obras (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  autor           VARCHAR(200),
  genero          VARCHAR(100),
  duracion_aprox  INT,                          -- Duración en minutos
  estado          VARCHAR(20) NOT NULL CHECK (estado IN ('EN_DESARROLLO', 'LISTA', 'ARCHIVADA')) DEFAULT 'EN_DESARROLLO',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obras_grupo ON obras(grupo_id);
CREATE INDEX idx_obras_estado ON obras(estado);

-- 10. ENSAYOS (vinculados a obras)
CREATE TABLE ensayos_generales (
  id              SERIAL PRIMARY KEY,
  obra_id         INT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titulo          VARCHAR(200) NOT NULL,
  fecha           TIMESTAMP NOT NULL,
  hora_fin        TIME,
  lugar           VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ensayos_obra ON ensayos_generales(obra_id);
CREATE INDEX idx_ensayos_fecha ON ensayos_generales(fecha);

-- 11. VISTA: Obras con información del grupo
CREATE VIEW v_obras_completas AS
SELECT
  o.id,
  o.grupo_id,
  o.nombre,
  o.descripcion,
  o.autor,
  o.genero,
  o.duracion_aprox,
  o.estado,
  o.created_at,
  o.updated_at,
  g.nombre as grupo_nombre,
  g.director_cedula,
  g.director_nombre,
  g.dia_semana as grupo_dia_semana,
  g.hora_inicio as grupo_hora_inicio,
  g.miembros_activos
FROM obras o
LEFT JOIN v_grupos_completos g ON g.id = o.grupo_id;

-- 12. VISTA: Ensayos con información completa (obra + grupo)
CREATE VIEW v_ensayos_completos AS
SELECT 
  e.id,
  e.obra_id,
  e.titulo,
  e.fecha,
  e.hora_fin,
  e.lugar,
  e.descripcion,
  e.created_at,
  o.nombre as obra_nombre,
  o.grupo_id,
  g.nombre as grupo_nombre,
  g.director_cedula as grupo_director_cedula,
  g.director_nombre as grupo_director_nombre,
  g.dia_semana as grupo_dia_semana,
  g.miembros_activos,
  g.miembros as grupo_miembros
FROM ensayos_generales e
LEFT JOIN obras o ON o.id = e.obra_id
LEFT JOIN v_grupos_completos g ON g.id = o.grupo_id
ORDER BY e.fecha DESC, e.hora_fin DESC;

-- ========================================
-- COMENTARIOS PARA ENTENDER EL FLUJO
-- ========================================

/*
FLUJO COMPLETO TICKETS:

1. ADMIN crea función (show)
   └─> Se generan N tickets con estado DISPONIBLE

2. ADMIN asigna 10 tickets a vendedor
   └─> Pasan a STOCK_VENDEDOR (vendedor_phone se llena)

3. VENDEDOR reserva ticket con nombre de comprador
   └─> Pasa a RESERVADO
   └─> comprador_nombre, comprador_contacto se llenan

4. VENDEDOR cobra y reporta venta
   └─> Pasa a REPORTADA_VENDIDA
   └─> reportada_por_vendedor = TRUE
   └─> reportada_at = NOW()
   └─> precio, medio_pago se llenan
   ⚠️ ADMIN ve: "este vendedor me debe plata"

5. ADMIN recibe plata y aprueba
   └─> Pasa a PAGADO
   └─> aprobada_por_admin = TRUE
   └─> pagado_at = NOW()
   ✅ Ticket listo para entrar al show

6. ADMIN escanea QR en puerta
   └─> Pasa a USADO
   └─> usado_at = NOW()
   🎭 Cliente entra

ESTADOS CLAVE:
- REPORTADA_VENDIDA + reportada_por_vendedor=true + aprobada_por_admin=false
  => "El vendedor me debe esta plata"
  
- PAGADO + aprobada_por_admin=true
  => "Ya recibí el dinero, ticket listo para usar"
*/

/*
FLUJO COMPLETO GRUPOS:

1. DIRECTOR o SUPER crea grupo
   └─> Se llena: nombre, día_semana, hora_inicio, fecha_inicio, fecha_fin, obra_a_realizar
   └─> director_cedula = cedula del creador
   └─> estado = ACTIVO

2. DIRECTOR agrega miembros (actores/actrices)
   └─> Se crea registro en grupo_miembros
   └─> activo = TRUE
   └─> fecha_ingreso = NOW()

3. DIRECTOR puede:
   ✅ Agregar/eliminar miembros
   ✅ Cambiar obra_a_realizar
   ✅ Ver lista de miembros
   ❌ NO puede cambiar dia_semana ni hora_inicio (horario fijo)

4. Cuando pasa fecha_fin:
   └─> El grupo pasa a ARCHIVADO automáticamente
   └─> Los miembros pueden ver histórico

PERMISOS:
- SUPER: puede crear grupos, ver todos, modificar cualquiera
- ADMIN (Director): puede crear grupos, ver los suyos, modificar solo los que creó
- VENDEDOR (Actor/Actriz): puede ver grupos donde es miembro

ARCHIVADO:
- Un grupo archivado mantiene su historial
- No se pueden agregar nuevos miembros
- Se puede consultar para ver qué obra trabajaron
*/
