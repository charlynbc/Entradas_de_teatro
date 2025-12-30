-- 007-ticket-auditoria-anulacion.sql
-- Agrega auditoría mínima de movimientos de tickets + soporte de anulación.

-- 1) Tabla de auditoría (si no existe)
CREATE TABLE IF NOT EXISTS ticket_movimientos (
  id           SERIAL PRIMARY KEY,
  tipo         VARCHAR(30) NOT NULL CHECK (tipo IN (
    'ASIGNACION',
    'RESERVA',
    'VENTA_REPORTADA',
    'PAGO_APROBADO',
    'TRANSFERENCIA',
    'ANULACION',
    'VALIDACION'
  )),
  ticket_code  VARCHAR(50) NOT NULL REFERENCES tickets(code) ON DELETE CASCADE,
  desde_phone  VARCHAR(20),
  hacia_phone  VARCHAR(20),
  motivo       TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_ticket ON ticket_movimientos(ticket_code);
CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_tipo ON ticket_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_ticket_movimientos_created_at ON ticket_movimientos(created_at);

-- 2) Campos de anulación en tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS anulado_motivo TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS anulado_at TIMESTAMP;

-- 3) Expandir constraint de estado para soportar ANULADO (y VENDIDO como alias futuro)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_estado_check'
  ) THEN
    ALTER TABLE tickets DROP CONSTRAINT tickets_estado_check;
  END IF;

  ALTER TABLE tickets
    ADD CONSTRAINT tickets_estado_check CHECK (
      estado IN (
        'DISPONIBLE',
        'STOCK_ACTOR',
        'RESERVADO',
        'REPORTADA_VENDIDA',
        'VENDIDO',
        'PAGADO',
        'USADO',
        'ANULADO'
      )
    );
END $$;
