# Servicios (capa de negocio)

Objetivo: concentrar lógica de negocio reutilizable y dejar los controladores (`controllers/`) finos, limitados a parseo/validación de request/response.

## Guía de migración incremental
- Extraer reglas de negocio desde `controllers/` hacia módulos en `services/`.
- Inyectar dependencias necesarias (por ejemplo, funciones de `db/` o utilidades de `utils/`).
- Mantener funciones puras cuando sea posible para facilitar tests.

## Ejemplos de servicios (futuros)
- `users.service.js`: alta/listado/validación de usuarios, hashing, reglas por rol.
- `shows.service.js`: creación/edición de shows, cupos y visibilidad.
- `tickets.service.js`: asignación/venta/uso de tickets y validaciones.
