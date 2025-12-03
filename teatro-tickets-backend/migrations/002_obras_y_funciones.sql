-- Migración 002: Reestructuración a Obras y Funciones
-- Sistema: OBRAS → FUNCIONES → ENTRADAS → ELENCO

-- 1. Crear tabla OBRAS (lo que antes se llamaba shows)
CREATE TABLE IF NOT EXISTS obras (
  id                VARCHAR(50) PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT,
  imagen_url        TEXT,
  activa            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obras_activa ON obras(activa);
CREATE INDEX idx_obras_nombre ON obras(nombre);

-- 2. Crear tabla FUNCIONES (fechas específicas de cada obra)
CREATE TABLE IF NOT EXISTS funciones (
  id                VARCHAR(50) PRIMARY KEY,
  obra_id           VARCHAR(50) NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  fecha             TIMESTAMP NOT NULL,
  lugar             VARCHAR(200),
  capacidad         INT NOT NULL,
  precio_base       NUMERIC(10,2) NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funciones_obra ON funciones(obra_id);
CREATE INDEX idx_funciones_fecha ON funciones(fecha);

-- 3. Crear tabla ELENCO_OBRA (vendedores asignados a cada obra, no a funciones individuales)
CREATE TABLE IF NOT EXISTS elenco_obra (
  id                SERIAL PRIMARY KEY,
  obra_id           VARCHAR(50) NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  cedula_vendedor   VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  assigned_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(obra_id, cedula_vendedor)
);

CREATE INDEX idx_elenco_obra_obra ON elenco_obra(obra_id);
CREATE INDEX idx_elenco_obra_vendedor ON elenco_obra(cedula_vendedor);

-- 4. Crear nueva tabla ENTRADAS vinculada a FUNCIONES (no a shows)
CREATE TABLE IF NOT EXISTS entradas (
  code                    VARCHAR(50) PRIMARY KEY,
  funcion_id              VARCHAR(50) NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  
  -- ESTADOS:
  -- DISPONIBLE: sin asignar a nadie
  -- EN_STOCK: asignada a vendedor del elenco
  -- RESERVADA: comprador hizo reserva pero no confirmó pago
  -- VENDIDA: vendedor reportó venta
  -- PAGADA: admin confirmó pago
  -- USADA: entrada validada en puerta
  estado                  VARCHAR(20) NOT NULL CHECK (
                            estado IN ('DISPONIBLE', 'EN_STOCK', 'RESERVADA', 
                                       'VENDIDA', 'PAGADA', 'USADA')
                          ) DEFAULT 'DISPONIBLE',
  
  -- Vendedor propietario
  cedula_vendedor         VARCHAR(20) REFERENCES users(cedula),
  
  -- Comprador (para reservas)
  comprador_nombre        VARCHAR(150),
  comprador_contacto      VARCHAR(150),
  
  -- Dinero
  precio                  NUMERIC(10,2),
  
  -- QR code
  qr_code                 TEXT,
  
  -- Timestamps
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  asignada_at             TIMESTAMP,
  reservada_at            TIMESTAMP,
  vendida_at              TIMESTAMP,
  pagada_at               TIMESTAMP,
  usada_at                TIMESTAMP
);

CREATE INDEX idx_entradas_funcion ON entradas(funcion_id);
CREATE INDEX idx_entradas_vendedor ON entradas(cedula_vendedor);
CREATE INDEX idx_entradas_estado ON entradas(estado);
CREATE INDEX idx_entradas_comprador ON entradas(comprador_nombre);

-- 5. Migrar datos existentes de shows a obras y funciones (OPCIONAL - Solo si hay datos)
-- Cada show se convierte en una OBRA con una FUNCIÓN
-- Comentado por defecto para evitar errores si no hay datos legacy

/*
INSERT INTO obras (id, nombre, descripcion, activa, created_at)
SELECT 
  'obra_' || id as id,
  nombre as nombre,
  'Migrado desde shows' as descripcion,
  TRUE as activa,
  created_at
FROM shows
WHERE NOT EXISTS (SELECT 1 FROM obras WHERE obras.nombre = shows.nombre);

INSERT INTO funciones (id, obra_id, fecha, lugar, capacidad, precio_base, created_at)
SELECT 
  id as id,
  'obra_' || id as obra_id,
  fecha,
  'Teatro Principal' as lugar,
  total_tickets as capacidad,
  precio as precio_base,
  created_at
FROM shows;
*/

-- Fin de migración de datos
-- Sistema listo para trabajar con nueva estructura

-- Comentarios
COMMENT ON TABLE obras IS 'Obras de teatro - entidad principal del sistema';
COMMENT ON TABLE funciones IS 'Funciones específicas de cada obra con fecha, hora y lugar';
COMMENT ON TABLE elenco_obra IS 'Vendedores asignados al elenco de cada obra';
COMMENT ON TABLE entradas IS 'Entradas individuales para cada función';
