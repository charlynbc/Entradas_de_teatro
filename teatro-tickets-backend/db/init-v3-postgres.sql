-- ========================================
-- BACÓ TEATRO - INIT SCHEMA (PostgreSQL) v3
-- Objetivo: crear schema base en DB vacía
-- NOTA: no inserta usuarios (seeds via init-supremo.js)
-- ========================================

-- 1) USERS
CREATE TABLE IF NOT EXISTS users (
  cedula           VARCHAR(20) PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  role             VARCHAR(20) NOT NULL,
  password_hash    TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  phone            VARCHAR(20),
  genero           VARCHAR(20) DEFAULT 'otro',
  email            VARCHAR(255),
  fecha_nacimiento DATE,
  apellido         VARCHAR(100),
  foto_url         TEXT,
  direccion        TEXT,
  notas            TEXT
);

-- Role: soportar valores legacy + actuales
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'VENDEDOR', 'INVITADO'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- 2) GRUPOS
CREATE TABLE IF NOT EXISTS grupos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  director_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula),

  dia_semana      VARCHAR(20) NOT NULL,
  hora_inicio     TIME NOT NULL,

  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,

  obra_a_realizar VARCHAR(200),
  estado          VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  foto_url        TEXT,

  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_estado_check;
ALTER TABLE grupos ADD CONSTRAINT grupos_estado_check
  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PAUSADO', 'ARCHIVADO'));

CREATE INDEX IF NOT EXISTS idx_grupos_director ON grupos(director_cedula);
CREATE INDEX IF NOT EXISTS idx_grupos_estado ON grupos(estado);
CREATE INDEX IF NOT EXISTS idx_grupos_fecha_fin ON grupos(fecha_fin);

-- 3) GRUPO_MIEMBROS
CREATE TABLE IF NOT EXISTS grupo_miembros (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  miembro_cedula  VARCHAR(20) NOT NULL REFERENCES users(cedula),
  rol_en_grupo    VARCHAR(20) NOT NULL DEFAULT 'ACTOR',
  joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_salida    TIMESTAMP,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(grupo_id, miembro_cedula)
);

ALTER TABLE grupo_miembros DROP CONSTRAINT IF EXISTS grupo_miembros_rol_en_grupo_check;
ALTER TABLE grupo_miembros ADD CONSTRAINT grupo_miembros_rol_en_grupo_check
  CHECK (rol_en_grupo IN ('DIRECTOR', 'ACTOR'));

CREATE INDEX IF NOT EXISTS idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_miembro ON grupo_miembros(miembro_cedula);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_activo ON grupo_miembros(activo);

-- 8) REPORTES OBRAS (persistencia de reportes)
CREATE TABLE IF NOT EXISTS reportes_obras (
  id               SERIAL PRIMARY KEY,
  show_id          INT NOT NULL, -- compat: en v3 lo tratamos como funcion_id
  nombre_obra      VARCHAR(255) NOT NULL,
  fecha_show       TIMESTAMP NOT NULL,
  director_id      VARCHAR(20) NOT NULL, -- compat: cedula del director/super
  total_tickets    INT NOT NULL DEFAULT 0,
  tickets_vendidos INT NOT NULL DEFAULT 0,
  tickets_usados   INT NOT NULL DEFAULT 0,
  ingresos_totales NUMERIC(12,2) NOT NULL DEFAULT 0,
  datos_vendedores JSONB NOT NULL DEFAULT '[]'::jsonb,
  datos_ventas     JSONB NOT NULL DEFAULT '{}'::jsonb,
  fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reportes_obras_show_id ON reportes_obras(show_id);
CREATE INDEX IF NOT EXISTS idx_reportes_obras_director_id ON reportes_obras(director_id);
CREATE INDEX IF NOT EXISTS idx_reportes_obras_fecha_show ON reportes_obras(fecha_show);

-- 4) OBRAS
CREATE TABLE IF NOT EXISTS obras (
  id             SERIAL PRIMARY KEY,
  grupo_id       INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  nombre         VARCHAR(200) NOT NULL,
  descripcion    TEXT,
  autor          VARCHAR(200),
  genero         VARCHAR(100),
  duracion_aprox INT,
  estado         VARCHAR(20) NOT NULL DEFAULT 'EN_DESARROLLO',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE obras DROP CONSTRAINT IF EXISTS obras_estado_check;
ALTER TABLE obras ADD CONSTRAINT obras_estado_check
  CHECK (estado IN ('EN_DESARROLLO', 'LISTA', 'ARCHIVADA'));

CREATE INDEX IF NOT EXISTS idx_obras_grupo ON obras(grupo_id);
CREATE INDEX IF NOT EXISTS idx_obras_estado ON obras(estado);

-- 5) FUNCIONES
CREATE TABLE IF NOT EXISTS funciones (
  id           SERIAL PRIMARY KEY,
  obra_id      INT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  fecha        TIMESTAMP NOT NULL,
  lugar        VARCHAR(200),
  capacidad    INT NOT NULL,
  precio_base  NUMERIC(10,2) NOT NULL,
  foto_url     TEXT,
  estado       VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE funciones DROP CONSTRAINT IF EXISTS funciones_estado_check;
ALTER TABLE funciones ADD CONSTRAINT funciones_estado_check
  CHECK (estado IN ('PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'REALIZADA'));

CREATE INDEX IF NOT EXISTS idx_funciones_fecha ON funciones(fecha);
CREATE INDEX IF NOT EXISTS idx_funciones_obra_id ON funciones(obra_id);
CREATE INDEX IF NOT EXISTS idx_funciones_estado ON funciones(estado);

-- 6) TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  code                    VARCHAR(50) PRIMARY KEY,
  funcion_id              INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  estado                  VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',

  vendedor_phone          VARCHAR(20),

  comprador_nombre        VARCHAR(150),
  comprador_contacto      VARCHAR(150),

  precio                  NUMERIC(10,2),
  medio_pago              VARCHAR(50),

  reportada_por_vendedor  BOOLEAN NOT NULL DEFAULT FALSE,
  aprobada_por_admin      BOOLEAN NOT NULL DEFAULT FALSE,

  qr_code                 TEXT,

  -- Anulación
  anulado_motivo           TEXT,
  anulado_at               TIMESTAMP,

  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  reservado_at            TIMESTAMP,
  reportada_at            TIMESTAMP,
  pagado_at               TIMESTAMP,
  usado_at                TIMESTAMP
);

-- Estados: tolerante para evitar fallos por CHECK desincronizado
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_estado_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_estado_check
  CHECK (estado IN ('DISPONIBLE', 'STOCK_ACTOR', 'STOCK_VENDEDOR', 'RESERVADO', 'REPORTADA_VENDIDA', 'PAGADO', 'USADO', 'ANULADO'));

CREATE INDEX IF NOT EXISTS idx_tickets_funcion ON tickets(funcion_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vendedor ON tickets(vendedor_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_comprador ON tickets(comprador_nombre);

-- 6.1) AUDITORÍA: Movimientos de tickets
CREATE TABLE IF NOT EXISTS ticket_movimientos (
  id           SERIAL PRIMARY KEY,
  tipo         VARCHAR(30) NOT NULL CHECK (tipo IN (
    'ASIGNACION',
    'RESERVA',
    'VENTA_REPORTADA',
    'PAGO_APROBADO',
    'TRANSFERENCIA',
    'ANULACION',
    'VALIDACION'
  )),
  ticket_code  VARCHAR(50) NOT NULL REFERENCES tickets(code) ON DELETE CASCADE,
  desde_phone  VARCHAR(20),
  hacia_phone  VARCHAR(20),
  motivo       TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_ticket ON ticket_movimientos(ticket_code);
CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_tipo ON ticket_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_created_at ON ticket_movimientos(created_at);

-- FK vendedor_phone -> users(phone) (se agrega si phone existe)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_vendedor_phone_fkey;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_vendedor_phone_fkey
  FOREIGN KEY (vendedor_phone) REFERENCES users(phone) ON DELETE SET NULL;

-- 7) ENSAYOS GENERALES (si se usa en rutas)
CREATE TABLE IF NOT EXISTS ensayos_generales (
  id          SERIAL PRIMARY KEY,
  obra_id     INT NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  fecha       TIMESTAMP NOT NULL,
  hora_fin    TIME,
  lugar       VARCHAR(200) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ensayos_obra ON ensayos_generales(obra_id);
CREATE INDEX IF NOT EXISTS idx_ensayos_fecha ON ensayos_generales(fecha);

-- VISTAS
CREATE OR REPLACE VIEW v_grupos_completos AS
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
  g.foto_url,
  g.created_at,
  g.updated_at,
  COUNT(gm.id) FILTER (WHERE gm.activo = TRUE) AS miembros_activos
FROM grupos g
JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
GROUP BY g.id, g.nombre, g.descripcion, g.director_cedula, u.name,
         g.dia_semana, g.hora_inicio, g.fecha_inicio, g.fecha_fin,
         g.obra_a_realizar, g.estado, g.foto_url, g.created_at, g.updated_at;

CREATE OR REPLACE VIEW v_obras_completas AS
SELECT
  o.id,
  o.grupo_id,
  g.nombre AS grupo_nombre,
  g.director_cedula,
  o.nombre,
  o.descripcion,
  o.autor,
  o.genero,
  o.duracion_aprox,
  o.estado,
  o.created_at,
  o.updated_at
FROM obras o
JOIN grupos g ON g.id = o.grupo_id;

CREATE OR REPLACE VIEW v_ensayos_completos AS
SELECT
  e.id,
  e.obra_id,
  o.nombre AS obra_nombre,
  e.titulo,
  e.fecha,
  e.hora_fin,
  e.lugar,
  e.descripcion,
  e.created_at
FROM ensayos_generales e
JOIN obras o ON o.id = e.obra_id;

CREATE OR REPLACE VIEW v_resumen_vendedor_funcion AS
SELECT
  t.funcion_id,
  f.fecha,
  t.vendedor_phone,
  u.name AS vendedor_nombre,
  o.nombre AS obra_nombre,
  COUNT(*) FILTER (WHERE t.estado IN ('STOCK_ACTOR', 'STOCK_VENDEDOR')) AS para_vender,
  COUNT(*) FILTER (WHERE t.estado = 'RESERVADO') AS reservadas,
  COUNT(*) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') AS reportadas_vendidas,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) AS pagadas,
  COUNT(*) FILTER (WHERE t.estado = 'USADO') AS usadas,
  SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS monto_reportado,
  SUM(CASE WHEN t.aprobada_por_admin
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS monto_aprobado,
  SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS monto_debe
FROM tickets t
JOIN funciones f ON f.id = t.funcion_id
JOIN obras o ON o.id = f.obra_id
LEFT JOIN users u ON u.phone = t.vendedor_phone
WHERE t.vendedor_phone IS NOT NULL
GROUP BY t.funcion_id, f.fecha, t.vendedor_phone, u.name, o.nombre;

CREATE OR REPLACE VIEW v_resumen_funcion_admin AS
SELECT
  f.id,
  f.fecha,
  f.lugar,
  f.capacidad,
  f.precio_base,
  f.estado AS estado_funcion,
  f.foto_url,
  o.id as obra_id,
  o.nombre AS obra_nombre,
  g.id as grupo_id,
  g.nombre AS grupo_nombre,

  COUNT(t.code) AS total_generados,
  COUNT(*) FILTER (WHERE t.estado = 'DISPONIBLE') AS disponibles,
  COUNT(*) FILTER (WHERE t.estado IN ('STOCK_ACTOR', 'STOCK_VENDEDOR')) AS en_stock_vendedores,
  COUNT(*) FILTER (WHERE t.estado = 'RESERVADO') AS reservadas,
  COUNT(*) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') AS reportadas_sin_aprobar,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO', 'USADO')) AS pagadas,
  COUNT(*) FILTER (WHERE t.estado = 'USADO') AS usadas,
  COUNT(*) FILTER (WHERE t.estado = 'ANULADO') AS anuladas,

  SUM(CASE WHEN t.estado IN ('REPORTADA_VENDIDA', 'PAGADO', 'USADO')
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS recaudacion_teorica,

  SUM(CASE WHEN t.aprobada_por_admin
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS recaudacion_real,

  SUM(CASE WHEN t.reportada_por_vendedor AND NOT t.aprobada_por_admin
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS pendiente_aprobar

FROM funciones f
JOIN obras o ON o.id = f.obra_id
JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN tickets t ON t.funcion_id = f.id
GROUP BY f.id, f.fecha, f.lugar, f.capacidad, f.precio_base, f.estado,
         f.foto_url, o.id, o.nombre, g.id, g.nombre;

CREATE OR REPLACE VIEW v_resumen_grupos AS
SELECT
  g.id,
  g.nombre,
  g.descripcion,
  g.director_cedula,
  u.name as director_nombre,
  g.dia_semana,
  g.hora_inicio,
  g.fecha_inicio,
  g.fecha_fin,
  g.obra_a_realizar,
  g.estado,
  g.created_at,
  g.updated_at,
  COUNT(DISTINCT gm.miembro_cedula) FILTER (WHERE gm.activo = TRUE) as total_miembros,
  COUNT(DISTINCT o.id) as total_obras,
  COUNT(DISTINCT f.id) as total_funciones
FROM grupos g
LEFT JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
LEFT JOIN obras o ON o.grupo_id = g.id
LEFT JOIN funciones f ON f.obra_id = o.id
GROUP BY g.id, g.nombre, g.descripcion, g.director_cedula, u.name,
         g.dia_semana, g.hora_inicio, g.fecha_inicio, g.fecha_fin,
         g.obra_a_realizar, g.estado, g.created_at, g.updated_at;
