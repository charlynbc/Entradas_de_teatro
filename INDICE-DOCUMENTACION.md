# 📚 ÍNDICE DE DOCUMENTACIÓN - BACÓ TEATRO

**Última actualización:** 08/01/2025 - ✅ **Sistema Funcional, Limpio y Listo para Producción**

---

## 🚀 INICIO RÁPIDO

### Para Empezar
**👉 PRIMERO LEE:** [GUIA-EJECUCION-RAPIDA.md](./GUIA-EJECUCION-RAPIDA.md)

Con VS Code Tasks:
1. Presiona: `Ctrl+Shift+B`
2. Selecciona: "Dev: Start DB + Backend Dev (nodemon)"
3. Accede: http://localhost:3000

Manual:
1. Backend: `cd teatro-tickets-backend && npm run dev`
2. Base de datos: `docker run -d --name teatro-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=teatro -p 5432:5432 postgres:15`
3. Acceder: http://localhost:3000

### URLs Principales
- **Inicio**: http://localhost:3000
- **Funciones de Hoy**: http://localhost:3000/funciones-hoy.html (✨ NUEVA)
- **Próximas Funciones**: http://localhost:3000/proximas-funciones.html (✨ NUEVA)
- **Dashboard SUPER**: http://localhost:3000/pages/roles/super.html
- **Dashboard Director**: http://localhost:3000/pages/roles/admin.html
- **Dashboard Actor**: http://localhost:3000/pages/roles/actor.html

---

## 📖 DOCUMENTACIÓN FUNCIONAL

### ✨ Nuevas Características (Sesión 08/01)
- **Navegación con Autenticación:** Sistema unificado de login/logout en todas las páginas
- **Separación de Funciones:** Ahora hay 2 páginas (funciones-hoy vs próximas-funciones)
- **28 Funciones Reales:** 5 grupos teatrales con datos de prueba realistas
- **Datos Poblados:** Sistema viene con actores, directores y funciones lista para usar

### Guías de Usuario por Rol
- [Manual Actor/Vendedor](./documentacion/manuales/MANUAL_ACTOR.md)
- [Manual Director](./documentacion/manuales/MANUAL_DIRECTOR.md)
- [Manual Comprador](./documentacion/manuales/MANUAL_COMPRADOR.md)

### Sistema y Funcionalidades
- [Cómo Funciona](./documentacion/como-funciona.md)
- [Arquitectura Grupos → Obras → Funciones](./docs/ARQUITECTURA-GRUPOS-OBRAS.md)
- [Sistema de Fotos en Funciones](./docs/SISTEMA-FOTOS-FUNCIONES.md)
- [Cumpleaños Semanales](./docs/CUMPLEAÑOS-SEMANALES.md)

---

## 🏗️ DOCUMENTACIÓN TÉCNICA

### Resúmenes Recientes
- [Resumen Final de Sesión](./RESUMEN-FINAL-SESSION.md) ⭐ **LEER PRIMERO**
- [Resumen Sesión 08/01](./RESUMEN-SESION-08-01.md)

### Arquitectura y Diseño
- [Arquitectura del Sistema](./documentacion/arquitectura/ARCHITECTURE.md)
- [Perfil Super Usuario](./documentacion/modulo-perfil-super-usuario.md)

### Deploy y DevOps
- [Resumen Deploy Final](./documentacion/deploy/RESUMEN-DEPLOY-FINAL.md)
- [Deploy Render Backend](./documentacion/deploy/DEPLOY-RENDER-backend.md)
- [Deploy Render Frontend](./documentacion/deploy/DEPLOY-RENDER-frontend.md)
---

## 🧪 Testing

Ejecuta los tests para validar el sistema:

```bash
# Test completo de integración (RECOMENDADO)
bash test-integracion.sh

# Regenerar datos reales
node teatro-tickets-backend/create-theater-groups.js

# Limpiar base de datos (solo SUPER)
node scripts/borrar.sh
```

---

## 🧠 Referencia Rápida

### Inicio Rápido (2 min)
```bash
# Opción 1: VS Code Tasks (RECOMENDADO)
Ctrl+Shift+B → "Dev: Start DB + Backend Dev (nodemon)"

# Opción 2: Manual
cd teatro-tickets-backend && npm run dev
```

### Base de Datos (Ya Poblada)
```bash
# Base de datos con 28 funciones (preseleccionada)
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 \
  postgres:15
```

### Credenciales de Prueba

| Usuario | Cedula | Rol | Password |
|---------|--------|-----|----------|
| Charly | 48376669 | SUPER | Teamomama91 |
| Gustavo | 12345678 | ADMIN | Teamomama91 |

---

## 📱 Páginas Principales

### Públicas
- `/` - Inicio con botones de navegación
- `/funciones-hoy.html` - Funciones de hoy
- `/proximas-funciones.html` - Próximas funciones
- `/sobre-baco.html` - Sobre BACO
- `/guia.html` - Cómo usar el sistema
- `/desarrollador.html` - Información del desarrollador

### Autenticadas (Dashboards)
- `/pages/roles/super.html` - Dashboard Super Usuario
- `/pages/roles/admin.html` - Dashboard Director
- `/pages/roles/actor.html` - Dashboard Actor/Vendedor

### Administración
- `/pages/auth/login.html` - Login
- `/pages/usuarios/` - Gestión de usuarios
- `/pages/grupos/` - Gestión de grupos
- `/pages/obras/` - Gestión de obras

---

## 🏗️ Estructura del Código

```
teatro-tickets-backend/
├── public/
│   ├── pages/
│   │   ├── roles/       # Dashboards por rol
│   │   ├── auth/        # Autenticación
│   │   ├── usuarios/    # Gestión de usuarios
│   │   ├── grupos/      # Gestión de grupos
│   │   └── obras/       # Gestión de obras
│   ├── js/              # JavaScript público
│   ├── css/             # Estilos
│   └── images/          # Imágenes
├── controllers/         # Lógica de negocio
├── routes/             # Rutas API
├── middleware/         # Autenticación y autorización
├── db/                 # Configuración de BD
└── ...
```

---

## 📚 Documentación Disponible

- `README.md` - Este archivo
- `INDICE-DOCUMENTACION.md` - Documentación centralizada
- `documentacion/README.md` - Guía general
- `documentacion/como-funciona.md` - Funcionamiento del sistema
- `documentacion/arquitectura/ARCHITECTURE.md` - Arquitectura técnica
- `documentacion/deploy/` - Guías de deployment
- `documentacion/manuales/` - Manuales de usuario por rol
- `docs/` - Documentación de características específicas

---

## 🔍 Información por Rol

### 👑 Super Usuario
- Acceso total al sistema
- Gestión de todos los usuarios, grupos y obras
- Reportes y auditoría
- Dashboard: `/pages/roles/super.html`

### 👨‍💼 Director (ADMIN)
- Gestión de su grupo y sus obras
- Creación de funciones
- Gestión de actores/vendedores
- Dashboard: `/pages/roles/admin.html`

### 🎭 Actor (VENDEDOR)
- Venta de entradas
- Ver funciones disponibles
- Generar PDFs de entradas
- Dashboard: `/pages/roles/actor.html`

### 👤 Invitado (sin autenticación)
- Ver funciones públicas
- Ver sobre BACO
- Leer guía de uso

---

## 🚀 Para Continuar el Desarrollo

### Tareas Pendientes
- [ ] Crear más grupos teatrales de prueba
- [ ] Testing completo con datos reales
- [ ] Implementar QR Scanner
- [ ] Mejorar UX del dashboard
- [ ] Agregar más funcionalidades

### Mejoras Futuras
- Sistema de notificaciones por email/SMS
- Integración con sistemas de pago
- App móvil mejorada
- Sistema de reportes avanzado

---

**Última actualización:** Enero 8, 2026  
**Versión:** 3.0.0
