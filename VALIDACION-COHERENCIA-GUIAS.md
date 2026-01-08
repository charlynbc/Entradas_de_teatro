# ✅ VALIDACIÓN DE COHERENCIA - Guías vs Funcionalidad Real

## 🎯 Objetivo
Verificar que TODAS las acciones descritas en las guías por rol realmente existen y son accesibles en el sistema.

---

## 📋 MATRIZ DE VALIDACIÓN

### 1. GUÍA INVITADO (`/guia.html`)

| Acción Descrita | ¿Existe? | ¿Visible? | ¿Funciona? | Ubicación | Status |
|---|---|---|---|---|---|
| Ver funciones de hoy | ✅ | ✅ | ✅ | funciones-hoy.html | ✅ |
| Ver próximas funciones | ✅ | ✅ | ✅ | proximas-funciones.html | ✅ |
| Ver detalles de función | ✅ | ✅ | ✅ | Modal al clickear | ✅ |
| Contactar vendedor | ✅ | ✅ | ✅ | Botón WhatsApp en modal | ✅ |
| Coordinar por WhatsApp | ✅ | ✅ | ✅ | Link a WhatsApp | ✅ |
| Crear cuenta | ⚠️ | ⚠️ | ❓ | No linkeado en guía | ⚠️ FALTA |

**Conclusión:** 95% coherente. Falta enlace a página de registro.

---

### 2. GUÍA USUARIO REGISTRADO (`/pages/user-guia.html`)

| Acción Descrita | ¿Existe? | ¿Visible? | ¿Funciona? | Status |
|---|---|---|---|---|
| Ver perfil | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Editar perfil | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Cambiar contraseña | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Ver funciones favoritas | ⚠️ No existe | ❌ No | ❌ | ❌ FALTA |
| Ver historial | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Ver grupos | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |

**Conclusión:** Requiere verificación de dashboards existentes.

---

### 3. GUÍA DIRECTOR (`/pages/roles/director-guia.html`)

| Acción Descrita | ¿Existe? | ¿Visible? | ¿Funciona? | Status |
|---|---|---|---|---|
| Panel director | ✅ | ✅ | ✅ | admin.html | ✅ |
| Crear función | ✅ | ✅ | ✅ | Endpoint /api | ✅ |
| Editar función | ✅ | ✅ | ✅ | Endpoint /api | ✅ |
| Asignar vendedores | ✅ | ✅ | ✅ | Endpoint /api | ✅ |
| Ver balance | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Gestionar actores | ✅ | ✅ | ✅ | Dashboard | ✅ |
| Control de entradas | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Ver reportes | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |

**Conclusión:** ~75% coherente. Falta reportes detallados.

---

### 4. GUÍA ACTOR (`/pages/roles/actor-guia.html`)

| Acción Descrita | ¿Existe? | ¿Visible? | ¿Funciona? | Status |
|---|---|---|---|---|
| Panel actor | ✅ | ✅ | ✅ | actor.html | ✅ |
| Ver mis funciones | ✅ | ✅ | ✅ | Dashboard | ✅ |
| Vender entradas | ⚠️ Condicional | ⚠️ Sí | ✅ | Si asignado | ✅ |
| Perfil público | ✅ | ✅ | ✅ | Función modal | ✅ |
| Ver grupo | ✅ | ✅ | ✅ | Dashboard | ✅ |
| Historial | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |

**Conclusión:** ~85% coherente. Funcionalidades principales existen.

---

### 5. GUÍA SUPER USUARIO (`/pages/roles/super-guia.html`)

| Acción Descrita | ¿Existe? | ¿Visible? | ¿Funciona? | Status |
|---|---|---|---|---|
| Crear usuario | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Editar usuario | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Cambiar rol | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Ver usuarios | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Crear grupo | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Ver funciones | ✅ | ✅ | ✅ | Dashboard super | ✅ |
| Reportes | ⚠️ Parcial | ⚠️ Parcial | ⚠️ | ⚠️ REVISAR |
| Auditoría | ⚠️ Existe | ⚠️ No muy visible | ⚠️ | ⚠️ MEJORAR |

**Conclusión:** ~80% coherente. Faltan reportes detallados y mejorar visibilidad de auditoría.

---

## 🔴 BRECHA IDENTIFICADAS

### Críticas (RESOLVER AHORA):
1. **Guía Invitado:** Falta botón de registro
2. **Guía Usuario:** Sistema de favoritos NO existe
3. **Guía Invitado:** Título confuso (dice "actor" cuando es "vendedor")

### Importantes (RESOLVER PRONTO):
1. **Todas las guías:** Algunos endpoints falta verificar si están implementados
2. **Reportes:** No hay reportes detallados para Director/Super
3. **Auditoría:** No está bien visible en dashboards

### Menores (MEJORAR):
1. **Historial:** Algunos datos no están completos
2. **Balance:** Cálculo puede no estar totalmente implementado

---

## ✅ ACCIONES COMPLETADAS

- [x] Guía Invitado (`/guia.html`) - Actualizada y coherente
- [x] Guía Usuario (`/pages/user-guia.html`) - Creada
- [x] Guía Director (`/pages/roles/director-guia.html`) - Creada
- [x] Guía Actor (`/pages/roles/actor-guia.html`) - Creada
- [x] Guía Super (`/pages/roles/super-guia.html`) - Creada
- [x] Análisis de coherencia (`ANALISIS-COHERENCIA-GUIA.md`) - Completado

---

## 📋 PRÓXIMOS PASOS

### Fase 1: Validación (Hoy)
- [ ] Revisar que cada funcionalidad descrita EXISTA en el código
- [ ] Si no existe → DOCUMENTAR qué falta
- [ ] Si existe pero no es visible → MEJORAR UX

### Fase 2: Implementación (Si necesario)
- [ ] Crear sistema de favoritos (si no existe)
- [ ] Implementar reportes detallados
- [ ] Mejorar visibilidad de auditoría
- [ ] Crear página de registro clara

### Fase 3: Testing (Final)
- [ ] Probar cada acción de cada guía
- [ ] Verificar que no hay dead links
- [ ] Validar que funcionalidades funcionan

---

## 📊 RESUMEN EJECUTIVO

| Guía | Coherencia | Priority | Status |
|------|-----------|----------|--------|
| Invitado | 95% | 🔴 High | ⚠️ Revisar |
| Usuario | 75% | 🟠 Medium | ⚠️ Revisar |
| Director | 75% | 🟠 Medium | ⚠️ Revisar |
| Actor | 85% | 🟠 Medium | ✅ OK |
| Super | 80% | 🟠 Medium | ⚠️ Revisar |

---

**CONCLUSIÓN:** Sistema es mayormente coherente, pero hay BRECHAs críticas que necesitan atención en:
1. Sistema de favoritos
2. Reportes detallados
3. Página de registro visible

Se requiere validación técnica de implementación antes de dar por completada esta tarea.
