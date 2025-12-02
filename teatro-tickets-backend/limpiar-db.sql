-- Script SQL para limpiar la base de datos
-- Ejecutar este script en Render Dashboard > tu base de datos > Query SQL

-- 1. Eliminar todos los reportes de obras
DELETE FROM reportes_obras;

-- 2. Eliminar todos los ensayos generales
DELETE FROM ensayos_generales;

-- 3. Eliminar todos los tickets
DELETE FROM tickets;

-- 4. Eliminar todos los shows
DELETE FROM shows;

-- 5. Eliminar todos los usuarios EXCEPTO el SUPER
DELETE FROM users WHERE rol != 'SUPER';

-- 6. Resetear secuencias (opcional, para que los IDs empiecen desde 1)
ALTER SEQUENCE IF EXISTS shows_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ensayos_generales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reportes_obras_id_seq RESTART WITH 1;

-- 7. Verificar usuarios restantes (debe ser solo 1: el SUPER)
SELECT cedula, nombre, rol FROM users;

-- 8. Verificar contadores
SELECT 
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM shows) as shows,
  (SELECT COUNT(*) FROM tickets) as tickets,
  (SELECT COUNT(*) FROM ensayos_generales) as ensayos,
  (SELECT COUNT(*) FROM reportes_obras) as reportes;
