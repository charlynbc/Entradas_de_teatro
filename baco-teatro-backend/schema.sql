-- Tabla de usuarios (vendedores y admins)
CREATE TABLE IF NOT EXISTS users (
  phone            VARCHAR(20) PRIMARY KEY,
  name             VARCHAR(100),
  role             VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','VENDEDOR')),
  password_hash    TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  active           BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla de funciones/shows
CREATE TABLE IF NOT EXISTS shows (
  id              SERIAL PRIMARY KEY,
  obra            VARCHAR(200) NOT NULL,
  fecha           TIMESTAMP NOT NULL,
  capacidad       INT NOT NULL,
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
  code               VARCHAR(50) PRIMARY KEY,
  show_id            INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,

  estado             VARCHAR(30) NOT NULL CHECK(
                       estado IN (
                         'DISPONIBLE',
                         'STOCK_VENDEDOR',
                         'RESERVADO',
                         'REPORTADA_VENDIDA',
                         'PAGADO',
                         'USADO'
                       )
                     ),

  vendedor_phone     VARCHAR(20) REFERENCES users(phone),
  comprador_nombre   VARCHAR(150),
  comprador_contacto VARCHAR(150),

  precio             NUMERIC(10,2),
  medio_pago         VARCHAR(50),

  reportada_por_vendedor BOOLEAN NOT NULL DEFAULT FALSE,
  aprobada_por_admin     BOOLEAN NOT NULL DEFAULT FALSE,

  creado_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  reservado_at       TIMESTAMP,
  reportada_at       TIMESTAMP,
  pagado_at          TIMESTAMP,
  usado_at           TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_tickets_show ON tickets(show_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vendedor ON tickets(vendedor_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);

-- Usuario admin inicial (password: admin123)
-- Hash generado con bcryptjs.hash('admin123', 10)
INSERT INTO users (phone, name, password_hash, role) 
VALUES (
  '+5491100000000', 
  'Super Admin', 
  '$2a$10$pQRWzSXBvVw0TLQ4hR1e/.lzDOjD8VGp1p7rfF07pTFrC3DZ63A7G',
  'ADMIN'
)
ON CONFLICT (phone) DO NOTHING;
