-- Migración: VENDEDOR → ACTOR
-- Fecha: 21 de diciembre de 2025

BEGIN;

-- 1. Eliminar el constraint anterior PRIMERO
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Actualizar usuarios existentes con rol VENDEDOR
UPDATE users 
SET role = 'ACTOR' 
WHERE role = 'VENDEDOR';

-- 3. Crear nuevo constraint con ACTOR en lugar de VENDEDOR
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'INVITADO'));

-- 4. Actualizar comentarios de la tabla
COMMENT ON COLUMN users.role IS 'Roles: SUPER (superusuario), ADMIN (administrador), ACTOR (actor/actriz), INVITADO (invitado)';

COMMIT;

-- Verificación
SELECT role, COUNT(*) as cantidad 
FROM users 
GROUP BY role 
ORDER BY role;
