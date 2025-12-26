# Fábricas (ensamblado de objetos)

Objetivo: centralizar la creación de objetos/servicios con sus dependencias (p. ej., pasar `db.query`, `logger`, config, etc.), evitando acoplamiento fuerte y facilitando el testeo.

## Patrón sugerido
- Exportar funciones `createXxxFactory()` que devuelvan instancias configuradas.
- Evitar singletons globales; preferir instancias inyectadas por módulo/route.

## Ejemplos (futuros)
- `createUsersService({ query, hashPassword })`
- `createTicketsService({ query, pdfGenerator })`
