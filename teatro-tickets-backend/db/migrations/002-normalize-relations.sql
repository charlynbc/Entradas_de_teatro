-- ========================================
-- MIGRACIÓN 002: NORMALIZAR RELACIONES
-- Fecha: 28/12/2025
-- Objetivo: Unificar sistema de miembros de grupos
-- ========================================

-- El código usa: grupo_directores y grupo_actores (NO EXISTEN)
-- El schema tiene: grupo_miembros con rol_en_grupo
-- Solución: Crear VISTAS compatibles

-- 1. VISTA: grupo_directores (compatibilidad con código legacy)
DROP VIEW IF EXISTS grupo_directores CASCADE;

CREATE OR REPLACE VIEW grupo_directores AS
SELECT 
    grupo_id,
    miembro_cedula as director_cedula,
    activo,
    joined_at,
    CASE WHEN miembro_cedula = (SELECT director_cedula FROM grupos WHERE id = grupo_id) 
         THEN TRUE 
         ELSE FALSE 
    END as es_principal
FROM grupo_miembros
WHERE rol_en_grupo = 'DIRECTOR';

-- 2. VISTA: grupo_actores (compatibilidad con código legacy)  
DROP VIEW IF EXISTS grupo_actores CASCADE;

CREATE OR REPLACE VIEW grupo_actores AS
SELECT 
    grupo_id,
    miembro_cedula as actor_cedula,
    activo,
    joined_at,
    NULL::VARCHAR(200) as personaje -- campo legacy, ahora NULL
FROM grupo_miembros
WHERE rol_en_grupo = 'ACTOR';

-- 3. TRIGGER: Insertar en grupo_directores → insertar en grupo_miembros
CREATE OR REPLACE FUNCTION insert_grupo_directores()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo, joined_at)
    VALUES (NEW.grupo_id, NEW.director_cedula, 'DIRECTOR', COALESCE(NEW.activo, TRUE), COALESCE(NEW.joined_at, NOW()))
    ON CONFLICT (grupo_id, miembro_cedula) 
    DO UPDATE SET rol_en_grupo = 'DIRECTOR', activo = EXCLUDED.activo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_grupo_directores
INSTEAD OF INSERT ON grupo_directores
FOR EACH ROW EXECUTE FUNCTION insert_grupo_directores();

-- 4. TRIGGER: Insertar en grupo_actores → insertar en grupo_miembros
CREATE OR REPLACE FUNCTION insert_grupo_actores()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo, joined_at)
    VALUES (NEW.grupo_id, NEW.actor_cedula, 'ACTOR', COALESCE(NEW.activo, TRUE), COALESCE(NEW.joined_at, NOW()))
    ON CONFLICT (grupo_id, miembro_cedula) 
    DO UPDATE SET rol_en_grupo = 'ACTOR', activo = EXCLUDED.activo;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_insert_grupo_actores
INSTEAD OF INSERT ON grupo_actores
FOR EACH ROW EXECUTE FUNCTION insert_grupo_actores();

-- 5. TRIGGER: Eliminar de grupo_directores → eliminar de grupo_miembros
CREATE OR REPLACE FUNCTION delete_grupo_directores()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM grupo_miembros 
    WHERE grupo_id = OLD.grupo_id 
      AND miembro_cedula = OLD.director_cedula 
      AND rol_en_grupo = 'DIRECTOR';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_grupo_directores
INSTEAD OF DELETE ON grupo_directores
FOR EACH ROW EXECUTE FUNCTION delete_grupo_directores();

-- 6. TRIGGER: Eliminar de grupo_actores → eliminar de grupo_miembros
CREATE OR REPLACE FUNCTION delete_grupo_actores()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM grupo_miembros 
    WHERE grupo_id = OLD.grupo_id 
      AND miembro_cedula = OLD.actor_cedula 
      AND rol_en_grupo = 'ACTOR';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delete_grupo_actores
INSTEAD OF DELETE ON grupo_actores
FOR EACH ROW EXECUTE FUNCTION delete_grupo_actores();

-- 7. TRIGGER: Actualizar grupo_directores
CREATE OR REPLACE FUNCTION update_grupo_directores()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE grupo_miembros 
    SET activo = NEW.activo
    WHERE grupo_id = OLD.grupo_id 
      AND miembro_cedula = OLD.director_cedula 
      AND rol_en_grupo = 'DIRECTOR';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_grupo_directores
INSTEAD OF UPDATE ON grupo_directores
FOR EACH ROW EXECUTE FUNCTION update_grupo_directores();

-- VERIFICACIÓN FINAL
SELECT 'Migración 002 completada: Vistas y triggers para compatibilidad creados' as status;
