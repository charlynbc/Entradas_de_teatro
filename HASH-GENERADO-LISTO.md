# ✅ SOLUCIÓN LISTA PARA EJECUTAR

## 🎯 Hash Generado Exitosamente

He generado el hash correcto para el password `Teamomama91`:

```
$2b$10$1.O93K2GKBzHwy8mKeHp9unLN6Ws23j/ygl3bCPNEmY8CBWybr3E6
```

## 🚀 EJECUTA ESTO AHORA (2 minutos)

### Opción 1: SQL Directo (MÁS RÁPIDO) ⭐

1. **Ve a Render Dashboard:**
   - https://dashboard.render.com
   - Selecciona tu base de datos PostgreSQL
   - Click en **"Shell"** o **"Connect"**

2. **Copia y pega TODO este SQL:**

```sql
DELETE FROM users WHERE cedula = '48376669';

INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at) 
VALUES ('supremo_' || extract(epoch from now())::bigint, '48376669', 'Super Baco', '$2b$10$1.O93K2GKBzHwy8mKeHp9unLN6Ws23j/ygl3bCPNEmY8CBWybr3E6', 'supremo', NOW(), NOW());

SELECT id, cedula, nombre, rol FROM users WHERE cedula = '48376669';
```

3. **Presiona Enter**

4. **¡Listo!** Ahora puedes hacer login con:
   - Cédula: `48376669`
   - Password: `Teamomama91`

---

### Opción 2: Usando el Script Node.js

Si tienes la DATABASE_URL de Render:

```bash
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend

# Reemplaza con tu URL real de Render
export DATABASE_URL="postgresql://usuario:password@host.render.com/database"

node reset-superusuario.js
```

---

## 📁 Archivo SQL Listo

También he creado el archivo **`EJECUTA-ESTE-SQL.sql`** con el comando completo.

Simplemente ábrelo, copia el contenido, y pégalo en la Shell de PostgreSQL en Render.

---

## ✅ Verificar que Funciona

Después de ejecutar el SQL, prueba el login:

```bash
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}'
```

Deberías recibir un token de autenticación.

---

## 🔐 Credenciales Finales

- **Cédula/Phone:** `48376669`
- **Password:** `Teamomama91`
- **Rol:** SUPER
- **Nombre:** Super Baco

---

## 📞 Si Necesitas Ayuda

1. El SQL está en: `EJECUTA-ESTE-SQL.sql`
2. Documentación completa: `INICIO-AQUI.md`
3. Todas las opciones: `SOLUCION-RAPIDA-LOGIN.md`

---

**Estado:** ✅ Hash generado y verificado correctamente  
**Fecha:** 3 de diciembre de 2025  
**Acción requerida:** Ejecutar el SQL en Render (2 minutos)
