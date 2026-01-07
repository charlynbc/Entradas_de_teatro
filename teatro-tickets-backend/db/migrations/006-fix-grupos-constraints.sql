-- Migración 006: Ajustar constraints de grupos
-- Fecha: 27-12-2025
-- Descripción: Hacer columnas opcionales según SUPER PROMPT

-- Hacer columnas opcionales en grupos
ALTER TABLE grupos ALTER COLUMN descripcion DROP NOT NULL;
ALTER TABLE grupos ALTER COLUMN dia_semana DROP NOT NULL;
ALTER TABLE grupos ALTER COLUMN hora_inicio DROP NOT NULL;
ALTER TABLE grupos ALTER COLUMN director_principal_cedula DROP NOT NULL;

-- Actualizar constraint de estado
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_estado_check;
ALTER TABLE grupos ADD CONSTRAINT grupos_estado_check 
    CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO'));

-- Actualizar constraint de dia_semana (ahora nullable)
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_dia_semana_check;

COMMENT ON TABLE grupos IS 'Grupos teatrales - estructura flexible según SUPER PROMPT BACÓ';
