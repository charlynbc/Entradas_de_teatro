# 🎭 Baco Teatro - Sistema de Venta de Entradas

Sistema completo de gestión y venta de entradas para teatro con diseño teatral profesional.

## 🚀 Características

- ✨ **Sistema virgen** - Se entrega sin datos precargados
- 👤 **Usuario supremo** inicial para configuración
- 🎫 **Venta de entradas** con generación de PDF
- 📧 **Envío por Email** y WhatsApp
- 🎨 **Diseño teatral** profesional y responsive
- 📱 **Optimizado para móviles**

## 📦 Instalación

```bash
# Clonar repositorio
git clone <url-del-repo>
cd Entradas_de_teatro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor
npm start
```

## 🎯 Primera Configuración

El sistema se entrega **completamente virgen** con solo:

### Usuario Supremo Inicial

- **Email:** `admin@bacoteatro.com`
- **Password:** `admin123`
- **Rol:** Supremo

⚠️ **IMPORTANTE:** Cambiar la contraseña inmediatamente después del primer acceso.

## 🛠️ Scripts Disponibles

```bash
# Iniciar servidor
npm start

# Desarrollo con auto-reinicio
npm run dev

# Limpiar base de datos (mantiene usuario supremo)
npm run limpiar-db

# Verificar estado de la base de datos
npm run verificar-db

# Preparar para entrega (limpiar + verificar)
npm run preparar-entrega
```

## 📊 Verificar Sistema Virgen

Para verificar que el sistema está virgen:

```bash
npm run verificar-db
```

Debe mostrar:
- ✅ Obras: 0
- ✅ Entradas: 0
- ✅ Usuarios: 1 (solo supremo)
- ✅ Estado: VIRGEN

## 🗂️ Estructura del Proyecto

```
Entradas_de_teatro/
├── models/              # Modelos de MongoDB
│   ├── Obra.js
│   ├── Entrada.js
│   └── Usuario.js
├── public/              # Archivos estáticos
│   ├── styles/
│   │   ├── common.css
│   │   ├── index.css
│   │   └── contacto.css
│   ├── images/
│   │   └── logo-baco.svg
│   ├── index.html
│   ├── contacto.html
│   └── script.js
├── scripts/             # Scripts de utilidad
│   ├── limpiar-db.js
│   └── verificar-db.js
├── server.js            # Servidor principal
├── package.json
└── README.md
```

## 🎨 Características del Diseño

- 🎭 Logo de Baco Teatro en todas las páginas
- 🎪 Cortina teatral animada
- 🎨 Paleta de colores: Rojo oscuro y Dorado
- 📱 Diseño responsive
- ✨ Efectos hover y animaciones sutiles

## 📧 Configuración de Email (Opcional)

Para habilitar envío de entradas por email:

1. Configurar en `.env`:
```bash
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
```

2. Para Gmail, crear App Password:
   - Ir a Cuenta Google → Seguridad
   - Verificación en dos pasos → Contraseñas de aplicaciones

## 📱 WhatsApp

El sistema genera enlaces de WhatsApp para enviar entradas directamente.

## 🔒 Seguridad

- ⚠️ Cambiar contraseña del usuario supremo
- 🔐 Configurar variables de entorno en producción
- 🛡️ No compartir credenciales de email

## 🐛 Solución de Problemas

### Base de datos no se conecta
```bash
# Verificar que MongoDB está corriendo
sudo systemctl status mongodb
```

### Limpiar datos de prueba
```bash
npm run limpiar-db
```

### Verificar estado
```bash
npm run verificar-db
```

## 📄 Licencia

Baco Teatro © 2024 - Todos los derechos reservados

## 👥 Soporte

Para consultas: info@bacoteatro.com.ar
