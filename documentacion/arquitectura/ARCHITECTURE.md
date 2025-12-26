# Baco Teatro App – Arquitectura Frontend

## Objetivo

Construir una aplicación web/móvil (Expo + React Native) optimizada para usarse desde el celular, que cubra el flujo completo de gestión de entradas estilo RedTickets:

- **Roles**: super usuario (owner), administradores/directores, actores/vendedores.
- **Obras y funciones**: creación, calendarización, localidades, precios y cupos.
- **Entradas**: generación automática con QR, estados (disponible, reservada, vendida, pagada, usada) y transferencias entre actores.
- **Control**: escaneo QR multi admin, dashboard de asistencias, seguimiento de caja por vendedor.

## Stack

- Expo SDK 52 + React Native 0.76
- React Navigation (stack + bottom tabs)
- Context API + AsyncStorage para sesión
- Fetch API contra backend Express (JSON store)
- Expo Barcode Scanner para validación de tickets

## Módulos

1. **Auth**
   - Login por cédula + contraseña
   - Restablecimiento con credenciales por defecto (1234)
   - `AuthContext` mantiene token y usuario (rol, nombre, obras asignadas)

2. **Super Usuario**
   - Dashboard global con KPIs
   - Gestión de administradores (crear, activar/desactivar, reset pass)
   - Vista de obras en producción y estado de ventas

3. **Director (Admin)**
   - Gestión de obras/funciones (CRUD)
   - Asignación de actores y distribución de entradas
   - Panel de control con conteo en tiempo real (vendidas, pagadas, ingresadas)
   - Escáner QR universal

4. **Actor (Vendedor)**
   - Stock por obra / función
   - Acciones rápidas: reservar, marcar vendida/pagada, transferir
   - Historial de transferencias y caja

5. **Tickets**
   - Estados normalizados y badges visuales
   - Transferencias auditadas
   - Validación QR requiere ticket vendido + pagado

## Navegación

```
RootNavigator
 ├── AuthStack (Login)
 └── AppStack
       ├── SuperTabs (Dashboard, Directores, Obras)
       ├── DirectorTabs (Resumen, Funciones, Escáner, Reportes)
       └── ActorTabs (Mi Stock, Transferir, Historial)
```

## Tema visual

- Basado en colores de Baco Teatro:
  - Primario: #6A040F (vino), Secundario: #F48C06 (ámbar)
  - Fondos oscuros degradados para headers
  - Componentes con bordes redondeados y sombras suaves

## Integración Backend

- `API_URL` configurable vía `EXPO_PUBLIC_API_URL`
- Endpoints consumidos:
  - `POST /api/auth/login`
  - `GET/POST /api/usuarios`
  - `GET/POST /api/shows`, `POST /api/shows/:id/assign`
  - `GET /api/reportes/...`
  - `GET /api/tickets/mis-tickets`, `POST /api/tickets/asignar`, `GET /api/tickets/validar/:code`

## Próximos pasos

1. Implementar contexto + navegación (App.js)
2. Reemplazar API mock por cliente HTTP real
3. Crear pantallas por rol con componentes reutilizables
4. Pulir estilos y probar en Expo Web (mobile viewport)
