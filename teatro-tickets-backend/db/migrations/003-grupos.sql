-- Migración 003: Tabla GRUPOS
-- Fecha: 27-12-2025
-- Descripción: Sistema de grupos teatrales según SUPER PROMPT BACÓ

-- Tabla: grupos
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    obra VARCHAR(255) DEFAULT 'Baco' NOT NULL,
    foto_url TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    horarios TEXT,
    director_principal_cedula VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (director_principal_cedula) REFERENCES users(cedula) ON DELETE SET NULL
);

-- Tabla intermedia: grupo_directores (un grupo puede tener múltiples directores)
CREATE TABLE IF NOT EXISTS grupo_directores (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL,
    director_cedula VARCHAR(20) NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (director_cedula) REFERENCES users(cedula) ON DELETE CASCADE,
    UNIQUE(grupo_id, director_cedula)
);

-- Tabla intermedia: grupo_actores (actores/actrices asignados al grupo)
CREATE TABLE IF NOT EXISTS grupo_actores (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL,
    actor_cedula VARCHAR(20) NOT NULL,
    personaje VARCHAR(255),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_cedula) REFERENCES users(cedula) ON DELETE CASCADE,
    UNIQUE(grupo_id, actor_cedula)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_grupos_director_principal ON grupos(director_principal_cedula);
CREATE INDEX IF NOT EXISTS idx_grupos_estado ON grupos(estado);
CREATE INDEX IF NOT EXISTS idx_grupo_directores_grupo ON grupo_directores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_actores_grupo ON grupo_actores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_actores_actor ON grupo_actores(actor_cedula);

-- Vista: resumen de grupos con contadores
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
         g.horarios, g.estado, g.director_principal_cedula, u.nombre, 
         g.created_at, g.updated_at;

-- Trigger: actualizar updated_at
CREATE OR REPLACE FUNCTION update_grupos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grupos_updated_at
BEFORE UPDATE ON grupos
FOR EACH ROW
EXECUTE FUNCTION update_grupos_timestamp();

COMMENT ON TABLE grupos IS 'Grupos teatrales - cada grupo representa una obra';
COMMENT ON TABLE grupo_directores IS 'Directores asignados a cada grupo';
COMMENT ON TABLE grupo_actores IS 'Actores/actrices asignados a cada grupo con sus personajes';
