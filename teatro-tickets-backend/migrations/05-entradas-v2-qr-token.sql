-- ============================================
-- MIGRACIÓN: QR seguro para entradas_v2
-- Agrega qr_token único para validar PDF/QR y escaneo
-- ============================================

ALTER TABLE entradas_v2
  ADD COLUMN IF NOT EXISTS qr_token TEXT;

-- Sembrar tokens para entradas existentes
UPDATE entradas_v2
   SET qr_token = COALESCE(qr_token, md5(random()::text || clock_timestamp()::text || id::text));

ALTER TABLE entradas_v2
  ALTER COLUMN qr_token SET NOT NULL,
  ALTER COLUMN qr_token SET DEFAULT md5(random()::text || clock_timestamp()::text || pg_backend_pid()::text);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entradas_v2_qr_token ON entradas_v2(qr_token);
