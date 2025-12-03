-- Migración: Agregar tabla shows_cast para gestionar elenco de obras
-- Esta tabla permite asignar múltiples vendedores a una obra

CREATE TABLE IF NOT EXISTS shows_cast (
  id                SERIAL PRIMARY KEY,
  show_id           VARCHAR(50) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  cedula_vendedor   VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  assigned_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Evitar duplicados: un vendedor solo puede estar una vez en cada obra
  UNIQUE(show_id, cedula_vendedor)
);

-- Índices para mejorar performance
CREATE INDEX idx_shows_cast_show ON shows_cast(show_id);
CREATE INDEX idx_shows_cast_vendedor ON shows_cast(cedula_vendedor);

-- Comentarios
COMMENT ON TABLE shows_cast IS 'Elenco de obras - relación muchos a muchos entre shows y vendedores';
COMMENT ON COLUMN shows_cast.show_id IS 'ID de la obra';
COMMENT ON COLUMN shows_cast.cedula_vendedor IS 'Cédula del vendedor asignado';
COMMENT ON COLUMN shows_cast.assigned_at IS 'Fecha y hora de asignación al elenco';
