# 🔍 DIAGNÓSTICO PASO 1: FUNDACIÓN DEL PROYECTO

## 📋 Contexto
**Fecha**: Diciembre 2025  
**Estado previo**: Ninguno (inicio de proyecto)  
**Objetivo**: Establecer sistema básico de gestión teatral para Baco Teatro Uruguay

---

## 🎯 Objetivo del PASO 1
**"Crear fundación técnica del sistema"**

### Entregables concretos
1. ✅ Estructura de directorios backend/frontend
2. ✅ Base de datos inicial (usuarios y autenticación)
3. ✅ Sistema de login con JWT
4. ✅ Roles básicos (SUPER, ADMIN, ACTOR)
5. ✅ API REST funcional
6. ✅ Frontend básico HTML/CSS/JS

---

## 🧱 Estado inicial (pre PASO-1)

### ❌ Lo que NO existía
- No había código
- No había base de datos
- No había arquitectura definida
- No había sistema de roles
- No había autenticación
- No había servidor

### 🎯 Lo que se necesitaba
- **Backend**: Node.js + Express para API REST
- **Base de datos**: PostgreSQL para persistencia
- **Autenticación**: JWT para sesiones
- **Frontend**: HTML/CSS/JS estático
- **Roles**: Sistema de permisos diferenciados

---

## 🔴 Decisiones arquitectónicas fundamentales

### 1. **Backend en Node.js + Express**
**Por qué**:
- JavaScript full-stack (mismo lenguaje frontend/backend)
- Ecosistema maduro con npm
- Fácil de deployar (Render, Heroku, etc.)
- Buen soporte para async/await
- Pool de conexiones a Postgres simple

### 2. **PostgreSQL como base de datos**
**Por qué**:
- SQL relacional para integridad de datos
- JSON/JSONB para flexibilidad
- Triggers para lógica de negocio
- Gratuito y open source
- Excelente soporte en hosting

### 3. **JWT para autenticación**
**Por qué**:
- Stateless (no requiere sesiones en servidor)
- Portable (funciona en SPA, mobile, etc.)
- Incluye claims (roles, permisos)
- Estándar de industria

### 4. **Frontend estático HTML/CSS/JS**
**Por qué**:
- Sin build tools necesarios
- Servido directamente desde Express
- Fácil de mantener
- No requiere React/Vue/Angular
- Más rápido para MVP

### 5. **Sistema de roles desde día 1**
**Por qué**:
- Separación de responsabilidades clara
- SUPER: control total
- ADMIN/Director: gestión de grupos
- ACTOR: vista limitada
- Escalable a más roles

---

## 🛠️ Implementación técnica

### Estructura de directorios creada
```
Entradas_de_teatro/
├── teatro-tickets-backend/
│   ├── index.js (servidor Express)
│   ├── db.js (conexión Postgres)
│   ├── auth/
│   │   ├── middleware.js (verificación JWT)
│   │   └── routes.js (login/registro)
│   ├── routes/
│   │   ├── users.js
│   │   ├── grupos.js
│   │   └── funciones.js
│   ├── public/
│   │   ├── index.html
│   │   ├── login.html
│   │   └── css/main.css
│   └── package.json
└── README.md
```

### Schema de base de datos inicial
```sql
CREATE TABLE users (
  cedula VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR')),
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);
```

### Sistema de autenticación
```javascript
// Login endpoint
POST /api/auth/login
{
  "cedula": "48376669",
  "password": "Teamomama91"
}
// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "cedula": "48376669",
    "name": "Super Baco",
    "role": "SUPER"
  }
}

// Middleware de verificación
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}
```

---

## 📊 Tecnologías elegidas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 18+ | Runtime backend |
| Express | 4.x | Framework web |
| PostgreSQL | 15 | Base de datos |
| pg (node-postgres) | 8.x | Driver de DB |
| bcrypt | 5.x | Hash de passwords |
| jsonwebtoken | 9.x | Autenticación JWT |
| cors | 2.x | CORS middleware |

---

## 🧪 Testing inicial

### Usuarios creados
1. **SUPER**: cédula `48376669` / password `Teamomama91`
2. **ADMIN**: cédula `48376668` / password `admin123`
3. **ACTOR**: cédula `48376667` / password `admin123`

### Endpoints funcionales
```bash
# Health check
GET /health
→ { "status": "ok", "database": "connected" }

# Login
POST /api/auth/login
→ { "token": "...", "user": {...} }

# Perfil (autenticado)
GET /api/auth/perfil
Headers: Authorization: Bearer <token>
→ { "cedula": "...", "name": "...", "role": "..." }

# Listar usuarios (solo SUPER)
GET /api/users
Headers: Authorization: Bearer <token>
→ [{ "cedula": "...", "name": "...", "role": "..." }, ...]
```

---

## ✅ Criterios de éxito cumplidos

- [x] Servidor Express corriendo en puerto configurable
- [x] Conexión a PostgreSQL funcional
- [x] Tabla `users` creada con roles
- [x] Sistema de login con JWT
- [x] Middleware de autenticación
- [x] CORS configurado
- [x] 3 usuarios base creados
- [x] Frontend básico con login
- [x] Health check endpoint
- [x] Variables de entorno (.env)

---

## 🚧 Limitaciones conocidas

### 1. **No hay registro público**
Solo el SUPER puede crear usuarios. Decisión de diseño para control de acceso.

### 2. **Passwords en texto en código**
Los usuarios base se crean con passwords hardcoded. Aceptable para MVP.

### 3. **Sin recuperación de password**
No hay flujo de "olvidé mi contraseña". Futuro PASO.

### 4. **JWT sin refresh token**
Token expira y requiere re-login. Aceptable para MVP.

### 5. **Frontend sin routing**
Páginas HTML separadas sin SPA routing. Aceptable para inicio.

---

## 📈 Próximos pasos habilitados

Con PASO 1 completo, se habilita:
- **PASO 2**: Gestión de grupos teatrales
- **PASO 3**: Sistema de funciones y obras
- **PASO 4**: Refactor de arquitectura (grupos → obras → funciones)
- Cualquier módulo que requiera autenticación y roles

---

## 🎓 Lecciones aprendadas

### 1. **Roles desde día 1 es crítico**
Refactorizar permisos después es muy costoso. Definirlos al inicio simplifica todo.

### 2. **JWT simplifica deployment**
No tener sesiones en servidor hace el deploy mucho más simple (stateless).

### 3. **Postgres pool evita problemas**
Usar pool de conexiones desde el inicio previene leaks y timeouts.

### 4. **Variables de entorno obligatorias**
DATABASE_URL, JWT_SECRET, PORT deben ser configurables desde env vars.

### 5. **Health check es esencial**
Permite monitoreo, debugging y verificación rápida de estado.

---

## 🔗 Referencias

- **Express**: https://expressjs.com/
- **node-postgres**: https://node-postgres.com/
- **JWT**: https://jwt.io/
- **bcrypt**: https://www.npmjs.com/package/bcrypt

---

**Estado final**: ✅ Fundación técnica sólida con autenticación, roles y API REST funcional
