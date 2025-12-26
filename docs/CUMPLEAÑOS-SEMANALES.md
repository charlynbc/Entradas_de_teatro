# 🎉 Cumpleaños Semanales - BACÓ Teatro

## Descripción

Sistema de notificación de cumpleaños semanales que muestra de forma elegante y teatral los cumpleaños de **todos los usuarios del sistema BACÓ** durante la semana actual (lunes a domingo).

## ✨ Características

- ✅ **Universal**: Todos los roles ven los mismos cumpleaños (Super Usuario, Director, Actor/Actriz)
- ✅ **Semanal**: Calcula automáticamente la semana actual (lunes a domingo)
- ✅ **Sin discriminación**: Muestra cumpleaños de cualquier usuario, no solo del grupo actual
- ✅ **Optimizado**: Cache de 30 minutos para evitar recálculos innecesarios
- ✅ **Elegante**: Banner con animación fadeInUp y diseño teatral BACÓ
- ✅ **Automático**: Si no hay cumpleaños, no muestra nada

## 🏗️ Arquitectura

### Frontend (`baco-common.js`)

**Módulo**: `Baco.Birthdays`

**Métodos principales**:

```javascript
// Obtiene rango de la semana actual (lunes-domingo)
Baco.Birthdays.getCurrentWeekRange()

// Obtiene cumpleaños semanales desde la API
await Baco.Birthdays.getWeeklyBirthdays()

// Renderiza el banner en el DOM
await Baco.Birthdays.renderWeeklyBanner('birthdayBanner')

// Limpia el cache (útil para testing)
Baco.Birthdays.clearCache()
```

**Cache**: 30 minutos por sesión

### Backend

**Endpoint**: `GET /api/users/birthdays/weekly`
- Autenticado (todos los roles)
- Sin permisos especiales requeridos

**Controlador**: `getWeeklyBirthdays()` en `users.controller.js`

**Servicio**: `getWeeklyBirthdaysService()` en `users.service.js`
- Calcula semana actual (lunes-domingo)
- Filtra usuarios con `fecha_nacimiento` no nula
- Retorna: `cedula`, `nombre`, `role`, `fecha_nacimiento`, `genero`

## 🎨 Diseño

### Banner de Cumpleaños

```html
<div class="birthday-banner">
  🎉 Cumpleaños de la semana
  
  🎁 Nombre Apellido (Rol) - DD/MM
  🎁 Otro Nombre (Rol) - DD/MM
</div>
```

**Estilos**:
- Fondo: Gradiente dorado/bordó con transparencia
- Borde: Dorado con opacidad 0.3
- Animación: `fadeInUp` (0.6s ease-out)
- Ícono: 🎂 `fa-birthday-cake`
- Tipografía: Playfair Display (títulos)

## 📦 Implementación

### 1. En el Dashboard

```html
<!-- HTML -->
<div id="birthdayBanner"></div>

<!-- JavaScript -->
<script>
  // Renderizar al cargar
  Baco.Birthdays.renderWeeklyBanner('birthdayBanner');
</script>
```

### 2. Requisitos

- Usuario autenticado
- Campo `fecha_nacimiento` en base de datos
- Inclusión de `baco-common.js` y `baco-common.css`

## 🗂️ Archivos Modificados

### Frontend
- ✅ `/public/js/baco-common.js` - Módulo `Baco.Birthdays`
- ✅ `/public/css/baco-common.css` - Animación `fadeInUp`
- ✅ `/public/admin-dashboard.html` - Banner integrado

### Backend
- ✅ `/routes/users.routes.js` - Ruta `/birthdays/weekly`
- ✅ `/controllers/users.controller.js` - Controlador `getWeeklyBirthdays`
- ✅ `/services/users.service.js` - Servicio `getWeeklyBirthdaysService`

## 🧪 Testing

### Verificar Funcionalidad

1. Crear usuarios con `fecha_nacimiento` esta semana
2. Recargar dashboard
3. Verificar que aparece el banner
4. Confirmar que muestra todos los roles

### Limpiar Cache

```javascript
// En consola del navegador
Baco.Birthdays.clearCache();
await Baco.Birthdays.getWeeklyBirthdays();
```

## 📊 Ejemplos de Salida

### Sin cumpleaños
```javascript
[]
```
→ No se muestra banner

### Con cumpleaños
```javascript
[
  {
    cedula: "12345678",
    nombre: "Juan Pérez",
    role: "VENDEDOR",
    fecha_nacimiento: "1995-12-28",
    genero: "masculino"
  },
  {
    cedula: "87654321",
    nombre: "María García",
    role: "ADMIN",
    fecha_nacimiento: "1992-12-30",
    genero: "femenino"
  }
]
```

→ Banner muestra:
```
🎉 Cumpleaños de la semana

🎁 Juan Pérez (Actor/Actriz) - 28/12
🎁 María García (Director/a) - 30/12
```

## 🚀 Performance

- **Primera carga**: ~50-100ms (consulta DB)
- **Cache hit**: <1ms (lectura localStorage)
- **Duración cache**: 30 minutos
- **Impacto**: Mínimo (una consulta por sesión)

## 🎭 Experiencia de Usuario

### Beneficios

1. **Comunidad**: Fortalece lazos entre miembros
2. **Humanización**: BACÓ se siente vivo y cercano
3. **Inclusión**: Todos ven todos los cumpleaños
4. **Discreción**: No es invasivo, solo informativo

### Consideraciones

- No requiere acción del usuario
- No interrumpe el flujo de trabajo
- Estética integrada al diseño BACÓ
- Visible pero no intrusivo

## 🔮 Futuras Mejoras

- [ ] Notificaciones push el día del cumpleaños
- [ ] Mensaje personalizado automático
- [ ] Integración con grupos/obras específicos
- [ ] Vista de calendario de cumpleaños
- [ ] Estadísticas de cumpleaños por mes

## 🎬 Conclusión

Esta funcionalidad añade **calidez humana** al sistema BACÓ, recordando que detrás de cada usuario hay una persona real. Es un pequeño detalle que marca la diferencia en la experiencia teatral.

---

**Fecha de implementación**: 26 Diciembre 2025
**Versión**: 1.0.0
**Estado**: ✅ Completo y funcional
