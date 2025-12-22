-- Migración: Agregar tabla de asistencias a ensayos

CREATE TABLE IF NOT EXISTS asistencias_ensayos (
  id              SERIAL PRIMARY KEY,
  ensayo_id       INT NOT NULL REFERENCES ensayos_generales(id) ON DELETE CASCADE,
  miembro_cedula  VARCHAR(20) NOT NULL REFERENCES users(cedula),
  
  -- Asistencia
  asistio         BOOLEAN NOT NULL DEFAULT TRUE,
  llego_tarde     BOOLEAN NOT NULL DEFAULT FALSE,
  minutos_tarde   INT DEFAULT 0,
  
  -- Observaciones
  observaciones   TEXT,
  
  -- Registro
  registrado_por  VARCHAR(20) REFERENCES users(cedula),  -- Quien registró la asistencia
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(ensayo_id, miembro_cedula)  -- Un miembro no puede tener múltiples registros para el mismo ensayo
);

CREATE INDEX IF NOT EXISTS idx_asistencias_ensayo ON asistencias_ensayos(ensayo_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_miembro ON asistencias_ensayos(miembro_cedula);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias_ensayos(created_at);

-- Vista: Resumen de asistencias por ensayo
CREATE OR REPLACE VIEW v_resumen_asistencias_ensayo AS
SELECT
  e.id as ensayo_id,
  e.titulo as ensayo_titulo,
  e.fecha as ensayo_fecha,
  e.obra_id,
  o.nombre as obra_nombre,
  o.grupo_id,
  g.nombre as grupo_nombre,
  
  -- Estadísticas de asistencia
  COUNT(a.id) as total_registros,
  COUNT(*) FILTER (WHERE a.asistio = TRUE) as presentes,
  COUNT(*) FILTER (WHERE a.asistio = FALSE) as ausentes,
  COUNT(*) FILTER (WHERE a.llego_tarde = TRUE) as llegadas_tarde,
  AVG(CASE WHEN a.llego_tarde THEN a.minutos_tarde ELSE 0 END) as promedio_minutos_tarde
  
FROM ensayos_generales e
LEFT JOIN obras o ON o.id = e.obra_id
LEFT JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN asistencias_ensayos a ON a.ensayo_id = e.id
GROUP BY e.id, e.titulo, e.fecha, e.obra_id, o.nombre, o.grupo_id, g.nombre;

-- Vista: Historial de asistencias por miembro
CREATE OR REPLACE VIEW v_historial_asistencias_miembro AS
SELECT
  u.cedula,
  u.name as nombre_miembro,
  g.id as grupo_id,
  g.nombre as grupo_nombre,
  o.id as obra_id,
  o.nombre as obra_nombre,
  e.id as ensayo_id,
  e.titulo as ensayo_titulo,
  e.fecha as ensayo_fecha,
  a.asistio,
  a.llego_tarde,
  a.minutos_tarde,
  a.observaciones,
  a.created_at as registro_fecha
  
FROM users u
JOIN asistencias_ensayos a ON a.miembro_cedula = u.cedula
JOIN ensayos_generales e ON e.id = a.ensayo_id
JOIN obras o ON o.id = e.obra_id
JOIN grupos g ON g.id = o.grupo_id
ORDER BY e.fecha DESC;

COMMENT ON TABLE asistencias_ensayos IS 'Registro de asistencias de miembros a ensayos';
COMMENT ON VIEW v_resumen_asistencias_ensayo IS 'Resumen estadístico de asistencias por ensayo';
COMMENT ON VIEW v_historial_asistencias_miembro IS 'Historial completo de asistencias de cada miembro';
