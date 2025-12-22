# 📝 GUÍA PARA COMPLETAR CORRECCIONES - Alertas Web Compatible

Este documento guía cómo completar la migración de todos los `Alert.alert()` al nuevo hook `useAlert`.

## Pasos para Cada Archivo

### 1. **Importar el Hook**

```javascript
// AGREGAR ESTA LÍNEA
import { useAlert } from '../../hooks/useAlert';
```

### 2. **Usar el Hook en el Componente**

```javascript
export default function MiPantalla() {
  const { showAlert, showConfirm, showConfirmWithCancel } = useAlert();
  
  // ... resto del código
}
```

### 3. **Reemplazar `Alert.alert()` Simples**

**ANTES:**
```javascript
Alert.alert('Título', 'Mensaje');
```

**DESPUÉS:**
```javascript
showAlert('Título', 'Mensaje');
```

### 4. **Reemplazar `Alert.alert()` con Confirmación**

**ANTES:**
```javascript
Alert.alert('Confirmar', '¿Estás seguro?', [
  { text: 'Cancelar', style: 'cancel' },
  { 
    text: 'Eliminar', 
    style: 'destructive', 
    onPress: async () => {
      await deleteItem(id);
      Alert.alert('Listo', 'Eliminado');
    } 
  }
]);
```

**DESPUÉS:**
```javascript
const confirmed = await showConfirm('Confirmar', '¿Estás seguro?');
if (confirmed) {
  await deleteItem(id);
  showAlert('Listo', 'Eliminado');
}
```

---

## Archivos Pendientes de Corrección

### Prioridad Alta (Funcionalidad crítica):

```
1. ActorStockScreen.js
   - Línea ~89: Alert.alert error
   - Línea ~98: Alert.alert validation
   - Línea ~381: Alert.alert PDF error
   - Línea ~454: Alert.alert descarga OK
   - Línea ~467: Alert.alert PDF error

2. DirectorRehearsalsScreen.js
   - Línea ~52: Alert.alert validation
   - Línea ~66: Alert.alert error
   - Línea ~73-83: Alert.alert con confirmación

3. DirectorVendorsScreen.js
   - Línea ~33: Alert.alert validation
   - Línea ~42: Alert.alert OK
   - Línea ~44: Alert.alert error
   - Línea ~64: Alert.alert error (en delete)

4. DirectorDashboardScreen.js
   - Línea ~56-66: Alert.alert con confirmación (eliminar vendedor)
```

### Prioridad Media (Operaciones comunes):

```
5. ActorTransferScreen.js
   - Línea ~33: Alert.alert validation
   - Línea ~41: Alert.alert OK
   - Línea ~43: Alert.alert error

6. DirectorScannerScreen.js
   - Línea ~48: Alert.alert rechazo
   - Línea ~55: Alert.alert error

7. ProfileScreen.js
   - Línea ~58, 75, 98: Alert.alert permisos
   - Línea ~158: Alert.alert opciones
```

---

## Plantilla Rápida de Corrección

Para facilitar, copia esta plantilla y adapta:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAlert } from '../../hooks/useAlert';

export default function MiPantalla() {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);

  // Validación simple
  const handleCreate = async () => {
    if (!datos.completos) {
      showAlert('Falta información', 'Completa todos los campos');
      return;
    }
    
    setLoading(true);
    try {
      await crearElemento(datos);
      showAlert('Éxito', 'Elemento creado correctamente');
      cargarDatos();
    } catch (error) {
      showAlert('Error', error.message || 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  // Con confirmación
  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      '⚠️ Eliminar',
      '¿Estás seguro? Esta acción no se puede deshacer'
    );
    
    if (confirmed) {
      try {
        await eliminarElemento(id);
        showAlert('Listo', 'Elemento eliminado correctamente');
        cargarDatos();
      } catch (error) {
        showAlert('Error', error.message || 'No se pudo eliminar');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Contenido */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
```

---

## Metodo Eficiente: Buscar y Reemplazar

Si tienes acceso a un editor con buscar/reemplazar por regex:

### 1. Encontrar todos los imports de Alert:
```regex
import.*Alert.*from 'react-native';
```

Reemplazar con:
```javascript
import { useAlert } from '../../hooks/useAlert';
```

### 2. Encontrar Alert.alert simples:
```regex
Alert\.alert\((['"][^'"]*['"],\s*['"][^'"]*['"])\)
```

Reemplazar con:
```javascript
showAlert($1)
```

---

## Testing Después de Corregir

Para cada archivo corregido:

1. **En Web (Chrome):**
   ```bash
   npm start
   # Abrir http://localhost:3000
   # Probar cada Alert:
   # - Validación (should show alert)
   # - Confirmación (should show confirm dialog)
   # - Errores (should show error alerts)
   ```

2. **En Mobile (Expo):**
   ```bash
   expo start
   # Abrir en simulator o device
   # Verificar que funciona igual
   ```

---

## Checklist de Validación

Para cada archivo corregido, validar:

- [ ] Importa correctamente el hook `useAlert`
- [ ] Todos los `Alert.alert()` fueron reemplazados
- [ ] El componente funciona en web
- [ ] El componente funciona en mobile
- [ ] Las confirmaciones funcionan correctamente
- [ ] Los mensajes de error se muestran
- [ ] Las validaciones detienen la acción cuando falta info

---

## Ejemplo Completo: DirectorRehearsalsScreen.js

```javascript
// ANTES
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';

// DESPUÉS
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useAlert } from '../../hooks/useAlert';

export default function DirectorRehearsalsScreen() {
  const { showAlert, showConfirm } = useAlert();
  // ... resto del código

  const handleCreate = async () => {
    if (!title || !location) {
      // ANTES: Alert.alert('Error', 'Titulo y lugar son obligatorios');
      // DESPUÉS:
      showAlert('Error', 'Titulo y lugar son obligatorios');
      return;
    }
    // ...
  };

  const handleDelete = async (id) => {
    // ANTES:
    // Alert.alert('Confirmar', '¿Borrar ensayo?', [
    //   { text: 'Cancelar', style: 'cancel' },
    //   { 
    //     text: 'Borrar', 
    //     style: 'destructive', 
    //     onPress: async () => { ... }
    //   }
    // ]);

    // DESPUÉS:
    const confirmed = await showConfirm('Confirmar', '¿Borrar ensayo?');
    if (confirmed) {
      try {
        await deleteRehearsal(id);
        loadData();
      } catch (error) {
        showAlert('Error', error.message);
      }
    }
  };
}
```

---

## Contacto para Dudas

Si tienes dudas sobre cómo aplicar estas correcciones:
- Revisar el hook `useAlert.js` para entender mejor
- Mirar `DirectorsScreen.js` como ejemplo completo
- Revisar este documento nuevamente

---

**Última Actualización**: 22 de diciembre de 2025
**Autor**: GitHub Copilot
