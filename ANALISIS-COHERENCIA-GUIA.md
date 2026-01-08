# 📋 ANÁLISIS: Coherencia Guía vs Funcionalidad Real

## 🔍 ESTADO ACTUAL

### Guía del Invitado (`/guia.html`) Promete:

**Paso 1:** "Selecciona la Función"
- ✅ **EXISTE** - Se pueden ver funciones en funciones-hoy.html y proximas-funciones.html

**Paso 2:** "Elige un Actor"
- ⚠️ **PARCIAL** - Se muestran vendedores en el modal, pero el paso dice "elige un ACTOR", no "vendedor"
- ❌ **CONFUSO** - La guía habla de "actor" pero realmente es "vendedor" (quien vende la entrada)

**Paso 3:** "Contacto por WhatsApp"
- ✅ **EXISTE** - Hay botón de WhatsApp para cada vendedor

**Paso 4:** "Confirma y Disfruta"
- ✅ **EXISTE** - El flujo es: contactar → coordinar → confirmar

---

## 📝 PROBLEMAS IDENTIFICADOS

### En páginas públicas:

1. **Falta claridad en la sección de vendedores**
   - No dice explícitamente "vendedores de entradas"
   - Icono de "usuarios" puede confundir

2. **El modal es solo modal de detalle**
   - No hay un flujo visual claro de "pasos" como en la guía
   - Usuario podría no entender qué hacer después de ver detalles

3. **No hay guía IN-CONTEXT**
   - La guía está en página separada
   - Usuario ve funciones → click → modal detalle → ¿ahora qué?
   - Debería haber tooltips o ayudas inline

### En la guía:

1. **Lenguaje inconsistente**
   - Dice "elige un actor" pero son "vendedores"
   - Debería decir "contacta con un vendedor de entradas"

2. **No explica dónde ver esto**
   - No linkea a funciones-hoy.html
   - Usuario lee guía pero no sabe ir a verlo inmediatamente

---

## ✅ SOLUCIÓN PROPUESTA

### Fase 1: Arreglar Coherencia (Hoy)

1. **Actualizar `/guia.html` para ser más claro:**
   - Cambiar "Elige un Actor" por "Contacta con un Vendedor"
   - Añadir link directo a funciones-hoy.html
   - Mejorar explicación del flujo WhatsApp

2. **Mejorar visual en modales públicos:**
   - Cuando se abre el modal de detalle, mostrar paso a paso
   - "Necesitas contactar al vendedor para reservar"
   - Destacar botón de WhatsApp

3. **Añadir help-text inline:**
   - Tooltip o pequeña ayuda cuando hay vendedores
   - Clarificar que es "venta de entradas"

### Fase 2: Guías por Rol (Próximo)

- [ ] Crear `/dashboard/guia.html` para usuario registrado
- [ ] Crear `/pages/roles/director-guia.html` para director
- [ ] Crear `/pages/roles/actor-guia.html` para actor
- [ ] Crear `/pages/roles/super-guia.html` para super

---

## 📊 MATRIZ DE FUNCIONALIDAD

| Acción | Guía Dice | Existe | Visible | Funciona | Status |
|--------|-----------|--------|---------|----------|--------|
| Ver funciones | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ✅ OK |
| Ver detalles | ✅ Implícito | ✅ Sí | ✅ Modal | ✅ Sí | ✅ OK |
| Ver vendedores | ✅ Dice "actor" | ✅ Sí | ✅ Modal | ✅ Sí | ⚠️ RENOMBRAR |
| WhatsApp | ✅ Sí | ✅ Sí | ✅ Botón | ✅ Sí | ✅ OK |
| Registrarse | ❌ No menciona | ❓ Existe | ❌ No visible | ❌ Link roto | ❌ FALTAN |

---

## 🎯 ACCIONES INMEDIATAS

### Acción 1: Actualizar `/guia.html`
```
- Cambiar "Elige un Actor" → "Contacta con un Vendedor"
- Añadir botón "Ver Funciones Disponibles" que linkee a funciones-hoy.html
- Mejorar la explicación del paso 2
```

### Acción 2: Mejorar modal de detalle
```
- Cuando hay vendedores, mostrar texto: "Contacta directamente con el vendedor de entradas para coordinar tu reserva"
- Destacar botón WhatsApp
- Si NO hay vendedores, mostrar: "Aún no hay vendedores registrados para esta función"
```

### Acción 3: Crear guías por rol
```
- Dashboard invitado/registrado
- Dashboard director
- Dashboard actor
- Dashboard super
```

---

**Conclusión:** La funcionalidad EXISTE pero la coherencia falta en:
1. Nomenclatura (actor vs vendedor)
2. Guía contextual (no hay ayuda inline)
3. Guías por rol (solo hay una guía genérica)

Proceder con mejoras en orden de prioridad.
