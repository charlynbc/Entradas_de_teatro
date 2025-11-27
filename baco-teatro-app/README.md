# Baco Teatro App 🎭🍊

App móvil para gestión y validación de entradas de teatro.

## Identidad Visual

- **Naranja Baco**: `#C84A1B`
- **Blanco**: `#FFFFFF`
- **Negro**: `#000000`

## Stack

- React Native
- Expo
- React Navigation
- Expo Barcode Scanner
- Backend: Node.js + Express

## Instalación

```bash
cd baco-teatro-app
npm install
```

## Ejecutar

```bash
npm start
```

Luego:
- Escanea el QR con **Expo Go** en tu celular Android
- O presiona `a` para abrir en emulador Android
- O presiona `i` para abrir en simulador iOS

## Configuración del Backend

Por defecto la app apunta a `http://localhost:3000`. 

Para probar en tu celular con el backend en Codespaces:

1. En Codespaces, ve a la pestaña **Ports**
2. Haz público el puerto 3000
3. Copia la URL forwarded (ej: `https://xxxx-3000.app.github.dev`)
4. Edita `src/services/api.js` y cambia:
   ```js
   export const API_URL = 'https://tu-url-de-codespaces.app.github.dev';
   ```

Cuando el backend esté en Render, cambialo a la URL de producción.

## Funcionalidades

### 🎫 Pantalla de Venta
- Buscar ticket por código
- Seleccionar vendedor
- Registrar datos del comprador (nombre, contacto)
- Elegir medio de pago (Efectivo, Transferencia, Prex, Otro)
- Registrar monto de venta
- Marcar ticket como PAGADO

### 📷 Pantalla de Validación (Scanner)
- Escaneo de códigos QR con cámara
- Validación automática de tickets
- Muestra información del ticket antes de validar
- Confirmación visual de tickets válidos/inválidos
- Previene doble validación (tickets ya usados)

### 📊 Pantalla de Reportes
- Ver resumen de ventas por función
- Estadísticas por vendedor:
  - Cantidad de tickets vendidos
  - Monto total recaudado
  - Promedio por ticket
- Totales generales de la función
- Actualización en tiempo real (pull to refresh)

## Navegación

La app tiene 3 pestañas principales:

1. **Vender** 💰: Registrar ventas de tickets
2. **Validar** 📷: Escanear y validar tickets con QR
3. **Reportes** 📊: Ver estadísticas de ventas

## Permisos

La app requiere permiso de **cámara** para escanear códigos QR.

## Próximas Funcionalidades

- [ ] Login de administradores
- [ ] Ver detalles de funciones
- [ ] Generar y descargar QR codes
- [ ] Notificaciones push
- [ ] Modo offline con sincronización
- [ ] Historial de validaciones

---

**Baco Teatro** - Sistema de gestión de entradas
