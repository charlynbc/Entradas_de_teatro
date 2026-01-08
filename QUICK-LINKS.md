# ⚡ QUICK LINKS - Acceso Rápido a Recursos

## 🚀 EMPEZAR AHORA

### 1️⃣ Ejecutar Sistema
- **Forma Rápida:** [GUIA-EJECUCION-RAPIDA.md](./GUIA-EJECUCION-RAPIDA.md) (2 minutos)
- **Manual:** `cd teatro-tickets-backend && npm run dev`
- **VS Code Tasks:** `Ctrl+Shift+B` → "Dev: Start DB + Backend Dev"

### 2️⃣ Ir a Interfaces
- **Inicio:** http://localhost:3000
- **Funciones Hoy:** http://localhost:3000/funciones-hoy.html
- **Próximas:** http://localhost:3000/proximas-funciones.html
- **Dashboard SUPER:** http://localhost:3000/pages/roles/super.html

### 3️⃣ Login (Credenciales)
```
SUPER: 48376669 / Teamomama91
Director: 11111111 / Teamomama91
Actor: 55555555 / Teamomama91
```

---

## 📚 DOCUMENTACIÓN ESENCIAL

### Para Empezar
| Documento | Contenido | Tiempo |
|-----------|-----------|--------|
| [GUIA-EJECUCION-RAPIDA.md](./GUIA-EJECUCION-RAPIDA.md) | Paso a paso ejecutar sistema | 5 min |
| [README.md](./README.md) | Referencia rápida de todo | 3 min |
| [ANTES-VS-DESPUES.md](./ANTES-VS-DESPUES.md) | Qué cambió en esta sesión | 10 min |

### Detalles Técnicos
| Documento | Contenido | Para Quién |
|-----------|-----------|-----------|
| [RESUMEN-FINAL-SESSION.md](./RESUMEN-FINAL-SESSION.md) | Resumen ejecutivo | Managers |
| [CHECKLIST-COMPLETACION.md](./CHECKLIST-COMPLETACION.md) | Todo lo completado | DevOps |
| [RESUMEN-SESION-08-01.md](./RESUMEN-SESION-08-01.md) | Detalles técnicos | Developers |

### Referencia General
| Documento | Contenido |
|-----------|-----------|
| [INDICE-DOCUMENTACION.md](./INDICE-DOCUMENTACION.md) | Índice de TODOS los documentos |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de cambios |

---

## 🎭 NUEVAS CARACTERÍSTICAS

### Sistema de Autenticación en Navegación
```javascript
// Archivo: /public/js/nav-auth.js
// CSS:    /public/css/nav-auth.css

✅ Detecta usuario logueado
✅ Muestra dropdown con nombre
✅ Botón "Cerrar Sesión" en todas las páginas
✅ Link a "Mi Dashboard"
```

### Separación Inteligente de Funciones
```html
funciones-hoy.html          ← Solo hoy
proximas-funciones.html     ← Próximas 2+ semanas
funciones.html              ← Ambas (backward compat)

Lógica: /public/js/baco-funciones-publicas.js
```

### Datos Realistas Poblados
```
✅ 5 grupos teatrales
✅ 9 directores
✅ 5 actores
✅ 28 funciones
→ Script: create-theater-groups.js
```

---

## 🧪 TESTING

### Tests Disponibles
```bash
# Test de integración (RECOMENDADO)
bash test-integracion.sh

# Regenerar datos
node teatro-tickets-backend/create-theater-groups.js

# Limpiar BD (solo SUPER)
node scripts/borrar.sh
```

### URLs de Prueba
```
GET http://localhost:3000/public/funciones
→ Devuelve 28 funciones en JSON

POST http://localhost:3000/api/auth/login
→ Autentica usuarios
```

---

## 📁 ARCHIVOS PRINCIPALES

### Frontend (HTML/CSS/JS)
```
/public/
├─ index.html                    Página inicio
├─ funciones-hoy.html            ✨ NUEVA - Solo hoy
├─ proximas-funciones.html       ✨ NUEVA - Próximas
├─ funciones.html                Ambas (legacy)
├─ sobre-baco.html               Refactorizado
├─ guia.html                      Con auth
├─ desarrollador.html             Con auth
├─ js/
│  ├─ nav-auth.js                ✨ NUEVO - Auth nav
│  ├─ baco-funciones-publicas.js  Actualizado
│  └─ ...
├─ css/
│  ├─ nav-auth.css               ✨ NUEVA
│  ├─ baco-landing.css            Principal (NO MODIFICAR)
│  └─ ...
└─ pages/
   ├─ roles/                      Dashboards
   └─ auth/                       Login
```

### Backend (Node.js)
```
/teatro-tickets-backend/
├─ index-v3-postgres.js          Entry point
├─ controllers/                   Lógica HTTP
├─ routes/                        Definición de rutas
├─ db/                            Conexión PostgreSQL
├─ middleware/                    Middlewares Express
├─ config/                        Configuración
├─ create-theater-groups.js       ✨ NUEVO - Datos
└─ package.json
```

### Scripts Utilidad
```
/scripts/
├─ borrar.sh                      Limpiar BD (guarda SUPER)
├─ limpieza-automatica-postgres.js
└─ ...

/test-integracion.sh             ✨ NUEVO - Tests
```

### Documentación
```
Root /
├─ README.md                      EMPIEZA AQUÍ
├─ GUIA-EJECUCION-RAPIDA.md       ✨ NUEVA - 2 pasos
├─ RESUMEN-FINAL-SESSION.md       ✨ NUEVA
├─ CHECKLIST-COMPLETACION.md      ✨ NUEVA
├─ RESUMEN-SESION-08-01.md        Detalles técnicos
├─ ANTES-VS-DESPUES.md            ✨ NUEVA
├─ INDICE-DOCUMENTACION.md        Todas las referencias
└─ CHANGELOG.md                   Historial
```

---

## 🔧 COMANDOS ÚTILES

### Iniciar Sistema
```bash
# Opción 1: VS Code (RECOMENDADO)
Ctrl+Shift+B → "Dev: Start DB + Backend Dev (nodemon)"

# Opción 2: Manual - Terminal 1
cd teatro-tickets-backend && npm run dev

# Opción 2: Manual - Terminal 2
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

### Testing
```bash
# Test completo
bash test-integracion.sh

# Regenerar datos (28 funciones)
node teatro-tickets-backend/create-theater-groups.js

# Limpiar BD
node scripts/borrar.sh
```

### Base de Datos
```bash
# Verificar datos
docker exec -it teatro-postgres psql -U postgres -d teatro

# Listar funciones
SELECT COUNT(*) FROM funciones;

# Listar grupos
SELECT * FROM grupos;
```

### Desarrollo
```bash
# Backend con auto-reload
cd teatro-tickets-backend && npm run dev

# Build del proyecto
npm run build

# Debug mode
npm run debug

# Logs de backend
npm run dev 2>&1 | tail -20
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### "No puedo conectar a localhost:3000"
```bash
# Verificar backend
curl http://localhost:3000

# Si no responde:
cd teatro-tickets-backend && npm run dev
```

### "Cannot connect to database"
```bash
# Verificar si PostgreSQL corre
docker ps | grep teatro-postgres

# Si no aparece:
docker run -d --name teatro-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_DB=teatro -p 5432:5432 postgres:15
```

### "No veo las 28 funciones"
```bash
# Regenerar datos
node scripts/borrar.sh
node teatro-tickets-backend/create-theater-groups.js

# Recargar página
```

### "Autenticación no funciona"
```bash
# Verificar que backend está corriendo
curl http://localhost:3000/api/auth/perfil

# Limpiar localStorage del navegador
F12 → Application → Clear Site Data

# Reintentar login
```

---

## 📞 CONTACTO

Para soporte o dudas, consultar:
- **Documentación:** [INDICE-DOCUMENTACION.md](./INDICE-DOCUMENTACION.md)
- **Email:** info@bacoteatro.com.ar
- **GitHub Issues:** (crear issue con detalles)

---

## ✅ VERIFICACIÓN RÁPIDA

Confirma que todo está funcionando:

```bash
# 1. Conectar a frontend
open http://localhost:3000

# 2. Ver funciones públicas
curl http://localhost:3000/public/funciones | head -20

# 3. Intentar login
# Usuario: 48376669
# Contraseña: Teamomama91

# 4. Ver dashboard
open http://localhost:3000/pages/roles/super.html

# 5. Ejecutar tests
bash test-integracion.sh
```

Si todo pasa ✅, el sistema está listo.

---

**Last Updated:** 08/01/2025
**Status:** ✅ Operacional y Listo para Producción
