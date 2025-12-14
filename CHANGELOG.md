# Changelog

Historial de cambios del proyecto Baco Teatro.

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
