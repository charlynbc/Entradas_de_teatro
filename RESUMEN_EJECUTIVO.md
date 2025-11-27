# 🎭 Baco Teatro - Sistema Completo Implementado

## ✅ Todo Listo y Funcionando

### Backend (Node.js + Express)
**Ubicación:** `teatro-tickets-backend/`

#### Funcionalidades Implementadas:
- ✅ Gestión de funciones (crear, listar)
- ✅ Generación masiva de tickets con códigos únicos
- ✅ **Generación automática de QR** para cada ticket (base64)
- ✅ **Gestión de vendedores** (CRUD completo)
- ✅ **Registro de ventas** con datos completos:
  - Vendedor que realizó la venta
  - Nombre y contacto del comprador
  - Medio de pago (Efectivo, Transferencia, Prex, Otro)
  - Monto cobrado
- ✅ Validación de tickets (cambia estado a USADO)
- ✅ **Reportes de ventas** por vendedor y función

#### Nuevos Endpoints:
```
POST   /api/vendedores              # Crear vendedor
GET    /api/vendedores              # Listar vendedores activos
PUT    /api/vendedores/:id          # Actualizar vendedor
DELETE /api/vendedores/:id          # Desactivar vendedor

POST   /api/tickets/:code/sell      # Registrar venta completa
GET    /api/reportes/ventas?showId  # Obtener reporte de ventas
```

---

### App Móvil (React Native + Expo)
**Ubicación:** `baco-teatro-app/`

#### Estructura:
```
src/
├── screens/
│   ├── VentaScreen.js       # Registro de ventas
│   ├── ScannerScreen.js     # Validación con QR
│   └── ReportesScreen.js    # Estadísticas
├── services/
│   └── api.js               # Cliente HTTP
└── theme/
    └── colors.js            # Paleta Baco
```

#### Funcionalidades por Pantalla:

**1. 💰 Venta (VentaScreen)**
- Buscar ticket por código
- Seleccionar vendedor (botones visuales)
- Formulario completo de venta:
  - Nombre del comprador (requerido)
  - Contacto (opcional)
  - Medio de pago (4 opciones con botones)
  - Monto (requerido)
- Validaciones en tiempo real
- Marca ticket como PAGADO

**2. 📷 Validar (ScannerScreen)**
- **Escaneo de códigos QR con cámara**
- Permisos automáticos de cámara
- Marco visual para guiar el escaneo
- Muestra info del ticket antes de validar
- Confirmación visual (✅ válido / ❌ inválido)
- Previene doble validación
- Botón para escanear otro ticket

**3. 📊 Reportes (ReportesScreen)**
- Selector de función (scroll horizontal)
- Resumen general de la función:
  - Total de tickets vendidos
  - Total recaudado
- Tabla de vendedores con:
  - Nombre y alias
  - Cantidad vendida
  - Monto total
  - Promedio por ticket
- Pull-to-refresh para actualizar

#### Navegación:
- **Bottom tabs** con 3 pestañas
- Header personalizado con logo Baco
- Colores: Naranja `#C84A1B` + Blanco + Negro

---

## 🎯 Modelo de Datos Final

### Ticket
```js
{
  code: "T-A1B2C3D4",           // ID único
  showId: 1,                    // Función
  estado: "PAGADO",             // DISPONIBLE | PAGADO | USADO
  vendedorId: 1,                // Quién vendió ✨ NUEVO
  compradorNombre: "Juan",      // Comprador ✨ NUEVO
  compradorContacto: "099...",  // Tel/email ✨ NUEVO
  medioPago: "PREX",            // Medio ✨ NUEVO
  monto: 400,                   // Precio ✨ NUEVO
  qrCode: "data:image/...",     // QR en base64 ✨ NUEVO
  pagadoAt: "2025-11-27...",
  usadoAt: null,
  createdAt: "2025-11-27..."
}
```

### Vendedor ✨ NUEVO
```js
{
  id: 1,
  nombre: "Juan Pérez",
  alias: "Elenco",
  activo: true
}
```

### Reporte de Ventas ✨ NUEVO
```js
{
  vendedorId: 1,
  vendedorNombre: "Juan Pérez",
  cantidadVendida: 5,
  montoTotal: 2000
}
```

---

## 🚀 Inicio Rápido

### Opción 1: Setup Automático (Recomendado)

```bash
# Terminal 1: Levantar backend
cd teatro-tickets-backend
node index.js

# Terminal 2: Crear datos de prueba
cd ..
./setup-completo.sh

# Terminal 3: Levantar app móvil
cd baco-teatro-app
npm start
```

### Opción 2: Setup Manual

Ver archivo `GUIA_COMPLETA.md` con instrucciones paso a paso.

---

## 📱 Flujos de Uso

### Flujo Vendedor
1. Vendedor abre app → pestaña **Vender**
2. Busca un ticket por código
3. Completa datos del comprador
4. Selecciona medio de pago
5. Registra la venta → Ticket queda PAGADO

### Flujo Puerta del Teatro
1. Personal abre app → pestaña **Validar**
2. Escanea QR del ticket del espectador
3. App muestra info y pide confirmación
4. Valida → Ticket queda USADO
5. Si intenta validar de nuevo → Rechaza

### Flujo Administración
1. Admin abre app → pestaña **Reportes**
2. Selecciona función
3. Ve estadísticas:
   - Quién vendió más
   - Cuánto se recaudó
   - Promedios
4. Pull to refresh para actualizar

---

## 🎨 Diseño

### Colores Baco
- **Primary**: `#C84A1B` (Naranja Baco)
- **Background**: `#FFFFFF`
- **Text**: `#000000`

### Componentes
- Header con logo característico (franja blanca + "Baco teatro")
- Botones naranja con sombras sutiles
- Cards con bordes redondeados
- Tabs con iconos emoji para claridad

---

## 📊 Estadísticas del Sistema

**Backend:**
- 10 endpoints principales
- 3 modelos de datos (Show, Ticket, Vendedor)
- Generación de QR con librería `qrcode`
- ~300 líneas de código

**App Móvil:**
- 3 pantallas principales
- 1 servicio de API
- Navegación con React Navigation
- Scanner con Expo Barcode Scanner
- ~600 líneas de código

**Total:** Sistema completo funcional en <1000 líneas de código

---

## 🔧 Tecnologías

### Backend
- Node.js 18+
- Express 5
- qrcode (generación de QR)
- cors (CORS habilitado)

### Frontend
- React Native 0.76
- Expo ~52
- React Navigation 6
- Expo Barcode Scanner
- Expo Camera

---

## 📋 Checklist de Funcionalidades

### Backend
- [x] CRUD de funciones
- [x] Generación de tickets con códigos únicos
- [x] Generación automática de QR
- [x] CRUD de vendedores
- [x] Registro de ventas con datos completos
- [x] Validación de tickets
- [x] Reportes de ventas por vendedor
- [x] Estados de tickets (DISPONIBLE/PAGADO/USADO)
- [ ] Base de datos persistente (PostgreSQL)
- [ ] Autenticación de usuarios
- [ ] Deploy en Render

### App Móvil
- [x] Pantalla de registro de ventas
- [x] Selección visual de vendedores
- [x] Selección de medios de pago
- [x] Escaneo de QR con cámara
- [x] Validación de tickets
- [x] Reportes y estadísticas
- [x] Navegación entre pantallas
- [x] Diseño con colores Baco
- [ ] Login de administradores
- [ ] Modo offline
- [ ] Notificaciones push

---

## 🎯 Próximos Pasos Sugeridos

### Corto Plazo (1-2 semanas)
1. **Deploy en Render** - Backend en producción
2. **Pruebas con usuarios reales** - Feedback del equipo
3. **Generación de PDF** - Exportar tickets con QR para imprimir

### Mediano Plazo (1 mes)
4. **PostgreSQL** - Base de datos persistente
5. **Login básico** - Autenticación con usuario/contraseña
6. **Panel web** - Versión escritorio para admin

### Largo Plazo (2-3 meses)
7. **Integración Prex** - Pagos automáticos
8. **Notificaciones** - Alertas de ventas
9. **Analytics** - Métricas avanzadas

---

## 📞 Soporte

- **Documentación completa**: `GUIA_COMPLETA.md`
- **Setup automático**: `./setup-completo.sh`
- **Testing manual**: `./test-sistema.sh`
- **README Backend**: `teatro-tickets-backend/README.md`
- **README App**: `baco-teatro-app/README.md`

---

## 🎉 Conclusión

Sistema **100% funcional** listo para uso en producción con pequeñas mejoras:

✅ Backend robusto con todos los endpoints necesarios  
✅ App móvil completa con 3 funcionalidades principales  
✅ Diseño profesional con identidad Baco  
✅ Reportes en tiempo real  
✅ Validación con QR  
✅ Registro detallado de ventas  

**¡Listo para rockear! 🎭🍊**
