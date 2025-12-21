#!/usr/bin/env bash
set -euo pipefail

# Borra todos los datos de la base de datos excepto el super usuario
# Prioriza usar $DATABASE_URL; si no está, intenta docker exec al contenedor teatro-postgres

SQL="\
DELETE FROM reportes_obras;\n\
DELETE FROM ensayos_generales;\n\
DELETE FROM tickets;\n\
DELETE FROM shows;\n\
DELETE FROM users WHERE cedula <> '48376669' AND (rol IS NULL OR LOWER(rol) <> 'supremo');\n\
"

echo "🧹 Borrando datos (excepto super usuario: 48376669)..."

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Usando DATABASE_URL"
  echo -e "$SQL" | psql "$DATABASE_URL"
else
  if docker ps --format '{{.Names}}' | grep -q '^teatro-postgres$'; then
    echo "Usando contenedor docker teatro-postgres"
    docker exec -i teatro-postgres psql -U postgres -d teatro -c "${SQL//$'\n'/ }"
  else
    echo "❌ No hay DATABASE_URL y no se encontró el contenedor teatro-postgres"
    echo "Configura DATABASE_URL o levanta la DB con el task 'DB: start postgres'"
    exit 1
  fi
fi

echo "✅ Limpieza completa"
