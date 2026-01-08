-- 014 - Procedimientos almacenados (cerrar función, balance anual) + Auditoría
-- Fecha: 2026-01-08

BEGIN;

-- Campos de control en funciones si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='funciones' AND column_name='cerrada'
  ) THEN
    EXECUTE 'ALTER TABLE funciones ADD COLUMN cerrada BOOLEAN NOT NULL DEFAULT FALSE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='funciones' AND column_name='creada_por'
  ) THEN
    EXECUTE 'ALTER TABLE funciones ADD COLUMN creada_por VARCHAR(20) REFERENCES users(cedula)';
  END IF;
END $$;

-- Tabla de cierre por función ya creada en 013; asegurar compat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cierre_funcion' AND column_name='cerrada_por'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='cierre_funcion' AND column_name='creado_por'
    ) THEN
      EXECUTE 'ALTER TABLE cierre_funcion RENAME COLUMN creado_por TO cerrada_por';
    ELSE
      EXECUTE 'ALTER TABLE cierre_funcion ADD COLUMN cerrada_por VARCHAR(20) REFERENCES users(cedula)';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cierre_funcion' AND column_name='cerrada_en'
  ) THEN
    EXECUTE 'ALTER TABLE cierre_funcion ADD COLUMN cerrada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
  END IF;
END $$;

-- 7A) Procedimiento: cerrar función
CREATE OR REPLACE PROCEDURE cerrar_funcion(
  p_funcion_id INT,
  p_usuario_cedula VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar que no esté cerrada
  IF EXISTS (SELECT 1 FROM funciones WHERE id = p_funcion_id AND cerrada = TRUE) THEN
    RAISE EXCEPTION 'La función ya está cerrada.';
  END IF;

  -- Insertar cierre (trigger 013 calcula ingresos/gastos/resultado)
  INSERT INTO cierre_funcion (funcion_id, cerrada_por)
  VALUES (p_funcion_id, p_usuario_cedula);

  -- Marcar función como cerrada
  UPDATE funciones SET cerrada = TRUE WHERE id = p_funcion_id;
END;
$$;

-- 7B) Tabla cierre anual si no existe (011 la crea pero aseguramos)
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

-- 7B) Procedimiento: generar balance anual
CREATE OR REPLACE PROCEDURE generar_balance_anual(
  p_director_cedula VARCHAR,
  p_anio INT,
  p_cerrado_por VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
  ingresos_entradas NUMERIC(12,2) := 0;
  ingresos_cuotas   NUMERIC(12,2) := 0;
  gastos_totales    NUMERIC(12,2) := 0;
BEGIN
  -- Entradas pagadas de funciones del director en el año
  SELECT COALESCE(SUM(cf.total_ingresos),0)
    INTO ingresos_entradas
  FROM cierre_funcion cf
  JOIN funciones f ON f.id = cf.funcion_id
  JOIN obras o ON o.id = f.obra_id
  JOIN grupos g ON g.id = o.grupo_id
  WHERE g.director_cedula = p_director_cedula
    AND EXTRACT(YEAR FROM cf.cerrada_en) = p_anio;

  -- Cuotas (si existe tabla cuotas)
  IF to_regclass('public.cuotas') IS NOT NULL THEN
    SELECT COALESCE(SUM(c.monto),0)
      INTO ingresos_cuotas
    FROM cuotas c
    JOIN grupos g ON g.id = c.grupo_id
    WHERE g.director_cedula = p_director_cedula
      AND EXTRACT(YEAR FROM c.vencimiento) = p_anio
      AND (c.estado IN ('al_dia','parcial') OR TRUE); -- flexible según estado
  END IF;

  -- Gastos (si existe tabla gastos)
  IF to_regclass('public.gastos') IS NOT NULL THEN
    SELECT COALESCE(SUM(ga.monto),0)
      INTO gastos_totales
    FROM gastos ga
    JOIN funciones f ON f.id = ga.funcion_id
    JOIN obras o ON o.id = f.obra_id
    JOIN grupos g ON g.id = o.grupo_id
    WHERE g.director_cedula = p_director_cedula
      AND EXTRACT(YEAR FROM ga.created_at) = p_anio;
  END IF;

  -- Upsert del cierre anual
  INSERT INTO cierre_anual_director (
    director_cedula, anio, ingresos_funciones, ingresos_cuotas,
    gastos_totales, balance_final, cerrado_por
  ) VALUES (
    p_director_cedula, p_anio, ingresos_entradas, ingresos_cuotas,
    gastos_totales, ingresos_entradas + ingresos_cuotas - gastos_totales, p_cerrado_por
  )
  ON CONFLICT (director_cedula, anio) DO UPDATE SET
    ingresos_funciones = EXCLUDED.ingresos_funciones,
    ingresos_cuotas    = EXCLUDED.ingresos_cuotas,
    gastos_totales     = EXCLUDED.gastos_totales,
    balance_final      = EXCLUDED.balance_final,
    cerrado_por        = EXCLUDED.cerrado_por;
END;
$$;

-- 8) Auditoría histórica
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_cedula VARCHAR(20),
  accion TEXT,
  tabla_afectada TEXT,
  registro_id TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario VARCHAR(20);
  v_registro TEXT;
BEGIN
  v_usuario := current_setting('app.usuario', true);
  IF TG_OP = 'DELETE' THEN
    v_registro := OLD.id::TEXT;
  ELSE
    BEGIN
      v_registro := NEW.id::TEXT;
    EXCEPTION WHEN undefined_column THEN
      v_registro := NULL;
    END;
  END IF;

  INSERT INTO auditoria (usuario_cedula, accion, tabla_afectada, registro_id)
  VALUES (v_usuario, TG_OP, TG_TABLE_NAME, v_registro);
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de triggers de auditoría (no intrusivo)
DO $$
BEGIN
  IF to_regclass('public.tickets') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_audit_tickets_ins ON tickets;
    DROP TRIGGER IF EXISTS trg_audit_tickets_upd ON tickets;
    CREATE TRIGGER trg_audit_tickets_ins AFTER INSERT ON tickets FOR EACH ROW EXECUTE FUNCTION log_auditoria();
    CREATE TRIGGER trg_audit_tickets_upd AFTER UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION log_auditoria();
  END IF;

  IF to_regclass('public.funciones') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_audit_funciones_upd ON funciones;
    CREATE TRIGGER trg_audit_funciones_upd AFTER UPDATE ON funciones FOR EACH ROW EXECUTE FUNCTION log_auditoria();
  END IF;
END $$;

COMMIT;
