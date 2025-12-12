#!/usr/bin/env bash
set -euo pipefail

# Ejecuta el entorno completo: DB + migración + backend
# Uso:
#   ./scripts/ejecutar.sh [dev|debug]
# Por defecto: dev (nodemon)

MODE=${1:-dev}
DB_URL=${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/teatro}

echo "🔧 Modo: $MODE"
echo "🗄️  DATABASE_URL: $DB_URL"

echo "🐘 Iniciando PostgreSQL (docker) si no está corriendo..."
if ! docker ps --format '{{.Names}}' | grep -q '^teatro-postgres$'; then
  docker rm -f teatro-postgres || true
  docker run -d --name teatro-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=teatro \
    -p 5432:5432 postgres:15
  echo "⏳ Esperando 3s que arranque Postgres..."; sleep 3
else
  echo "✅ PostgreSQL ya está corriendo"
fi

echo "🧩 Aplicando migración phone+FK..."
(
  export DATABASE_URL="$DB_URL"
  cd "$(dirname "$0")/.."/teatro-tickets-backend
  npm run db:migrate-phone-fk
)

echo "🚀 Levantando backend..."
export DATABASE_URL="$DB_URL"
cd "$(dirname "$0")/.."/teatro-tickets-backend

if [[ "$MODE" == "debug" ]]; then
  echo "🪲 Debug (--inspect=9229)"
  npm run debug
else
  echo "♻️  Dev (nodemon)"
  npm run dev
fi
