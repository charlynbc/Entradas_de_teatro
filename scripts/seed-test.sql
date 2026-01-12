-- Script rápido para insertar datos de prueba directamente en PostgreSQL

-- 1. Crear grupo con el Super Usuario como director
INSERT INTO grupos (nombre, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin)
VALUES ('Los Titanes del Teatro', '48376669', 'Lunes', '19:00:00', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months')
RETURNING id;

-- 2. Crear obra para el grupo
INSERT INTO obras (nombre, grupo_id, duracion_aprox, descripcion)
VALUES (
  'La Vida es Sueño',
  (SELECT id FROM grupos WHERE nombre = 'Los Titanes del Teatro' LIMIT 1),
  120,
  'Una obra clásica del teatro barroco español de Calderón de la Barca'
)
RETURNING id;

-- 3. Crear funciones para HOY y futuro
-- Función de HOY
INSERT INTO funciones (
  obra_id,
  fecha,
  lugar,
  capacidad,
  precio_base,
  estado
) VALUES (
  (SELECT id FROM obras WHERE nombre = 'La Vida es Sueño' LIMIT 1),
  CURRENT_DATE + INTERVAL '20 hours',
  'Teatro El Galpón - Sala Principal',
  150,
  300,
  'PROGRAMADA'
);

-- Función de MAÑANA
INSERT INTO funciones (
  obra_id,
  fecha,
  lugar,
  capacidad,
  precio_base,
  estado
) VALUES (
  (SELECT id FROM obras WHERE nombre = 'La Vida es Sueño' LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day 20 hours',
  'Teatro El Galpón - Sala Principal',
  150,
  300,
  'PROGRAMADA'
);

-- Función en 3 días
INSERT INTO funciones (
  obra_id,
  fecha,
  lugar,
  capacidad,
  precio_base,
  estado
) VALUES (
  (SELECT id FROM obras WHERE nombre = 'La Vida es Sueño' LIMIT 1),
  CURRENT_DATE + INTERVAL '3 days 21 hours',
  'Teatro Victoria',
  120,
  350,
  'PROGRAMADA'
);

-- 4. Verificar datos creados
SELECT 
  f.id,
  o.nombre,
  f.fecha,
  f.lugar,
  g.nombre as grupo
FROM funciones f
JOIN obras o ON o.id = f.obra_id
JOIN grupos g ON g.id = o.grupo_id
ORDER BY f.fecha;
