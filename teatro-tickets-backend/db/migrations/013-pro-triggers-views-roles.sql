-- 013 - Triggers inteligentes, vistas PRO y roles SQL
-- Fecha: 2026-01-08

BEGIN;

-- =========================================================
-- 1) Cierre por función + trigger de cálculo
-- =========================================================
CREATE TABLE IF NOT EXISTS cierre_funcion (
  id SERIAL PRIMARY KEY,
  funcion_id INTEGER NOT NULL UNIQUE REFERENCES funciones(id) ON DELETE CASCADE,
  total_ingresos NUMERIC(12,2) DEFAULT 0,
  total_gastos NUMERIC(12,2) DEFAULT 0,
  resultado NUMERIC(12,2) DEFAULT 0,
  creado_por VARCHAR(20) REFERENCES users(cedula),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION validar_cierre_funcion()
RETURNS TRIGGER AS $$
DECLARE
  ingresos NUMERIC(12,2) := 0;
  gastos NUMERIC(12,2) := 0;
BEGIN
  SELECT COALESCE(SUM(CASE WHEN t.estado IN ('PAGADO','USADO') THEN COALESCE(t.precio, f.precio_base, 0) ELSE 0 END), 0)
    INTO ingresos
  FROM funciones f
  LEFT JOIN tickets t ON t.funcion_id = f.id
  WHERE f.id = NEW.funcion_id;

  IF to_regclass('public.gastos') IS NOT NULL THEN
    SELECT COALESCE(SUM(g.monto), 0) INTO gastos FROM gastos g WHERE g.funcion_id = NEW.funcion_id;
  END IF;

  NEW.total_ingresos := ingresos;
  NEW.total_gastos := gastos;
  NEW.resultado := ingresos - gastos;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_cierre_funcion ON cierre_funcion;
CREATE TRIGGER trg_validar_cierre_funcion
BEFORE INSERT ON cierre_funcion
FOR EACH ROW
EXECUTE FUNCTION validar_cierre_funcion();

-- =====================================
-- 2) Bloqueos cuando la función está cerrada
-- =====================================
CREATE OR REPLACE FUNCTION bloquear_cambios_funcion_cerrada()
RETURNS TRIGGER AS $$
DECLARE
  v_funcion_id INTEGER;
BEGIN
  SELECT COALESCE(NEW.funcion_id, OLD.funcion_id) INTO v_funcion_id;
  IF EXISTS (SELECT 1 FROM cierre_funcion cf WHERE cf.funcion_id = v_funcion_id) THEN
    RAISE EXCEPTION 'La función está cerrada. No se permiten modificaciones.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF to_regclass('public.gastos') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_bloquear_gastos_funcion_cerrada ON gastos;
    CREATE TRIGGER trg_bloquear_gastos_funcion_cerrada
    BEFORE INSERT OR UPDATE OR DELETE ON gastos
    FOR EACH ROW
    EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();
  END IF;

  IF to_regclass('public.tickets') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_bloquear_tickets_funcion_cerrada_ins ON tickets;
    DROP TRIGGER IF EXISTS trg_bloquear_tickets_funcion_cerrada_upd ON tickets;
    DROP TRIGGER IF EXISTS trg_bloquear_tickets_funcion_cerrada_del ON tickets;

    CREATE TRIGGER trg_bloquear_tickets_funcion_cerrada_ins
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();

    CREATE TRIGGER trg_bloquear_tickets_funcion_cerrada_upd
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();

    CREATE TRIGGER trg_bloquear_tickets_funcion_cerrada_del
    BEFORE DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION bloquear_cambios_funcion_cerrada();
  END IF;
END $$;

-- (Se moverán vistas y permisos a una migración separada para evitar errores de sintaxis en entornos parciales)

COMMIT;
