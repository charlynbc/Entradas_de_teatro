-- Script SQL para resetear el superusuario
-- Ejecuta esto desde la Shell de PostgreSQL en Render Dashboard

-- IMPORTANTE: Este hash es de ejemplo. Para generar el hash correcto:
-- 1. Ejecuta en tu computadora: cd teatro-tickets-backend && node generar-hash.js
-- 2. Copia el hash generado y reemplázalo abajo donde dice 'HASH_AQUI'
-- 3. O ejecuta directamente: node reset-superusuario.js con la DATABASE_URL

-- Paso 1: Eliminar usuario supremo existente
DELETE FROM users WHERE cedula = '48376669';

-- Paso 2: Crear nuevo usuario supremo con password hasheado
-- Password original: Teamomama91
-- Hash: Se debe generar con bcrypt (10 salt rounds)

-- OPCIÓN A: Si tienes un hash válido, usa este formato:
INSERT INTO users (
  id,
  cedula,
  nombre,
  password,
  rol,
  created_at,
  updated_at
) VALUES (
  'supremo_' || extract(epoch from now())::bigint,
  '48376669',
  'Super Baco',
  'HASH_AQUI',  -- <-- REEMPLAZA con el hash generado por generar-hash.js
  'supremo',
  NOW(),
  NOW()
);

-- OPCIÓN B (RECOMENDADA): Usa el script Node.js en su lugar
-- En tu terminal local:
-- cd teatro-tickets-backend
-- DATABASE_URL="tu-url-aqui" node reset-superusuario.js

-- Paso 3: Verificar que se creó correctamente
SELECT 
  id,
  cedula,
  nombre,
  rol,
  length(password) as password_length,
  created_at
FROM users 
WHERE cedula = '48376669';

-- Deberías ver:
-- cedula: 48376669
-- nombre: Super Baco  
-- rol: supremo
-- password_length: 60 (los hashes bcrypt tienen 60 caracteres)
-- created_at: (fecha actual)

-- Paso 4: Probar el login
-- Usa curl o la app móvil con:
--    Cédula: 48376669
--    Password: Teamomama91
