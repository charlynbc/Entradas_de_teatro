-- ========================================
-- MIGRACIÓN 005: Cierre definitivo de grupo (CERRADO) + campos de liquidación
-- Fecha: 07/01/2026
-- Reglas: NO borra datos.
-- ========================================

-- 1) GRUPOS.estado: agregar CERRADO (manteniendo legacy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'grupos'
      AND column_name = 'estado'
  ) THEN
    ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_estado_check;
    ALTER TABLE grupos ADD CONSTRAINT grupos_estado_check
      CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PAUSADO', 'ARCHIVADO', 'FINALIZADO', 'CANCELADO', 'CERRADO'));
  END IF;
END $$;

-- 2) Tabla liquidaciones_grupo: compatibilidad con resumen financiero de cierre
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name='liquidaciones_grupo'
  ) THEN
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS total_vendidos INT;
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS total_pagados INT;
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS total_recaudado NUMERIC(10,2);
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS total_pendiente NUMERIC(10,2);
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP;
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS cerrado_por VARCHAR(20);
    ALTER TABLE liquidaciones_grupo ADD COLUMN IF NOT EXISTS observaciones TEXT;

    -- Backfill suave desde campos existentes (si aplica)
    UPDATE liquidaciones_grupo
      SET total_recaudado = COALESCE(total_recaudado, ingresos_total)
      WHERE total_recaudado IS NULL;

    UPDATE liquidaciones_grupo
      SET total_pagados = COALESCE(total_pagados, tickets_pagados)
      WHERE total_pagados IS NULL;

    UPDATE liquidaciones_grupo
      SET fecha_cierre = COALESCE(fecha_cierre, created_at)
      WHERE fecha_cierre IS NULL;
  END IF;
END $$;

-- Índices: crear solo si la tabla existe (CREATE INDEX IF NOT EXISTS falla si la tabla no existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name='liquidaciones_grupo'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_liquidaciones_grupo_grupo_id ON liquidaciones_grupo(grupo_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grupos_estado ON grupos(estado);
