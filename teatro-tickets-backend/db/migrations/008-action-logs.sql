-- ========================================
-- MIGRACIÓN: Action Logs (Auditoría)
-- Fecha: 2026-01-07
-- ========================================

-- Crear tabla action_logs
CREATE TABLE IF NOT EXISTS action_logs (
  id              SERIAL PRIMARY KEY,
  user_cedula     VARCHAR(20) REFERENCES users(cedula),
  rol             VARCHAR(20),
  accion          VARCHAR(50) NOT NULL,
  entidad         VARCHAR(50) NOT NULL,
  entidad_id      VARCHAR(100),
  grupo_id        INT REFERENCES grupos(id),
  descripcion     TEXT,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_cedula);
CREATE INDEX IF NOT EXISTS idx_action_logs_grupo ON action_logs(grupo_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_accion ON action_logs(accion);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_entidad ON action_logs(entidad, entidad_id);
