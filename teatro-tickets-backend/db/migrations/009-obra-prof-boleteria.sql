-- Migración 009: Obras profesionales (bandera) y soporte boletería
-- Fecha: 2026-01-08

-- Agregar bandera a obras para marcar si es profesional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='obras'
  ) THEN
    EXECUTE 'ALTER TABLE obras ADD COLUMN IF NOT EXISTS es_profesional BOOLEAN NOT NULL DEFAULT FALSE';
    -- Asegurar default explícito
    EXECUTE 'ALTER TABLE obras ALTER COLUMN es_profesional SET DEFAULT FALSE';
  END IF;
END $$;

-- Nota: El rol "BOLETERIA" se maneja a nivel de aplicación para evitar conflictos
-- con checks previos. Se recomienda crear usuario boletería con phone fijo.
