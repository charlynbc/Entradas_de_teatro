-- ========================================
-- BACO TEATRO - SCHEMA v3.0 con PostgreSQL
-- ========================================

-- ========================================
-- BACO TEATRO - SCHEMA DEFINITIVO
-- Sistema de Usuarios, Grupos, Entradas, Cuotas
-- Formato de fechas: DD/MM/YYYY en frontend
-- Fotos circulares estilo WhatsApp
-- ========================================

-- 1. USUARIOS (cedula como ID único)
CREATE TABLE usuarios (
  cedula              VARCHAR(20) PRIMARY KEY,
  rol                 VARCHAR(20) NOT NULL CHECK (rol IN ('super', 'director', 'actor')),
  nombre              VARCHAR(100) NOT NULL,
  apellido            VARCHAR(100) NOT NULL,
  fecha_nacimiento    DATE NOT NULL,
  celular             VARCHAR(30),
  foto_url            TEXT DEFAULT '/assets/baco.png',
  descripcion         TEXT,
  password_hash       TEXT NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_fecha_nacimiento ON usuarios(fecha_nacimiento);

-- Usuario Super (único) - password: Teamomama91
-- Se puede cambiar la contraseña y borrar todo el sistema
INSERT INTO usuarios (cedula, rol, nombre, apellido, fecha_nacimiento, foto_url, descripcion, password_hash) VALUES
  ('48376669', 'super', 'Charly', 'Barrios', '1991-10-29', '/assets/baco.png', 'Guardián del teatro', '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e')
ON CONFLICT (cedula) DO UPDATE SET rol = 'super', password_hash = '$2b$10$ZXH8vT/SpnVBDGDjj3L7M.7BKMCuQC19V5Ieou0Rv25KTk3lHIT1e';


-- 2. GRUPOS (para clases de teatro)
CREATE TABLE grupos (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  horario_fijo        VARCHAR(100),
  director_cedula     VARCHAR(20) NOT NULL REFERENCES usuarios(cedula),
  obra_nombre         VARCHAR(150) DEFAULT 'BACO',
  foto_url            TEXT DEFAULT '/assets/baco.png',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grupos_director ON grupos(director_cedula);

-- 3. INTEGRANTES DE GRUPO
CREATE TABLE grupo_integrantes (
  id                  SERIAL PRIMARY KEY,
  grupo_id            INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_cedula      VARCHAR(20) NOT NULL REFERENCES usuarios(cedula),
  rol_en_grupo        VARCHAR(30),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (grupo_id, usuario_cedula)
);

CREATE INDEX idx_grupo_integrantes_grupo ON grupo_integrantes(grupo_id);
CREATE INDEX idx_grupo_integrantes_usuario ON grupo_integrantes(usuario_cedula);

-- 4. ENSAYOS
CREATE TABLE ensayos (
  id                  SERIAL PRIMARY KEY,
  grupo_id            INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  fecha               DATE NOT NULL,
  hora                TIME NOT NULL,
  lugar               VARCHAR(200),
  descripcion         TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ensayos_grupo ON ensayos(grupo_id);
CREATE INDEX idx_ensayos_fecha ON ensayos(fecha);

-- 5. FUNCIONES (presentaciones)
CREATE TABLE funciones (
  id                  SERIAL PRIMARY KEY,
  grupo_id            INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  fecha               DATE NOT NULL,
  hora                TIME NOT NULL,
  lugar               VARCHAR(200) NOT NULL,
  precio_entrada      NUMERIC(10,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_funciones_grupo ON funciones(grupo_id);
CREATE INDEX idx_funciones_fecha ON funciones(fecha);

-- 6. ENTRADAS
CREATE TABLE entradas (
  id                      SERIAL PRIMARY KEY,
  funcion_id              INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  vendedor_cedula         VARCHAR(20) REFERENCES usuarios(cedula),
  estado                  VARCHAR(20) NOT NULL CHECK (
                            estado IN ('sin_asignar', 'asignada', 'reservada', 'pagada')
                          ) DEFAULT 'sin_asignar',
  invitado_nombre         VARCHAR(150),
  invitado_celular        VARCHAR(30),
  precio                  NUMERIC(10,2) NOT NULL,
  qr_code                 TEXT,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reservado_at            TIMESTAMP,
  pagado_at               TIMESTAMP
);

CREATE INDEX idx_entradas_funcion ON entradas(funcion_id);
CREATE INDEX idx_entradas_vendedor ON entradas(vendedor_cedula);
CREATE INDEX idx_entradas_estado ON entradas(estado);

-- 7. GASTOS
CREATE TABLE gastos (
  id                  SERIAL PRIMARY KEY,
  funcion_id          INT NOT NULL REFERENCES funciones(id) ON DELETE CASCADE,
  descripcion         VARCHAR(200) NOT NULL,
  monto               NUMERIC(10,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gastos_funcion ON gastos(funcion_id);

-- 8. CUOTAS (escuela)
CREATE TABLE cuotas (
  id                  SERIAL PRIMARY KEY,
  grupo_id            INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  actor_cedula        VARCHAR(20) NOT NULL REFERENCES usuarios(cedula),
  monto               NUMERIC(10,2) NOT NULL,
  vencimiento         DATE NOT NULL,
  estado              VARCHAR(20) NOT NULL CHECK (
                        estado IN ('al_dia', 'parcial', 'adeuda')
                      ) DEFAULT 'al_dia',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuotas_grupo ON cuotas(grupo_id);
CREATE INDEX idx_cuotas_actor ON cuotas(actor_cedula);
CREATE INDEX idx_cuotas_vencimiento ON cuotas(vencimiento);

-- ========================================
-- TRIGGERS Y FUNCIONES
-- ========================================

-- Trigger: Crear cuota automáticamente al agregar actor a grupo
CREATE OR REPLACE FUNCTION crear_cuota_automatica()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el usuario es actor
  IF EXISTS (SELECT 1 FROM usuarios WHERE cedula = NEW.usuario_cedula AND rol = 'actor') THEN
    INSERT INTO cuotas (grupo_id, actor_cedula, monto, vencimiento)
    VALUES (NEW.grupo_id, NEW.usuario_cedula, 0, CURRENT_DATE + INTERVAL '30 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crear_cuota
AFTER INSERT ON grupo_integrantes
FOR EACH ROW
EXECUTE FUNCTION crear_cuota_automatica();

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista: Recaudación por función
CREATE OR REPLACE VIEW v_recaudacion_funcion AS
SELECT
  f.id AS funcion_id,
  TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
  TO_CHAR(f.hora, 'HH24:MI') AS hora,
  f.lugar,
  g.nombre AS grupo,
  g.obra_nombre,
  COUNT(e.id) FILTER (WHERE e.estado = 'pagada') AS entradas_pagadas,
  COUNT(e.id) FILTER (WHERE e.estado = 'reservada') AS entradas_reservadas,
  COUNT(e.id) FILTER (WHERE e.estado = 'asignada') AS entradas_asignadas,
  COUNT(e.id) FILTER (WHERE e.estado = 'sin_asignar') AS entradas_sin_asignar,
  COALESCE(SUM(CASE WHEN e.estado = 'pagada' THEN e.precio END), 0) AS total_recaudado
FROM funciones f
JOIN grupos g ON g.id = f.grupo_id
LEFT JOIN entradas e ON e.funcion_id = f.id
GROUP BY f.id, f.fecha, f.hora, f.lugar, g.nombre, g.obra_nombre;

-- Vista: Balance por función
CREATE OR REPLACE VIEW v_balance_funcion AS
SELECT
  f.id AS funcion_id,
  TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
  g.obra_nombre,
  COALESCE(SUM(CASE WHEN e.estado = 'pagada' THEN e.precio END), 0) AS ingresos,
  COALESCE(SUM(ga.monto), 0) AS egresos,
  COALESCE(SUM(CASE WHEN e.estado = 'pagada' THEN e.precio END), 0) - COALESCE(SUM(ga.monto), 0) AS balance
FROM funciones f
JOIN grupos g ON g.id = f.grupo_id
LEFT JOIN entradas e ON e.funcion_id = f.id
LEFT JOIN gastos ga ON ga.funcion_id = f.id
GROUP BY f.id, f.fecha, g.obra_nombre;

-- Vista: Entradas por actor
CREATE OR REPLACE VIEW v_entradas_actor AS
SELECT
  u.cedula,
  u.nombre,
  u.apellido,
  u.foto_url,
  COUNT(e.id) AS total_entradas,
  COUNT(*) FILTER (WHERE e.estado = 'pagada') AS entradas_pagadas,
  COUNT(*) FILTER (WHERE e.estado = 'reservada') AS entradas_reservadas,
  COUNT(*) FILTER (WHERE e.estado = 'asignada') AS entradas_asignadas,
  SUM(CASE WHEN e.estado = 'pagada' THEN e.precio ELSE 0 END) AS recaudado
FROM usuarios u
LEFT JOIN entradas e ON e.vendedor_cedula = u.cedula
WHERE u.rol = 'actor'
GROUP BY u.cedula, u.nombre, u.apellido, u.foto_url;

-- Vista: Cumpleaños del día
CREATE OR REPLACE VIEW v_cumpleanos_hoy AS
SELECT
  cedula,
  nombre,
  apellido,
  foto_url,
  TO_CHAR(fecha_nacimiento, 'DD/MM') AS cumpleanos,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento)) AS edad
FROM usuarios
WHERE EXTRACT(DAY FROM fecha_nacimiento) = EXTRACT(DAY FROM CURRENT_DATE)
AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY nombre, apellido;

-- Vista: Historial de funciones por usuario
CREATE OR REPLACE VIEW v_historial_funciones AS
SELECT
  gi.usuario_cedula,
  TO_CHAR(f.fecha, 'DD/MM/YYYY') AS fecha,
  TO_CHAR(f.hora, 'HH24:MI') AS hora,
  f.lugar,
  g.nombre AS grupo,
  g.obra_nombre,
  g.foto_url AS grupo_foto
FROM grupo_integrantes gi
JOIN grupos g ON g.id = gi.grupo_id
JOIN funciones f ON f.grupo_id = g.id
ORDER BY f.fecha DESC, f.hora DESC;

-- Vista: Cuotas por actor
CREATE OR REPLACE VIEW v_cuotas_actor AS
SELECT
  c.actor_cedula,
  g.nombre AS grupo,
  c.monto,
  TO_CHAR(c.vencimiento, 'DD/MM/YYYY') AS vencimiento,
  c.estado,
  c.created_at
FROM cuotas c
JOIN grupos g ON g.id = c.grupo_id
ORDER BY c.vencimiento ASC;

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

/*
SISTEMA BACO - REGLAS CLAVE:

1. CÉDULA = ID único e inmutable
2. Contraseña por defecto: "admin"
3. Fotos circulares estilo WhatsApp
4. Formato de fechas: DD/MM/YYYY en frontend
5. Cuotas se crean automáticamente al agregar actor
6. Estados de entrada pueden volver atrás
7. Director es dueño de sus grupos
8. Super tiene control total
9. Identidad visual: BACO (teatral, humano, mobile-first)
*/
