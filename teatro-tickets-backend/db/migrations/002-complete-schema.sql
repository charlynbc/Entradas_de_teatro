-- Migración 002: Schema completo
-- Fecha: 27-12-2025

-- Tabla: obras (catálogo de obras teatrales)
CREATE TABLE IF NOT EXISTS obras (
  id           SERIAL PRIMARY KEY,
  titulo       VARCHAR(255) NOT NULL,
  descripcion  TEXT,
  duracion     INT,
  foto_url     TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla: funciones (presentaciones de obras)
CREATE TABLE IF NOT EXISTS funciones (
  id           SERIAL PRIMARY KEY,
  obra_id      INT REFERENCES obras(id) ON DELETE SET NULL,
  obra         VARCHAR(255),
  fecha        TIMESTAMP NOT NULL,
  lugar        VARCHAR(200),
  capacidad    INT NOT NULL,
  precio_base  NUMERIC(10,2) NOT NULL,
  foto_url     TEXT,
  estado       VARCHAR(20) NOT NULL CHECK (estado IN ('ACTIVA', 'CONCLUIDA', 'CANCELADA')) DEFAULT 'ACTIVA',
  conclusion_director TEXT,
  puntuacion   INT CHECK (puntuacion >= 1 AND puntuacion <= 10),
  fecha_conclusion TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funciones_fecha ON funciones(fecha);
CREATE INDEX IF NOT EXISTS idx_funciones_obra_id ON funciones(obra_id);
CREATE INDEX IF NOT EXISTS idx_funciones_estado ON funciones(estado);

-- Tabla: tickets (entradas para funciones)
CREATE TABLE IF NOT EXISTS tickets (
  code                    VARCHAR(50) PRIMARY KEY,
  funcion_id              INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  estado                  VARCHAR(20) NOT NULL CHECK (
                            estado IN ('DISPONIBLE', 'STOCK_VENDEDOR', 'RESERVADO', 
                                       'REPORTADA_VENDIDA', 'PAGADO', 'USADO')
                          ) DEFAULT 'DISPONIBLE',
  vendedor_phone          VARCHAR(20) REFERENCES users(phone),
  comprador_nombre        VARCHAR(150),
  comprador_contacto      VARCHAR(150),
  precio                  NUMERIC(10,2),
  medio_pago              VARCHAR(50),
  reportada_por_vendedor  BOOLEAN NOT NULL DEFAULT FALSE,
  aprobada_por_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  qr_code                 TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  reservado_at            TIMESTAMP,
  reportada_at            TIMESTAMP,
  pagado_at               TIMESTAMP,
  usado_at                TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_funcion ON tickets(funcion_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vendedor ON tickets(vendedor_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_comprador ON tickets(comprador_nombre);

COMMENT ON TABLE obras IS 'Catálogo de obras teatrales';
COMMENT ON TABLE funciones IS 'Presentaciones/funciones de obras';
COMMENT ON TABLE tickets IS 'Entradas para funciones';
