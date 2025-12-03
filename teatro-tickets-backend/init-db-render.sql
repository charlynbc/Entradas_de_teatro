-- Script para inicializar la base de datos en Render
-- Base de datos virgen con solo el super usuario

-- Limpiar tablas existentes
DROP TABLE IF EXISTS reportes_obras CASCADE;
DROP TABLE IF EXISTS ensayos_generales CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY,
  cedula VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  password TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('supremo', 'admin', 'vendedor')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de shows
CREATE TABLE shows (
  id VARCHAR(100) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(200),
  precio NUMERIC(10,2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  creado_por VARCHAR(100) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de tickets
CREATE TABLE tickets (
  id VARCHAR(100) PRIMARY KEY,
  show_id VARCHAR(100) REFERENCES shows(id) ON DELETE CASCADE,
  qr_code TEXT,
  estado VARCHAR(50) DEFAULT 'NO_ASIGNADO',
  precio_venta NUMERIC(10,2),
  vendedor_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de ensayos generales
CREATE TABLE ensayos_generales (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  lugar VARCHAR(200),
  descripcion TEXT,
  director_id VARCHAR(100) REFERENCES users(id),
  actores_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de reportes de obras
CREATE TABLE reportes_obras (
  id SERIAL PRIMARY KEY,
  show_id VARCHAR(100),
  nombre_obra VARCHAR(200) NOT NULL,
  fecha_show TIMESTAMP NOT NULL,
  director_id VARCHAR(100),
  total_tickets INTEGER NOT NULL,
  tickets_vendidos INTEGER DEFAULT 0,
  tickets_usados INTEGER DEFAULT 0,
  ingresos_totales NUMERIC(10,2) DEFAULT 0,
  datos_vendedores JSONB DEFAULT '[]',
  datos_ventas JSONB DEFAULT '{}',
  fecha_generacion TIMESTAMP DEFAULT NOW()
);

-- Insertar super usuario
-- Password: super123 (hash bcrypt)
INSERT INTO users (id, cedula, nombre, password, rol, activo)
VALUES (
  'supremo_SUPER',
  'supremo@baco.com',
  'Super Baco',
  '$2b$10$YourHashedPasswordHere',
  'supremo',
  true
);

-- Crear índices para mejor performance
CREATE INDEX idx_shows_fecha ON shows(fecha);
CREATE INDEX idx_tickets_show ON tickets(show_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_ensayos_fecha ON ensayos_generales(fecha);
CREATE INDEX idx_reportes_show ON reportes_obras(show_id);

-- Verificar
SELECT 'Base de datos inicializada correctamente' as status;
SELECT * FROM users WHERE rol = 'supremo';
