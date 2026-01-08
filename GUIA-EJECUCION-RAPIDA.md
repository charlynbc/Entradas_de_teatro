# 🚀 GUÍA RÁPIDA - Cómo Ejecutar el Sistema

## ⚡ Forma Más Rápida (Recomendado)

### Con VS Code Tasks
1. Presiona: **`Ctrl+Shift+B`** (o Cmd+Shift+B en Mac)
2. Se abrirá el menú de tareas
3. Selecciona: **"Dev: Start DB + Backend Dev (nodemon)"**
4. Espera ~10 segundos
5. Abre: **http://localhost:3000** en el navegador

✅ **¡Listo!** El sistema está ejecutándose con auto-reload.

---

## 🛠️ Forma Manual (Si VS Code Tasks no funciona)

### Terminal 1: Base de Datos
```bash
cd /workspaces/Entradas_de_teatro

docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

Espera 3-5 segundos a que se inicie.

### Terminal 2: Backend
```bash
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend

npm install  # Solo la primera vez
npm run dev
```

### Terminal 3: Abre el navegador
```
http://localhost:3000
```

✅ **¡Listo!** El sistema está ejecutándose.

---

## 📍 URLs para Probar

| Sección | URL |
|---------|-----|
| **Inicio** | http://localhost:3000 |
| **Funciones Hoy** | http://localhost:3000/funciones-hoy.html |
| **Próximas Funciones** | http://localhost:3000/proximas-funciones.html |
| **Dashboard SUPER** | http://localhost:3000/pages/roles/super.html |
| **Dashboard Director** | http://localhost:3000/pages/roles/admin.html |
| **Dashboard Actor** | http://localhost:3000/pages/roles/actor.html |
| **Acerca de Baco** | http://localhost:3000/sobre-baco.html |

---

## 👤 Credenciales de Prueba

**Usuario SUPER (Administración completa)**
```
Cédula: 48376669
Contraseña: Teamomama91
```

**Director (Gestión de grupo)**
```
Cédula: 11111111
Contraseña: Teamomama91
```

**Actor (Consulta de información)**
```
Cédula: 55555555
Contraseña: Teamomama91
```

---

## ✨ Qué Probar Primero

### 1. Página Pública (Sin Login)
- Visita: http://localhost:3000/funciones-hoy.html
- Verás un listado de 28 funciones disponibles
- Botón "Cerrar Sesión" arriba a la derecha (clickeado mostrará login)

### 2. Login como SUPER
- Click en "Cerrar Sesión" (arriba a la derecha)
- Ingresa la cédula **48376669** y password **Teamomama91**
- Serás redirigido al Dashboard SUPER
- Aquí puedes crear grupos, directores, funciones, etc.

### 3. Login como Director
- Logout (botón arriba a la derecha)
- Ingresa cédula **11111111** y password **Teamomama91**
- Verás el Dashboard Director con opción de crear funciones

### 4. Verificar Datos
- En cualquier página pública (http://localhost:3000/funciones-hoy.html)
- Deberías ver 28 funciones en la cartelera
- Cada función muestra: nombre, fecha, hora, sala, precio, grupo

---

## 🧪 Ejecutar Tests de Integración

```bash
cd /workspaces/Entradas_de_teatro
bash test-integracion.sh
```

Este test valida:
- ✅ Conectividad del servidor
- ✅ Endpoints públicos
- ✅ Autenticación de usuarios
- ✅ Datos en base de datos
- ✅ Estado de páginas frontend

---

## 🚨 Si Algo No Funciona

### "No puedo conectar a http://localhost:3000"
```bash
# Verifica que el backend está corriendo
curl http://localhost:3000

# Si no responde, reinicia
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend
npm run dev
```

### "Error: Cannot connect to database"
```bash
# Verifica que PostgreSQL está corriendo
docker ps | grep teatro-postgres

# Si no aparece, inicia PostgreSQL manualmente
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

### "No veo las 28 funciones"
```bash
# Regenera los datos
cd /workspaces/Entradas_de_teatro
node scripts/borrar.sh
node teatro-tickets-backend/create-theater-groups.js

# Recarga la página
```

### "No puedo loguearme"
1. Verifica que la base de datos está corriendo: `docker ps | grep teatro-postgres`
2. Verifica que el backend está corriendo: `curl http://localhost:3000/api/auth/login`
3. Prueba con la cédula exacta: `48376669` (sin espacios)
4. Contraseña exacta: `Teamomama91`

---

## 🛑 Detener el Sistema

### Opción 1: VS Code Tasks
1. Presiona: **`Ctrl+Shift+B`**
2. Selecciona: **"Dev: Stop DB + Backend"**
3. Espera a que se detengan

### Opción 2: Manual
```bash
# Detener backend
Ctrl+C en la terminal donde corre npm run dev

# Detener PostgreSQL
docker rm -f teatro-postgres
```

---

## 📞 Soporte Rápido

Si algo no funciona:

1. **Abre la consola del navegador:** F12 → Console
   - Busca mensajes de error (red, authentication, etc.)

2. **Revisa los logs del backend:** Terminal donde corre npm run dev
   - Busca errores de conexión a BD
   - Busca errores HTTP

3. **Verifica la BD:**
   ```bash
   docker exec -it teatro-postgres psql -U postgres -d teatro -c "SELECT COUNT(*) as funciones FROM funciones;"
   ```
   - Deberías ver: funciones = 28

---

## 🎉 Una Vez Todo Funcionando

- Prueba todas las URLs arriba
- Intenta login con los 3 roles
- Verifica que puedes crear funciones (como SUPER)
- Verifica que puedes cerrar sesión
- Verifica que las funciones públicas se ven sin login

¡**Disfruta del sistema!** 🎭
