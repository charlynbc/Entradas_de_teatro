-- Migración: De Grupos → Obras → Ensayos/Funciones

-- 1. Agregar columna obra_id a shows (sin NOT NULL todavía)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS obra_id INT REFERENCES obras(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shows_obra_id ON shows(obra_id);

-- 2. Agregar columna rol_en_grupo a grupo_miembros
ALTER TABLE grupo_miembros ADD COLUMN IF NOT EXISTS rol_en_grupo VARCHAR(20) CHECK (rol_en_grupo IN ('DIRECTOR', 'ACTOR')) DEFAULT 'ACTOR';

-- 3. Actualizar miembros existentes (todos son actores por defecto)
UPDATE grupo_miembros SET rol_en_grupo = 'ACTOR' WHERE rol_en_grupo IS NULL;

-- 4. Crear tabla obras
CREATE TABLE IF NOT EXISTS obras (
  id              SERIAL PRIMARY KEY,
  grupo_id        INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  autor           VARCHAR(200),
  genero          VARCHAR(100),
  duracion_aprox  INT,
  estado          VARCHAR(20) NOT NULL CHECK (estado IN ('EN_DESARROLLO', 'LISTA', 'ARCHIVADA')) DEFAULT 'EN_DESARROLLO',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obras_grupo ON obras(grupo_id);
CREATE INDEX IF NOT EXISTS idx_obras_estado ON obras(estado);

-- 5. Crear obras automáticamente desde grupos existentes
INSERT INTO obras (grupo_id, nombre, descripcion, estado, created_at)
SELECT 
  g.id,
  COALESCE(g.obra_a_realizar, 'Obra de ' || g.nombre),
  g.descripcion,
  'EN_DESARROLLO',
  g.created_at
FROM grupos g
WHERE NOT EXISTS (SELECT 1 FROM obras WHERE grupo_id = g.id)
AND g.obra_a_realizar IS NOT NULL;

-- 6. Agregar columna obra_id a ensayos_generales
ALTER TABLE ensayos_generales ADD COLUMN IF NOT EXISTS obra_id INT REFERENCES obras(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ensayos_obra ON ensayos_generales(obra_id);

-- 7. Migrar ensayos existentes a obras
-- Por cada ensayo, vincular a la primera obra del grupo
UPDATE ensayos_generales e
SET obra_id = (
  SELECT o.id FROM obras o
  WHERE o.grupo_id = e.grupo_id
  ORDER BY o.created_at ASC
  LIMIT 1
)
WHERE e.obra_id IS NULL AND e.grupo_id IS NOT NULL;

-- 8. Recrear vista de obras
DROP VIEW IF EXISTS v_obras_completas CASCADE;
CREATE VIEW v_obras_completas AS
SELECT
  o.id,
  o.grupo_id,
  o.nombre,
  o.descripcion,
  o.autor,
  o.genero,
  o.duracion_aprox,
  o.estado,
  o.created_at,
  o.updated_at,
  g.nombre as grupo_nombre,
  g.director_cedula,
  u.name as director_nombre,
  g.dia_semana as grupo_dia_semana,
  g.hora_inicio as grupo_hora_inicio,
  COUNT(gm.id) FILTER (WHERE gm.activo = TRUE) AS miembros_activos
FROM obras o
LEFT JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id AND gm.activo = TRUE
GROUP BY o.id, o.nombre, o.descripcion, o.autor, o.genero, o.duracion_aprox, o.estado, 
         o.created_at, o.updated_at, g.nombre, g.director_cedula, u.name, 
         g.dia_semana, g.hora_inicio;

-- 9. Recrear vista de ensayos
DROP VIEW IF EXISTS v_ensayos_completos CASCADE;
CREATE VIEW v_ensayos_completos AS
SELECT 
  e.id,
  e.obra_id,
  e.titulo,
  e.fecha,
  e.hora_fin,
  e.lugar,
  e.descripcion,
  e.created_at,
  o.nombre as obra_nombre,
  o.grupo_id,
  g.nombre as grupo_nombre,
  g.director_cedula as grupo_director_cedula,
  u.name as grupo_director_nombre,
  g.dia_semana as grupo_dia_semana,
  (SELECT COUNT(*) FROM grupo_miembros gm WHERE gm.grupo_id = g.id AND gm.activo = TRUE) as miembros_activos,
  (SELECT json_agg(json_build_object('cedula', um.cedula, 'nombre', um.name) ORDER BY um.name)
   FROM grupo_miembros gm 
   JOIN users um ON um.cedula = gm.miembro_cedula 
   WHERE gm.grupo_id = g.id AND gm.activo = TRUE) as grupo_miembros
FROM ensayos_generales e
LEFT JOIN obras o ON o.id = e.obra_id
LEFT JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN users u ON u.cedula = g.director_cedula;

-- 10. Limpiar columnas legacy de ensayos (opcional, comentado por seguridad)
-- ALTER TABLE ensayos_generales DROP COLUMN IF EXISTS grupo_id;
-- ALTER TABLE ensayos_generales DROP COLUMN IF EXISTS director_id;
-- ALTER TABLE ensayos_generales DROP COLUMN IF EXISTS actores_ids;

COMMIT;
