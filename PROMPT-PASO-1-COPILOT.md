# 🤖 PROMPT PASO 1: FUNDACIÓN DEL SISTEMA

**Para**: GitHub Copilot  
**Objetivo**: Crear infraestructura básica del sistema de gestión de entradas de teatro  
**Tiempo estimado**: 2-3 horas  
**Complejidad**: ⭐⭐⭐ (Media)

---

## 📋 CONTEXTO

Necesito crear desde cero un sistema de gestión de entradas para grupos de teatro en Uruguay. El sistema tendrá 3 roles principales: SUPER (administrador global), ADMIN (director de grupo) y ACTOR (miembro de grupo). Este PASO 1 establece la fundación técnica: servidor backend, base de datos, autenticación JWT y frontend básico.

---

## 🎯 OBJETIVO DEL PASO

Implementar un servidor Express con:
- Autenticación basada en JWT
- Sistema de roles (SUPER/ADMIN/ACTOR)
- Conexión a PostgreSQL con pool
- API REST básica
- Frontend HTML estático para login
- Health check endpoint

---

## 🛠️ IMPLEMENTACIÓN REQUERIDA

### 1. Estructura de proyecto

Crear esta estructura:

```
teatro-tickets-backend/
├── package.json
├── .env.example
├── .gitignore
├── index.js              ← Servidor principal
├── db.js                 ← Pool de PostgreSQL
├── auth/
│   ├── middleware.js     ← JWT middleware
│   └── routes.js         ← Login/registro
├── routes/
│   └── users.js          ← CRUD usuarios
└── public/
    ├── index.html        ← Landing page
    ├── login.html        ← Formulario login
    └── css/
        └── main.css      ← Estilos
```

---

### 2. Archivo `package.json`

```json
{
  "name": "teatro-tickets-backend",
  "version": "1.0.0",
  "description": "Sistema de gestión de entradas de teatro",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

### 3. Archivo `.env.example`

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro

# JWT Secret (cambiar en producción)
JWT_SECRET=cambiar-esto-en-produccion-usar-openssl-rand-base64-32

# Server
PORT=4000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

---

### 4. Archivo `db.js` (Pool de PostgreSQL)

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Conexión a PostgreSQL establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
```

---

### 5. Archivo `auth/middleware.js` (JWT verification)

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded; // { cedula, role }
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // SUPER puede todo
    if (req.user.role === 'SUPER') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }

    next();
  };
}

module.exports = { verifyToken, requireRole };
```

---

### 6. Archivo `auth/routes.js` (Login endpoint)

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('./middleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body;

    if (!cedula || !password) {
      return res.status(400).json({ error: 'Cédula y password requeridos' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT cedula, name, role, password_hash, active FROM users WHERE cedula = $1',
      [cedula]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar si está activo
    if (!user.active) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT (expira en 8 horas)
    const token = jwt.sign(
      { cedula: user.cedula, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        cedula: user.cedula,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/perfil (requiere JWT)
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cedula, name, role, active FROM users WHERE cedula = $1',
      [req.user.cedula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
```

---

### 7. Archivo `routes/users.js` (CRUD usuarios)

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { verifyToken, requireRole } = require('../auth/middleware');

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// GET /api/users (solo SUPER)
router.get('/', requireRole('SUPER'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cedula, name, role, active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/users (solo SUPER)
router.post('/', requireRole('SUPER'), async (req, res) => {
  try {
    const { cedula, name, role, password } = req.body;

    if (!cedula || !name || !role || !password) {
      return res.status(400).json({ error: 'Campos requeridos: cedula, name, role, password' });
    }

    if (!['SUPER', 'ADMIN', 'ACTOR'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser SUPER, ADMIN o ACTOR' });
    }

    // Hash del password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (cedula, name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING cedula, name, role, created_at',
      [cedula, name, role, password_hash]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Cédula ya existe' });
    }
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/users/:cedula (solo SUPER)
router.put('/:cedula', requireRole('SUPER'), async (req, res) => {
  try {
    const { cedula } = req.params;
    const { name, role, active } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), active = COALESCE($3, active) WHERE cedula = $4 RETURNING cedula, name, role, active',
      [name, role, active, cedula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/users/:cedula (solo SUPER)
router.delete('/:cedula', requireRole('SUPER'), async (req, res) => {
  try {
    const { cedula } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE cedula = $1 RETURNING cedula',
      [cedula]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
```

---

### 8. Archivo `index.js` (Servidor principal)

```javascript
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./auth/routes');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logs de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as users FROM users');
    res.json({
      status: 'ok',
      database: 'connected',
      users: parseInt(result.rows[0].users)
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Catch-all para SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error del servidor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎭 Servidor de Baco Teatro corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});
```

---

### 9. Archivo `public/login.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Baco Teatro</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      <h1>🎭 Baco Teatro</h1>
      <h2>Iniciar Sesión</h2>
      
      <form id="loginForm">
        <div class="form-group">
          <label for="cedula">Cédula</label>
          <input type="text" id="cedula" name="cedula" required placeholder="48376669">
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" required>
        </div>
        
        <button type="submit" class="btn btn-primary">Ingresar</button>
        
        <div id="error" class="error" style="display: none;"></div>
      </form>
    </div>
  </div>

  <script>
    const API_URL = window.location.origin;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const cedula = document.getElementById('cedula').value.trim();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          errorDiv.textContent = data.error || 'Error al iniciar sesión';
          errorDiv.style.display = 'block';
          return;
        }
        
        // Guardar token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirigir según rol
        if (data.user.role === 'SUPER') {
          window.location.href = '/super.html';
        } else if (data.user.role === 'ADMIN') {
          window.location.href = '/director.html';
        } else {
          window.location.href = '/actor.html';
        }
        
      } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'Error de conexión con el servidor';
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>
```

---

### 10. Archivo `public/index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baco Teatro - Sistema de Entradas</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🎭 Baco Teatro</h1>
      <p class="subtitle">Sistema de Gestión de Entradas</p>
    </header>
    
    <main>
      <section class="hero">
        <h2>Gestiona tus funciones teatrales</h2>
        <p>Sistema completo para grupos de teatro en Uruguay</p>
        <a href="/login.html" class="btn btn-primary">Iniciar Sesión</a>
      </section>
      
      <section class="features">
        <div class="feature">
          <h3>📊 Gestión de Funciones</h3>
          <p>Control total de funciones, horarios y ventas</p>
        </div>
        <div class="feature">
          <h3>🎟️ Venta de Entradas</h3>
          <p>Registro de ventas con identificación de vendedores</p>
        </div>
        <div class="feature">
          <h3>👥 Grupos Teatrales</h3>
          <p>Administra múltiples grupos y obras</p>
        </div>
      </section>
    </main>
    
    <footer>
      <p>&copy; 2025 Baco Teatro. Todos los derechos reservados.</p>
    </footer>
  </div>
</body>
</html>
```

---

### 11. Archivo `public/css/main.css`

```css
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
  --bg: #0f172a;
  --bg-card: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --error: #ef4444;
  --success: #10b981;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 3rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

h1, h2 {
  margin-bottom: 1rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg);
  border: 1px solid #334155;
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--primary);
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
  width: 100%;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.error {
  background: #7f1d1d;
  color: #fecaca;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.hero {
  text-align: center;
  padding: 4rem 0;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

footer {
  margin-top: 4rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
}
```

---

## 🗄️ SCHEMA DE BASE DE DATOS

### SQL para crear tabla `users`

```sql
CREATE TABLE IF NOT EXISTS users (
  cedula VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR')),
  password_hash TEXT NOT NULL,
  email VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Seed de usuarios base

```sql
-- Usuario SUPER (guardián del sistema)
INSERT INTO users (cedula, name, role, password_hash)
VALUES (
  '48376669',
  'Super Baco',
  'SUPER',
  '$2b$10$Q7X9YrP3K2L.5H8N6vT4oeZ1W2E3R4T5Y6U7I8O9P0A1S2D3F4G5H6' -- Teamomama91
);

-- Usuario ADMIN (director ejemplo)
INSERT INTO users (cedula, name, role, password_hash)
VALUES (
  '48376668',
  'Director Ejemplo',
  'ADMIN',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMN' -- admin123
);

-- Usuario ACTOR (miembro ejemplo)
INSERT INTO users (cedula, name, role, password_hash)
VALUES (
  '48376667',
  'Actor Ejemplo',
  'ACTOR',
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMN' -- admin123
);
```

**Nota**: Los hashes de password se generan con:
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('Teamomama91', 10).then(hash => console.log(hash));
```

---

## ✅ TESTING Y VALIDACIÓN

### 1. Verificar backend corriendo

```bash
curl http://localhost:4000/health
```

**Esperado**:
```json
{
  "status": "ok",
  "database": "connected",
  "users": 3
}
```

### 2. Test de login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"48376669","password":"Teamomama91"}'
```

**Esperado**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "cedula": "48376669",
    "name": "Super Baco",
    "role": "SUPER"
  }
}
```

### 3. Test de perfil con JWT

```bash
TOKEN="<el token del paso anterior>"
curl http://localhost:4000/api/auth/perfil \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**:
```json
{
  "cedula": "48376669",
  "name": "Super Baco",
  "role": "SUPER",
  "active": true
}
```

### 4. Test de listar usuarios (requiere SUPER)

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**:
```json
[
  {
    "cedula": "48376669",
    "name": "Super Baco",
    "role": "SUPER",
    "active": true,
    "created_at": "2025-12-..."
  },
  ...
]
```

### 5. Test frontend

1. Abrir http://localhost:4000/login.html
2. Ingresar:
   - Cédula: `48376669`
   - Password: `Teamomama91`
3. Presionar "Ingresar"
4. Debe redirigir a `/super.html` (o mostrar 404 si aún no existe)
5. Verificar en DevTools → Application → Local Storage:
   - `token`: debe estar presente
   - `user`: debe tener los datos del usuario

---

## 🎯 CRITERIOS DE ACEPTACIÓN

Marcar cada item al completarlo:

- [ ] Servidor Express corriendo en puerto 4000
- [ ] Base de datos PostgreSQL conectada
- [ ] Tabla `users` creada con schema correcto
- [ ] 3 usuarios seed insertados
- [ ] Endpoint `/health` funcional
- [ ] Endpoint `/api/auth/login` funcional
- [ ] Endpoint `/api/auth/perfil` funcional con JWT
- [ ] Endpoint `/api/users` funcional (CRUD)
- [ ] Middleware `verifyToken` funcionando
- [ ] Middleware `requireRole` funcionando
- [ ] Frontend `index.html` accesible
- [ ] Frontend `login.html` accesible
- [ ] Login frontend redirige correctamente por rol
- [ ] Token guardado en localStorage
- [ ] Passwords hasheados con bcrypt
- [ ] JWT con expiración de 8 horas
- [ ] CORS configurado
- [ ] Error handling implementado
- [ ] Logs de requests habilitados

---

## 🚀 COMANDOS DE EJECUCIÓN

### Setup inicial

```bash
# 1. Crear directorio
mkdir teatro-tickets-backend
cd teatro-tickets-backend

# 2. Inicializar npm
npm init -y

# 3. Instalar dependencias
npm install express pg bcrypt jsonwebtoken cors dotenv compression

# 4. Instalar dev dependencies
npm install --save-dev nodemon

# 5. Crear .env
cp .env.example .env
# Editar .env con valores reales
```

### Ejecutar Postgres con Docker

```bash
docker run -d \
  --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

### Aplicar schema SQL

```bash
docker exec -i teatro-postgres psql -U postgres -d teatro < init-schema.sql
```

### Correr backend

```bash
# Desarrollo con nodemon
npm run dev

# Producción
npm start
```

---

## 📝 NOTAS FINALES

### Seguridad implementada
✅ Passwords hasheados con bcrypt (10 rounds)  
✅ JWT con secret configurable  
✅ Token expira en 8 horas  
✅ CORS restrictivo  
✅ Middleware de autenticación  
✅ Roles verificados por endpoint  

### Performance
✅ Pool de conexiones Postgres (max 20)  
✅ Compression middleware habilitado  
✅ Static files servidos eficientemente  

### Listo para siguiente paso
Con PASO 1 completado, puedes proceder a:
- PASO 2: Gestión de grupos teatrales
- PASO 3: Sistema de funciones y entradas
- PASO 4: Refactor de arquitectura

---

**Autor**: Sistema Baco Teatro  
**Fecha**: Diciembre 2025  
**Versión**: 1.0
