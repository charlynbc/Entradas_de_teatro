# 🎭 BACO TEATRO - Sistema de Gestión de Entradas

Sistema integral de gestión y venta de entradas para teatro con autenticación por roles y dashboards personalizados.

---

## 🧠 Pitch (2 minutos)

> “Baco Teatro es un sistema de gestión integral para compañías teatrales.
> Resuelve el desorden en obras, entradas y dinero.”

> “Separa responsabilidades: el actor vende, el director valida, y el sistema audita todo.”

> “No procesa pagos ni factura: registra operaciones y genera reportes claros.”

---

## 🛡️ Legal y Auditoría (PASO 9)

- Términos y condiciones publicados
- Política de privacidad Ley 18.331 (Uruguay)
- Disclaimers en pantallas clave
- Auditoría completa de cambios críticos

Detalles y checklist: [PASO-9-COMPLETADO.md](PASO-9-COMPLETADO.md) · Guía: [QUICK-START-PASO-9.md](QUICK-START-PASO-9.md)

---

## 🚀 Ejecución Rápida (2 pasos)

### Opción 1: Con VS Code Tasks (Recomendado ⭐)

1. **Abre la paleta de comandos:** `Ctrl+Shift+B`
2. **Selecciona:** "Dev: Start DB + Backend Dev (nodemon)"
3. **Accede a:** http://localhost:3000

### Opción 2: Manual

```bash
# Terminal 1: Base de datos
cd /workspaces/Entradas_de_teatro
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15

# Terminal 2: Backend
cd teatro-tickets-backend
npm install
npm run dev

# Acceder a http://localhost:3000
```

---

## 📍 URLs Principales

| Sección | URL |
|---------|-----|
| Inicio | http://localhost:3000 |
| Funciones de Hoy | http://localhost:3000/funciones-hoy.html |
| Próximas Funciones | http://localhost:3000/proximas-funciones.html |
| Dashboard Super | http://localhost:3000/pages/roles/super.html |
| Dashboard Director | http://localhost:3000/pages/roles/admin.html |
| Dashboard Actor | http://localhost:3000/pages/roles/actor.html |

---

## 👤 Credenciales de Prueba

| Rol | Cédula | Contraseña |
|-----|--------|-----------|
| SUPER | 48376669 | Teamomama91 |
| DIRECTOR | 11111111 | Teamomama91 |
| ACTOR | 55555555 | Teamomama91 |

⚠️ **En producción:** Cambiar estas contraseñas inmediatamente.

---

## 📊 Datos Iniciales

El sistema viene **completamente poblado** con:

- ✅ **5 grupos teatrales:** La Candela, Los Trágicos, Etapas, Máscaras Teatro, Baco
- ✅ **9 directores** (1 por grupo + usuarios de prueba)
- ✅ **5 actores** integrados en los grupos
- ✅ **28 funciones próximas** (listas para vender entradas)
- ✅ **Usuario SUPER** para administración completa

### Regenerar datos

Para reiniciar con datos frescos:

```bash
node scripts/borrar.sh                    # Borra todo menos usuario SUPER
node teatro-tickets-backend/create-theater-groups.js  # Crea 28 funciones nuevas
```

---

## 🧪 Testing

```bash
# Ejecutar test de integración completo
bash test-integracion.sh
```

Este test valida:
- Conectividad del servidor
- Endpoints públicos (funciones)
- Autenticación (3 roles)
- Acceso a datos por rol
- Estado de páginas frontend
- Sistema de autenticación en navegación

---

## 🛠️ Scripts Disponibles

```bash
# Backend
npm run dev           # Desarrollo con auto-reinicio (nodemon)
npm run build         # Compilar proyecto
npm run debug         # Modo debug con inspector

# Base de datos
npm run migrate-phone-fk   # Aplicar migraciones
npm run verificar-db       # Verificar estado de BD

# Limpiar datos
npm run limpiar-db        # Borra todo excepto usuario SUPER
npm run limpiar-funciones-pasadas  # Elimina funciones con fecha pasada
```

---

## 🎯 Características

✅ Autenticación por roles (SUPER, DIRECTOR, ACTOR, INVITADO)
✅ Gestión de grupos teatrales y funciones
✅ Sistema de venta de entradas y reservas
✅ Dashboards personalizados por rol
✅ Sitio público de funciones (hoy y próximas)
✅ API REST completa (40+ endpoints)
✅ Navegación con autenticación integrada
✅ Página "Cerrar Sesión" con dropdown de usuario
✅ Página de guía por rol

---

## 📁 Estructura del Proyecto

```
Entradas_de_teatro/
├── public/                  # Frontend (HTML/CSS/JS estático)
│   ├── index.html          # Página de inicio
│   ├── funciones-hoy.html  # Funciones de hoy solamente
│   ├── proximas-funciones.html  # Próximas funciones
│   ├── sobre-baco.html     # Quiénes somos
│   ├── guia.html           # Guía de uso
│   ├── js/
│   │   ├── nav-auth.js     # Sistema de autenticación en navegación
│   │   ├── baco-funciones-publicas.js  # Cargar funciones dinámicamente
│   │   └── ...
│   └── css/
│       ├── baco-landing.css   # Estilos principales (DO NOT MODIFY)
│       ├── nav-auth.css       # Estilos del sistema de auth
│       └── ...
├── teatro-tickets-backend/
│   ├── index-v3-postgres.js   # Entry point del servidor
│   ├── controllers/            # Lógica de HTTP
│   ├── routes/                 # Definición de rutas
│   ├── db/                     # Conexión y helpers PostgreSQL
│   ├── middleware/             # Middlewares Express
│   ├── config/                 # Configuración
│   ├── create-theater-groups.js  # Script para crear datos de ejemplo
│   └── package.json
├── scripts/                    # Utilidades de línea de comando
├── tests/                      # Tests por rol
└── test-integracion.sh        # Test de integración general
```

---

## 🔐 Autenticación

El sistema utiliza:

- **JWT tokens:** Almacenados en `localStorage`
- **Duración:** 30 días
- **Roles:** SUPER, DIRECTOR, ACTOR, INVITADO
- **Logout:** Botón "Cerrar Sesión" en navegación, borra token automáticamente

---

## 🌐 API REST

Base URL: `http://localhost:3000/api`

**Público (sin autenticación):**
- `GET /public/funciones` - Listado de todas las funciones

**Autenticado (requiere JWT):**
- `GET /auth/perfil` - Datos del usuario logueado
- `POST /auth/login` - Autenticación
- `POST /auth/logout` - Cerrar sesión (frontend)
- Y 35+ endpoints más por rol...

Documentación completa en [INDICE-DOCUMENTACION.md](./INDICE-DOCUMENTACION.md)

---

## 📚 Documentación Adicional

- [Índice de Documentación](./INDICE-DOCUMENTACION.md)
- [Resumen de Sesión 08/01](./RESUMEN-SESION-08-01.md)
- [Cambios Recientes](./CHANGELOG.md)
- [Guías por Rol](./documentacion/)

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep teatro-postgres

# Reiniciar si es necesario
docker rm -f teatro-postgres
docker run -d --name teatro-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=teatro -p 5432:5432 postgres:15
```

### Error: "localhost:3000 not accessible"
```bash
# Verificar que el backend está corriendo
curl http://localhost:3000/public/funciones

# Si no responde, reiniciar backend con npm run dev
```

### Limpiar datos y empezar de cero
```bash
node scripts/borrar.sh
node teatro-tickets-backend/create-theater-groups.js
```

---

## 📄 Licencia

Baco Teatro © 2024 - Todos los derechos reservados

## 👥 Contacto

info@bacoteatro.com.ar
