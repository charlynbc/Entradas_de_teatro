# 🎭 BACO TEATRO - Scripts de Ejecución Rápida

## Descripción

Dos scripts shell para ejecutar y detener la aplicación completa de una sola vez.

---

## 📋 Scripts Disponibles

### 1. `./run-all.sh` - Ejecutar TODO

Inicia automáticamente:
- ✅ PostgreSQL (Docker)
- ✅ Backend (Node.js/Express)
- ✅ Frontend (React Native Web/Expo Metro)

**Uso:**
```bash
cd /workspaces/Entradas_de_teatro
./run-all.sh
```

**Qué hace:**
1. Verifica si PostgreSQL está corriendo (si no, lo inicia)
2. Aplica migraciones de BD
3. Inicia el Backend en puerto 3000
4. Inicia el Frontend en puerto 8081
5. Verifica que todos los servicios estén respondiendo
6. Muestra credenciales y URLs de acceso

**Output esperado:**
```
✅ Backend está respondiendo
✅ Frontend está sirviendo
✅ PostgreSQL está corriendo

🎯 SERVICIOS ACTIVOS:
Frontend (Expo Metro)  │  http://localhost:8081
Backend (Express API)  │  http://localhost:3000
Base de Datos          │  postgresql://localhost:5432

🔓 Credenciales de acceso:
   Cédula:      48376669
   Contraseña:  Teamomama91

✅ ¡APLICACIÓN LISTA! Abre http://localhost:8081
```

---

### 2. `./stop-all.sh` - Detener TODO

Detiene automáticamente:
- ✅ Frontend (Expo Metro)
- ✅ Backend (Node.js)
- ✅ PostgreSQL (Docker)

**Uso:**
```bash
cd /workspaces/Entradas_de_teatro
./stop-all.sh
```

**Output esperado:**
```
✅ Frontend detenido
✅ Backend detenido
✅ PostgreSQL detenido

✅ Todos los servicios han sido detenidos
```

---

## 🚀 Flujo Típico

### Iniciar la aplicación por primera vez:
```bash
cd /workspaces/Entradas_de_teatro
./run-all.sh
```

Luego abre en tu navegador: **http://localhost:8081**

### Después de terminar de trabajar:
```bash
./stop-all.sh
```

---

## 💡 Comandos Útiles Durante la Ejecución

Cuando el Frontend esté compilando (ves "Metro waiting on..."), puedes:

| Tecla | Acción |
|-------|--------|
| `r` | Recargar la aplicación (Hot Reload) |
| `w` | Abrir en navegador |
| `m` | Mostrar menú de opciones |
| `?` | Ver todos los comandos |
| `Ctrl+C` | Detener Expo Metro |

---

## 📊 Verificación Manual (si algo falla)

### Verificar Frontend:
```bash
curl http://localhost:8081
```

### Verificar Backend:
```bash
curl http://localhost:3000/health
```
Debe responder:
```json
{"status":"ok","storage":"postgresql","database":"connected",...}
```

### Verificar PostgreSQL:
```bash
docker ps --filter "name=teatro"
```

---

## 📝 Logs

Si algo falla, puedes revisar los logs:

```bash
# Logs del Backend
tail -f /tmp/backend.log

# Logs del Frontend
tail -f /tmp/frontend.log
```

---

## 🔧 Solución de Problemas

### El script dice que un puerto ya está en uso

**Opción 1:** Ejecutar stop-all.sh primero
```bash
./stop-all.sh
./run-all.sh
```

**Opción 2:** Matar procesos manualmente
```bash
# Frontend
pkill -f "expo"

# Backend
pkill -f "node"

# PostgreSQL
docker rm -f teatro-postgres
```

### Falla la conexión a la base de datos

Verifica que PostgreSQL esté corriendo:
```bash
docker ps | grep teatro-postgres
```

Si no aparece, ejecuta:
```bash
docker run -d --name teatro-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=teatro -p 5432:5432 postgres:15
```

### Frontend tarda mucho en compilar

Esto es normal la primera vez. Expo Metro compila React Native a Web. 
Espera 30-60 segundos, verás:
```
Metro waiting on exp://...
Web is waiting on http://localhost:8081
```

---

## ✅ Estado Correcto

Cuando todo funciona bien:

```
✅ Backend está respondiendo
✅ Frontend está sirviendo
✅ PostgreSQL está corriendo

Frontend (Expo Metro)  │  http://localhost:8081
Backend (Express API)  │  http://localhost:3000
Base de Datos          │  postgresql://localhost:5432

Cédula:      48376669
Contraseña:  Teamomama91
```

---

## 📚 Más Info

- [Estructura del Proyecto](./README.md)
- [Documentación Técnica](./documentacion/)
- [API Endpoints](./teatro-tickets-backend/README.md)

---

**¡Listo! Tu aplicación web está lista para ejecutarse.** 🎭
