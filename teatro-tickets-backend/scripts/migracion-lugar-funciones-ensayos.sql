-- Migración: Estandarizar nombres de columnas de lugar
-- Fecha: 21 de diciembre de 2025

BEGIN;

-- 1. Renombrar 'direccion' a 'lugar' en shows para consistencia
-- NOTA: Si ya fue ejecutado, ignorar error
DO $$
BEGIN
    ALTER TABLE shows RENAME COLUMN direccion TO lugar;
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Column direccion already renamed or does not exist';
END $$;

-- 2. Verificar que ensayos_generales tiene columna 'lugar'
-- Ya existe por defecto

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN shows.lugar IS 'Lugar/dirección donde se realiza la función';
COMMENT ON COLUMN ensayos_generales.lugar IS 'Lugar/dirección donde se realiza el ensayo';

COMMIT;

-- Verificación
SELECT 'shows' as tabla, 
       COUNT(*) FILTER (WHERE column_name = 'lugar') as tiene_lugar
FROM information_schema.columns 
WHERE table_name = 'shows' AND table_schema = 'public'
UNION ALL
SELECT 'ensayos_generales' as tabla,
       COUNT(*) FILTER (WHERE column_name = 'lugar') as tiene_lugar
FROM information_schema.columns 
WHERE table_name = 'ensayos_generales' AND table_schema = 'public';
