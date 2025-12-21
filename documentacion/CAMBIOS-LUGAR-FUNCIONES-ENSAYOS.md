# 🏛️ Cambios: Campos de Lugar en Funciones y Ensayos

## ✅ Tarea Completada
**Objetivo:** Agregar y estandarizar campos de lugar (ubicación) en funciones y ensayos.

## 📋 Cambios Realizados

### 1. Base de Datos - Tabla `shows` (Funciones)
- **Antes:** Campo `direccion` 
- **Después:** Campo `lugar`
- **Migración:** `ALTER TABLE shows RENAME COLUMN direccion TO lugar;`

### 2. Base de Datos - Tabla `ensayos_generales` (Ensayos)
- **Estado:** Ya tenía campo `lugar` - No requiere cambios
- **Estructura confirmada:** `obra_id, titulo, fecha, hora_fin, lugar, descripcion`

### 3. Código - Seed Script
- **Archivo:** `teatro-tickets-backend/seed-minimo-init.js`
- **Cambio:** Actualizado INSERT para usar `lugar` en vez de `direccion`
- **Valor ejemplo:** `'Teatro Principal'`

### 4. Documentación - Script de Migración
- **Archivo:** `teatro-tickets-backend/scripts/migracion-lugar-funciones-ensayos.sql`
- **Propósito:** Documenta y ejecuta la migración de campos de lugar
- **Incluye:** Comentarios explicativos y consultas de verificación

## 🧪 Verificación de Funcionamiento

### API Funciones (Público)
```json
GET /api/shows
[
  {
    "id": 3,
    "nombre": "Función de Prueba",
    "lugar": "Teatro Principal"
  }
]
```

### API Ensayos (Autenticado)
```json
GET /api/ensayos
[
  {
    "id": 1,
    "titulo": "Ensayo General - Baco",
    "fecha": "2025-12-24",
    "lugar": "Sala de Ensayo Principal"
  }
]
```

## 📊 Testing
- **Tests ejecutados:** 14/14
- **Status:** ✅ TODOS PASARON
- **Confirmación:** Los cambios no afectaron funcionalidad existente

## 🏗️ Arquitectura Final
```
Grupos → Actores → Obra "Baco" → Funciones (con lugar) + Ensayos (con lugar)
```

## 📝 Impacto
- **Consistencia:** Ambas entidades ahora usan campo `lugar`
- **API coherente:** Endpoints devuelven mismo nombre de campo
- **Base de datos:** Esquema estandarizado para ubicaciones

---
**Fecha:** 2025-01-21  
**Parte de:** Refactorización VENDEDOR→ACTOR y mejoras arquitecturales  
**Estado:** ✅ COMPLETADO