-- Crear tablas en el orden correcto para evitar problemas de dependencias

-- 1. USUARIOS
CREATE TABLE users (
  cedula         VARCHAR(20) PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('SUPER', 'ADMIN', 'VENDEDOR', 'INVITADO')),
  password_hash TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  phone         VARCHAR(20),
  genero        VARCHAR(20) DEFAULT 'otro'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);

-- Usuario Super
INSERT INTO users (cedula, name, role, password_hash, phone, active) VALUES
  ('48376669', 'Super Usuario', 'SUPER', '\$2b\$10\$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e', '48376669', TRUE)
ON CONFLICT (cedula) DO UPDATE SET role = 'SUPER';

-- 2. GRUPOS (antes de obras)
CREATE TABLE grupos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL UNIQUE,
  descripcion     TEXT,
  director_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  dia_semana      VARCHAR(10),
  hora_inicio     TIME,
  fecha_inicio    DATE,
  fecha_fin       DATE,
  obra_a_realizar VARCHAR(200),
  estado          VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PAUSADO')) DEFAULT 'ACTIVO',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grupos_director ON grupos(director_cedula);
CREATE INDEX idx_grupos_estado ON grupos(estado);

-- 3. GRUPO_MIEMBROS
CREATE TABLE grupo_miembros (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  miembro_cedula  VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  rol_en_grupo    VARCHAR(20) CHECK (rol_en_grupo IN ('DIRECTOR', 'ACTOR')) DEFAULT 'ACTOR',
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(grupo_id, miembro_cedula)
);

CREATE INDEX idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX idx_grupo_miembros_miembro ON grupo_miembros(miembro_cedula);

-- 4. OBRAS
CREATE TABLE obras (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  autor           VARCHAR(200),
  genero          VARCHAR(100),
  duracion_aprox  INT,
  estado          VARCHAR(20) NOT NULL CHECK (estado IN ('EN_DESARROLLO', 'LISTA', 'ARCHIVADA')) DEFAULT 'EN_DESARROLLO',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obras_grupo ON obras(grupo_id);
CREATE INDEX idx_obras_estado ON obras(estado);

-- 5. FUNCIONES/SHOWS (después de obras)
CREATE TABLE shows (
  id           SERIAL PRIMARY KEY,
  obra_id      INT REFERENCES obras(id) ON DELETE SET NULL,
  obra         VARCHAR(200) NOT NULL,
  fecha        TIMESTAMP NOT NULL,
  lugar        VARCHAR(200),
  capacidad    INT NOT NULL,
  base_price   NUMERIC(10,2) NOT NULL,
  foto_url     TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shows_fecha ON shows(fecha);
CREATE INDEX idx_shows_obra_id ON shows(obra_id);

-- 6. TICKETS
CREATE TABLE tickets (
  code                    VARCHAR(50) PRIMARY KEY,
  show_id                 INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  estado                  VARCHAR(20) NOT NULL CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'PAGADO', 'USADO', 'ANULADO')) DEFAULT 'DISPONIBLE',
  precio                  NUMERIC(10,2) NOT NULL,
  comprador_phone         VARCHAR(20),
  comprador_nombre        VARCHAR(100),
  comprador_cedula        VARCHAR(20),
  fecha_compra            TIMESTAMP,
  vendedor_phone          VARCHAR(20) REFERENCES users(phone) ON DELETE SET NULL,
  metodo_pago             VARCHAR(20),
  transaccion_id          VARCHAR(100),
  fecha_uso               TIMESTAMP,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_show ON tickets(show_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_comprador_phone ON tickets(comprador_phone);
CREATE INDEX idx_tickets_vendedor_phone ON tickets(vendedor_phone);

-- 7. ENSAYOS
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

-- 8. VISTAS
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
  g.created_at,
  g.updated_at,
  COALESCE(json_agg(
    json_build_object(
      'cedula', um.cedula,
      'nombre', um.name,
      'rol', gm.rol_en_grupo,
      'activo', gm.activo,
      'joined_at', gm.joined_at
    )
  ) FILTER (WHERE gm.activo = TRUE), '[]'::json) AS miembros
FROM grupos g
JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
LEFT JOIN users um ON um.cedula = gm.miembro_cedula
GROUP BY g.id, g.nombre, g.descripcion, g.director_cedula, u.name, 
         g.dia_semana, g.hora_inicio, g.fecha_inicio, g.fecha_fin, 
         g.obra_a_realizar, g.estado, g.created_at, g.updated_at;

CREATE OR REPLACE VIEW v_obras_completas AS
SELECT
  o.id,
  o.grupo_id,
  g.nombre AS grupo_nombre,
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
