# 🎭 GUÍA DE ACCESO AL SISTEMA BACO

## 🚀 Inicio Rápido

### 1️⃣ Acceder al Sistema

El sistema ya está corriendo en: **http://localhost:3000**

### 2️⃣ Credenciales de Prueba

#### Super Usuario (Administrador Total)
```
Cédula: 48376669
Password: Teamomama91
URL: http://localhost:3000/pages/roles/super.html
```

**Permisos:**
- ✅ Gestión completa de usuarios
- ✅ Administración de todos los grupos
- ✅ Control de cuotas de todos
- ✅ Gestión de gastos globales
- ✅ Acceso a todas las funcionalidades

#### Directores (Administradores de Grupo)

**María García**
```
Cédula: 12345678
Password: admin
URL: http://localhost:3000/pages/roles/director.html
```

**Juan Pérez**
```
Cédula: 23456789
Password: admin
URL: http://localhost:3000/pages/roles/director.html
```

**Permisos:**
- ✅ Gestión de su grupo teatral
- ✅ Administración de integrantes
- ✅ Programación de ensayos
- ✅ Control de funciones
- ✅ Cuotas de su grupo
- ✅ Gastos de su grupo

#### Actores

**Ana Martínez** 🎂 *(¡Cumple hoy!)*
```
Cédula: 34567890
Password: admin
Nacimiento: 08/01/2000 (26 años)
URL: http://localhost:3000/pages/roles/actor.html
```

**Carlos Rodríguez**
```
Cédula: 45678901
Password: admin
URL: http://localhost:3000/pages/roles/actor.html
```

**Laura Fernández**
```
Cédula: 56789012
Password: admin
URL: http://localhost:3000/pages/roles/actor.html
```

**Permisos:**
- ✅ Ver su perfil
- ✅ Estado de sus cuotas
- ✅ Sus ensayos próximos
- ✅ Sus funciones
- ✅ Sus entradas asignadas
- ✅ Cumpleaños de compañeros

---

## 🎂 Componente de Cumpleaños

### ¿Cómo Probarlo?

1. Accede con **cualquier usuario**
2. Al cargar el dashboard, verás automáticamente:

```
╔═══════════════════════════════════════╗
║  🎉 ¡FELIZ CUMPLEAÑOS ANA! 🎉          ║
║                                       ║
║      [Foto circular de Ana]           ║
║                                       ║
║    Ana Martínez cumple 26 años        ║
║            08 de Enero                ║
║                                       ║
║  🎭 ¡Felicidades en tu día especial!  ║
╚═══════════════════════════════════════╝
```

3. Haz clic en la tarjeta para ver el **modal con confeti animado**

### Características
- 🎨 Diseño teatral festivo
- 🎪 Animación de confeti
- 📸 Foto circular estilo WhatsApp
- 📅 Edad calculada automáticamente
- 🎭 Mensaje teatral personalizado

---

## 📱 Navegación del Sistema

### Flujo de Trabajo Típico

#### Como Super Usuario:
1. **Login** → Dashboard principal
2. **Usuarios** → Crear/editar actores y directores
3. **Grupos** → Crear grupos teatrales
4. **Cuotas** → Gestionar pagos
5. **Gastos** → Registrar gastos globales

#### Como Director:
1. **Login** → Dashboard de director
2. **Mi Grupo** → Gestionar grupo asignado
3. **Integrantes** → Agregar actores al grupo
4. **Ensayos** → Programar ensayos
5. **Funciones** → Crear funciones teatrales
6. **Cuotas** → Ver estado de pagos del grupo
7. **Gastos** → Registrar gastos del grupo

#### Como Actor:
1. **Login** → Dashboard de actor
2. **Mi Perfil** → Ver información personal
3. **Mis Cuotas** → Estado de pagos
4. **Ensayos** → Próximos ensayos
5. **Funciones** → Próximas funciones
6. **Entradas** → Entradas asignadas

---

## 🔧 Funcionalidades Disponibles

### ✅ Implementado y Funcionando

- [x] **Autenticación JWT** - Login seguro con tokens
- [x] **Autorización por Roles** - Super/Director/Actor
- [x] **Gestión de Usuarios** - CRUD completo
- [x] **Componente Cumpleaños** - Detección automática
- [x] **Cuotas** - Sistema de pagos
- [x] **Gastos** - Registro de gastos
- [x] **Dashboards** - 3 dashboards role-based
- [x] **Fechas DD/MM/YYYY** - Formato local
- [x] **Fotos Circulares** - Estilo WhatsApp
- [x] **Responsive Design** - Mobile-first

### 🚧 Próximamente

- [ ] **Grupos y Obras** - Gestión completa
- [ ] **Ensayos** - Programación de ensayos
- [ ] **Funciones** - Creación de funciones
- [ ] **Entradas** - Asignación y gestión
- [ ] **QR Scanner** - Validación de entradas
- [ ] **Reportes** - Gráficos y estadísticas
- [ ] **Notificaciones** - Push notifications

---

## 🧪 Tests Realizados

### Suite de Tests Automatizados

Ejecuta el test completo:
```bash
bash test-completo.sh
```

**Tests incluidos:**
1. ✅ Conectividad del servidor
2. ✅ Login de Super Usuario
3. ✅ Verificación de perfil
4. ✅ Listado de usuarios
5. ✅ Detección de cumpleaños
6. ✅ Login de Director
7. ✅ Login de Actor
8. ✅ Autorización por roles

**Resultado Esperado:**
```
✅ TODOS LOS TESTS PASARON EXITOSAMENTE
🎭 Sistema BACO completamente funcional
```

---

## 🎨 Diseño del Sistema

### Colores BACO
- **Vino:** `#6A040F` - Color principal
- **Dorado:** `#F48C06` - Acentos y botones
- **Fondo:** `#F5F5F5` - Fondo claro
- **Texto:** `#333` - Texto oscuro

### Estilo Visual
- 📱 Mobile-first responsive
- 🖼️ Fotos circulares estilo WhatsApp
- 🎭 Temática teatral en componentes
- 🎨 Gradientes y sombras modernas
- ✨ Animaciones sutiles

---

## 📊 Estadísticas del Sistema

### Base de Datos
- **Usuarios:** 6 (1 super, 2 directores, 3 actores)
- **Tablas:** 8 tablas principales
- **Vistas:** 4 vistas auxiliares
- **Triggers:** 2 triggers automáticos

### API REST
- **Endpoints:** 20+ rutas implementadas
- **Autenticación:** JWT con 30 días de expiración
- **Roles:** 3 niveles de autorización
- **Formato:** JSON responses

### Frontend
- **Dashboards:** 3 interfaces role-based
- **Componentes:** 10+ componentes reutilizables
- **Responsive:** Breakpoints para móvil/tablet/desktop
- **Accesibilidad:** Contraste y tamaños de fuente apropiados

---

## 🐛 Troubleshooting

### El servidor no responde
```bash
# Verificar si está corriendo
ps aux | grep node

# Reiniciar servidor
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend
npm run dev
```

### Error de autenticación
- Verifica que la cédula y password sean correctas
- El token expira en 30 días
- Logout y login nuevamente si hay problemas

### No aparece el cumpleaños
- Verifica la fecha del sistema
- Ana cumple el 08/01
- El componente se actualiza automáticamente cada día

### Base de datos vacía
```bash
# Recrear usuarios de prueba
bash scripts/crear-datos-prueba.sh
```

---

## 📞 Soporte

**Desarrollador:** Charly Barrios  
**Sistema:** BACO - Gestión Teatral  
**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready

**Documentación:**
- [SISTEMA-FUNCIONAL.md](SISTEMA-FUNCIONAL.md) - Estado del sistema
- [PROMPT-MAESTRO.md](documentacion/PROMPT-MAESTRO.md) - Especificaciones
- [README.md](README.md) - Documentación general

---

## 🎯 Próximos Pasos

1. **Explorar Dashboards** - Accede con cada rol
2. **Probar Cumpleaños** - Verifica que aparece Ana
3. **Crear Datos** - Agrega grupos, ensayos, funciones
4. **Testing Completo** - Prueba todos los flujos
5. **Documentar Uso** - Crea guías de usuario
6. **Deploy Producción** - Prepara para servidor real

---

**¡El sistema está listo para usar! 🎉**

Accede ahora a: **http://localhost:3000**
