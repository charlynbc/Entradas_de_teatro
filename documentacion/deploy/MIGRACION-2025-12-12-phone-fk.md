# Migración 2025-12-12: users.phone único + FK en tickets

Objetivo: normalizar el esquema para que `tickets.vendedor_phone` referencie `users.phone` de forma consistente y habilitar autenticación por `phone` (mapeado a `cedula`).

## Contexto
- Estado previo: `users` no tenía columna `phone` y `tickets` no existía o no tenía FK establecida.
- Se agregó `users.phone` y un índice único. Se creó `tickets` y se vinculó su `vendedor_phone` a `users(phone)`.

## Cambios en código
- Archivo: teatro-tickets-backend/schema.sql
  - Se añadió la columna `phone` en `users`.
  - Se creó el índice único `idx_users_phone_unique`.
  - Se aseguró la referencia `tickets.vendedor_phone -> users(phone)`.

## Pasos de migración (local/Render PostgreSQL)

1) Crear columna `phone` (si no existe):

```bash
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"
```

2) Crear índice único sobre `phone`:

```bash
psql "$DATABASE_URL" -c "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone);"
```

3) Crear tabla `tickets` (si aún no existe):

```bash
psql "$DATABASE_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS tickets (
  code VARCHAR(50) PRIMARY KEY,
  show_id INT NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('DISPONIBLE','STOCK_VENDEDOR','RESERVADO','REPORTADA_VENDIDA','PAGADO','USADO')) DEFAULT 'DISPONIBLE',
  vendedor_phone VARCHAR(20),
  comprador_nombre VARCHAR(150),
  comprador_contacto VARCHAR(150),
  precio NUMERIC(10,2),
  medio_pago VARCHAR(50),
  reportada_por_vendedor BOOLEAN NOT NULL DEFAULT FALSE,
  aprobada_por_admin BOOLEAN NOT NULL DEFAULT FALSE,
  qr_code TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reservado_at TIMESTAMP,
  reportada_at TIMESTAMP,
  pagado_at TIMESTAMP,
  usado_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tickets_show ON tickets(show_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
SQL
```

4) Agregar la FK desde `tickets.vendedor_phone` a `users(phone)`:

```bash
psql "$DATABASE_URL" -c "ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_vendedor_phone_fkey;"
psql "$DATABASE_URL" -c "ALTER TABLE tickets ADD CONSTRAINT tickets_vendedor_phone_fkey FOREIGN KEY (vendedor_phone) REFERENCES users(phone);"
```

## Verificación

```bash
curl -sS "$BACKEND_URL/health"
# Debe mostrar status ok y totales

curl -sS -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
# Debe responder con token y user
```

## Notas
- En esta fase `phone` mapea el login a `cedula`. A futuro podemos separar `phone` (teléfono real) de `cedula` (identificador) y ajustar controladores.
- Si la base tiene datos previos, rellenar `users.phone` a partir de `users.cedula` para mantener compatibilidad:

```bash
psql "$DATABASE_URL" -c "UPDATE users SET phone = cedula WHERE phone IS NULL;"
```

## Rollback

```bash
psql "$DATABASE_URL" -c "ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_vendedor_phone_fkey;"
psql "$DATABASE_URL" -c "DROP INDEX IF EXISTS idx_users_phone_unique;"
# (Opcional) ALTER TABLE users DROP COLUMN phone;  # solo si no hay dependencias
```
