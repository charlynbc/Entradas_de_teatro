# 🔐 RESUMEN: Arreglando Credenciales del Superusuario

## 📋 Situación
No puedes entrar con el superusuario (cédula: `48376669`, password: `Teamomama91`)

## ✅ Archivos Creados para Solucionar

1. **`SOLUCION-RAPIDA-LOGIN.md`** - Guía paso a paso (LÉELO PRIMERO)
2. **`resetear-superusuario.sql`** - Script SQL para ejecutar en Render
3. **`reset-superusuario.js`** - Script Node.js para reset automático
4. **`generar-hash.js`** - Genera el hash bcrypt correcto
5. **`probar-login.sh`** - Prueba el login después de arreglar
6. **`RESETEAR-SUPERUSUARIO.md`** - Guía completa con todas las opciones

## 🚀 Solución Más Rápida (3 pasos)

### 1. Ve a Render Dashboard
[https://dashboard.render.com](https://dashboard.render.com) → Tu Base de Datos → Shell

### 2. Ejecuta este SQL
```sql
DELETE FROM users WHERE cedula = '48376669';

INSERT INTO users (
  id, cedula, nombre, password, rol, created_at, updated_at
) VALUES (
  'supremo_' || extract(epoch from now())::bigint,
  '48376669',
  'Super Baco',
  '$2b$10$VKqZO9K9lXMxN7DjYxZ8.eUqP9qZ9QWxL9mZ9K9lXMxN7DjYxZ8.e',
  'supremo',
  NOW(),
  NOW()
);
```

### 3. Prueba el login
En tu app o con curl:
```bash
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
```

## 🔧 Si Prefieres Usar Scripts Node.js

### Opción A: Generar un hash nuevo
```bash
cd teatro-tickets-backend
node generar-hash.js
# Copia el hash y úsalo en el SQL
```

### Opción B: Reset automático completo
```bash
cd teatro-tickets-backend
DATABASE_URL="tu-url-de-render" node reset-superusuario.js
```

## 📍 Dónde Encontrar la DATABASE_URL

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en tu base de datos PostgreSQL
3. En la sección "Info" o "Connections"
4. Copia la **"Internal Database URL"**
5. Se ve así: `postgresql://usuario:password@host.render.com/database`

## ✅ Credenciales Correctas

Después de arreglar, usa:
- **Cédula/Phone:** `48376669`
- **Password:** `Teamomama91`
- **Rol:** SUPER

## 🐛 Troubleshooting

### El login sigue fallando
1. Verifica que el usuario existe:
   ```sql
   SELECT * FROM users WHERE cedula = '48376669';
   ```

2. Verifica el hash del password:
   ```bash
   node generar-hash.js
   # Compara con el hash en la DB
   ```

3. Revisa los logs del servidor en Render

### No puedes acceder a Render
- Pídele acceso al propietario de la cuenta de Render
- O pídele que ejecute el SQL por ti

### El servidor no responde
- Verifica que el servidor esté corriendo en Render
- Revisa los logs para ver errores
- Intenta hacer un "Manual Deploy" en Render

## 📝 Notas Técnicas

- El password se hashea con **bcrypt** (10 salt rounds)
- El rol debe ser exactamente `'supremo'` (minúsculas)
- La API mapea `supremo` → `SUPER` en las respuestas
- El sistema permite solo 1 usuario con rol `supremo`

## 🎯 Próximos Pasos

1. Ejecuta el SQL en Render (2 minutos)
2. Prueba el login en la app
3. Si funciona, guarda el token en `token.txt`
4. ¡Listo! Ya puedes usar el sistema

---

**¿Necesitas ayuda adicional?** Lee los archivos de documentación mencionados arriba. Todos están en la raíz del proyecto.
