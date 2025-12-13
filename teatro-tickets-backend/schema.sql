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
  phone         VARCHAR(20)
);

-- Índice único opcional para phone si se usa como identificador de login
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);

-- Usuario Super (único) - password por defecto: admin123
-- Tipos de usuario: SUPER (único), ADMIN (directores), VENDEDOR (actores), INVITADO (sin login)
INSERT INTO users (cedula, name, role, password_hash, phone, active) VALUES
  ('48376669', 'Super Usuario', 'SUPER', '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e', '48376669', TRUE)
ON CONFLICT (cedula) DO UPDATE SET role = 'SUPER', password_hash = '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e';

-- 2. FUNCIONES (shows)
CREATE TABLE shows (
  id           SERIAL PRIMARY KEY,
  obra         VARCHAR(200) NOT NULL,
  fecha        TIMESTAMP NOT NULL,
  lugar        VARCHAR(200),
  capacidad    INT NOT NULL,
  base_price   NUMERIC(10,2) NOT NULL,   -- precio base por entrada
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shows_fecha ON shows(fecha);

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

-- ========================================
-- COMENTARIOS PARA ENTENDER EL FLUJO
-- ========================================

/*
FLUJO COMPLETO:

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
