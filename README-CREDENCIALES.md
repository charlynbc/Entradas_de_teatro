# 📦 ARCHIVOS CREADOS PARA SOLUCIONAR LAS CREDENCIALES

He creado varios archivos para ayudarte a resolver el problema de login del superusuario:

## 📖 Documentación (Lee primero)

1. **`INICIO-AQUI.md`** ⭐ **EMPIEZA POR ESTE**
   - Solución más simple y rápida (2 minutos)
   - Paso a paso con comandos para copiar y pegar

2. **`SOLUCION-RAPIDA-LOGIN.md`**
   - Guía completa con capturas conceptuales
   - Varias opciones explicadas en detalle
   - Troubleshooting incluido

3. **`RESETEAR-SUPERUSUARIO.md`**
   - Documentación técnica completa
   - Todas las opciones posibles
   - Para usuarios avanzados

4. **`LEEME-PRIMERO-CREDENCIALES.md`**
   - Resumen ejecutivo
   - Links a todos los recursos

## 🛠️ Scripts Ejecutables

5. **`arreglar-credenciales.sh`**
   ```bash
   export DATABASE_URL="postgresql://..."
   ./arreglar-credenciales.sh
   ```
   - Reset automático completo
   - Requiere DATABASE_URL de Render

6. **`probar-login.sh`**
   ```bash
   ./probar-login.sh
   ```
   - Prueba si el login funciona
   - Guarda el token si es exitoso

## 🔧 Scripts Node.js (en teatro-tickets-backend/)

7. **`reset-superusuario.js`**
   ```bash
   cd teatro-tickets-backend
   DATABASE_URL="..." node reset-superusuario.js
   ```
   - Reset completo con verificación
   - Genera hash, elimina usuario anterior, crea nuevo

8. **`generar-hash.js`**
   ```bash
   cd teatro-tickets-backend
   node generar-hash.js
   ```
   - Solo genera el hash bcrypt del password
   - Te da los comandos SQL listos para usar

9. **`create-admin.js`** (ya existía)
   - Crea/actualiza el usuario supremo
   - Usa ON CONFLICT para evitar duplicados

10. **`init-supremo.js`** (ya existía)
    - Se ejecuta automáticamente al iniciar el servidor
    - Crea el usuario si no existe

## 📄 SQL Directo

11. **`resetear-superusuario.sql`**
    - Template SQL para ejecutar en Render Shell
    - Incluye instrucciones de uso

## 🎯 ¿Cuál usar?

### Si tienes acceso a Render Dashboard → Base de Datos → Shell
✅ **Usa: `generar-hash.js` + `resetear-superusuario.sql`**
1. Ejecuta `generar-hash.js` en tu computadora
2. Copia el SQL que te da
3. Pégalo en la Shell de Render
4. Listo!

### Si tienes la DATABASE_URL de Render
✅ **Usa: `arreglar-credenciales.sh`**
1. `export DATABASE_URL="postgresql://..."`
2. `./arreglar-credenciales.sh`
3. Listo!

### Si prefieres hacerlo manual
✅ **Usa: `reset-superusuario.js`**
1. `cd teatro-tickets-backend`
2. `DATABASE_URL="..." node reset-superusuario.js`
3. Listo!

### Si solo quieres entender qué hacer
✅ **Lee: `INICIO-AQUI.md`**

## 🔐 Credenciales Finales

Después de ejecutar cualquiera de las soluciones:
- **Cédula:** `48376669`
- **Password:** `Teamomama91`
- **Rol:** SUPER (supremo en la DB)
- **Nombre:** Super Baco

## ⚡ Solución Express (30 segundos)

```bash
# 1. Genera el hash
cd teatro-tickets-backend && node generar-hash.js

# 2. Copia el SQL que aparece

# 3. Pégalo en Render Dashboard → Tu DB → Shell

# 4. Listo! Prueba el login
```

## 📞 Ayuda

Si ninguna solución funciona:
1. Verifica que el servidor esté corriendo en Render
2. Revisa los logs del servidor (Render Dashboard → Logs)
3. Verifica que la base de datos esté accesible
4. Lee `SOLUCION-RAPIDA-LOGIN.md` sección "Troubleshooting"

---

**Creado:** 3 de diciembre de 2025  
**Por:** GitHub Copilot (Claude Sonnet 4.5)  
**Propósito:** Arreglar problema de login del superusuario
