# Teatro Tickets API 🎭

Backend para sistema de gestión de entradas de teatro.

## Características

- ✅ Crear funciones (obra + fecha + capacidad)
- ✅ Generar tickets con códigos únicos
- ✅ Marcar tickets como pagados
- ✅ Validar tickets en la puerta del teatro
- ✅ Consultar información de tickets y funciones

## Stack

- Node.js + Express
- Base de datos en memoria (migraremos a PostgreSQL)

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

El servidor se levantará en `http://localhost:3000`

## Endpoints

### Healthcheck
```
GET /
```

### Funciones

**Crear función**
```bash
POST /api/shows
Content-Type: application/json

{
  "obra": "Hamlet",
  "fecha": "2025-12-24 21:00",
  "capacidad": 100
}
```

**Listar funciones**
```bash
GET /api/shows
```

**Generar tickets para una función**
```bash
POST /api/shows/:id/generate-tickets
Content-Type: application/json

{
  "cantidad": 10
}
```

**Ver tickets de una función**
```bash
GET /api/shows/:id/tickets
```

### Tickets

**Consultar un ticket**
```bash
GET /api/tickets/:code
```

**Marcar ticket como pagado**
```bash
POST /api/tickets/:code/pay
```

**Validar ticket (en puerta del teatro)**
```bash
POST /api/tickets/:code/validate
```

## Estados de tickets

- `DISPONIBLE`: Ticket generado pero no pagado
- `PAGADO`: Ticket pagado, listo para validar
- `USADO`: Ticket ya validado en la puerta

## Deploy en Render

1. Conectar repositorio a Render
2. Configurar como Web Service
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Render asignará automáticamente el PORT

---

Desarrollado para gestión de entradas de teatro 🎫
