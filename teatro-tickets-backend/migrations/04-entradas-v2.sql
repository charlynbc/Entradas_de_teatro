-- ============================================
-- MIGRACIÓN: ENTRADAS V2 CON ESTADOS COMPLETOS
-- ============================================
-- Estados: sin_asignar, asignada, reservada, pronta, pagada,
--          utilizada, no_vendida, perdonada
-- Incluye trazabilidad por función, actor, creador y log de cambios

-- 1) Tabla de entradas v2
CREATE TABLE IF NOT EXISTS entradas_v2 (
  id                  SERIAL PRIMARY KEY,
  code                VARCHAR(50) UNIQUE NOT NULL,
  funcion_id          INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  creador_cedula      VARCHAR(20) REFERENCES users(cedula),
  actor_cedula        VARCHAR(20) REFERENCES users(cedula),
  estado              VARCHAR(20) NOT NULL DEFAULT 'sin_asignar'
                        CHECK (estado IN (
                          'sin_asignar','asignada','reservada','pronta',
                          'pagada','utilizada','no_vendida','perdonada'
                        )),
  reservante_nombre   VARCHAR(150),
  reservante_telefono VARCHAR(30),
  precio              NUMERIC(10,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  reservada_at        TIMESTAMP,
  pronta_at           TIMESTAMP,
  pagada_at           TIMESTAMP,
  utilizada_at        TIMESTAMP,
  no_vendida_at       TIMESTAMP,
  perdonada_at        TIMESTAMP,
  escaneada_por       VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_entradas_v2_funcion ON entradas_v2(funcion_id);
CREATE INDEX IF NOT EXISTS idx_entradas_v2_actor ON entradas_v2(actor_cedula);
CREATE INDEX IF NOT EXISTS idx_entradas_v2_estado ON entradas_v2(estado);
CREATE INDEX IF NOT EXISTS idx_entradas_v2_creador ON entradas_v2(creador_cedula);

-- 2) Log de movimientos de entradas v2
CREATE TABLE IF NOT EXISTS entradas_v2_logs (
  id             SERIAL PRIMARY KEY,
  entrada_id     INT NOT NULL REFERENCES entradas_v2(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(20),
  estado_nuevo    VARCHAR(20),
  accion          VARCHAR(50),
  detalle         TEXT,
  ejecutado_por   VARCHAR(20),
  actor_cedula    VARCHAR(20),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entradas_v2_logs_entrada ON entradas_v2_logs(entrada_id);
CREATE INDEX IF NOT EXISTS idx_entradas_v2_logs_actor ON entradas_v2_logs(actor_cedula);

-- 3) Vista de estadísticas por función (usa estados v2)
CREATE OR REPLACE VIEW v_entradas_v2_funcion_stats AS
SELECT
  f.id AS funcion_id,
  COUNT(e.id) AS total_creadas,
  COUNT(*) FILTER (WHERE e.estado = 'pagada') AS pagadas,
  COUNT(*) FILTER (WHERE e.estado = 'utilizada') AS utilizadas,
  COUNT(*) FILTER (WHERE e.estado = 'no_vendida') AS no_vendidas,
  COUNT(*) FILTER (WHERE e.estado = 'perdonada') AS perdonadas,
  COUNT(*) FILTER (WHERE e.estado IN ('pagada','utilizada')) AS efectivamente_vendidas,
  (COUNT(*) - COUNT(*) FILTER (WHERE e.estado = 'perdonada')) AS total_real_funcion
FROM funciones f
LEFT JOIN entradas_v2 e ON e.funcion_id = f.id
GROUP BY f.id;

-- 4) Vista de estadísticas por actor
CREATE OR REPLACE VIEW v_entradas_v2_actor_stats AS
SELECT
  u.cedula,
  u.name AS nombre,
  u.apellido,
  COUNT(e.id) AS asignadas,
  COUNT(*) FILTER (WHERE e.estado IN ('pagada','utilizada')) AS vendidas,
  COUNT(*) FILTER (WHERE e.estado = 'pronta') AS prontas,
  COUNT(*) FILTER (WHERE e.estado = 'no_vendida') AS no_vendidas,
  COUNT(*) FILTER (WHERE e.estado = 'perdonada') AS perdonadas,
  COALESCE(SUM(CASE WHEN e.estado = 'no_vendida' THEN e.precio ELSE 0 END), 0) AS saldo_negativo,
  COALESCE(SUM(CASE WHEN e.estado = 'perdonada' THEN e.precio ELSE 0 END), 0) AS deuda_perdonada
FROM users u
LEFT JOIN entradas_v2 e ON e.actor_cedula = u.cedula
WHERE u.role = 'ACTOR'
GROUP BY u.cedula, u.name, u.apellido;
