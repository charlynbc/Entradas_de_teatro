-- Migración 003-B: Actualizar tabla grupos para SUPER PROMPT
-- Fecha: 27-12-2025

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- Agregar obra (renombrar de obra_a_realizar si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'obra') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'obra_a_realizar') THEN
            ALTER TABLE grupos RENAME COLUMN obra_a_realizar TO obra;
        ELSE
            ALTER TABLE grupos ADD COLUMN obra VARCHAR(255) DEFAULT 'Baco';
        END IF;
    END IF;

    -- Agregar foto_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'foto_url') THEN
        ALTER TABLE grupos ADD COLUMN foto_url TEXT;
    END IF;

    -- Agregar horarios (combinar dia_semana + hora_inicio si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'horarios') THEN
        ALTER TABLE grupos ADD COLUMN horarios TEXT;
        -- Migrar datos existentes
        UPDATE grupos SET horarios = CONCAT(dia_semana, ' ', hora_inicio::text) 
        WHERE dia_semana IS NOT NULL AND hora_inicio IS NOT NULL;
    END IF;

    -- Agregar director_principal_cedula (migrar de director_cedula si existe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'director_principal_cedula') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'director_cedula') THEN
            ALTER TABLE grupos RENAME COLUMN director_cedula TO director_principal_cedula;
        ELSE
            ALTER TABLE grupos ADD COLUMN director_principal_cedula VARCHAR(20);
            ALTER TABLE grupos ADD FOREIGN KEY (director_principal_cedula) 
                REFERENCES users(cedula) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Actualizar check constraint de estado
    ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_estado_check;
    ALTER TABLE grupos ADD CONSTRAINT grupos_estado_check 
        CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO'));
END $$;

-- Crear/actualizar índices
CREATE INDEX IF NOT EXISTS idx_grupos_director_principal 
    ON grupos(director_principal_cedula);

-- Recrear vista con nueva estructura
DROP VIEW IF EXISTS v_resumen_grupos CASCADE;

CREATE OR REPLACE VIEW v_resumen_grupos AS
SELECT 
    g.id,
    g.nombre,
    g.obra,
    g.foto_url,
    g.fecha_inicio,
    g.fecha_fin,
    g.horarios,
    g.estado,
    g.director_principal_cedula,
    u.name as director_principal_nombre,
    COUNT(DISTINCT gd.director_cedula) as total_directores,
    COUNT(DISTINCT ga.actor_cedula) as total_actores,
    g.created_at,
    g.updated_at
FROM grupos g
LEFT JOIN users u ON g.director_principal_cedula = u.cedula
LEFT JOIN grupo_directores gd ON g.id = gd.grupo_id
LEFT JOIN grupo_actores ga ON g.id = ga.grupo_id
GROUP BY g.id, g.nombre, g.obra, g.foto_url, g.fecha_inicio, g.fecha_fin, 
         g.horarios, g.estado, g.director_principal_cedula, u.name, 
         g.created_at, g.updated_at;

-- Migrar directores existentes a tabla intermedia
INSERT INTO grupo_directores (grupo_id, director_cedula, es_principal)
SELECT id, director_principal_cedula, true
FROM grupos
WHERE director_principal_cedula IS NOT NULL
ON CONFLICT (grupo_id, director_cedula) DO NOTHING;

COMMENT ON TABLE grupos IS 'Grupos teatrales - cada grupo representa una obra (actualizado para SUPER PROMPT)';
