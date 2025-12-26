# Costos y licenciamiento (estimaciones 2025)

## Sistema Implementado: Baco Teatro

Sistema completo de gestión de teatro con:
- ✅ Gestión de usuarios (SUPER, DIRECTOR, VENDEDOR, ADMIN, INVITADO)
- ✅ Gestión de grupos teatrales con directores
- ✅ Gestión de ensayos con asistencia
- ✅ Gestión de obras por grupo
- ✅ Gestión de funciones (shows) con entradas
- ✅ Sistema de tickets con QR
- ✅ Transferencias de entradas entre usuarios
- ✅ Cierre de funciones con evaluación y PDF
- ✅ Finalización de grupos con conclusión y PDF
- ✅ Reportes y estadísticas completas
- ✅ Frontend React Native Web (multiplataforma)
- ✅ Backend Node.js + Express + PostgreSQL
- ✅ Sistema de fotos para grupos y funciones

Estas cifras son orientativas y dependen del uso y el proveedor.

## Costos de operación (mensual)
- Hosting Backend (Render/Railway/Fly.io):
  - Plan Starter/Basic: ~US$7–15
  - Plan con autoescalado: ~US$25–50
- Base de Datos PostgreSQL (Render/Neon/Supabase):
  - Starter: ~US$7–15
  - Standard (mayor RAM/almacenamiento): ~US$25–50
- Almacenamiento de fotos (S3/Cloudinary):
  - Gratis hasta ~5GB o ~US$5–15/mes
- Dominio (anual): ~US$10–20 (prorrateado: ~US$1–2/mes)
- Correo transaccional (SendGrid/Mailgun) - opcional:
  - Gratis limitado o ~US$15–35 (según volumen)
- WhatsApp Business API (opcional):
  - Meta fees + proveedor (Twilio/360Dialog), puede variar US$25–100+

Ejemplo OPEX mensual (bajo uso): US$25–60
Ejemplo OPEX mensual (uso medio): US$60–150

## Precio de venta actual (propuesta)

### Sistema Completo Implementado
El sistema incluye:
- Gestión completa de usuarios con 5 roles
- Sistema de grupos teatrales con directores
- Gestión de ensayos y asistencia
- Gestión de obras y funciones
- Emisión de tickets con QR
- Transferencias de entradas
- Cierre de funciones con evaluación (1-10) y PDF
- Finalización de grupos con conclusión y PDF
- Reportes estadísticos completos
- Frontend multiplataforma (Web/iOS/Android)
- Sistema de fotos para grupos y funciones

### Modalidades de Venta

**Licencia Única (On-Premise)**
- Básico (one-off): US$3,500–5,500
  - Sistema completo implementado
  - Instalación en servidor del cliente
  - Capacitación de 4 horas
  - 30 días de soporte post-instalación
  - 1 ronda de ajustes menores

**Licencia + Mantenimiento**
- Instalación: US$3,500–5,500
- Mantenimiento: US$99–199/mes
  - Hosting y base de datos incluidos
  - Backups automáticos diarios
  - Monitoreo 24/7
  - Parches de seguridad
  - Soporte por email (48h respuesta)
  - 2 horas/mes de ajustes incluidas

**Plan Pro (Empresarial)**
- Instalación: US$6,500–10,000
  - Personalización de marca (colores, logos)
  - Reportes personalizados adicionales
  - Integración WhatsApp Business API
  - Capacitación extendida (8 horas)
  - Handoff completo con documentación
- Mantenimiento Pro: US$249–399/mes
  - Todo lo del plan básico
  - Soporte prioritario (24h respuesta)
  - 8 horas/mes de desarrollo incluidas
  - SLA 99.5% uptime

**SaaS Multi-Tenant**
- Sin fee inicial o setup reducido: US$500–1,200
- Por organización: US$149–299/mes
  - Hasta 10 grupos teatrales
  - Hasta 100 usuarios
  - 50GB almacenamiento de fotos
  - Reportes estándar
  - Soporte por email
- Organización Plus: US$399–599/mes
  - Grupos ilimitados
  - Usuarios ilimitados
  - 200GB almacenamiento
  - Reportes personalizados
  - Soporte prioritario
  - WhatsApp Business API incluido

**Servicios Adicionales**
- Integración WhatsApp: US$800–1,500 (one-time)
- Migración de datos: US$500–2,000 (según volumen)
- Capacitación adicional: US$120–180/hora
- Desarrollo de features custom: US$80–150/hora
- Consultoría técnica: US$100–200/hora

Nota: Si se integra WhatsApp Business API, emailing transaccional a escala o autoescalado, sumar OPEX correspondiente (ver secciones arriba).

## Costos de puesta en marcha (one-off)
- Setup e infraestructura (provisión Render, DB, dominios, CI/CD): 6–12 horas
- Ajustes de marca y contenidos iniciales: 4–10 horas
- Capacitación básica: 2–4 horas

Total estimado setup: 12–26 horas (según alcance y personalización)

## Modalidades de licenciamiento sugeridas
- Licencia propietaria por instalación (un solo cliente):
  - Fee de setup + mantenimiento mensual.
- Licencia SaaS multi-cliente:
  - Fee mensual por organización + límites por usuarios/volumen.
- Soporte:
  - Bolsa de horas mensual o bajo demanda.

## Precios de referencia (ejemplo)
- Plan Básico (1 sede, bajo volumen):
  - Setup: US$600–1,200
  - Mensual: US$39–99 (incluye hosting básico y soporte limitado)
- Plan Pro (múltiples sedes, reportes avanzados):
  - Setup: US$1,200–2,500
  - Mensual: US$99–249 (hosting estándar + soporte ampliado)
- Plan Enterprise (personalizaciones, SLA):
  - A convenir (cotización según requisitos)

## Consideraciones
- Las cifras no incluyen impuestos ni comisiones de pasarela de pago.
- Optimizar costos con monitoreo de uso real y escalado ajustado.
- Mantener copias de seguridad y políticas de seguridad activas.

---

## Anexo: Diagnóstico rápido de “failed al iniciar sesión”
- Verificar origen y CORS:
  - Asegura que el backend permita el origen `https://*.app.github.dev` y el puerto `3000`.
  - En cookies de sesión/JWT: `SameSite=None`, `Secure=true`, dominio acorde al subdominio de Codespaces.
- Variables de entorno mínimas:
  - `JWT_SECRET` definido y consistente entre emisión y verificación.
  - `DATABASE_URL`/credenciales correctas y accesibles desde el contenedor.
  - URLs de `FRONTEND_URL` y `BACKEND_URL` apuntando a `*.app.github.dev` con el puerto correcto.
- Pruebas rápidas:
  - `curl -i -X POST https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"pass"}'`
  - Revisar respuesta y encabezados `Set-Cookie`/token.
- Logs y errores típicos:
  - 401/403: credenciales inválidas o firma JWT incorrecta.
  - 400: payload faltante (`email`, `password`) o validación.
  - CORS: falta de `Access-Control-Allow-Origin` y `Allow-Credentials`.
- Checklist de servidor:
  - Habilitar `credentials: true` en CORS si usas cookies.
  - En Express: `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'none' })`.
  - Asegura que el middleware de auth lee el token desde `Authorization: Bearer` o cookie, según diseño.
- Entorno Codespaces:
  - Usa URLs completas del servicio (no `localhost`) para redirecciones OAuth y callbacks.
  - Reinicia el servicio tras cambios y limpia cookies del navegador antes de reintentar.

---

## Anexo: Solución de “failed to fetch”
Causas comunes:
- CORS bloqueado: origen `https://*.app.github.dev` no permitido o falta `credentials`.
- URL incorrecta: el frontend apunta a `localhost` en vez de `*.app.github.dev:3000`.
- Cookies/Token no enviados: `fetch` sin `credentials: 'include'` o sin header `Authorization`.
- HTTP/HTTPS mixto: peticiones http desde página https (bloqueadas).
- Puerto/servidor no expuesto o caído: proceso no escucha o healthcheck falla.

Cliente (React/TS) — asegura envío de credenciales y URL correcta:
```ts
const API_URL = process.env.REACT_APP_API_URL ?? 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';
async function apiFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    credentials: 'include', // enviar cookies
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}
// Login:
apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
```

Servidor (Express) — CORS y cookies para Codespaces:
```js
import cors from 'cors';
import cookieParser from 'cookie-parser';
const origin = 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';
app.use(cors({ origin, credentials: true }));
app.use(cookieParser());
// Al emitir cookie JWT:
res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'none' });
```

Comprobaciones rápidas:
- curl -I https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/api/health → debe responder 200.
- En Network del navegador, la request debe mostrar `Access-Control-Allow-Origin` y `Set-Cookie` (si aplica).
- Evita `http://` en cualquier endpoint; usa siempre `https://*.app.github.dev`.
- Si usas header Bearer: `Authorization: Bearer <token>` y valida su lectura en middleware.
---

## Anexo: Acceso con diferentes usuarios (roles)
Suposiciones:
- Entorno Codespaces (`https://*.app.github.dev`) y servidor en puerto 3000.
- Autenticación con JWT y cookies httpOnly (o header Bearer).

Backend (Express) — emisión de JWT con rol y protección por roles:
```js
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const ORIGIN = 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  // ...validar input, buscar usuario, verificar hash...
  const user = /* ...fetch user from DB... */ { id: 'u1', email, role: 'admin' }; // ejemplo
  // ...si password ok...
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ ok: true });
});

// Middleware de auth
function auth(req, res, next) {
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;
  if (!raw) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(raw, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

// Middleware de rol
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
  next();
};

// Perfil actual
app.get('/auth/me', auth, (req, res) => {
  res.json({ id: req.user.sub, email: req.user.email, role: req.user.role });
});

// Logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token', { secure: true, sameSite: 'none' });
  res.json({ ok: true });
});

// Ejemplo de rutas protegidas por rol
app.get('/admin/reportes', auth, requireRole('admin'), (req, res) => {
  // ...contenido admin...
  res.json({ data: [] });
});
app.post('/ventas/orden', auth, requireRole('vendedor', 'admin'), (req, res) => {
  // ...crear orden...
  res.status(201).json({ ok: true });
});
```

Frontend (React/TS) — sesión y control por rol:
```ts
const API_URL = process.env.REACT_APP_API_URL ?? 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';

async function api(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

export async function login(email: string, password: string) {
  const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('login_failed');
  return me();
}

export async function me() {
  const res = await api('/auth/me');
  if (!res.ok) throw new Error('unauthenticated');
  return res.json(); // { id, email, role }
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' });
}

// Ejemplo de guard de ruta/comp:
function Can({ roles, children }: { roles: string[]; children: any }) {
  // ...hook de sesión que llama a me() y guarda user...
  const user = /* ...estado global... */ { role: 'admin' }; // ejemplo
  if (!user || !roles.includes(user.role)) return null;
  return children;
}

// Uso:
// <Can roles={['admin']}><AdminPanel /></Can>
// <Can roles={['vendedor','admin']}><Ventas /></Can>
```

Checklist de pruebas (usuarios):
- Crear al menos 3 usuarios en DB: admin, vendedor, cliente con contraseñas hasheadas (bcrypt).
- Validar login de cada usuario y llamada a /auth/me retorna rol correcto.
- Acceso:
  - admin: puede acceder a /admin/reportes.
  - vendedor: puede crear /ventas/orden pero no /admin/reportes.
  - cliente: acceso limitado a sus recursos.
- Limpiar cookies y reintentar si cambia de usuario.
- Verificar que todas las peticiones se realizan a `https://*.app.github.dev` con `credentials: 'include'`.
---

## Anexo: Implementación completa de acceso multiusuario (hazlo todo)
Suposiciones:
- Backend en Express con JWT y cookies httpOnly.
- Entorno Codespaces `https://*.app.github.dev` (puerto 3000).
- Tres roles: `admin`, `vendedor`, `cliente`.

Backend (Express) — auth, roles y rutas:
```js
import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';

// Config
const ORIGIN = 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'; // usa env en prod
const app = express();
app.use(express.json());
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());

// Seed de usuarios en memoria (reemplaza con DB en prod)
const users = [
  { id: 'u_admin', email: 'admin@example.com', role: 'admin', passwordHash: bcrypt.hashSync('admin123', 10) },
  { id: 'u_vendedor', email: 'vend@example.com', role: 'vendedor', passwordHash: bcrypt.hashSync('vend123', 10) },
  { id: 'u_cliente', email: 'cli@example.com', role: 'cliente', passwordHash: bcrypt.hashSync('cli123', 10) },
];

// Utilidades
function sign(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
}
function auth(req, res, next) {
  const h = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const raw = h?.startsWith('Bearer ') ? h.slice(7) : cookieToken;
  if (!raw) return res.status(401).json({ error: 'unauthorized' });
  try { req.user = jwt.verify(raw, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'invalid_token' }); }
}
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
  next();
};

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
  const token = sign(user);
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ ok: true });
});

// Perfil actual
app.get('/auth/me', auth, (req, res) => {
  res.json({ id: req.user.sub, email: req.user.email, role: req.user.role });
});

// Logout
app.post('/auth/logout', (_req, res) => {
  res.clearCookie('token', { secure: true, sameSite: 'none' });
  res.json({ ok: true });
});

// Rutas protegidas por rol
app.get('/admin/reportes', auth, requireRole('admin'), (_req, res) => res.json({ data: ['r1','r2'] }));
app.post('/ventas/orden', auth, requireRole('vendedor','admin'), (_req, res) => res.status(201).json({ ok: true, id: 'ord_1' }));
app.get('/cliente/mis-entradas', auth, requireRole('cliente','admin'), (_req, res) => res.json({ entradas: [] }));

// Arranque (ajusta al server existente)
app.listen(3000, () => console.log('API lista en :3000'));
```

Frontend (React/TS) — util de API y flujo de sesión:
```ts
const API_URL = process.env.REACT_APP_API_URL ?? 'https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev';

async function api(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

export async function login(email: string, password: string) {
  const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('login_failed');
  return me();
}

export async function me() {
  const res = await api('/auth/me');
  if (!res.ok) throw new Error('unauthenticated');
  return res.json(); // { id, email, role }
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' });
}

// Ejemplos de consumo por rol:
// await api('/admin/reportes'); // requiere admin
// await api('/ventas/orden', { method: 'POST' }); // vendedor o admin
// await api('/cliente/mis-entradas'); // cliente o admin
```

Verificación rápida (curl):
```sh
# Health
curl -i https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/api/health
# Login admin y uso de cookie
curl -i -c cookies.txt -b cookies.txt -H 'Content-Type: application/json' \
  -X POST https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/auth/login \
  -d '{"email":"admin@example.com","password":"admin123"}'
# Perfil
curl -i -b cookies.txt https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/auth/me
# Ruta admin
curl -i -b cookies.txt https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/admin/reportes
# Logout
curl -i -b cookies.txt -X POST https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev/auth/logout
```

Checklist:
- Usa siempre la URL pública `https://*.app.github.dev` y `credentials: 'include'`.
- Requiere `Secure=true` y `SameSite=None` en cookies.
- Define `JWT_SECRET` en el contenedor.
- Prueba tres usuarios: admin, vendedor, cliente; valida acceso por rol.
```
