# Issues Conocidos

Lista de problemas conocidos y sus soluciones.

## React Native Web

### ❌ Alert.alert no funciona en web
**Problema:** `Alert.alert()` de React Native no funciona en navegadores web.

**Solución:** Usar `window.confirm()` para web y `Alert.alert()` para móvil:
```javascript
const confirmed = Platform.OS === 'web' 
  ? window.confirm('¿Mensaje?')
  : await new Promise(resolve => {
      Alert.alert('Título', 'Mensaje', [
        { text: 'Cancelar', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) }
      ]);
    });
```

**Estado:** ✅ Corregido en commit `32973f1` (14/12/2025)

---

## Caché en Desarrollo

### ❌ Navegador mantiene caché del bundle JS
**Problema:** Cambios en el código no se reflejan tras recompilar porque el navegador cachea el bundle.

**Solución aplicada:**
1. Headers anti-caché en modo desarrollo:
```javascript
if (process.env.NODE_ENV === 'development') {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
}
```

2. Recarga forzada del navegador:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` / `Cmd+Shift+R`
   - DevTools: Marcar "Disable cache" en Network tab

**Estado:** ✅ Corregido en commit `32973f1` (14/12/2025)

---

## Fonts en Render

### ❌ Iconos no se cargan en deployment
**Problema:** Los fonts de @expo/vector-icons no se suben a Render porque node_modules está en .gitignore.

**Solución:** 
1. Copiar fonts a `/public/fonts` fuera de node_modules
2. Servir con middleware específico:
```javascript
app.use('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts', 
  express.static(path.join(PUBLIC_DIR, 'fonts'))
);
```

**Estado:** ✅ Resuelto en commits anteriores

---

## Autenticación

### ❌ Contraseña inicial no funciona
**Problema:** El hash de contraseña en DB no coincide con la contraseña esperada.

**Solución:** Regenerar hash y actualizar en PostgreSQL:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Teamomama91', 10).then(console.log);"
# Copiar hash y actualizar:
UPDATE users SET password_hash = '$2b$10$...' WHERE cedula = '48376669';
```

**Estado:** ✅ Corregido (14/12/2025)

---

## Performance

### ⚠️ Build lento en Render
**Problema:** El build en Render toma 10-15 minutos.

**Solución temporal:** Build command manual en dashboard de Render:
```bash
chmod +x build.sh && ./build.sh
```

**Pendiente:** Optimizar proceso de build o usar caché de npm en Render.

---

## Fecha de última actualización
14 de diciembre de 2025
