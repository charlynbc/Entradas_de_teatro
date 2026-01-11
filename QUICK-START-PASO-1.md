# ⚡ QUICK START: PASO 1 - Fundación del Sistema

**Objetivo**: Levantar backend con autenticación JWT en 45 minutos  
**Complejidad**: ⭐⭐⭐ Media  
**Prerequisitos**: Node.js 18+, PostgreSQL 15+, Docker

---

## 🎯 Lo que vas a construir

- ✅ Backend Express con JWT
- ✅ Base de datos PostgreSQL
- ✅ Sistema de roles (SUPER/ADMIN/ACTOR)
- ✅ API REST protegida
- ✅ Frontend HTML básico

---

## ⏱️ Timeline (45 minutos)

| Tiempo | Actividad | Checkpoint |
|--------|-----------|------------|
| 0-10 min | Setup inicial | Backend instalado |
| 10-20 min | Database + schema | Postgres corriendo |
| 20-30 min | Autenticación JWT | Login funcional |
| 30-40 min | Frontend básico | Login UI funcional |
| 40-45 min | Testing | Todo verificado ✅ |

---

## 📋 PASO A PASO

### 🔹 Minuto 0-10: Setup inicial

#### 1. Crear proyecto

```bash
cd /workspaces/Entradas_de_teatro
mkdir -p teatro-tickets-backend/auth
mkdir -p teatro-tickets-backend/routes
mkdir -p teatro-tickets-backend/public/css
cd teatro-tickets-backend
```

#### 2. Crear `package.json`

```bash
cat > package.json << 'EOF'
{
  "name": "teatro-tickets-backend",
  "version": "1.0.0",
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
EOF
```

#### 3. Instalar dependencias

```bash
npm install
```

**✅ Checkpoint**: Debe aparecer `node_modules/` y `package-lock.json`

---

### 🔹 Minuto 10-20: Database

#### 4. Levantar PostgreSQL con Docker

```bash
docker rm -f teatro-postgres || true
docker run -d \
  --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

**Esperar 5 segundos** para que Postgres inicie.

#### 5. Crear archivo `.env`

```bash
cat > .env << 'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
JWT_SECRET=baco-teatro-secret-cambiar-en-produccion-2025
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOF
```

#### 6. Crear schema SQL

```bash
cat > init-schema.sql << 'EOF'
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

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Seed usuario SUPER
INSERT INTO users (cedula, name, role, password_hash)
VALUES ('48376669', 'Super Baco', 'SUPER', '$2b$10$YourHashHere')
ON CONFLICT (cedula) DO NOTHING;
EOF
```

#### 7. Aplicar schema

```bash
docker exec -i teatro-postgres psql -U postgres -d teatro < init-schema.sql
```

**✅ Checkpoint**: Ejecutar `docker exec teatro-postgres psql -U postgres -d teatro -c "\dt"` debe mostrar tabla `users`.

---

### 🔹 Minuto 20-30: Backend con JWT

#### 8. Crear `db.js`

```bash
cat > db.js << 'EOF'
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
  console.error('❌ Error en pool:', err);
  process.exit(-1);
});

module.exports = pool;
EOF
```

#### 9. Crear `auth/middleware.js`

```bash
cat > auth/middleware.js << 'EOF'
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.user.role === 'SUPER' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ error: 'Sin permisos' });
  };
}

module.exports = { verifyToken, requireRole };
EOF
```

#### 10. Crear `auth/routes.js`

```bash
cat > auth/routes.js << 'EOF'
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('./middleware');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { cedula, password } = req.body;

    if (!cedula || !password) {
      return res.status(400).json({ error: 'Cédula y password requeridos' });
    }

    const result = await pool.query(
      'SELECT cedula, name, role, password_hash, active FROM users WHERE cedula = $1',
      [cedula]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { cedula: user.cedula, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { cedula: user.cedula, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

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
EOF
```

#### 11. Crear `routes/users.js`

```bash
cat > routes/users.js << 'EOF'
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { verifyToken, requireRole } = require('../auth/middleware');

const router = express.Router();
router.use(verifyToken);

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

router.post('/', requireRole('SUPER'), async (req, res) => {
  try {
    const { cedula, name, role, password } = req.body;

    if (!cedula || !name || !role || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!['SUPER', 'ADMIN', 'ACTOR'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (cedula, name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING cedula, name, role',
      [cedula, name, role, password_hash]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cédula ya existe' });
    }
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
EOF
```

#### 12. Crear `index.js` (servidor principal)

```bash
cat > index.js << 'EOF'
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

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

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
      database: 'disconnected'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🎭 Servidor Baco Teatro en puerto ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});
EOF
```

**✅ Checkpoint**: Ejecutar `node index.js` debe mostrar "Servidor Baco Teatro en puerto 4000".

---

### 🔹 Minuto 30-40: Frontend básico

#### 13. Crear `public/index.html`

```bash
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baco Teatro</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="container">
    <h1>🎭 Baco Teatro</h1>
    <p>Sistema de Gestión de Entradas</p>
    <a href="/login.html" class="btn">Iniciar Sesión</a>
  </div>
</body>
</html>
EOF
```

#### 14. Crear `public/login.html`

```bash
cat > public/login.html << 'EOF'
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
          <input type="text" id="cedula" required placeholder="48376669">
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" required>
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
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'SUPER') {
          window.location.href = '/super.html';
        } else if (data.user.role === 'ADMIN') {
          window.location.href = '/director.html';
        } else {
          window.location.href = '/actor.html';
        }
        
      } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'Error de conexión';
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>
EOF
```

#### 15. Crear `public/css/main.css`

```bash
cat > public/css/main.css << 'EOF'
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
  --bg: #0f172a;
  --bg-card: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
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
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
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
EOF
```

---

### 🔹 Minuto 40-45: Testing final

#### 16. Generar hash de password para usuario SUPER

```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('Teamomama91', 10).then(hash => {
  console.log('Hash generado:');
  console.log(hash);
  console.log('\nEjecutar SQL:');
  console.log(\"UPDATE users SET password_hash = '\"+hash+\"' WHERE cedula = '48376669';\");
});
"
```

Copiar el comando SQL que muestra y ejecutar:

```bash
docker exec teatro-postgres psql -U postgres -d teatro -c "UPDATE users SET password_hash = '<el hash generado>' WHERE cedula = '48376669';"
```

#### 17. Iniciar backend

```bash
npm run dev
```

**Debe mostrar**:
```
✅ Conexión a PostgreSQL establecida
🎭 Servidor Baco Teatro en puerto 4000
📍 Health: http://localhost:4000/health
```

#### 18. Probar health check

```bash
# En otra terminal
curl http://localhost:4000/health
```

**Esperado**:
```json
{"status":"ok","database":"connected","users":1}
```

#### 19. Probar login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"48376669","password":"Teamomama91"}'
```

**Esperado**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "cedula": "48376669",
    "name": "Super Baco",
    "role": "SUPER"
  }
}
```

#### 20. Probar frontend

Abrir navegador en: http://localhost:4000/login.html

1. Ingresar:
   - Cédula: `48376669`
   - Password: `Teamomama91`
2. Presionar "Ingresar"
3. Debe intentar redirigir a `/super.html`
4. Abrir DevTools → Application → Local Storage → http://localhost:4000
5. Verificar:
   - `token`: existe
   - `user`: `{"cedula":"48376669","name":"Super Baco","role":"SUPER"}`

---

## ✅ CHECKLIST FINAL

Verificar que todo esté completo:

- [ ] Backend corriendo en puerto 4000
- [ ] Postgres container corriendo
- [ ] Tabla `users` existe
- [ ] Usuario SUPER con hash correcto
- [ ] `/health` responde OK
- [ ] `/api/auth/login` genera JWT válido
- [ ] `/api/auth/perfil` funciona con JWT
- [ ] Frontend login.html carga
- [ ] Login funciona y guarda token
- [ ] Token visible en localStorage

---

## 🐛 TROUBLESHOOTING

### Error: "ECONNREFUSED localhost:5432"

**Causa**: Postgres no está corriendo.

**Solución**:
```bash
docker start teatro-postgres
# O recrear:
docker rm -f teatro-postgres
docker run -d --name teatro-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=teatro -p 5432:5432 postgres:15
```

### Error: "Credenciales inválidas"

**Causa**: Hash de password no coincide.

**Solución**: Regenerar hash (paso 16) y actualizar BD.

### Error: "jwt malformed"

**Causa**: Token no está en formato correcto o no se está enviando.

**Solución**: Verificar header `Authorization: Bearer <token>` en la request.

### Frontend muestra "Error de conexión"

**Causa**: Backend no está corriendo.

**Solución**:
```bash
cd teatro-tickets-backend
npm run dev
```

---

## 🎉 ¡COMPLETADO!

Has creado con éxito:

✅ Backend Express con autenticación JWT  
✅ Base de datos PostgreSQL con usuarios  
✅ Sistema de roles funcional  
✅ API REST protegida  
✅ Frontend básico con login  

**Próximo paso**: PASO 2 - Gestión de grupos teatrales

---

**Tiempo total**: ~45 minutos  
**Complejidad**: ⭐⭐⭐ Media  
**Estado**: ✅ COMPLETADO
