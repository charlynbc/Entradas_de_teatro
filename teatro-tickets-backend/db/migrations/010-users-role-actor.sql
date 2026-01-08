-- Migración 010: Ajustar CHECK de users.role para incluir ACTOR
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name='users' AND constraint_type='CHECK' AND constraint_name='users_role_check'
  ) THEN
    EXECUTE 'ALTER TABLE users DROP CONSTRAINT users_role_check';
  END IF;
  EXECUTE 'ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (''SUPER'',''ADMIN'',''ACTOR'',''VENDEDOR'',''INVITADO''))';
END $$;
