# Qué falta (pendientes y roadmap)

Estado general: base estable (snapshot 02/12). A continuación, mejoras sugeridas y tareas pendientes.

## Alto impacto
- Backups automáticos de PostgreSQL (programados y verificados).
- CI/CD: pipeline de build, lint y deploy a Render con tags o ramas protegidas.
- Tests de integración y e2e básicos (login, CRUD shows/tickets, flujos críticos).
- Observabilidad: logs estructurados y alertas (nivel error) + endpoint `/metrics` opcional.
- Rate limiting y protección básica (helmet, cors afinado, límites por IP en `/api`).

## UX/Producto
- Exportación de reportes (CSV/PDF) desde paneles de directores y admins.
- Internacionalización (i18n) y accesibilidad (a11y) en frontend.
- Validaciones adicionales en formularios y mensajes de error consistentes.
- Gestión de roles avanzada (directores, actores) según navegación existente.

## Seguridad y datos
- Rotación de `JWT_SECRET` y almacenamiento seguro de secretos.
- Políticas de retención y limpieza de datos (GDPR-like).
- Auditoría de acciones sensibles (crear/editar shows, ventas, etc.).

## Desempeño
- Índices adicionales según uso real (consultas frecuentes) y análisis de EXPLAIN.
- Cache selectiva para listados estáticos.

## Infraestructura
- Entorno staging en Render (DB + backend) para pruebas previas al deploy a producción.
- Tareas de mantenimiento: `scripts/` con limpiezas y verificaciones recurrentes.

## Notas
- Mantener este archivo actualizado. Añadir checklists por entrega.
