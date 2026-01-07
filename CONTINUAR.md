# CONTINUAR (30/12/2025)

Este archivo es el “punto de re-enganche”.

Cuando escribas **continuar** en el chat, la idea es que yo:
1) lea este archivo,
2) levante DB + backend,
3) ejecute los tests relevantes,
4) corrija lo que falte (sin tocar frontend),
5) deje todo commiteado en la rama `30/12`.

## Estado actual

- Objetivo original: **NO tocar frontend**. Arreglar backend + Postgres para:
  - crear DIRECTORES (rol `ADMIN`),
  - asignarlos a grupos,
  - persistir roles/relaciones,
  - migraciones seguras (ALTER/constraints/índices),
  - logs claros.

- Cambios ya hechos (resumen corto):
  - Grupos/membresías: la persistencia se alinea a `grupo_miembros` y vistas de compat.
  - Se agregó migración “safe constraints” para tolerar roles/estados legacy.
  - Hay trabajo adicional en tickets/reportes/compatibilidad (ver `git status` / commits de esta rama).

## Cómo levantar el entorno local

1) Iniciar Postgres (Docker):
- VS Code task: `DB: start postgres`

2) Aplicar migraciones/compat:
- VS Code task: `DB: migrate phone+FK`

3) Levantar backend:
- VS Code task: `Backend: dev (nodemon)`
  - Alternativa: `npm run debug` (si querés inspección)

## Validaciones mínimas (lo que falta confirmar)

- Validar que el backend quede corriendo estable (si muere, capturar stacktrace y arreglar).
- Probar flujo “director”:
  - Login SUPER (`/api/auth/login`).
  - Crear director (solo SUPER): `POST /api/usuarios/directores`.
  - Asignarlo a grupo: `POST /api/grupos/:id/directores`.
  - Confirmar en DB: tabla `users` y tabla `grupo_miembros`.

## Tests sugeridos

- Desde raíz:
  - VS Code tasks en `Tests:` (super/director/vendedores/invitados)
  - O scripts directos:
    - `node tests/test-super-usuario.js`
    - `node tests/test-director.js`
    - `node tests/test-vendedores.js`
    - `node tests/test-invitados.js`

## Nota importante

- Si hay diferencias entre “prompt/documentación” y el sistema real, priorizar **compatibilidad + no romper producción**.
