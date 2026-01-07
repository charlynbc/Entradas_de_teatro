-- ========================================
-- MIGRACIÓN 004: Constraints seguros (roles + estados)
-- Fecha: 30/12/2025
-- Objetivo: Alinear constraints con backend actual sin borrar datos.
-- Reglas: SOLO ALTER/constraints/índices. No elimina filas.
-- ========================================

-- 1) USERS.role: permitir set de roles tolerante (incluye legacy VENDEDOR)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'VENDEDOR', 'INVITADO'));
  END IF;
END $$;

-- 2) GRUPOS.estado: permitir estados usados por el sistema (incluye legacy)
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
      CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PAUSADO', 'ARCHIVADO', 'FINALIZADO', 'CANCELADO'));
  END IF;
END $$;

-- 3) Índices (si faltan)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_grupos_estado ON grupos(estado);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_miembro ON grupo_miembros(miembro_cedula);
