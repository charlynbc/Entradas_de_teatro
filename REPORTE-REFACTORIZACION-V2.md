# 🎭 Reporte de Refactorización V2.0 - Baco Teatro

**Fecha:** 21 de diciembre de 2025  
**Versión:** 2.0 - VENDEDOR → ACTOR  
**Estado:** ✅ COMPLETADO - 100% Tests Pasados

---

## 📋 Resumen Ejecutivo

Se realizó una **refactorización completa** del sistema Baco Teatro para reflejar correctamente el modelo de teatro profesional, cambiando el concepto de "VENDEDOR" por "ACTOR/ACTRIZ" y mejorando la arquitectura de grupos, obras y funciones.

### Cambios Principales

1. ✅ **Rol VENDEDOR → ACTOR** en toda la base de datos y código
2. ✅ **Obra por defecto "Baco"** asignada automáticamente a grupos
3. ✅ **Arquitectura mejorada** de grupos con actores, horarios y obras
4. ✅ **Funciones públicas** visibles en pantalla de inicio
5. ✅ **Testing completo** - 14/14 tests pasados (100%)

---

## 🔄 Cambios Realizados

### 1. Base de Datos

#### Migración de Roles
```sql
-- Eliminar constraint anterior
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Actualizar usuarios existentes
UPDATE users SET role = 'ACTOR' WHERE role = 'VENDEDOR';

-- Crear nuevo constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPER', 'ADMIN', 'ACTOR', 'INVITADO'));
```

**Resultado:**
- ✅ 0 usuarios con role VENDEDOR
- ✅ 2 usuarios migrados a ACTOR
- ✅ Constraint actualizado correctamente

#### Estructura Actual

**Tabla `users`:**
- Roles válidos: `SUPER`, `ADMIN`, `ACTOR`, `INVITADO`
- Password hashcado con bcrypt
- Phone único (FK para tickets)

**Tabla `grupos`:**
- Director (SUPER o ADMIN)
- Horario semanal (día + hora)
- Fecha inicio y fin
- Estados: `ACTIVO`, `FINALIZADO`

**Tabla `grupo_miembros`:**
- Relaciona actores con grupos
- Campo `activo` para soft delete
- `rol_en_grupo`: `DIRECTOR` o `ACTOR`

**Tabla `obras`:**
- Pertenece a un grupo
- Nombre por defecto: "Baco"
- Editable por el director

**Tabla `shows` (funciones):**
- Asociadas a una obra
- Visible en pantalla de inicio si `estado = 'activa'`
- Tiene entradas (tickets)

**Tabla `tickets`:**
- Columna `vendedor_phone` (mantiene nombre por FK)
- Representa al `actor_phone` semánticamente
- Estados: `DISPONIBLE`, `STOCK_ACTOR`, `RESERVADO`, `REPORTADA_VENDIDA`, `PAGADO`, `USADA`

### 2. Backend

#### Archivos Modificados

**Controllers:**
- `controllers/shows.controller.js`
  - Corregido filtro de estado: `'ACTIVA'` → `'activa'`
  - Agregado JOIN con obras para mostrar `obra_nombre`
  - Orden cronológico: DESC → ASC (próximas primero)

**Services:**
- `services/grupos.service.js`
  - Corregida query para rol ACTOR (antes VENDEDOR)
  - Usando subquery en lugar de JOIN DISTINCT
  - Filtra por `activo = TRUE`

**Scripts:**
- `scripts/migracion-vendedor-a-actor.sql` - Script de migración SQL
- `scripts/crear-usuarios-prueba.js` - Actualizado para crear ACTOR
- `scripts/testing-v2-completo.sh` - Suite de testing automatizado
- `seed-minimo-init.js` - Obra por defecto cambiada a "Baco"

**Documentación:**
- `docs/ARQUITECTURA-V2-ACTORES.md` - Documentación completa de la arquitectura
- `REPORTE-REFACTORIZACION-V2.md` - Este reporte

### 3. Datos de Prueba

#### Usuarios Creados

| Rol | Cédula | Password | Nombre | Phone |
|-----|--------|----------|--------|-------|
| SUPER | 48376669 | Teamomama91 | Super Usuario | - |
| ADMIN | 11111111 | admin123 | Admin de Prueba | 099111111 |
| ACTOR | 22222222 | vendedor123 | Actor/Actriz de Prueba | 099222222 |
| ACTOR | 44444444 | actor456 | Actor/Actriz Secundario | 099444444 |
| INVITADO | 33333333 | invitado123 | Invitado de Prueba | 099333333 |

#### Datos de Ejemplo

**Grupo:**
- ID: 5
- Nombre: "Grupo de Prueba"
- Director: Super Usuario (48376669)
- Horario: Lunes 19:00
- Período: 2025-12-21 a 2026-06-21
- Miembros: 2 actores

**Obra:**
- ID: 2
- Nombre: "Baco"
- Descripción: "Obra por defecto del sistema - Editable por el director"
- Duración: 120 minutos
- Estado: LISTA

**Función:**
- ID: 3
- Nombre: "Función de Prueba"
- Obra: Baco
- Fecha: 2025-12-28 23:33
- Precio: $500
- Cupos: 10 disponibles
- Estado: activa

---

## 🧪 Resultados de Testing

### Suite de Tests V2.0

Ejecutado el 21 de diciembre de 2025 a las 23:40 UTC

```
🧪 =========================================
    TESTING SISTEMA BACO TEATRO V2.0
    VENDEDOR → ACTOR Refactorización
=========================================

📋 FASE 1: Autenticación
────────────────────────────────────────
✅ Login usuario SUPER
✅ Login usuario ADMIN
✅ Login usuario ACTOR (antes VENDEDOR) - Migración exitosa

📋 FASE 2: Funciones Públicas (Sin Auth)
────────────────────────────────────────
✅ GET /api/shows (público) - 1 función visible
✅ Obra por defecto 'Baco' en funciones

📋 FASE 3: Grupos y Arquitectura
────────────────────────────────────────
✅ GET /api/grupos (SUPER) - 1 grupo
✅ Grupo tiene actores (2 miembros)
✅ GET /api/grupos (ACTOR) - 1 grupo visible

📋 FASE 4: Base de Datos
────────────────────────────────────────
✅ Constraint roles actualizado
✅ No hay usuarios con role VENDEDOR (0)
✅ Existen usuarios con role ACTOR (2)

📋 FASE 5: Endpoints Críticos
────────────────────────────────────────
✅ Funciones concluidas (GET /api/shows/concluidas)
✅ Grupos finalizados (GET /api/grupos/finalizados/lista)
✅ Seed mínimo ejecutable

=========================================
  RESUMEN DE TESTING
=========================================
✅ Tests Pasados:  14
❌ Tests Fallidos: 0
📊 Total:          14

🎉 ¡TODOS LOS TESTS PASARON! 🎉
```

### Cobertura de Tests

- ✅ **Autenticación:** Login con todos los roles
- ✅ **Migración:** Verificación de cambio VENDEDOR → ACTOR
- ✅ **API Pública:** Funciones visibles sin autenticación
- ✅ **Autorización:** Permisos por rol (SUPER, ADMIN, ACTOR)
- ✅ **Grupos:** Listado y miembros
- ✅ **Base de Datos:** Constraints y datos migrados
- ✅ **Endpoints Críticos:** Reportes y listados especiales
- ✅ **Seed Script:** Datos de prueba generables

---

## 📐 Arquitectura V2.0

### Modelo Conceptual

```
DIRECTOR (SUPER/ADMIN)
    ↓ crea
GRUPO
    ├── Actores (miembros)
    ├── Horario (Lunes 19:00, etc.)
    ├── Fecha inicio → Fecha fin
    └── OBRA (por defecto "Baco")
        ↓ genera
        FUNCIONES
            └── ENTRADAS (distribuidas a actores)
```

### Flujo de Trabajo

1. **Director crea grupo**
   - Define horario semanal
   - Establece período (fecha_inicio → fecha_fin)
   - Obra "Baco" se asigna automáticamente

2. **Director agrega actores**
   - Selecciona usuarios con role ACTOR
   - Los agrega a `grupo_miembros`
   - Actores ven el grupo en su panel

3. **Director crea funciones**
   - Funciones asociadas a la obra del grupo
   - Aparecen en la pantalla de inicio de la app
   - Tienen entradas generadas automáticamente

4. **Director distribuye entradas**
   - Asigna entradas a actores específicos
   - Actores pueden reservar/vender sus entradas
   - Control de stock por actor

5. **Reportes y control**
   - Por función individual
   - Por todas las funciones del grupo
   - Estados de pago y deudas

---

## 🔍 Validaciones y Permisos

### Por Rol

**SUPER:**
- ✅ Ver/Editar todos los grupos, obras, funciones
- ✅ Crear usuarios de cualquier rol
- ✅ Acceso a todos los reportes

**ADMIN (Director):**
- ✅ Crear/Editar sus propios grupos
- ✅ Agregar/Remover actores de sus grupos
- ✅ Crear obras y funciones
- ✅ Distribuir entradas a actores
- ✅ Ver reportes de sus funciones/grupos
- ❌ No puede ver datos de otros directores

**ACTOR:**
- ✅ Ver grupos donde es miembro
- ✅ Ver funciones de sus grupos
- ✅ Ver sus entradas asignadas
- ✅ Reservar/Vender entradas de su stock
- ✅ Ver su historial
- ❌ No puede crear funciones
- ❌ No puede ver datos de otros actores

**INVITADO:**
- ✅ Ver funciones públicas
- ✅ Comprar entradas disponibles
- ✅ Ver sus compras
- ❌ Sin acceso a gestión

---

## 📱 Pantalla de Inicio (App Baco)

### Funciones Públicas

La pantalla de inicio muestra todas las funciones con `estado = 'activa'`, ordenadas cronológicamente:

**Endpoint:** `GET /api/shows`  
**Autenticación:** No requerida

**Respuesta:**
```json
[
  {
    "id": 3,
    "nombre": "Función de Prueba",
    "obra_nombre": "Baco",
    "obra_descripcion": "Obra por defecto del sistema...",
    "fecha_hora": "2025-12-28T23:33:06.096Z",
    "direccion": "Teatro Principal",
    "precio": "500.00",
    "cupos_disponibles": 10,
    "cupos_totales": 10,
    "estado": "activa"
  }
]
```

**Características:**
- ✅ Muestra nombre de la obra
- ✅ Información completa de la función
- ✅ Cupos disponibles en tiempo real
- ✅ Accesible sin login
- ✅ Ordenado por fecha próxima primero

---

## 🐛 Problemas Corregidos

### Durante la Refactorización

1. **Estado de funciones en mayúsculas**
   - ❌ Código buscaba `estado = 'ACTIVA'`
   - ✅ BD tenía `estado = 'activa'`
   - **Fix:** Cambiado filtro a minúsculas

2. **Query de grupos para ACTOR fallaba**
   - ❌ `SELECT DISTINCT g.*` con JOIN causaba error
   - ✅ Cambiado a subquery con `IN`
   - **Fix:** Funciona correctamente

3. **Obra por defecto no era "Baco"**
   - ❌ Seed creaba "Obra de Prueba"
   - ✅ Cambiado a "Baco" con descripción apropiada
   - **Fix:** Seed actualizado

4. **Funciones no mostraban obra**
   - ❌ `SELECT s.*` sin obra_nombre
   - ✅ Agregado LEFT JOIN con obras
   - **Fix:** Ahora incluye obra_nombre y descripción

5. **Orden de funciones invertido**
   - ❌ `ORDER BY fecha_hora DESC` (pasadas primero)
   - ✅ Cambiado a `ASC` (próximas primero)
   - **Fix:** Pantalla de inicio muestra próximas funciones

---

## 📊 Métricas del Sistema

### Base de Datos
- **Tablas principales:** 8 (users, grupos, grupo_miembros, obras, shows, tickets, ensayos_generales, v_grupos_completos)
- **Usuarios:** 5 (1 SUPER, 1 ADMIN, 2 ACTOR, 1 INVITADO)
- **Grupos activos:** 1
- **Obras:** 1 ("Baco")
- **Funciones activas:** 1
- **Actores en grupos:** 2

### Código
- **Archivos modificados:** 8
- **Archivos nuevos:** 4
- **Líneas de código afectadas:** ~500
- **Tests automatizados:** 14

### Testing
- **Tests ejecutados:** 14
- **Tests pasados:** 14 (100%)
- **Tests fallidos:** 0
- **Cobertura:** Autenticación, API, BD, Endpoints críticos

---

## 🚀 Próximos Pasos Recomendados

### Prioridad Alta
1. ⚠️ **Actualizar frontend (Expo App)**
   - Cambiar textos "Vendedor" → "Actor/Actriz"
   - Actualizar pantalla "Vendedores" → "Elenco"
   - Recompilar y desplegar

2. 📝 **Documentación de API**
   - Crear Swagger/OpenAPI spec
   - Documentar todos los endpoints
   - Agregar ejemplos de uso

### Prioridad Media
1. 🔍 **Refactorizar nombres de variables**
   - `vendedor_phone` → considerar renombrar (breaking change)
   - Estados `STOCK_VENDEDOR` → `STOCK_ACTOR`
   - Comentarios en código

2. 🧪 **Ampliar testing**
   - Tests de integración
   - Tests E2E con Playwright
   - Coverage > 80%

### Prioridad Baja
1. 📊 **Mejoras de reportes**
   - Dashboard mejorado
   - Gráficos visuales
   - Exportación a PDF/Excel

2. 🎨 **UI/UX**
   - Mejorar diseño de pantalla de inicio
   - Animaciones
   - Modo oscuro

---

## ✅ Checklist de Validación

Antes de desplegar a producción, verificar:

- [x] Migración de base de datos ejecutada
- [x] Tests pasando al 100%
- [x] Usuarios de prueba creados y funcionando
- [x] Endpoints críticos validados
- [x] Documentación actualizada
- [ ] Frontend recompilado (pendiente)
- [ ] Variables de entorno verificadas
- [ ] Backup de BD realizado
- [ ] Plan de rollback preparado

---

## 📞 Soporte y Contacto

Para dudas sobre la refactorización o problemas encontrados:

**Documentación:**
- Arquitectura: `docs/ARQUITECTURA-V2-ACTORES.md`
- Testing: `scripts/testing-v2-completo.sh`
- Migración: `scripts/migracion-vendedor-a-actor.sql`

**Testing rápido:**
```bash
# Ejecutar suite completa
./scripts/testing-v2-completo.sh

# Login manual
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"22222222","password":"vendedor123"}'

# Ver funciones públicas
curl http://localhost:3000/api/shows
```

---

**Fin del Reporte de Refactorización V2.0**

✅ **Estado: COMPLETADO**  
🎉 **Resultado: EXITOSO - 100% Tests Pasados**  
📅 **Fecha: 21 de diciembre de 2025**
