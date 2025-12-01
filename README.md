# 🎭 Baco Teatro - Sistema de Gestión de Entradas

Sistema completo para gestión de entradas de teatro con roles de usuario (Supremo, Admin, Vendedor), generación de QR, trazabilidad completa y reportes de ventas.

## 🚀 Deploy en Producción (Render)

### Backend + Base de Datos PostgreSQL

El sistema usa PostgreSQL para persistencia real de datos. Sigue la guía completa:

👉 **[Guía de Deploy del Backend](./teatro-tickets-backend/DEPLOY-RENDER.md)**

**Resumen rápido:**
1. Crear base de datos PostgreSQL en Render
2. Crear Web Service para el backend
3. Configurar variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.)
4. Deploy automático desde GitHub

### Frontend (Expo Web)

El frontend se puede desplegar como Static Site o servirse desde el backend:

👉 **[Guía de Deploy del Frontend](./baco-teatro-app/DEPLOY-RENDER.md)**

**Opciones:**
- **Opción 1:** Static Site independiente en Render (CDN, más rápido)
- **Opción 2:** Servir desde el backend (más simple, un solo servicio)

---

## 💻 Desarrollo Local

### Requisitos

- Node.js 18+
- PostgreSQL 14+ (para backend con DB real)
- npm o yarn

### Backend

```bash
cd teatro-tickets-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL local

# Iniciar servidor
npm start
```

El servidor correrá en `http://localhost:3000`

**Endpoints importantes:**
- `GET /health` - Estado del sistema
- `GET /api` - Información de la API
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro de usuarios

### Frontend (Expo Web)

```bash
cd baco-teatro-app

# Instalar dependencias
npm install

# Configurar API URL
cp .env.example .env
# Editar .env: EXPO_PUBLIC_API_URL=http://localhost:3000

# Iniciar en modo web
npx expo start --web
```

La app correrá en `http://localhost:8081`

---

## 🏗️ Arquitectura del Sistema

### Backend (`teatro-tickets-backend`)

- **Runtime:** Node.js + Express
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT
- **Estructura:**
  - `index-v3-postgres.js` - Servidor principal
  - `db/postgres.js` - Conexión y queries a PostgreSQL
  - `routes/` - Rutas de la API (auth, users, shows, tickets, reportes)
  - `controllers/` - Lógica de negocio
  - `utils/` - Utilidades (dataStore adaptado a Postgres)

### Frontend (`baco-teatro-app`)

- **Framework:** React Native (Expo)
- **Web:** Expo Web (React DOM)
- **Estructura:**
  - `App.js` - Punto de entrada, manejo de autenticación
  - `screens/` - Pantallas (Login, AdminHome, VendedorHome)
  - `api/` - Cliente HTTP para consumir backend
  - `theme/` - Colores y estilos

---

## 👥 Roles de Usuario

### 🔑 Supremo
- Crear y gestionar usuarios (admins y vendedores)
- Todas las funciones de Admin

### 🎫 Admin
- Crear funciones de teatro
- Generar tickets con QR únicos
- Asignar tickets a vendedores
- Validar tickets (escaneo QR)
- Ver reportes de ventas

### 💰 Vendedor
- Ver tickets asignados
- Reportar ventas (con datos del comprador)
- Marcar tickets como pagados
- Ver historial de ventas

---

## 🔄 Flujo de Tickets

```
1. Admin crea función → Genera N tickets con QR
2. Admin asigna tickets a vendedor → Estado: EN_PODER
3. Vendedor reporta venta → Estado: VENDIDA_NO_PAGADA
4. Vendedor confirma pago → Estado: VENDIDA_PAGADA
5. Ticket se escanea en entrada → Estado: USADA
```

**Estados posibles:**
- `NO_ASIGNADO` - Recién creado
- `EN_PODER` - Asignado a vendedor
- `VENDIDA_NO_PAGADA` - Vendido pero sin pago confirmado
- `VENDIDA_PAGADA` - Vendido y pagado
- `USADA` - Ya se usó para ingresar

---

## 📊 Base de Datos

### Tablas principales:

**users**
- id, cedula, nombre, password (hash), rol
- Índice único en cedula

**shows**
- id, nombre, fecha, precio, total_tickets, creado_por
- Relación: creado_por → users.id

**tickets**
- id, show_id, qr_code (único), estado, vendedor_id
- precio_venta, comprador_nombre, comprador_contacto
- fecha_asignacion, fecha_venta, fecha_uso
- Relaciones: show_id → shows.id, vendedor_id → users.id

---

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT con secret configurable
- SSL obligatorio en producción (Render lo maneja automáticamente)
- Variables de entorno para secretos (nunca en código)

---

## 📦 Scripts Disponibles

### Backend

```bash
npm start       # Iniciar servidor
npm run dev     # Modo desarrollo (mismo que start)
```

### Frontend

```bash
npx expo start          # Iniciar con Expo Go
npx expo start --web    # Iniciar en navegador
npx expo export:web     # Build para producción web
```

---

## 🐛 Troubleshooting

### Backend no se conecta a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
psql -U postgres -c "SELECT version();"

# Verificar DATABASE_URL en .env
echo $DATABASE_URL

# Ver logs del servidor
npm start
```

### Frontend no se conecta al backend

1. Verificar que backend esté corriendo: `curl http://localhost:3000/health`
2. Verificar `EXPO_PUBLIC_API_URL` en `.env`
3. Abrir consola del navegador (F12) para ver errores

### Errores de CORS

El backend ya tiene CORS habilitado. Si persiste:
- Verificar que la URL del backend sea correcta
- En desarrollo local, ambos deben usar `localhost` (no mezclar con `127.0.0.1`)

---

## 📚 Recursos

- [Documentación de Render](https://render.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

## 🤝 Contribuir

Este proyecto está en la rama `prototipo` para desarrollo activo. La rama `funciona` contiene la última versión estable.

```bash
# Clonar y trabajar en prototipo
git clone https://github.com/charlynbc/Entradas_de_teatro.git
cd Entradas_de_teatro
git checkout prototipo

# Crear feature branch
git checkout -b feature/nueva-funcionalidad

# Hacer cambios, commit y push
git add .
git commit -m "Descripción de cambios"
git push origin feature/nueva-funcionalidad
```

---

## 📄 Licencia

ISC

---

**¡Listo para producción!** 🚀

Para cualquier duda, revisa las guías de deploy específicas en cada carpeta.
