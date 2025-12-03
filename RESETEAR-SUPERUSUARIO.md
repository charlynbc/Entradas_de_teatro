# 🔧 Guía para Resetear el Superusuario

## Problema
No puedes entrar con el usuario supremo (cédula: `48376669`)

## Solución Rápida

### Opción 1: Usando el Script de Reset (Recomendado)

Si tienes acceso a la `DATABASE_URL` de Render:

```bash
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend

# Ejecuta con la URL de tu base de datos de Render
DATABASE_URL="postgresql://usuario:password@host.render.com/database" node reset-superusuario.js
```

**Dónde encontrar la DATABASE_URL:**
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu base de datos PostgreSQL
3. Copia la **Internal Database URL**
4. Pégala en el comando de arriba

### Opción 2: Desde la Terminal de Render

1. Ve a tu base de datos en [Render Dashboard](https://dashboard.render.com)
2. Abre la **Shell** de la base de datos
3. Ejecuta estos comandos SQL:

```sql
-- Eliminar usuario supremo anterior
DELETE FROM users WHERE cedula = '48376669';

-- Crear nuevo usuario supremo
-- Nota: Este password ya está hasheado con bcrypt
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
  '$2b$10$N5kI3Y4fZv1mQZxJ8K9QXeHF8vL4wZ3xK7pR2vN1mT5yU6wQ8sE7G',
  'supremo',
  NOW(),
  NOW()
);

-- Verificar que se creó correctamente
SELECT id, cedula, nombre, rol FROM users WHERE cedula = '48376669';
```

### Opción 3: Recrear Usuario desde el Backend

Si el servidor está corriendo en Render:

```bash
# 1. SSH al servidor de Render (desde su dashboard)
cd /opt/render/project/src

# 2. Ejecutar el script de creación
node reset-superusuario.js
```

## 🔐 Credenciales del Superusuario

Una vez reseteado, las credenciales son:

- **Cédula/Phone:** `48376669`
- **Contraseña:** `Teamomama91`
- **Rol:** SUPER
- **Nombre:** Super Baco

## ✅ Verificar que Funciona

Después de resetear, prueba el login:

```bash
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
```

Deberías recibir un token de autenticación.

## 📝 Notas Importantes

1. **El password "Teamomama91" está hardcodeado** en varios archivos:
   - `/teatro-tickets-backend/init-supremo.js`
   - `/teatro-tickets-backend/create-admin.js`
   - `/teatro-tickets-backend/reset-superusuario.js`

2. **La contraseña se hashea con bcrypt** (10 salt rounds) antes de guardarse

3. **El sistema permite solo un usuario supremo** con la cédula `48376669`

## 🐛 Si Aún No Funciona

### Verifica la Base de Datos

```bash
# Conecta a la base de datos y verifica:
psql $DATABASE_URL -c "SELECT * FROM users WHERE cedula = '48376669';"
```

### Verifica el Hash del Password

```bash
# Desde Node.js, verifica que el hash es correcto
node -e "
import bcrypt from 'bcrypt';
const hash = 'HASH_DE_LA_DB_AQUI';
bcrypt.compare('Teamomama91', hash).then(console.log);
"
```

### Reiniciar el Servidor

A veces el servidor cachea las credenciales. Reinicia el servicio en Render:
1. Ve al dashboard de tu Web Service
2. Click en "Manual Deploy" > "Clear build cache & deploy"

## 📞 Contacto

Si ninguna opción funciona, verifica:
- ¿La base de datos está accesible?
- ¿El servidor está corriendo?
- ¿Hay errores en los logs de Render?
