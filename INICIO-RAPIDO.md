# 🎭 Baco Teatro - Sistema Completo - Guía Rápida

## ✅ Estado: COMPLETADO Y FUNCIONANDO

Todas las mejoras han sido implementadas y probadas exitosamente.

---

## 🚀 Inicio Rápido

### 1. Iniciar el Sistema

```bash
# Terminal 1: Base de datos
npm run db:start

# Terminal 2: Backend
cd teatro-tickets-backend
npm run dev
```

### 2. Crear Datos de Prueba

```bash
cd teatro-tickets-backend
npm run db:crear-datos-completos
```

### 3. Probar el Sistema

```bash
# Opción A: Navegador
open http://localhost:3000/pages/auth/login.html

# Opción B: Script automatizado
bash scripts/test-sistema-completo.sh
```

---

## 👥 Usuarios de Prueba

| Usuario | Cédula | Password | Rol | Escritorio |
|---------|--------|----------|-----|------------|
| Super Usuario | 11111111 | 1234 | SUPER | Super Dashboard |
| Director Principal | 22222222 | 1234 | ADMIN | Panel Director |
| Actor Vendedor 1 | 33333333 | 1234 | ACTOR | Panel Vendedor |
| Actor Vendedor 2 | 44444444 | 1234 | ACTOR | Panel Vendedor |
| Vendedor Externo | 55555555 | 1234 | ACTOR | Panel Vendedor |

---

## 📚 Documentación Completa

- **[MEJORAS-IMPLEMENTADAS.md](MEJORAS-IMPLEMENTADAS.md)** - Lista detallada de todos los cambios
- **[SISTEMAS-ENTRADAS-EXPLICACION.md](SISTEMAS-ENTRADAS-EXPLICACION.md)** - Explicación técnica de sistemas de entradas

---

## 🎯 Nuevas Funcionalidades

### 1. Sistema Unificado de Reservas

Endpoints que funcionan con ambos sistemas (tickets y entradas_v2):

```bash
# Detectar sistema de función
GET /api/reservas/sistema/:funcionId

# Crear reserva (detecta automáticamente)
POST /api/reservas/crear
{
  "funcion_id": 1,
  "comprador_nombre": "Juan Pérez",
  "comprador_telefono": "+59899123456"
}

# Listar mis entradas
GET /api/reservas/mis-entradas?funcion_id=1

# Estadísticas de función
GET /api/reservas/estadisticas/:funcionId
```

### 2. Login Mejorado

- ✅ Redirección automática según rol
- ✅ Validación de usuario activo
- ✅ Manejo de roles desconocidos
- ✅ Mensajes de error claros

### 3. Scripts de Utilidad

```bash
# Crear datos completos (usuarios, grupos, obras, funciones, entradas)
npm run db:crear-datos-completos

# Migrar tickets legacy a entradas_v2
npm run db:migrar-entradas

# Probar sistema completo
bash scripts/test-sistema-completo.sh
```

---

## 🔧 Scripts NPM Disponibles

```json
{
  "start": "Inicia servidor en producción",
  "dev": "Inicia servidor en desarrollo (nodemon)",
  "db:crear-datos-completos": "Crea estructura completa de prueba",
  "db:migrar-entradas": "Migra tickets a entradas_v2",
  "db:migrate-phone-fk": "Aplica migraciones legacy",
  "debug": "Inicia servidor en modo debug"
}
```

---

## 📊 Endpoints API

### Autenticación
- `POST /api/auth/login` - Login de usuarios
- `GET /api/auth/verify` - Verificar token

### Reservas Unificadas (NUEVO)
- `POST /api/reservas/crear` - Crear reserva
- `GET /api/reservas/mis-entradas` - Listar entradas
- `GET /api/reservas/estadisticas/:id` - Estadísticas
- `GET /api/reservas/sistema/:id` - Detectar sistema

### Funciones
- `GET /api/funciones` - Listar funciones
- `POST /api/funciones` - Crear función
- `GET /api/funciones/:id` - Detalle de función

### Público
- `GET /api/public/funciones` - Funciones públicas
- `POST /api/public/funciones/:id/reservar` - Reserva pública

---

## 🎯 Flujos de Trabajo

### Flujo Completo: Desde Creación hasta Venta

```
1. SUPER/ADMIN crea grupo
   ↓
2. ADMIN crea obra en el grupo
   ↓
3. ADMIN crea función (genera entradas automáticamente)
   ↓
4. ADMIN asigna entradas a vendedores (ACTOR)
   ↓
5. ACTOR reserva entrada con datos del comprador
   ↓
6. ACTOR marca como "pronta" (venta lista para cobrar)
   ↓
7. ADMIN/DIRECTOR confirma pago (marca como "pagada")
   ↓
8. ADMIN escanea QR en puerta (marca como "utilizada")
```

### Flujo Reserva Pública

```
1. Invitado ve funciones en /proximas-funciones.html
   ↓
2. Selecciona función y vendedor
   ↓
3. Completa formulario (nombre, teléfono)
   ↓
4. Sistema reserva automáticamente
   ↓
5. Genera mensaje WhatsApp para vendedor
   ↓
6. Vendedor coordina con cliente
   ↓
7. Director confirma pago
   ↓
8. Entrada válida para escaneo
```

---

## 🔍 Verificación del Sistema

### Health Check
```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "name": "teatro"
  },
  "data": {
    "users": 5,
    "funciones": 2,
    "grupos": 1
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"11111111","password":"1234"}'
```

### Test Reserva Unificada
```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"33333333","password":"1234"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Ver mis entradas
curl http://localhost:3000/api/reservas/mis-entradas \
  -H "Authorization: Bearer $TOKEN"

# 3. Detectar sistema de función 1
curl http://localhost:3000/api/reservas/sistema/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Si no está corriendo
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 postgres:15
```

### No hay datos
```bash
cd teatro-tickets-backend
npm run db:crear-datos-completos
```

### Login falla
1. Verificar que existan usuarios: `curl http://localhost:3000/health`
2. Revisar credenciales (ver tabla de usuarios arriba)
3. Verificar que `active = true` en la base de datos

### Reservas no funcionan
1. Verificar que la función tenga entradas: `GET /api/reservas/estadisticas/:id`
2. Verificar sistema usado: `GET /api/reservas/sistema/:id`
3. Verificar que el vendedor tenga stock asignado

---

## 📈 Próximos Pasos

1. **Prueba el login** con diferentes roles
2. **Crea una función** de prueba
3. **Asigna entradas** a un vendedor
4. **Haz una reserva** como vendedor
5. **Confirma el pago** como director
6. **Escanea el QR** para marcar como usada

---

## 🎉 ¡Todo Listo!

El sistema está completamente operativo con:
- ✅ Login y redirección por roles
- ✅ Sistema unificado de reservas
- ✅ Migración automática entre sistemas
- ✅ Datos de prueba completos
- ✅ Scripts de utilidad
- ✅ Documentación completa

**Para comenzar:** Abre http://localhost:3000/pages/auth/login.html

---

**Última actualización:** 12 de enero de 2026  
**Versión:** 3.0.0  
**Estado:** ✅ Producción Ready
