# Changelog

Historial de cambios del proyecto Baco Teatro.

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
