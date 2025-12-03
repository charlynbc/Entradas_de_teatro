-- ============================================
-- EJECUTA ESTO EN RENDER DASHBOARD → TU DB → SHELL
-- ============================================
-- Hash generado: $2b$10$1.O93K2GKBzHwy8mKeHp9unLN6Ws23j/ygl3bCPNEmY8CBWybr3E6
-- Password: Teamomama91
-- Fecha: 3 de diciembre de 2025
-- ============================================

-- Paso 1: Eliminar usuario anterior
DELETE FROM users WHERE cedula = '48376669';

-- Paso 2: Crear nuevo usuario supremo con hash CORRECTO
INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
VALUES ('supremo_' || extract(epoch from now())::bigint, '48376669', 'Super Baco', '$2b$10$1.O93K2GKBzHwy8mKeHp9unLN6Ws23j/ygl3bCPNEmY8CBWybr3E6', 'supremo', NOW(), NOW());

-- Paso 3: Verificar
SELECT 
  id, 
  cedula, 
  nombre, 
  rol, 
  length(password) as hash_length,
  created_at 
FROM users 
WHERE cedula = '48376669';

-- ============================================
-- DESPUÉS DE EJECUTAR ESTO, PODRÁS HACER LOGIN CON:
-- Cédula: 48376669
-- Password: Teamomama91
-- ============================================
