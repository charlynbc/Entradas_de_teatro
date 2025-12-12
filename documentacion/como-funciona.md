# Cómo funciona

## Visión general
- Frontend: `baco-teatro-app` (Expo Web/React). El script `build-for-render.sh` genera la web y copia artefactos a `teatro-tickets-backend/public`.
- Backend: `teatro-tickets-backend` (Node.js + Express, ESM) con PostgreSQL. Autenticación JWT, roles `supremo`, `admin`, `vendedor`.
- Base de datos: PostgreSQL (Render en producción, Docker en desarrollo). Inicialización de schema en `db/postgres.js`.
- Deploy: Render. Snapshot estable etiquetado como `render-2025-12-02`.

## Flujo de ejecución
1. Frontend build: `baco-teatro-app/build-for-render.sh` → exporta `dist` y copia a `teatro-tickets-backend/public`.
2. Backend sirve API y la web empaquetada desde `/public`.
3. Variables de entorno clave (ver `teatro-tickets-backend/.env.example`):
   - `DATABASE_URL`, `JWT_SECRET`, `PORT`.
4. Health y API:
   - Healthcheck: `/health`
   - API base: `/api`

## Roles y seguridad
- JWT (`config/auth.js`): generación/verificación de token.
- Roles admitidos: `supremo`, `admin`, `vendedor` (validado en DB y controladores).

## Desarrollo en Codespaces
- Tareas VS Code en [.vscode/tasks.json](../.vscode/tasks.json): DB start/stop, backend dev/reload/stop, debug, y compuestas.
- Depuración: script `npm run debug` (abre `--inspect=9229`), luego attach con “Attach (9229)” en [.vscode/launch.json](../.vscode/launch.json).
 - Resumen operativo: [RESUMEN-ENTORNO-02-12.md](./deploy/RESUMEN-ENTORNO-02-12.md).

## Estructura rápida
- `baco-teatro-app/` → código del frontend (Expo/React Web)
- `teatro-tickets-backend/` → API, estáticos en `public/`, inicialización DB, rutas y controladores
- `documentacion/` → documentos funcionales y operativos
- `.vscode/` → tareas y configuración de depuración

