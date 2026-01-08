-- 015 - Vistas de dashboard PRO y permisos SQL refinados
-- Fecha: 2026-01-08

BEGIN;

-- =============================
-- Vistas para dashboards PRO
-- =============================

-- Vista: Recaudación por función
DROP VIEW IF EXISTS vw_recaudacion_funcion CASCADE;
CREATE VIEW vw_recaudacion_funcion AS
SELECT
  f.id AS funcion_id,
  o.nombre AS titulo,
  f.fecha,
  f.lugar,
  COUNT(t.code) FILTER (WHERE t.estado IN ('PAGADO','USADO')) AS entradas_pagadas,
  COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0) AS total_recaudado
FROM funciones f
LEFT JOIN obras o ON o.id = f.obra_id
LEFT JOIN tickets t ON t.funcion_id = f.id
GROUP BY f.id, o.nombre, f.fecha, f.lugar;

-- Vista: Balance de obra profesional (usando cierre_funcion si existe)
DROP VIEW IF EXISTS vw_balance_obra_profesional CASCADE;
CREATE VIEW vw_balance_obra_profesional AS
SELECT
  o.id AS obra_id,
  o.nombre,
  COALESCE(SUM(cf.total_ingresos), 0) AS ingresos,
  COALESCE(SUM(cf.total_gastos), 0) AS gastos,
  COALESCE(SUM(cf.resultado), 0) AS resultado
FROM obras o
LEFT JOIN funciones f ON f.obra_id = o.id
LEFT JOIN cierre_funcion cf ON cf.funcion_id = f.id
WHERE COALESCE(o.es_profesional, FALSE) = TRUE
GROUP BY o.id, o.nombre;

-- Vista: Balance anual por director (desde cierre_anual_director)
DROP VIEW IF EXISTS vw_balance_anual_director CASCADE;
CREATE VIEW vw_balance_anual_director AS
SELECT
  cad.director_cedula,
  cad.anio,
  cad.ingresos_funciones AS total_ingresos_entradas,
  cad.ingresos_cuotas AS total_ingresos_cuotas,
  cad.gastos_totales AS total_gastos,
  cad.balance_final AS resultado_final,
  cad.creado_en
FROM cierre_anual_director cad;

-- =====================================
-- Roles y permisos SQL refinados
-- =====================================

-- Crear roles si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_super') THEN
    CREATE ROLE rol_super;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_director') THEN
    CREATE ROLE rol_director;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_boleteria') THEN
    CREATE ROLE rol_boleteria;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_actor') THEN
    CREATE ROLE rol_actor;
  END IF;
END $$;

-- Super: control total
DO $$
BEGIN
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_super';
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_super';
  EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO rol_super';
  EXECUTE 'GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO rol_super';
END $$;

-- Director: gestión de funciones, gastos, cierres y balance
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['funciones','cierre_funcion','cierre_anual_director'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE ON %I TO rol_director', t);
    END IF;
  END LOOP;

  -- Lectura de catálogo
  FOREACH t IN ARRAY ARRAY['tickets','obras','grupos','users'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON %I TO rol_director', t);
    END IF;
  END LOOP;
  
  -- Procedimientos permitidos
  EXECUTE 'GRANT EXECUTE ON PROCEDURE cerrar_funcion TO rol_director';
  EXECUTE 'GRANT EXECUTE ON PROCEDURE generar_balance_anual TO rol_director';
END $$;

-- Boletería: venta/cobro de tickets, lectura de funciones y cierres
DO $$
DECLARE
  t TEXT;
BEGIN
  IF to_regclass('public.tickets') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON tickets TO rol_boleteria';
  END IF;

  FOREACH t IN ARRAY ARRAY['funciones','cierre_funcion','obras'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON %I TO rol_boleteria', t);
    END IF;
  END LOOP;
END $$;

-- Actor: solo lectura de agenda y tickets propios
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['funciones','tickets','obras','grupos'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON %I TO rol_actor', t);
    END IF;
  END LOOP;
END $$;

-- Permisos sobre vistas de dashboard
DO $$
DECLARE
  v TEXT;
  r TEXT;
BEGIN
  FOR v IN SELECT unnest(ARRAY['vw_recaudacion_funcion','vw_balance_obra_profesional','vw_balance_anual_director']) LOOP
    IF to_regclass('public.' || v) IS NOT NULL THEN
      FOR r IN SELECT unnest(ARRAY['rol_super','rol_director','rol_boleteria']) LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
          EXECUTE format('GRANT SELECT ON %I TO %I', v, r);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Permisos sobre secuencias (para INSERT en tickets, cierre_funcion, etc.)
DO $$
DECLARE
  s TEXT;
BEGIN
  FOR s IN SELECT unnest(ARRAY['tickets_code_seq','cierre_funcion_id_seq','cierre_anual_director_id_seq','auditoria_id_seq']) LOOP
    IF to_regclass('public.' || s) IS NOT NULL THEN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO rol_director', s);
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO rol_boleteria', s);
    END IF;
  END LOOP;
END $$;

COMMIT;
