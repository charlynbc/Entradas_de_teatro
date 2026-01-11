-- Auditoría genérica v1 (tablas existentes en v3)

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id TEXT,
  accion VARCHAR(10) NOT NULL, -- INSERT/UPDATE/DELETE
  usuario_ref TEXT,
  ip_address VARCHAR(45),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', 'N/A'), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', 'N/A'), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(OLD)->>'id', 'N/A'), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tablas principales
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_users ON users';
    EXECUTE 'CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='grupos') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_grupos ON grupos';
    EXECUTE 'CREATE TRIGGER audit_grupos AFTER INSERT OR UPDATE OR DELETE ON grupos FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='obras') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_obras ON obras';
    EXECUTE 'CREATE TRIGGER audit_obras AFTER INSERT OR UPDATE OR DELETE ON obras FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='funciones') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_funciones ON funciones';
    EXECUTE 'CREATE TRIGGER audit_funciones AFTER INSERT OR UPDATE OR DELETE ON funciones FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tickets') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_tickets ON tickets';
    EXECUTE 'CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
END $$;
