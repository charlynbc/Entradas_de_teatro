-- Migración 005: Completar estructura de users
-- Fecha: 27-12-2025
-- Descripción: Agregar columnas faltantes para perfiles completos

-- Agregar columnas para información personal
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notas TEXT;

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_fecha_nacimiento ON users(fecha_nacimiento);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comentarios descriptivos
COMMENT ON COLUMN users.fecha_nacimiento IS 'Fecha de nacimiento del usuario (para cumpleaños)';
COMMENT ON COLUMN users.apellido IS 'Apellido del usuario';
COMMENT ON COLUMN users.email IS 'Correo electrónico de contacto';
COMMENT ON COLUMN users.foto_url IS 'URL de la foto de perfil';
COMMENT ON COLUMN users.direccion IS 'Dirección física del usuario';
COMMENT ON COLUMN users.notas IS 'Notas adicionales sobre el usuario';
