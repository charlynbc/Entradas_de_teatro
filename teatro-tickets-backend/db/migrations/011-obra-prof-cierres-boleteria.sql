-- 011 - Obra profesional: cierres, vistas de boletería y contabilidad
-- Fecha: 2026-01-08

BEGIN;

-- Tabla de cierres de obras profesionales (bloquea ventas/modificaciones)
CREATE TABLE IF NOT EXISTS cierre_obras_profesionales (
  id SERIAL PRIMARY KEY,
  obra_id INTEGER NOT NULL UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
  fecha_cierre DATE NOT NULL DEFAULT CURRENT_DATE,
  ingresos_totales NUMERIC(12,2) DEFAULT 0,
  gastos_totales NUMERIC(12,2) DEFAULT 0,
  balance_final NUMERIC(12,2) DEFAULT 0,
  cerrado_por VARCHAR(20) REFERENCES users(cedula),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Función + trigger para impedir ventas/actualizaciones en obras cerradas
CREATE OR REPLACE FUNCTION trg_bloquear_tickets_obra_cerrada()
RETURNS TRIGGER AS $$
DECLARE
  v_obra_id INTEGER;
BEGIN
  SELECT o.id INTO v_obra_id
  FROM funciones f
  JOIN obras o ON o.id = f.obra_id
  WHERE f.id = COALESCE(NEW.funcion_id, OLD.funcion_id)
  LIMIT 1;

  IF v_obra_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cierre_obras_profesionales cop WHERE cop.obra_id = v_obra_id
  ) THEN
    RAISE EXCEPTION 'La obra profesional está cerrada. No se pueden modificar tickets.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tickets_obra_cerrada_ins ON tickets;
CREATE TRIGGER trg_tickets_obra_cerrada_ins
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION trg_bloquear_tickets_obra_cerrada();

DROP TRIGGER IF EXISTS trg_tickets_obra_cerrada_upd ON tickets;
CREATE TRIGGER trg_tickets_obra_cerrada_upd
BEFORE UPDATE ON tickets
FOR EACH ROW
WHEN (NEW.estado IS DISTINCT FROM OLD.estado OR NEW.vendedor_phone IS DISTINCT FROM OLD.vendedor_phone)
EXECUTE FUNCTION trg_bloquear_tickets_obra_cerrada();

-- Vista de boletería por obra profesional y función
CREATE OR REPLACE VIEW v_boleteria_obras_profesionales AS
SELECT
  o.id AS obra_id,
  o.nombre AS obra_nombre,
  f.id AS funcion_id,
  f.fecha AS fecha_funcion,
  f.lugar,
  COALESCE(f.precio_base, 0) AS precio_base,
  COUNT(t.code) FILTER (WHERE t.estado IN ('REPORTADA_VENDIDA','PAGADO','USADO')) AS entradas_vendidas,
  COUNT(t.code) FILTER (WHERE t.estado IN ('PAGADO','USADO')) AS entradas_pagadas,
  SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS total_recaudado
FROM obras o
JOIN funciones f ON f.obra_id = o.id
LEFT JOIN tickets t ON t.funcion_id = f.id
WHERE COALESCE(o.es_profesional, FALSE) = TRUE
GROUP BY o.id, o.nombre, f.id, f.fecha, f.lugar, f.precio_base;

-- Vista de balance por obra profesional
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastos') THEN
    CREATE OR REPLACE VIEW v_balance_obras_profesionales AS
    SELECT
      o.id AS obra_id,
      o.nombre AS obra_nombre,
      COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) AS ingresos,
      COALESCE(SUM(g.monto), 0) AS gastos,
      COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) - COALESCE(SUM(g.monto), 0) AS balance
    FROM obras o
    JOIN funciones f ON f.obra_id = o.id
    LEFT JOIN tickets t ON t.funcion_id = f.id
    LEFT JOIN gastos g ON g.funcion_id = f.id
    WHERE COALESCE(o.es_profesional, FALSE) = TRUE
    GROUP BY o.id, o.nombre;
  ELSE
    CREATE OR REPLACE VIEW v_balance_obras_profesionales AS
    SELECT
      o.id AS obra_id,
      o.nombre AS obra_nombre,
      COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) AS ingresos,
      0::NUMERIC(12,2) AS gastos,
      COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) AS balance
    FROM obras o
    JOIN funciones f ON f.obra_id = o.id
    LEFT JOIN tickets t ON t.funcion_id = f.id
    WHERE COALESCE(o.es_profesional, FALSE) = TRUE
    GROUP BY o.id, o.nombre;
  END IF;
END$$;

-- Vista de contabilidad anual (soporta ausencia de cuotas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuotas') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastos') THEN
      CREATE OR REPLACE VIEW v_contabilidad_anual_base AS
      SELECT
        g.director_cedula AS director_cedula,
        EXTRACT(YEAR FROM f.fecha)::INT AS anio,
        SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS ingresos_funciones,
        SUM(CASE WHEN c.estado = 'pagada' THEN c.monto ELSE 0 END) AS ingresos_cuotas,
        SUM(COALESCE(ga.monto, 0)) AS gastos
      FROM grupos g
      JOIN obras o ON o.grupo_id = g.id
      JOIN funciones f ON f.obra_id = o.id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      LEFT JOIN gastos ga ON ga.funcion_id = f.id
      LEFT JOIN cuotas c ON c.grupo_id = g.id
      GROUP BY g.director_cedula, EXTRACT(YEAR FROM f.fecha)::INT;
    ELSE
      CREATE OR REPLACE VIEW v_contabilidad_anual_base AS
      SELECT
        g.director_cedula AS director_cedula,
        EXTRACT(YEAR FROM f.fecha)::INT AS anio,
        SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS ingresos_funciones,
        SUM(CASE WHEN c.estado = 'pagada' THEN c.monto ELSE 0 END) AS ingresos_cuotas,
        0::NUMERIC(12,2) AS gastos
      FROM grupos g
      JOIN obras o ON o.grupo_id = g.id
      JOIN funciones f ON f.obra_id = o.id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      LEFT JOIN cuotas c ON c.grupo_id = g.id
      GROUP BY g.director_cedula, EXTRACT(YEAR FROM f.fecha)::INT;
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastos') THEN
      CREATE OR REPLACE VIEW v_contabilidad_anual_base AS
      SELECT
        g.director_cedula AS director_cedula,
        EXTRACT(YEAR FROM f.fecha)::INT AS anio,
        SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS ingresos_funciones,
        0::NUMERIC(12,2) AS ingresos_cuotas,
        SUM(COALESCE(ga.monto, 0)) AS gastos
      FROM grupos g
      JOIN obras o ON o.grupo_id = g.id
      JOIN funciones f ON f.obra_id = o.id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      LEFT JOIN gastos ga ON ga.funcion_id = f.id
      GROUP BY g.director_cedula, EXTRACT(YEAR FROM f.fecha)::INT;
    ELSE
      CREATE OR REPLACE VIEW v_contabilidad_anual_base AS
      SELECT
        g.director_cedula AS director_cedula,
        EXTRACT(YEAR FROM f.fecha)::INT AS anio,
        SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END) AS ingresos_funciones,
        0::NUMERIC(12,2) AS ingresos_cuotas,
        0::NUMERIC(12,2) AS gastos
      FROM grupos g
      JOIN obras o ON o.grupo_id = g.id
      JOIN funciones f ON f.obra_id = o.id
      LEFT JOIN tickets t ON t.funcion_id = f.id
      GROUP BY g.director_cedula, EXTRACT(YEAR FROM f.fecha)::INT;
    END IF;
  END IF;
END$$;

-- Tabla de cierres anuales por director
CREATE TABLE IF NOT EXISTS cierre_anual_director (
  id SERIAL PRIMARY KEY,
  director_cedula VARCHAR(20) REFERENCES users(cedula),
  anio INTEGER NOT NULL,
  ingresos_funciones NUMERIC(12,2) DEFAULT 0,
  ingresos_cuotas NUMERIC(12,2) DEFAULT 0,
  gastos_totales NUMERIC(12,2) DEFAULT 0,
  balance_final NUMERIC(12,2) DEFAULT 0,
  cerrado_por VARCHAR(20) REFERENCES users(cedula),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (director_cedula, anio)
);

-- Refrescar v_obras_completas para exponer es_profesional
DROP VIEW IF EXISTS v_obras_completas;
CREATE VIEW v_obras_completas AS
SELECT
  o.id,
  o.grupo_id,
  g.nombre AS grupo_nombre,
  o.nombre,
  o.descripcion,
  o.autor,
  o.genero,
  o.duracion_aprox,
  COALESCE(o.es_profesional, FALSE) AS es_profesional,
  o.estado,
  o.created_at,
  o.updated_at
FROM obras o
JOIN grupos g ON g.id = o.grupo_id;

COMMIT;
