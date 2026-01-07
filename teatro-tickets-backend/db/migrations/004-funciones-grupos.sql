-- Migración 004: Asociar funciones a grupos
-- Fecha: 27-12-2025
-- Descripción: Agregar grupo_id a funciones para asociarlas con grupos teatrales

-- 1. Agregar columna grupo_id
ALTER TABLE funciones 
ADD COLUMN grupo_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE;

-- 2. Crear índice para grupo_id
CREATE INDEX idx_funciones_grupo_id ON funciones(grupo_id);

-- 3. Hacer obra_id nullable (opcional, ya que ahora usamos grupo que tiene obra)
ALTER TABLE funciones 
ALTER COLUMN obra_id DROP NOT NULL;

-- 4. Agregar campo para código QR único de la función
ALTER TABLE funciones
ADD COLUMN qr_code VARCHAR(100) UNIQUE;

-- 5. Agregar campo para número de entradas disponibles
ALTER TABLE funciones
ADD COLUMN entradas_disponibles INTEGER DEFAULT 0;

-- 6. Agregar campo para número de entradas vendidas
ALTER TABLE funciones
ADD COLUMN entradas_vendidas INTEGER DEFAULT 0;

-- Comentarios
COMMENT ON COLUMN funciones.grupo_id IS 'Grupo teatral al que pertenece la función';
COMMENT ON COLUMN funciones.qr_code IS 'Código QR único para verificación de entradas';
COMMENT ON COLUMN funciones.entradas_disponibles IS 'Cantidad de entradas disponibles';
COMMENT ON COLUMN funciones.entradas_vendidas IS 'Cantidad de entradas vendidas';
