-- 012 - Snapshot de descripción de obra profesional en funciones
-- Fecha: 2026-01-08

BEGIN;

-- Columna snapshot en funciones
ALTER TABLE funciones
ADD COLUMN IF NOT EXISTS descripcion_obra TEXT;

-- Función: copiar descripción de obra profesional al crear función
CREATE OR REPLACE FUNCTION copiar_descripcion_obra_profesional()
RETURNS TRIGGER AS $$
DECLARE
  v_es_profesional BOOLEAN := FALSE;
  v_descripcion TEXT := NULL;
BEGIN
  SELECT COALESCE(o.es_profesional, FALSE), o.descripcion
    INTO v_es_profesional, v_descripcion
  FROM obras o
  WHERE o.id = NEW.obra_id;

  IF v_es_profesional THEN
    NEW.descripcion_obra := COALESCE(NEW.descripcion_obra, v_descripcion);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de inserción
DROP TRIGGER IF EXISTS trg_copiar_descripcion_obra ON funciones;
CREATE TRIGGER trg_copiar_descripcion_obra
BEFORE INSERT ON funciones
FOR EACH ROW
EXECUTE FUNCTION copiar_descripcion_obra_profesional();

-- Backfill para funciones existentes de obras profesionales
UPDATE funciones f
SET descripcion_obra = o.descripcion
FROM obras o
WHERE f.obra_id = o.id
  AND COALESCE(o.es_profesional, FALSE) = TRUE
  AND f.descripcion_obra IS NULL;

COMMIT;
