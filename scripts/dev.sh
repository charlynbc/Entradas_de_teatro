#!/usr/bin/env bash
set -euo pipefail

# Orquesta el entorno de desarrollo: DB + backend

function start_db() {
  docker rm -f teatro-postgres || true
  docker run -d --name teatro-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=teatro \
    -p 5432:5432 postgres:15
}

function stop_db() {
  docker rm -f teatro-postgres || true
}

function backend_dev() {
  pushd teatro-tickets-backend >/dev/null
  cp -n .env.example .env || true
  npm ci
  npm run dev
  popd >/dev/null
}

function backend_reload() {
  export DATABASE_URL=${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/teatro}
  pushd teatro-tickets-backend >/dev/null
  npm run reload
  popd >/dev/null
}

case "${1:-}" in
  start-db)
    start_db ;;
  stop-db)
    stop_db ;;
  dev)
    backend_dev ;;
  reload)
    backend_reload ;;
  *)
    echo "Usage: $0 {start-db|stop-db|dev|reload}" ;;
 esac
