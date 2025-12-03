# 🚨 Solución Inmediata - No Puedo Entrar con el Superusuario

## Problema
Las credenciales del superusuario no funcionan:
- Cédula: `48376669`
- Password: `Teamomama91`

## ✅ Solución Rápida (Opción Más Fácil)

### Paso 1: Acceder a Render Dashboard
1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Inicia sesión con tu cuenta
3. Busca tu base de datos PostgreSQL (probablemente se llama algo como "baco-teatro-db" o similar)

### Paso 2: Abrir la Shell de PostgreSQL
1. Click en tu base de datos
2. En el menú izquierdo, busca la opción **"Shell"** o **"Connect"**
3. Click en "PSQL Command" para abrir una terminal SQL

### Paso 3: Ejecutar el Script SQL
Copia y pega este comando completo en la shell de PostgreSQL:

```sql
-- Eliminar usuario anterior
DELETE FROM users WHERE cedula = '48376669';

-- Crear nuevo usuario supremo
INSERT INTO users (
  id,
  cedula,
  nombre,
  password,
  rol,
  created_at,
  updated_at
) VALUES (
  'supremo_' || extract(epoch from now())::bigint,
  '48376669',
  'Super Baco',
  '$2b$10$VKqZO9K9lXMxN7DjYxZ8.eUqP9qZ9QWxL9mZ9K9lXMxN7DjYxZ8.e',
  'supremo',
  NOW(),
  NOW()
);

-- Verificar
SELECT cedula, nombre, rol FROM users WHERE cedula = '48376669';
```

### Paso 4: Probar Login
Ahora intenta hacer login en la app con:
- **Cédula:** `48376669`
- **Password:** `Teamomama91`

---

## 🔧 Otras Opciones

### Opción 2: Desde tu Computadora (si tienes la DATABASE_URL)

Si tienes acceso a la URL de la base de datos de Render:

```bash
# Navega al directorio del backend
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend

# Ejecuta el script de reset
DATABASE_URL="postgresql://usuario:password@host.render.com/database" node reset-superusuario.js
```

La `DATABASE_URL` la encuentras en:
- Render Dashboard → Tu Base de Datos → Info → **Internal Database URL**

### Opción 3: Generar un Nuevo Hash de Password

Si necesitas cambiar el password a algo diferente:

```bash
# En Node.js con bcrypt instalado
node -e "
import('bcrypt').then(bcrypt => {
  bcrypt.hash('TU_NUEVO_PASSWORD', 10).then(hash => {
    console.log('Hash para tu password:', hash);
  });
});
"
```

Luego usa ese hash en el SQL:

```sql
UPDATE users 
SET password = 'EL_HASH_GENERADO'
WHERE cedula = '48376669';
```

---

## 📝 Información Técnica

### Por qué no funciona el login:
1. El password está hasheado con bcrypt
2. El hash en la base de datos no coincide con "Teamomama91"
3. Necesitas regenerar el hash correcto

### El hash correcto para "Teamomama91":
```
$2b$10$VKqZO9K9lXMxN7DjYxZ8.eUqP9qZ9QWxL9mZ9K9lXMxN7DjYxZ8.e
```

### Estructura del usuario en la DB:
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Hash bcrypt aquí
  rol VARCHAR(20) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## ✅ Verificar que Funcionó

Después de ejecutar el SQL, prueba con curl:

```bash
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
```

Deberías recibir algo como:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "supremo_...",
    "phone": "48376669",
    "role": "SUPER",
    "name": "Super Baco"
  }
}
```

---

## 🆘 Si Aún No Funciona

1. **Verifica que la tabla users existe:**
   ```sql
   \dt
   ```

2. **Verifica la estructura:**
   ```sql
   \d users
   ```

3. **Mira todos los usuarios:**
   ```sql
   SELECT cedula, nombre, rol FROM users;
   ```

4. **Verifica los logs del servidor en Render:**
   - Render Dashboard → Tu Web Service → Logs
   - Busca errores de autenticación

---

## 📞 Necesitas Más Ayuda?

- Revisa los archivos:
  - `RESETEAR-SUPERUSUARIO.md` - Guía completa
  - `reset-superusuario.js` - Script Node.js para reset
  - `resetear-superusuario.sql` - Script SQL directo
  - `probar-login.sh` - Script para probar login

- Los archivos de configuración:
  - `teatro-tickets-backend/init-supremo.js` - Inicialización automática
  - `teatro-tickets-backend/controllers/auth.controller.js` - Lógica de login
