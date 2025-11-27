# 🚀 GUÍA DE DEPLOY COMPLETO - BACO TEATRO v3.0

## 📦 STACK COMPLETO

- **Backend**: Node.js + Express + PostgreSQL (Render)
- **Base de Datos**: PostgreSQL (Render)
- **App Móvil**: React Native + Expo (EAS Build)
- **Repositorio**: GitHub

---

## PARTE 1: DEPLOY BACKEND EN RENDER

### 1.1 Crear cuenta en Render
- Ir a https://render.com
- Registrarse con GitHub

### 1.2 Crear PostgreSQL Database

1. Dashboard → New → PostgreSQL
2. Configurar:
   - **Name**: `baco-teatro-db`
   - **Region**: Oregon (free tier)
   - **Plan**: Free
3. Click **Create Database**
4. Guardar credenciales:
   - **Internal Database URL**: Se usa en el backend
   - **External Database URL**: Para conectar desde tu PC

### 1.3 Crear las tablas en PostgreSQL

Conectar desde tu máquina:

```bash
# Instalar psql (si no lo tienes)
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql-client

# Conectar (usar External Database URL)
psql postgresql://user:pass@hostname/dbname
```

Ejecutar SQL:

```sql
-- Tabla usuarios
CREATE TABLE users (
  phone VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'VENDEDOR',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla shows
CREATE TABLE shows (
  id SERIAL PRIMARY KEY,
  obra VARCHAR(255) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  capacidad INT NOT NULL,
  base_price NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla tickets
CREATE TABLE tickets (
  code VARCHAR(20) PRIMARY KEY,
  show_id INT REFERENCES shows(id),
  estado VARCHAR(30) DEFAULT 'DISPONIBLE',
  vendedor_phone VARCHAR(20) REFERENCES users(phone),
  comprador_nombre VARCHAR(255),
  comprador_contacto VARCHAR(255),
  precio NUMERIC(10,2),
  medio_pago VARCHAR(50),
  fecha_reserva TIMESTAMP,
  fecha_venta TIMESTAMP,
  fecha_pago TIMESTAMP,
  fecha_uso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_tickets_show ON tickets(show_id);
CREATE INDEX idx_tickets_vendedor ON tickets(vendedor_phone);
CREATE INDEX idx_tickets_estado ON tickets(estado);

-- Vistas para reportes
CREATE VIEW v_resumen_vendedor_show AS
SELECT 
  t.vendedor_phone,
  u.name as vendedor_nombre,
  s.id as show_id,
  s.obra,
  COUNT(*) FILTER (WHERE t.estado IN ('STOCK_VENDEDOR','RESERVADO','REPORTADA_VENDIDA','PAGADO','USADO')) as asignados,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO','USADO')) as vendidos,
  SUM(t.precio) FILTER (WHERE t.estado IN ('PAGADO','USADO')) as monto_cobrado,
  SUM(t.precio) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') as monto_debe
FROM tickets t
JOIN users u ON t.vendedor_phone = u.phone
JOIN shows s ON t.show_id = s.id
GROUP BY t.vendedor_phone, u.name, s.id, s.obra;

CREATE VIEW v_resumen_show_admin AS
SELECT 
  s.id as show_id,
  s.obra,
  s.fecha,
  s.capacidad as total_tickets,
  COUNT(*) FILTER (WHERE t.estado IN ('PAGADO','USADO')) as tickets_vendidos,
  SUM(t.precio) FILTER (WHERE t.estado IN ('PAGADO','USADO')) as total_cobrado,
  SUM(t.precio) FILTER (WHERE t.estado = 'REPORTADA_VENDIDA') as total_reportado
FROM shows s
LEFT JOIN tickets t ON s.id = t.show_id
GROUP BY s.id, s.obra, s.fecha, s.capacidad;

-- Usuario ADMIN inicial (password: admin123)
INSERT INTO users (phone, name, password_hash, role) 
VALUES ('+5491100000000', 'Super Admin', '$2b$10$OZQiXXXXXXX', 'ADMIN');
```

**IMPORTANTE**: Para el usuario admin, genera el hash de la password:

```bash
cd teatro-tickets-backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (e,h) => console.log(h));"
# Copiar el hash generado y usarlo en el INSERT
```

### 1.4 Crear Web Service para el Backend

1. Dashboard → New → Web Service
2. Conectar con GitHub:
   - Autorizar Render en tu repo
   - Seleccionar repositorio: `Entradas_de_teatro`
   - Root Directory: `teatro-tickets-backend`
3. Configurar:
   - **Name**: `baco-teatro-api`
   - **Region**: Oregon
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index-v3-refactored.js`
   - **Plan**: Free
4. Environment Variables (click **Add Environment Variable**):

```bash
DATABASE_URL=<Internal Database URL de PostgreSQL>
PORT=3000
BASE_URL=https://baco-teatro-api.onrender.com
JWT_SECRET=<genera_un_secreto_seguro_aleatorio>
NODE_ENV=production
```

Para generar JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Click **Create Web Service**
6. Esperar deploy (5-10 min)
7. Verificar en: https://baco-teatro-api.onrender.com/health

### 1.5 Probar API

```bash
# Health check
curl https://baco-teatro-api.onrender.com/health

# Login
curl -X POST https://baco-teatro-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491100000000","password":"admin123"}'

# Debe devolver: {"token":"JWT_TOKEN","user":{...}}
```

---

## PARTE 2: DEPLOY APP MÓVIL CON EXPO

### 2.1 Configurar Backend URL

Editar `baco-teatro-app/api/api.js`:

```javascript
export const API_URL = __DEV__ 
  ? 'http://localhost:3000'
  : 'https://baco-teatro-api.onrender.com';  // ← Tu URL de Render
```

### 2.2 Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2.3 Login en Expo

```bash
cd baco-teatro-app
eas login
# Crear cuenta en expo.dev si no tienes
```

### 2.4 Configurar Build

```bash
eas build:configure
```

Esto crea `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2.5 Build para Android (APK)

```bash
# Build de prueba
eas build --platform android --profile preview

# Build de producción
eas build --platform android --profile production
```

**Proceso**:
1. EAS sube tu código a los servidores de Expo
2. Compila la app en la nube
3. Te da un link para descargar el APK (~20-30 min)

### 2.6 Build para iOS (requiere cuenta Apple Developer)

```bash
eas build --platform ios --profile production
```

**Nota**: iOS requiere:
- Apple Developer Account ($99/año)
- Certificados y provisioning profiles
- EAS te guía en el proceso

### 2.7 Descargar y Distribuir

1. Cuando termine el build, recibes link de descarga
2. APK puede instalarse directamente en Android
3. Compartir link con usuarios de prueba
4. Para producción: subir a Google Play Store

---

## PARTE 3: TESTING COMPLETO

### 3.1 Backend

```bash
# 1. Crear usuario vendedor
curl -X POST https://baco-teatro-api.onrender.com/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5491122334455","name":"Juan Vendedor","role":"VENDEDOR"}'

# 2. Crear función
curl -X POST https://baco-teatro-api.onrender.com/api/shows \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"obra":"Hamlet","fecha":"2024-12-31T20:00:00Z","capacidad":50,"base_price":5000}'

# 3. Asignar tickets
curl -X POST https://baco-teatro-api.onrender.com/api/shows/1/assign-tickets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendedor_phone":"+5491122334455","cantidad":10}'
```

### 3.2 App Móvil

**Test Admin**:
1. Login con admin
2. Crear función → Verificar tickets generados
3. Crear vendedor
4. Asignar tickets al vendedor
5. Ver reportes

**Test Vendedor**:
1. Login con vendedor
2. Ver tickets en Mi Stock
3. Reservar ticket → Completar datos
4. Reportar venta → Esperar aprobación admin
5. Admin aprueba → Ver QR
6. Compartir QR con comprador

**Test Validación**:
1. Login como admin
2. Ir a Validar QR
3. Escanear QR de ticket PAGADO
4. Verificar que pasa a USADO

---

## PARTE 4: MANTENIMIENTO

### 4.1 Ver Logs del Backend

```bash
# En Render Dashboard
Baco Teatro API → Logs (actualiza en tiempo real)
```

### 4.2 Conectar a Base de Datos

```bash
psql <External Database URL de Render>

# Ver usuarios
SELECT phone, name, role FROM users;

# Ver tickets por estado
SELECT estado, COUNT(*) FROM tickets GROUP BY estado;

# Ver funciones
SELECT * FROM shows ORDER BY fecha;
```

### 4.3 Actualizar Backend

```bash
# Hacer cambios en código local
git add .
git commit -m "Update backend"
git push origin main

# Render detecta el push y redeploya automáticamente
```

### 4.4 Actualizar App Móvil

```bash
cd baco-teatro-app
# Hacer cambios
# Incrementar versión en app.json

eas build --platform android --profile production
# Distribuir nuevo APK
```

---

## PARTE 5: TROUBLESHOOTING

### Backend no levanta

1. Verificar logs en Render
2. Verificar `DATABASE_URL` esté correcto
3. Verificar `PORT` en 3000
4. Verificar `index-v3-refactored.js` existe

### App no conecta con backend

1. Verificar `API_URL` en `api/api.js`
2. Verificar backend esté en https (no http)
3. Verificar backend responda en /health
4. Ver logs de React Native: `npx react-native log-android`

### Base de datos vacía

1. Conectar con psql
2. Ejecutar SQL de creación de tablas
3. Insertar usuario admin inicial

### QR no escanea

1. Verificar permisos de cámara en settings del teléfono
2. Verificar `expo-barcode-scanner` instalado
3. Probar con otro código QR (de prueba)

### Build falla en EAS

1. Verificar `app.json` sin errores de sintaxis
2. Verificar `package.json` versiones compatibles
3. Ver logs detallados: `eas build --platform android --profile preview --clear-cache`

---

## 📱 URLs IMPORTANTES

- **Backend**: https://baco-teatro-api.onrender.com
- **Health Check**: https://baco-teatro-api.onrender.com/health
- **Validación Pública**: https://baco-teatro-api.onrender.com/validar/{CODE}
- **Database**: Render Dashboard → PostgreSQL
- **Expo Dashboard**: https://expo.dev (ver builds)

---

## 🔒 CREDENCIALES

**Admin Inicial**:
- Phone: `+5491100000000`
- Password: `admin123`

**Base de Datos**:
- Ver en Render Dashboard → PostgreSQL → Connect

**JWT Secret**:
- Ver en Render Dashboard → Web Service → Environment

---

## 🎯 CHECKLIST FINAL

- [ ] PostgreSQL creado en Render
- [ ] Tablas y vistas creadas
- [ ] Usuario admin inicial insertado
- [ ] Backend deployed y respondiendo en /health
- [ ] Variables de entorno configuradas
- [ ] API_URL actualizada en app móvil
- [ ] Build de Android generado
- [ ] APK descargado y probado
- [ ] Login funciona (admin y vendedor)
- [ ] Flow completo testeado
- [ ] QR scanner funciona
- [ ] Compartir QR funciona

---

**¡Sistema completo funcionando! 🎭🚀**
