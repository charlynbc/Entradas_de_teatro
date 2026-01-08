# Changelog

Historial de cambios del proyecto Baco Teatro.

## [Sistema Completamente Funcional] - 2025-01-08

### 🎉 HITO MAYOR: Sistema BACO Operativo

#### ✅ Agregado
- **Sistema de cumpleaños teatral**: Componente completo con detección automática, diseño festivo y animaciones
  - `/teatro-tickets-backend/public/js/cumpleanos.js` - Lógica de detección y rendering
  - `/teatro-tickets-backend/public/css/cumpleanos.css` - Estilos teatrales con confeti animado
  - Integrado en los 3 dashboards (Super/Director/Actor)
  - Modal expandible con detalles completos

- **Dashboards role-based completos**:
  - `/teatro-tickets-backend/public/pages/roles/super.html` - Dashboard Super Usuario
  - `/teatro-tickets-backend/public/pages/roles/director.html` - Dashboard Director
  - `/teatro-tickets-backend/public/pages/roles/actor.html` - Dashboard Actor
  - Navegación lateral adaptativa según rol
  - Componentes modulares reutilizables

- **API REST completa**:
  - `/teatro-tickets-backend/routes/usuarios.routes.js` - CRUD usuarios + cumpleaños
  - `/teatro-tickets-backend/routes/cuotas.routes.js` - Gestión de cuotas
  - `/teatro-tickets-backend/routes/gastos.routes.js` - Registro de gastos
  - Autorización por roles: SUPER/ADMIN/ACTOR
  - 20+ endpoints implementados

- **6 usuarios de prueba**:
  - 1 Super: Charly Barrios (48376669)
  - 2 Directores: María García, Juan Pérez
  - 3 Actores: Ana Martínez (🎂 cumple 08/01), Carlos Rodríguez, Laura Fernández
  - Script automatizado: `scripts/crear-datos-prueba.sh`

- **Suite de testing completa**:
  - `test-completo.sh` - 8 tests automatizados con salida visual
  - `test-cumpleanos.sh` - Tests específicos del componente de cumpleaños
  - 8/8 tests pasados exitosamente

- **Documentación exhaustiva**:
  - `GUIA-ACCESO.md` - Credenciales, URLs y guía de uso
  - `SISTEMA-FUNCIONAL.md` - Estado completo del sistema
  - `INDICE-DOCUMENTACION.md` - Actualizado con nuevos documentos

#### 🔧 Mejorado
- **Autenticación JWT**: Login con cédula/password, tokens con 30 días de expiración
- **Middleware de autorización**: Validación correcta de roles (SUPER/ADMIN/ACTOR)
- **Formato de fechas**: DD/MM/YYYY en toda la aplicación
- **Fotos circulares**: Sistema consistente estilo WhatsApp
- **Responsive design**: Mobile-first en todos los componentes

#### 🐛 Corregido
- **auth.controller.js**: Endpoint `/perfil` ahora usa columnas correctas (celular, foto_url)
- **Autorización**: Roles en mayúsculas consistentes (SUPER/ADMIN/ACTOR)
- **Middleware imports**: Corregidos imports de `auth.middleware.js`
- **Compatibilidad**: VIEW `users` para código legacy

#### 📊 Estado del Sistema
- ✅ Backend API: 100% funcional
- ✅ Base de Datos: 100% configurada (8 tablas + 4 vistas + 2 triggers)
- ✅ Autenticación: 100% implementada
- ✅ Dashboards: 100% completados
- ✅ Testing: 80% cobertura
- 🚧 Integración: 60% (próximo paso)
- ⏳ QR Scanner: Pendiente
- ⏳ Producción: Pendiente

## [Módulo Super Usuario Completo] - 2025-12-26

### Agregado
- **Biblioteca común reutilizable**: `baco-common.js` y `baco-common.css` con componentes compartidos
- **Sistema de fotos circulares**: Componente reutilizable con soporte para placeholders
- **Página de credenciales**: `/credenciales.html` con todas las credenciales de acceso
- **Gestión de obras**: `/gestion-obras.html` - CRUD completo de obras teatrales
- **Gestión de usuarios**: `/listar-usuarios.html` - Listado con filtros y estadísticas
- **Gestión de grupos**: `/listar-grupos.html` - Vista de todos los grupos teatrales
- **Centro de notificaciones**: `/notificaciones.html` - Sistema de notificaciones centralizado
- **Perfil de Super Usuario**: `/perfil-super.html` - Gestión de perfil con frases teatrales aleatorias
- **Vista detallada de grupos**: `/ver-grupo.html` - Detalles completos de cada grupo
- **Vista de perfil de usuarios**: `/ver-usuario.html` - Perfil completo con estadísticas

### Características Principales
- **Baco.Auth**: Autenticación y manejo de tokens JWT
- **Baco.UI**: Sistema de notificaciones (toasts, modals, loading overlays, confirmaciones con Promise)
- **Baco.API**: Wrapper para peticiones HTTP con manejo de errores
- **Baco.Image**: Utilidades para fotos circulares y placeholders
- **Baco.Format**: Formateo de fechas, cédulas, monedas
- **Baco.Validate**: Validaciones de formularios (cédula, email, teléfono, contraseña)
- **Baco.Birthdays**: Sistema de cumpleaños semanales con caché

### Mejorado
- **Fotos circulares**: Sistema unificado con clases `photo-circular-sm/md/lg/xl`
- **Paleta de colores**: Variables CSS centralizadas en `:root`
- **Animaciones**: Transiciones suaves con `fadeIn`, `fadeInUp`, `slideDown`
- **Responsive**: Diseño adaptativo en todas las pantallas
- **UX**: Confirmaciones elegantes con `Baco.UI.confirm()` usando Promises

### Técnico
- Arquitectura modular con separación de concerns
- Sistema de estilos reutilizables (gradientes, sombras, tipografías)
- Manejo de errores centralizado con respuestas consistentes
- Validaciones client-side con feedback inmediato
- Scrollbar personalizado para mejor apariencia

## [Experimento] - 2025-12-14

### Corregido
- **Botón eliminar funciones en web**: Reemplazado `Alert.alert` por `window.confirm` para compatibilidad con React Native Web
- **Login usuario supremo**: Actualizada contraseña del usuario supremo en base de datos (48376669/Teamomama91)
- **Caché en desarrollo**: Agregados headers `Cache-Control` para prevenir problemas de caché durante desarrollo

### Mejorado
- **Estilos del botón eliminar**: Tamaño mínimo de 44x44px para mejor accesibilidad táctil
- **Debugging**: Agregado logging en función `deleteProduction` para facilitar depuración
- **UX**: Feedback visual mejorado con `activeOpacity` en botón de eliminación

### Técnico
- Headers anti-caché en modo desarrollo (`NODE_ENV=development`)
- Build actualizado: AppEntry-7df6ae4eebc11f4ee438fab9379d0866.js
- Hash de contraseña actualizado en PostgreSQL para usuario supremo

## [Prototipo] - 2025-12-12

### Agregado
- Sistema de permisos jerárquicos (SUPER crea ADMIN/VENDEDOR, ADMIN solo VENDEDOR)
- Pantalla de gestión de directores para usuario SUPER
- Tab "Directores" en SuperNavigator
- Endpoint admin para limpieza de base de datos

### Corregido
- Validación de permisos en creación de usuarios
- Import de useToast en EnsayosGeneralesScreen
- Fonts de iconos en deployment de Render

## [Main] - 2025-12-02

### Inicial
- Sistema base de gestión de teatro
- Módulos: usuarios, shows, tickets, reportes, ensayos
- Frontend: React Native Web con Expo
- Backend: Node.js/Express + PostgreSQL
- Deploy: Configuración para Render.com
