# 🚨 NO PUEDO ENTRAR CON EL SUPERUSUARIO - SOLUCIÓN

## El Problema
No puedes hacer login con:
- Cédula: `48376669`
- Password: `Teamomama91`

## ✅ LA SOLUCIÓN MÁS FÁCIL (3 pasos - 2 minutos)

### 1️⃣ Ve a Render
Abre [dashboard.render.com](https://dashboard.render.com) → Tu Base de Datos → **Shell**

### 2️⃣ Copia y Pega Esto
```sql
DELETE FROM users WHERE cedula = '48376669';
```

### 3️⃣ Genera el Hash y Crea el Usuario

En tu computadora:
```bash
cd teatro-tickets-backend
node generar-hash.js
```

Esto te dará algo como:
```
✅ Hash generado:
$2b$10$AbC123XyZ...

📋 SQL para insertar nuevo usuario:
INSERT INTO users (id, cedula, nombre, password, rol, created_at, updated_at)
VALUES ('supremo_..., '48376669', 'Super Baco', '$2b$10$AbC...', 'supremo', NOW(), NOW());
```

Copia ese SQL completo y pégalo en la Shell de Render.

## ¡LISTO! 🎉

Ahora puedes hacer login con:
- Cédula: `48376669`
- Password: `Teamomama91`

---

## 🔄 Método Alternativo (Si tienes DATABASE_URL)

```bash
# 1. Obtén la DATABASE_URL de Render
# 2. Ejecuta:
export DATABASE_URL="postgresql://..."
./arreglar-credenciales.sh
```

---

## 📚 Más Información

- **`SOLUCION-RAPIDA-LOGIN.md`** - Guía detallada
- **`RESETEAR-SUPERUSUARIO.md`** - Todas las opciones posibles
- **`arreglar-credenciales.sh`** - Script automático
- **`reset-superusuario.js`** - Reset con Node.js
- **`generar-hash.js`** - Solo genera el hash
- **`resetear-superusuario.sql`** - Template SQL

---

## ❓ FAQ

**P: ¿Por qué no funciona mi password?**  
R: El hash en la base de datos no coincide. Necesitas regenerarlo.

**P: ¿Dónde está la DATABASE_URL?**  
R: Render Dashboard → Tu DB → Info/Connect → Internal Database URL

**P: ¿Puedo cambiar el password?**  
R: Sí, edita `generar-hash.js` y cambia `'Teamomama91'` por lo que quieras.

**P: ¿Cuánto tarda?**  
R: 2-3 minutos total.

---

**Hecho por:** GitHub Copilot  
**Fecha:** 3 de diciembre de 2025
