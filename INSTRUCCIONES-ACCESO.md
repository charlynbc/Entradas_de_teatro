# 🌐 Instrucciones de Acceso - Baco Teatro

## Estado del Sistema ✅

- **Backend:** ✅ Corriendo en puerto 3000
- **Base de datos:** ✅ PostgreSQL activa
- **Frontend:** ✅ Desplegado en `/teatro-tickets-backend/public/`
- **Test:** ✅ 100% éxito (19/19 tests)

---

## 🚀 Cómo Acceder en Codespaces

### Paso 1: Hacer el Puerto Público

1. En VS Code, abre la pestaña **"PORTS"** (abajo, junto a Terminal)
2. Busca el puerto **3000**
3. Haz clic derecho sobre el puerto 3000
4. Selecciona **"Port Visibility"** → **"Public"**

### Paso 2: Abrir en el Navegador

Después de hacer el puerto público:

1. En la pestaña **"PORTS"**, haz clic en el ícono del **globo** 🌐 junto al puerto 3000
2. O copia la URL que aparece en la columna "Forwarded Address"

**URL esperada:**
```
https://stunning-fortnight-4564r5v6jwv3q4wr-3000.app.github.dev
```

---

## 🔐 Credenciales de Acceso

### Usuario SUPER (Administrador Total)
- **Cédula:** `48376669`
- **Contraseña:** `Teamomama91`
- **Permisos:** Todos (crear grupos, funciones, cerrar, finalizar, ver todo)

### Usuario Director (prueba)
- **Cédula:** `1234567`
- **Contraseña:** `Pass123!`
- **Permisos:** Crear y gestionar sus grupos

---

## 📱 Pantallas Disponibles

### Para SUPER Usuario:

1. **Dashboard:** Estadísticas generales
2. **Grupos:** Ver/crear/editar/finalizar grupos
3. **Funciones:** Ver/crear/cerrar funciones
4. **Funciones Concluidas:** Historial con PDFs
5. **Grupos Finalizados:** Historial con informes
6. **Ensayos:** Gestión de asistencia
7. **Reportes:** Estadísticas completas
8. **Usuarios:** Gestión de accesos

### Para Director:

1. **Dashboard:** Sus grupos y funciones
2. **Mis Grupos:** Grupos donde es director
3. **Funciones Concluidas:** Sus funciones cerradas
4. **Grupos Finalizados:** Sus grupos finalizados

---

## 🔧 Solución de Problemas

### Error: "No se puede conectar" o "401 Unauthorized"

**Causa:** El puerto no es público

**Solución:**
1. Pestaña PORTS en VS Code
2. Click derecho en puerto 3000
3. Port Visibility → Public
4. Recargar la página del navegador

### Error: "La página está en blanco"

**Causa:** JavaScript no carga o error en el bundle

**Solución:**
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Si hay error de CORS, verifica que el puerto sea público

### Error: "Failed to fetch"

**Causa:** El frontend no encuentra el backend

**Solución:**
1. Verifica que uses la URL completa (https://...)
2. No uses `localhost` en el navegador
3. Asegúrate de que el puerto esté expuesto como público

---

## 🧪 Verificación Rápida

### Desde Terminal:

```bash
# 1. Verificar que el servidor está corriendo
ps aux | grep "node index-v3-postgres.js"

# 2. Verificar que el frontend está desplegado
ls -la teatro-tickets-backend/public/

# 3. Probar el endpoint de salud
curl http://localhost:3000/api/health

# 4. Ejecutar test completo
node tests/test-dinamico-completo.js
```

### Desde el Navegador:

1. **Abrir:** `https://[tu-codespace]-3000.app.github.dev`
2. **Ver:** Pantalla de login
3. **Ingresar:** Cédula `48376669` y contraseña `Teamomama91`
4. **Verificar:** Dashboard con estadísticas

---

## 📊 Test Dinámico

Ejecutar test completo para verificar todas las funcionalidades:

```bash
node tests/test-dinamico-completo.js
```

**Resultado esperado:**
- ✅ Tests exitosos: 19
- ❌ Tests fallidos: 0
- Tasa de éxito: 100%

---

## 🐛 Debug Avanzado

### Ver logs del servidor:
```bash
tail -f /tmp/server.log
```

### Ver últimas queries SQL:
```bash
tail -100 /tmp/server.log | grep "Query ejecutado"
```

### Verificar base de datos:
```bash
docker exec postgres-teatro psql -U postgres -d teatro -c "SELECT COUNT(*) FROM users;"
docker exec postgres-teatro psql -U postgres -d teatro -c "SELECT COUNT(*) FROM grupos;"
docker exec postgres-teatro psql -U postgres -d teatro -c "SELECT COUNT(*) FROM shows;"
```

### Reiniciar servidor:
```bash
pkill -f "node index-v3-postgres.js"
cd teatro-tickets-backend
node index-v3-postgres.js > /tmp/server.log 2>&1 &
```

---

## 📦 Recompilar Frontend (si es necesario)

```bash
cd baco-teatro-app
npx expo export --platform web --clear
rm -rf ../teatro-tickets-backend/public/*
cp -r dist/* ../teatro-tickets-backend/public/
```

---

## ✅ Checklist de Funcionamiento

- [ ] Servidor corriendo en puerto 3000
- [ ] Puerto 3000 es **público** en Codespaces
- [ ] Frontend desplegado en `/public/`
- [ ] Base de datos PostgreSQL activa
- [ ] Usuario SUPER existe (48376669)
- [ ] Test dinámico: 100% éxito
- [ ] URL pública abre en navegador
- [ ] Login funciona con credenciales SUPER
- [ ] Dashboard muestra estadísticas

---

## 🎯 Primeros Pasos tras Login

1. **Ver Dashboard:** Estadísticas actuales
2. **Crear Grupo:** Ir a "Grupos" → "+" → Llenar formulario
3. **Agregar Miembros:** Entrar al grupo → "Agregar miembro"
4. **Crear Obra:** En el grupo → "Obras" → "+"
5. **Crear Función:** En el grupo → "Nueva función"
6. **Emitir Tickets:** En la función → "Asignar tickets"

---

**Sistema:** Baco Teatro v1.0  
**Commit actual:** 507506b  
**Branch:** experimento  
**Estado:** ✅ PRODUCTION READY
