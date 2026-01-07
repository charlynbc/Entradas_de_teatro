-- ========================================
-- MIGRACIÓN 001: SINCRONIZACIÓN SCHEMA
-- Fecha: 28/12/2025
-- Objetivo: Corregir desincronización detectada en testing
-- ========================================

-- 1. CREAR VISTA v_resumen_grupos (faltante)
DROP VIEW IF EXISTS v_resumen_grupos CASCADE;

CREATE OR REPLACE VIEW v_resumen_grupos AS
SELECT 
    g.id,
    g.nombre,
    g.descripcion,
    g.director_cedula,
    u.name as director_nombre,
    g.dia_semana,
    g.hora_inicio,
    g.fecha_inicio,
    g.fecha_fin,
    g.obra_a_realizar,
    g.estado,
    g.created_at,
    g.updated_at,
    COUNT(DISTINCT gm.miembro_cedula) FILTER (WHERE gm.activo = TRUE) as total_miembros,
    COUNT(DISTINCT o.id) as total_obras,
    COUNT(DISTINCT f.id) as total_funciones
FROM grupos g
LEFT JOIN users u ON u.cedula = g.director_cedula
LEFT JOIN grupo_miembros gm ON gm.grupo_id = g.id
LEFT JOIN obras o ON o.grupo_id = g.id
LEFT JOIN funciones f ON f.obra_id = o.id
GROUP BY g.id, g.nombre, g.descripcion, g.director_cedula, u.name, 
         g.dia_semana, g.hora_inicio, g.fecha_inicio, g.fecha_fin, 
         g.obra_a_realizar, g.estado, g.created_at, g.updated_at;

-- 2. CORREGIR v_resumen_funcion_admin (incluir join correcto con grupos)
DROP VIEW IF EXISTS v_resumen_funcion_admin CASCADE;

CREATE OR REPLACE VIEW v_resumen_funcion_admin AS
SELECT
  f.id,
  f.fecha,
  f.lugar,
  f.capacidad,
  f.precio_base,
  f.estado AS estado_funcion,
  f.foto_url,
  o.id as obra_id,
  o.nombre AS obra_nombre,
  g.id as grupo_id,
  g.nombre AS grupo_nombre,
  
  -- Conteos de tickets
  COUNT(t.code) AS total_generados,
  COUNT(*) FILTER (WHERE t.estado = 'DISPONIBLE') AS disponibles,
  COUNT(*) FILTER (WHERE t.estado = 'RESERVADO') AS reservadas,
  COUNT(*) FILTER (WHERE t.estado = 'PAGADO') AS pagadas,
  COUNT(*) FILTER (WHERE t.estado = 'USADO') AS usadas,
  COUNT(*) FILTER (WHERE t.estado = 'ANULADO') AS anuladas,
  
  -- Dinero
  SUM(CASE WHEN t.estado IN ('PAGADO', 'USADO')
           THEN COALESCE(t.precio, f.precio_base)
           ELSE 0 END) AS recaudacion_real

FROM funciones f
JOIN obras o ON o.id = f.obra_id
JOIN grupos g ON g.id = o.grupo_id
LEFT JOIN tickets t ON t.funcion_id = f.id
GROUP BY f.id, f.fecha, f.lugar, f.capacidad, f.precio_base, f.estado, 
         f.foto_url, o.id, o.nombre, g.id, g.nombre;

-- 3. VERIFICAR tipos de datos correctos en users.role
-- El código usa: SUPER, ADMIN, ACTOR, INVITADO
-- El schema init usa: SUPER, ADMIN, VENDEDOR, INVITADO
-- Necesitamos soportar ambos (ACTOR es el correcto para actores)

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'VENDEDOR', 'INVITADO'));

-- 4. AGREGAR campos faltantes si no existen

-- Verificar y agregar foto_url a grupos si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'grupos' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE grupos ADD COLUMN foto_url TEXT;
  END IF;
END $$;

-- Verificar y agregar foto_url a users si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE users ADD COLUMN foto_url TEXT;
  END IF;
END $$;

-- Verificar y agregar cumpleanos a users si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cumpleanos'
  ) THEN
    ALTER TABLE users ADD COLUMN cumpleanos DATE;
  END IF;
END $$;

-- 5. NORMALIZAR estados de grupos
-- El init usa: ACTIVO, INACTIVO, PAUSADO
-- Pero el código puede usar: ACTIVO, ARCHIVADO
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_estado_check;
ALTER TABLE grupos ADD CONSTRAINT grupos_estado_check 
  CHECK (estado IN ('ACTIVO', 'INACTIVO', 'PAUSADO', 'ARCHIVADO'));

-- 6. ÍNDICES adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_vendedor ON tickets(vendedor_phone);

-- VERIFICACIÓN FINAL
SELECT 'Migración 001 completada exitosamente' as status;
