-- ========================================
-- MIGRACIÓN 003: COMPLETAR TABLA USERS
-- Fecha: 28/12/2025
-- Objetivo: Agregar campos faltantes en users
-- ========================================

-- Agregar campos que el código espera pero no existen
DO $$ 
BEGIN
  -- email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(200);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
  END IF;

  -- apellido
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'apellido'
  ) THEN
    ALTER TABLE users ADD COLUMN apellido VARCHAR(100);
  END IF;

  -- fecha_nacimiento (diferente de cumpleanos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'fecha_nacimiento'
  ) THEN
    ALTER TABLE users ADD COLUMN fecha_nacimiento DATE;
  END IF;

  -- direccion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'direccion'
  ) THEN
    ALTER TABLE users ADD COLUMN direccion TEXT;
  END IF;

  -- notas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'notas'
  ) THEN
    ALTER TABLE users ADD COLUMN notas TEXT;
  END IF;
END $$;

-- VERIFICACIÓN FINAL
SELECT 'Migración 003 completada: Campos adicionales agregados a users' as status;
