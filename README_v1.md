# Baco Teatro - Sistema de Gestión de Entradas 🎭🍊

Sistema completo para gestión y validación de entradas de teatro.

## Identidad Visual

**Baco Teatro** usa una paleta minimalista:
- **Naranja Baco**: `#C84A1B` (color principal)
- **Blanco**: `#FFFFFF`
- **Negro**: `#000000`

## Arquitectura

El proyecto está dividido en dos partes:

### 1. Backend - API REST (`teatro-tickets-backend/`)
- **Stack**: Node.js + Express
- **Puerto**: 3000
- **Deploy**: Render (próximamente)
- **Base de datos**: En memoria (migraremos a PostgreSQL)

### 2. App Móvil (`baco-teatro-app/`)
- **Stack**: React Native + Expo + React Navigation
- **Plataformas**: Android e iOS
- **Funcionalidades**: 
  - 🎫 Registro de ventas
  - 📷 Validación con escaneo QR
  - 📊 Reportes y estadísticas

## Estructura del Proyecto

```
Entradas_de_teatro/
├── teatro-tickets-backend/    # API REST
│   ├── index.js              # Servidor Express
│   ├── package.json          
│   └── README.md
│
└── baco-teatro-app/           # App móvil
    ├── App.js                # Pantalla principal
    ├── src/
    │   └── theme/
    │       └── colors.js     # Paleta Baco
    ├── package.json
    └── README.md
```

## Inicio Rápido

### Backend

```bash
cd teatro-tickets-backend
npm install
npm start
```

El servidor estará en `http://localhost:3000`

### App Móvil

```bash
cd baco-teatro-app
npm install
npm start
```

Escanea el QR con Expo Go en tu celular.

## Flujo de Uso

### Para Vendedores
1. **Crear función** (obra + fecha + capacidad) desde el backend
2. **Generar tickets** con códigos únicos y QR automáticos
3. **Asignar tickets** a vendedores
4. **Registrar venta** en la app móvil:
   - Buscar ticket por código
   - Ingresar datos del comprador
   - Seleccionar medio de pago
   - Marcar como PAGADO

### Para Validación en Puerta
1. Abrir app móvil en pestaña **Validar**
2. **Escanear QR** del ticket con la cámara
3. Sistema verifica automáticamente:
   - ✅ Ticket válido → Permite entrada
   - ❌ Ya usado / No pagado → Bloquea

### Para Administración
1. Pestaña **Reportes** en la app
2. Ver estadísticas por función:
   - Ventas por vendedor
   - Montos recaudados
   - Tickets vendidos vs disponibles

## Estados de Tickets

- `DISPONIBLE`: Generado pero no vendido
- `PAGADO`: Vendido y listo para validar
- `USADO`: Ya validado en la puerta

## Endpoints Principales

### Funciones
- `POST /api/shows` - Crear función
- `GET /api/shows` - Listar funciones
- `POST /api/shows/:id/generate-tickets` - Generar tickets con QR
- `GET /api/shows/:id/tickets` - Ver tickets de una función

### Tickets
- `GET /api/tickets/:code` - Consultar ticket
- `POST /api/tickets/:code/sell` - **Registrar venta** (nuevo)
- `POST /api/tickets/:code/pay` - Marcar como pagado
- `POST /api/tickets/:code/validate` - Validar en puerta

### Vendedores
- `GET /api/vendedores` - Listar vendedores
- `POST /api/vendedores` - Crear vendedor
- `PUT /api/vendedores/:id` - Actualizar vendedor
- `DELETE /api/vendedores/:id` - Desactivar vendedor

### Reportes
- `GET /api/reportes/ventas?showId=X` - Resumen de ventas por vendedor

Ver documentación completa en cada README de los subdirectorios.

## Próximos Pasos

- [ ] Deploy del backend en Render
- [ ] Login de administradores
- [ ] Migrar a PostgreSQL
- [ ] Panel web de administración
- [ ] Integración con API de Prex (pago automático)
- [ ] Notificaciones push
- [ ] Modo offline en app móvil

---

**Desarrollado para Baco Teatro** 🎭