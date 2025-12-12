# Guía de Tareas y Depuración en VS Code

Este proyecto incluye tareas preconfiguradas y configuraciones de depuración para acelerar el flujo en Codespaces.

## Requisitos
- Docker disponible (para PostgreSQL local).
- Node.js y npm ya presentes en el Codespace.

## Tareas disponibles (Terminal > Run Task)
- DB: start postgres
  - Levanta PostgreSQL 15 en Docker (usuario/password `postgres`, DB `teatro`).
- DB: stop postgres
  - Detiene y elimina el contenedor de PostgreSQL.
- Backend: dev (nodemon)
  - Arranca el backend con recarga automática; copia `.env.example` a `.env` si falta.
- Backend: reload (background)
  - Reinicia el backend en segundo plano y guarda su PID en `/tmp/backend.pid`.
- Backend: stop
  - Detiene el backend lanzado con `reload`.
- Backend: debug (inspect)
  - Ejecuta `npm run debug` (abre el inspector en `9229`).
- Backend: debug (inspect background)
  - Lanza el backend con inspector en segundo plano; guarda PID en `/tmp/backend-debug.pid`.
- Backend: stop debug
  - Detiene el proceso de debug en background.
- Dev: Start DB + Backend Debug
  - Secuencia: inicia PostgreSQL y luego el backend en modo debug (background).
- Dev: Stop DB + Backend
  - Secuencia: detiene el backend en debug y luego PostgreSQL.

## Depuración
- Inicia "Backend: debug (inspect)" o la compuesta "Dev: Start DB + Backend Debug".
- Abre la vista Run and Debug y elige "Attach (9229)" para conectarte en un clic.
- Alternativas en `.vscode/launch.json`:
  - Debug Backend (index-v3-postgres.js): lanza el backend con el depurador.
  - Attach to Backend (PID from /tmp/backend.pid): adjunta seleccionando proceso.

## Variables de entorno
- Crea `teatro-tickets-backend/.env` basado en `.env.example` (ya provisto).
- El script `npm run debug` exporta automáticamente `DATABASE_URL` local.

## Notas
- El build del frontend (`baco-teatro-app/build-for-render.sh`) copia los artefactos a `teatro-tickets-backend/public`.
- Para limpiar/levantar rápido: usa `scripts/dev.sh` (`start-db`, `reload`, etc.).
