# Entorno de Desarrollo (Snapshot 02/12)

Este documento resume cómo replicar el entorno del 02/12 en Codespaces.

## Variables necesarias

Crea `.env` en `teatro-tickets-backend/` basado en `.env.example`:

- DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
- JWT_SECRET=teatro-baco-secret-2024
- PORT=3000

Opcional en `baco-teatro-app/.env`:
- EXPO_PUBLIC_API_URL=http://localhost:3000

## Comandos npm (backend)

- dev: arranca en desarrollo con recarga automática (nodemon)
- start: arranca en producción
- reload: reinicia rápido en background y guarda PID en /tmp/backend.pid
- stop: detiene el proceso del backend si está en background
- status: muestra si el proceso está corriendo

## Pasos para levantar el backend

1. Levantar PostgreSQL local con Docker:
   docker rm -f teatro-postgres || true
   docker run -d --name teatro-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_DB=teatro \
     -p 5432:5432 postgres:15

2. Configurar variables de entorno:
   Copia `teatro-tickets-backend/.env.example` a `.env` y ajusta si es necesario.

3. Instalar dependencias:
   cd teatro-tickets-backend
   npm ci

4. Arrancar el backend:
   npm run dev
   # o, en background:
   npm run reload

Frontend (web) ya se copia al backend por `baco-teatro-app/build-for-render.sh`.

## Tag de estado estable

Se creó el tag `render-2025-12-02` apuntando al commit del 02/12.

Para usarlo:
- Verlo: git show render-2025-12-02
- Checkout: git checkout tags/render-2025-12-02 -b snapshot-02-12
- Deploy: usa este tag/branch para Render si deseas pinnear el estado.
