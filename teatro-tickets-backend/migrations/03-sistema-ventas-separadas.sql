-- ============================================
-- MIGRACIONES - SISTEMA DE VENTAS SEPARADAS
-- ============================================
-- Descripción: Agregar campos para distinguir
-- origen de venta: ACTOR, ONLINE, CORTESIA
--
-- IMPORTANTE: Non-breaking migration
-- - Solo agrega columnas
-- - Usa DEFAULT para valores existentes
-- - No borra nada
-- ============================================

-- ============================================
-- 1. FUNCIONES - Agregar tipo y compra online
-- ============================================

ALTER TABLE funciones ADD COLUMN IF NOT EXISTS 
  tipo_funcion VARCHAR(20) DEFAULT 'INDEPENDIENTE'
  CHECK (tipo_funcion IN ('INDEPENDIENTE', 'PROFESIONAL'));

ALTER TABLE funciones ADD COLUMN IF NOT EXISTS
  permite_compra_online BOOLEAN DEFAULT FALSE;

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_funciones_tipo 
  ON funciones(tipo_funcion);

CREATE INDEX IF NOT EXISTS idx_funciones_compra_online 
  ON funciones(permite_compra_online);

-- ============================================
-- 2. TICKETS - Agregar origen y email
-- ============================================

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS
  origen_venta VARCHAR(20) DEFAULT 'ACTOR'
  CHECK (origen_venta IN ('ACTOR', 'ONLINE', 'CORTESIA'));

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS
  comprador_email VARCHAR(100);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS
  fecha_pago_sistema TIMESTAMP;

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_origen
  ON tickets(origen_venta);

CREATE INDEX IF NOT EXISTS idx_tickets_email
  ON tickets(comprador_email);

CREATE INDEX IF NOT EXISTS idx_tickets_pago_sistema
  ON tickets(fecha_pago_sistema);

-- ============================================
-- 3. NUEVA TABLA - COMPRAS PÚBLICAS (auditoría)
-- ============================================

CREATE TABLE IF NOT EXISTS compras_publicas (
  id SERIAL PRIMARY KEY,
  
  -- Identificación
  compra_codigo VARCHAR(30) NOT NULL UNIQUE,
  
  -- Datos del comprador
  comprador_nombre VARCHAR(100) NOT NULL,
  comprador_email VARCHAR(100) NOT NULL,
  comprador_telefono VARCHAR(20),
  
  -- Datos de la compra
  funcion_id INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  cantidad_tickets INT NOT NULL DEFAULT 1,
  
  -- Tickets asociados
  ticket_codes TEXT[], -- Array de códigos de tickets
  
  -- Datos financieros
  precio_unitario NUMERIC(10,2) NOT NULL,
  precio_total NUMERIC(10,2) NOT NULL,
  
  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA'
    CHECK (estado IN ('PENDIENTE', 'COMPLETADA', 'CANCELADA', 'REEMBOLSADA')),
  
  -- Método de pago (futuro)
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(100),
  
  -- Auditoría
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Nota: email de confirmación enviado
  email_confirmacion_enviado BOOLEAN DEFAULT FALSE,
  email_confirmacion_enviado_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compras_publicas_email
  ON compras_publicas(comprador_email);

CREATE INDEX IF NOT EXISTS idx_compras_publicas_funcion
  ON compras_publicas(funcion_id);

CREATE INDEX IF NOT EXISTS idx_compras_publicas_estado
  ON compras_publicas(estado);

CREATE INDEX IF NOT EXISTS idx_compras_publicas_fecha
  ON compras_publicas(created_at);

-- ============================================
-- 4. NUEVA TABLA - CORTESÍAS (tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS tickets_cortesia (
  id SERIAL PRIMARY KEY,
  
  -- Ticket relacionado
  ticket_code VARCHAR(50) NOT NULL UNIQUE REFERENCES tickets(code) ON DELETE CASCADE,
  
  -- Quién asignó
  asignado_por_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  
  -- Detalles
  motivo VARCHAR(200),
  personalidad_nota VARCHAR(500),
  
  -- Auditoría
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cortesia_ticket
  ON tickets_cortesia(ticket_code);

CREATE INDEX IF NOT EXISTS idx_cortesia_asignado_por
  ON tickets_cortesia(asignado_por_cedula);

-- ============================================
-- 5. RELLENAR DATOS HISTÓRICOS (seguro)
-- ============================================

-- Todos los tickets existentes son ACTOR (salvo que se cambien)
-- Esta línea es idempotente (no rompe nada)
UPDATE tickets 
SET origen_venta = 'ACTOR' 
WHERE origen_venta = 'ACTOR' OR origen_venta IS NULL;

-- Todas las funciones existentes son INDEPENDIENTE
UPDATE funciones
SET tipo_funcion = 'INDEPENDIENTE'
WHERE tipo_funcion = 'INDEPENDIENTE' OR tipo_funcion IS NULL;

-- Compra online deshabilitada por defecto (seguridad)
UPDATE funciones
SET permite_compra_online = FALSE
WHERE permite_compra_online IS NULL;

-- ============================================
-- 6. VISTA - FUNCIONES CON DISPONIBILIDAD
-- ============================================

CREATE OR REPLACE VIEW v_funciones_disponibles AS
SELECT
  f.id,
  f.fecha,
  f.lugar,
  f.precio_base,
  f.capacidad,
  f.tipo_funcion,
  f.permite_compra_online,
  o.id AS obra_id,
  o.nombre AS obra_nombre,
  o.descripcion,
  g.id AS grupo_id,
  g.nombre AS grupo_nombre,
  
  -- Disponibilidad
  (SELECT COUNT(*) FROM tickets t 
   WHERE t.funcion_id = f.id AND t.estado = 'DISPONIBLE') AS entradas_disponibles,
  
  (SELECT COUNT(*) FROM tickets t 
   WHERE t.funcion_id = f.id AND t.estado IN ('STOCK_ACTOR', 'RESERVADO', 'REPORTADA_VENDIDA')) AS entradas_vendidas,
  
  (SELECT COUNT(*) FROM tickets t 
   WHERE t.funcion_id = f.id AND t.estado = 'PAGADO') AS entradas_pagadas,
  
  (SELECT COUNT(*) FROM tickets t 
   WHERE t.funcion_id = f.id AND t.estado = 'USADO') AS entradas_usadas
  
FROM funciones f
LEFT JOIN obras o ON o.id = f.obra_id
LEFT JOIN grupos g ON g.id = o.grupo_id
WHERE f.estado IN ('PROGRAMADA', 'CONFIRMADA')
  AND f.fecha >= NOW();

-- ============================================
-- 7. VISTA - VENTAS POR ORIGEN
-- ============================================

CREATE OR REPLACE VIEW v_ventas_por_origen AS
SELECT
  f.id AS funcion_id,
  f.fecha,
  o.nombre AS obra_nombre,
  g.nombre AS grupo_nombre,
  
  COUNT(t.code) FILTER (WHERE t.origen_venta = 'ACTOR') AS vendidas_por_actor,
  COUNT(t.code) FILTER (WHERE t.origen_venta = 'ONLINE') AS vendidas_online,
  COUNT(t.code) FILTER (WHERE t.origen_venta = 'CORTESIA') AS cortesias,
  
  COUNT(t.code) FILTER (WHERE t.estado = 'PAGADO') AS pagadas,
  COUNT(t.code) FILTER (WHERE t.estado = 'USADO') AS usadas,
  
  COUNT(t.code) AS total_vendidas,
  
  SUM(t.precio) FILTER (WHERE t.origen_venta = 'ACTOR') AS ingresos_actor,
  SUM(t.precio) FILTER (WHERE t.origen_venta = 'ONLINE') AS ingresos_online,
  SUM(t.precio) FILTER (WHERE t.estado = 'PAGADO') AS ingresos_pagados,
  SUM(t.precio) AS ingresos_totales
  
FROM funciones f
LEFT JOIN obras o ON o.id = f.obra_id
LEFT JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN tickets t ON t.funcion_id = f.id
WHERE f.estado IN ('PROGRAMADA', 'CONFIRMADA', 'REALIZADA')
GROUP BY f.id, f.fecha, o.nombre, g.nombre
ORDER BY f.fecha DESC;

-- ============================================
-- 8. FUNCIÓN - Generar código de compra
-- ============================================

CREATE OR REPLACE FUNCTION generar_codigo_compra()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'COMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         LPAD(NEXTVAL('compras_publicas_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGER - Actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_compras()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compras_publicas_timestamp ON compras_publicas;
CREATE TRIGGER trg_compras_publicas_timestamp
BEFORE UPDATE ON compras_publicas
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_compras();

DROP TRIGGER IF EXISTS trg_cortesia_timestamp ON tickets_cortesia;
CREATE TRIGGER trg_cortesia_timestamp
BEFORE UPDATE ON tickets_cortesia
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_compras();

-- ============================================
-- 10. PERMISO - Tabla pública para queries
-- ============================================

-- Las vistas se pueden consultar sin auth (auditoría en aplicación)
GRANT SELECT ON v_funciones_disponibles TO PUBLIC;

-- Las compras y cortesías solo por app logic
-- (No dar acceso directo a DB para estas)

-- ============================================
-- VALIDACIÓN - Queries útiles para testing
-- ============================================

-- Ver funciones con compra online habilitada:
-- SELECT * FROM v_funciones_disponibles 
-- WHERE permite_compra_online = true;

-- Ver todas las ventas por origen:
-- SELECT * FROM v_ventas_por_origen 
-- ORDER BY fecha DESC;

-- Ver compras recientes:
-- SELECT * FROM compras_publicas 
-- ORDER BY created_at DESC LIMIT 10;

-- Ver cortesías otorgadas:
-- SELECT tc.*, t.code, u.name as asignado_por
-- FROM tickets_cortesia tc
-- JOIN tickets t ON t.code = tc.ticket_code
-- JOIN users u ON u.cedula = tc.asignado_por_cedula
-- ORDER BY tc.created_at DESC;

-- ============================================
-- END MIGRATIONS
-- ============================================
