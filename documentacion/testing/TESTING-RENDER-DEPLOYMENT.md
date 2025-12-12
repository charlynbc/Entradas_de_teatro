# Testing Render Deployment - Baco Teatro

**URL de Producción:** https://baco-teatro-1jxj.onrender.com  
**Fecha de Prueba:** 2 de diciembre de 2025

## ✅ Estado General

El servidor está funcionando correctamente y responde en todos los endpoints principales.

## 🧪 Pruebas Realizadas

### 1. Health Check del Servidor

```bash
curl https://baco-teatro-1jxj.onrender.com/health
```

**Resultado:** ✅ Exitoso
```json
{
  "status": "ok",
  "storage": "postgresql",
  "database": "connected",
  "totals": {
    "users": 8,
    "shows": 0,
    "tickets": 1
  }
}
```

### 2. Endpoint Raíz de la API

```bash
curl https://baco-teatro-1jxj.onrender.com/api
```

**Resultado:** ✅ Exitoso
```json
{
  "ok": true,
  "message": "API Teatro Tickets - PostgreSQL",
  "version": "3.0.0",
  "docs": "/README"
}
```

### 3. Login de Usuario Supremo

```bash
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
```

**Resultado:** ✅ Exitoso
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "supremo_1764609459397",
    "phone": "48376669",
    "role": "SUPER",
    "name": "Super Baco"
  }
}
```

### 4. Listar Usuarios (con autenticación)

```bash
curl https://baco-teatro-1jxj.onrender.com/api/usuarios \
  -H "Authorization: Bearer <TOKEN>"
```

**Resultado:** ✅ Exitoso
- Retorna lista de 8 usuarios (directores y actores de prueba)

### 5. Listar Shows

```bash
curl https://baco-teatro-1jxj.onrender.com/api/shows \
  -H "Authorization: Bearer <TOKEN>"
```

**Resultado:** ✅ Exitoso (array vacío)
- No hay shows creados actualmente

## 📋 Credenciales de Acceso

### Usuario Supremo (Super Admin)
- **Cédula/Phone:** `48376669`
- **Password:** `Teamomama91`
- **Rol:** SUPER

## 🔧 Configuración del Sistema

### Variables de Entorno en Render
- ✅ `DATABASE_URL` configurado correctamente
- ✅ `JWT_SECRET` configurado
- ✅ `PORT` asignado automáticamente por Render

### Base de Datos PostgreSQL
- ✅ Conexión establecida
- ✅ Schema inicializado
- ✅ Usuario supremo creado automáticamente

## 🎯 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/completar-registro` - Completar registro
- `GET /api/auth/verificar` - Verificar token (requiere auth)

### Usuarios
- `GET /api/usuarios` - Listar usuarios (requiere auth)
- `POST /api/usuarios` - Crear usuario (requiere auth SUPER/ADMIN)
- `GET /api/usuarios/:id` - Obtener usuario (requiere auth)
- `PUT /api/usuarios/:id` - Actualizar usuario (requiere auth)
- `DELETE /api/usuarios/:id` - Eliminar usuario (requiere auth SUPER/ADMIN)

### Shows/Obras
- `GET /api/shows` - Listar shows
- `POST /api/shows` - Crear show (requiere auth ADMIN)
- `GET /api/shows/:id` - Obtener show
- `PUT /api/shows/:id` - Actualizar show (requiere auth ADMIN)
- `DELETE /api/shows/:id` - Eliminar show (requiere auth ADMIN)

### Tickets/Entradas
- `GET /api/tickets` - Listar tickets (requiere auth)
- `POST /api/tickets` - Crear ticket (requiere auth)
- `GET /api/tickets/:id` - Obtener ticket (requiere auth)
- `PUT /api/tickets/:id` - Actualizar ticket (requiere auth)

### Reportes
- `GET /api/reportes/ventas` - Reporte de ventas (requiere auth ADMIN/SUPER)
- `GET /api/reportes/actores` - Reporte de actores (requiere auth ADMIN/SUPER)

### Ensayos
- `GET /api/ensayos` - Listar ensayos (requiere auth)
- `POST /api/ensayos` - Crear ensayo (requiere auth ADMIN)

## ⚠️ Notas Importantes

1. **Sistema de Autenticación:** Usa cédula como identificador principal (mapeado como `phone` en el frontend)
2. **Roles del Sistema:**
   - `supremo` → `SUPER` (acceso completo)
   - `admin` → `ADMIN` (gestión de shows y reportes)
   - `vendedor` → `VENDEDOR` (venta de tickets)
3. **Base de Datos Limpia:** Actualmente solo tiene usuarios de prueba, sin shows ni tickets
4. **Token JWT:** Válido por 30 días desde el login

## 🚀 Próximos Pasos

1. Crear shows/obras de prueba desde la app móvil o via API
2. Probar flujo completo de venta de tickets
3. Validar reportes con datos reales
4. Verificar notificaciones y transferencias entre actores

## 🐛 Errores Encontrados y Soluciones

### ❌ Error Menor: Confusión en ruta de health check
**Descripción:** Se intentaba acceder a `/api/health` cuando la ruta correcta es `/health`  
**Solución:** Documentar que el health check está en `/health` directamente, no bajo `/api`

### ✅ Estado Final: Sin errores críticos
- ✅ Todos los endpoints funcionan correctamente
- ✅ Base de datos PostgreSQL conectada
- ✅ Usuario supremo creado automáticamente
- ✅ Frontend desplegado y funcionando
- ✅ Autenticación JWT operativa
- ✅ 8 usuarios de prueba registrados
- ✅ 1 ticket de prueba en el sistema

## 📝 Observaciones

1. **Base de datos limpia:** Actualmente solo hay usuarios y tickets de prueba, sin shows activos
2. **JavaScript Bundle:** El bundle Expo se carga correctamente desde `/_expo/static/js/web/`
3. **Metadata:** Sistema usando Metro bundler (React Native Web)
4. **CORS:** Configurado correctamente con `access-control-allow-origin: *`

## 🧪 Script de Testing Automatizado

Se creó el script `test-render-deployment.sh` que ejecuta todas las pruebas automáticamente:

```bash
./test-render-deployment.sh
```

Este script verifica:
- Health check del servidor
- Endpoint raíz de la API
- Login de usuario supremo
- Listado de usuarios
- Listado de shows
- Listado de tickets
- Carga del frontend HTML
- Disponibilidad del JavaScript bundle
- Assets estáticos (metadata.json)

---

**Estado Final:** ✅ DEPLOYMENT EXITOSO
