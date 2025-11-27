# 🔍 AUDITORÍA COMPLETA DEL PROYECTO BACO TEATRO

## ❌ PROBLEMAS ENCONTRADOS

### 1. **RUTAS BACKEND vs APP NO COINCIDEN**

#### Backend (`server.js`):
```javascript
app.use("/auth", authRoutes);        // → /auth/login
app.use("/users", usersRoutes);      // → /users
app.use("/shows", showsRoutes);      // → /shows
app.use("/tickets", ticketsRoutes);  // → /tickets
app.use("/reportes", reportesRoutes); // → /reportes
```

#### App móvil (`api/api.js`):
```javascript
fetch(`${API_URL}/api/auth/login`)         // ❌ RUTA INCORRECTA
fetch(`${API_URL}/api/users`)              // ❌ RUTA INCORRECTA
fetch(`${API_URL}/api/shows`)              // ❌ RUTA INCORRECTA
```

**PROBLEMA**: La app agrega `/api/` pero el backend NO lo tiene.

**SOLUCIÓN**: 
- Opción A: Cambiar todas las rutas de la app (quitar `/api`)
- Opción B: Cambiar el backend para usar `/api` como prefijo

---

### 2. **NOMBRES DE RUTAS DIFERENTES**

#### Backend:
```javascript
POST /shows/:id/generate  // generarTickets
POST /shows/:id/assign    // asignarTickets
POST /auth/complete-register
```

#### App:
```javascript
POST /shows/:id/assign-tickets  // ❌ DIFERENTE
POST /auth/completar-registro   // ❌ DIFERENTE
```

---

### 3. **CAMPOS DE BASE DE DATOS vs CÓDIGO**

#### Schema.sql:
```sql
users (phone, name, role, password_hash)
```

#### App espera:
```javascript
user.rol   // ❌ Backend devuelve "role"
user.nombre // ❌ Backend devuelve "name"
```

---

## ✅ LO QUE ESTÁ BIEN

1. ✅ Schema SQL: Bien estructurado (users, shows, tickets)
2. ✅ 6 estados de tickets correctos
3. ✅ JWT implementado
4. ✅ bcrypt hash correcto
5. ✅ Índices en DB
6. ✅ Middleware de auth y roles
7. ✅ Assets PNG generados

---

## 🔧 CORRECCIONES NECESARIAS

### PRIORIDAD ALTA (rompen la app):

1. **Arreglar prefijo `/api/`** en todas las rutas
2. **Unificar nombres**: `role` vs `rol`, `name` vs `nombre`
3. **Corregir endpoints**: `/assign` vs `/assign-tickets`
4. **Corregir rutas auth**: `/complete-register` vs `/completar-registro`

### PRIORIDAD MEDIA:

5. Verificar respuestas JSON del backend
6. Agregar validaciones de campos
7. Testear flujo completo

---

## 📋 PLAN DE ACCIÓN

### Paso 1: Actualizar rutas del backend (MÁS FÁCIL)
Agregar prefijo `/api` en `server.js`:

```javascript
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/shows", showsRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/reportes", reportesRoutes);
```

### Paso 2: Unificar nombres en respuestas
En `auth.controller.js`, devolver:
```javascript
{
  token: "...",
  user: {
    phone: user.phone,
    name: user.name,    // ← mantener "name"
    role: user.role     // ← mantener "role"
  }
}
```

Y en la app, mapear correctamente:
```javascript
user.role  // NO user.rol
user.name  // NO user.nombre
```

### Paso 3: Unificar rutas
Cambiar en `routes/shows.routes.js`:
```javascript
router.post("/:id/assign-tickets", ..., asignarTickets);
```

Cambiar en `routes/auth.routes.js`:
```javascript
router.post("/completar-registro", completarRegistro);
```

---

## 🎯 DECISIÓN RECOMENDADA

**OPCIÓN RECOMENDADA**: Arreglar el BACKEND (más estándar usar `/api/`)

Motivos:
- Es estándar REST API usar `/api/` como prefijo
- La app ya está configurada así
- Más fácil cambiar 5 líneas en backend que 50+ en la app
- Backend aún no está desplegado, no rompe nada

