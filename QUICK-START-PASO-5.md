# ⚡ QUICK START — PASO 5 (Sistema de Cuentas)

## 🎯 Qué Vas a Hacer

Agregar gestión económica real:
- Cuentas bancarias
- Comprobantes de transferencia
- Validación de pagos
- Caja con auditoría completa

**Tiempo:** 30-45 minutos  
**Complejidad:** Media-Alta

---

## 📋 Pre-requisitos

- [ ] PASO 4 completado
- [ ] Base de datos corriendo
- [ ] Backend corriendo
- [ ] Copilot Chat disponible

---

## 🚀 Pasos (8 en total)

### 1️⃣ Abre Copilot Chat

```
VS Code → Ctrl+Shift+I
```

### 2️⃣ Copia el Prompt

```
File: PROMPT-PASO-5-COPILOT.md
Selection: TODO (Ctrl+A)
Copy: Ctrl+C
```

### 3️⃣ Pega en Chat

```
En Copilot Chat → Ctrl+V
Enter
```

### 4️⃣ Espera

```
60-90 segundos (más largo que PASO 4)
```

Copilot generará:
- 1 migration SQL (200+ líneas)
- 2 services nuevos
- 2 controllers nuevos
- 2 routes nuevos
- 3 actualizaciones de services

### 5️⃣ Copia Archivos

```
Para cada bloque que genera:
1. Crea archivo (si no existe)
2. Pega contenido
3. Guarda (Ctrl+S)
```

Archivos nuevos:
- `migrations/04-sistema-cuentas-transferencias.sql`
- `services/cuentasBancariasService.js`
- `services/comprobantesService.js`
- `controllers/cuentas.controller.js`
- `controllers/comprobantes.controller.js`
- `routes/cuentas.routes.js`
- `routes/comprobantes.routes.js`

Archivos a actualizar:
- `services/cuotasService.js`
- `services/cajaService.js`
- `index-v3-postgres.js` (agregar rutas)

### 6️⃣ Corre Migration

```bash
cd teatro-tickets-backend

export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro

psql $DATABASE_URL -f migrations/04-sistema-cuentas-transferencias.sql
```

Debe decir:
```
CREATE TABLE
CREATE TABLE
ALTER TABLE
ALTER TABLE
...
CREATE INDEX
```

### 7️⃣ Crea Carpeta Uploads

```bash
mkdir -p teatro-tickets-backend/uploads/comprobantes
chmod 755 teatro-tickets-backend/uploads
```

### 8️⃣ Tests

```bash
npm test
```

Si pasan todos: ✅ LISTO

---

## ✅ Validación Rápida

### Test Manual 1: Crear Cuenta

```bash
curl -X POST http://localhost:3000/cuentas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "tipo_owner": "GRUPO",
    "owner_id": 1,
    "banco": "Santander",
    "titular": "Test User",
    "numero_cuenta": "123456789",
    "alias": "test.cuenta"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "cuenta": {
    "id": 1,
    "tipo_owner": "GRUPO",
    "banco": "Santander",
    ...
  }
}
```

### Test Manual 2: Subir Comprobante

```bash
curl -X POST http://localhost:3000/comprobantes \
  -H "Authorization: Bearer TOKEN" \
  -F "tipo=CUOTA" \
  -F "referencia_id=1" \
  -F "archivo=@test.jpg"
```

Respuesta esperada:
```json
{
  "success": true,
  "comprobante": {
    "id": 1,
    "estado": "PENDIENTE",
    ...
  }
}
```

### Test Manual 3: Validar Comprobante

```bash
curl -X PATCH http://localhost:3000/comprobantes/1/validar \
  -H "Authorization: Bearer TOKEN"
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Comprobante validado"
}
```

---

## 🐛 Debugging Rápido

### Error: "Relation does not exist"

**Causa:** Migration no corrió

**Solución:**
```bash
psql $DATABASE_URL -f migrations/04-sistema-cuentas-transferencias.sql
```

### Error: "Cannot find module cuentasBancariasService"

**Causa:** Archivo no creado

**Solución:** Crea el archivo y pega el código de Copilot

### Error: "Upload folder not found"

**Causa:** Carpeta no existe

**Solución:**
```bash
mkdir -p teatro-tickets-backend/uploads/comprobantes
```

---

## 📊 Checklist Final

- [ ] Migration corrió sin errores
- [ ] Tablas creadas: `cuentas_bancarias`, `comprobantes`
- [ ] Campos agregados en: `cuotas`, `tickets`, `funciones`, `grupos`, `caja`
- [ ] Services creados: `cuentasBancariasService`, `comprobantesService`
- [ ] Controllers creados: `cuentas`, `comprobantes`
- [ ] Routes agregadas: `/cuentas`, `/comprobantes`
- [ ] Carpeta `uploads/` creada
- [ ] Tests pasan
- [ ] Test manual: crear cuenta ✓
- [ ] Test manual: subir comprobante ✓
- [ ] Test manual: validar comprobante ✓

---

## 🎉 ¿Qué Lograste?

```
ANTES (PASO 4)
├─ Pagos abstractos
├─ Sin cuentas bancarias
├─ Sin comprobantes
└─ Sin validación

AHORA (PASO 5)
├─ Cuentas bancarias reales
├─ Comprobantes de transferencia
├─ Validación por directores
├─ Auditoría completa
└─ Gestión económica profesional ✅
```

---

## 🚀 Próximo Paso

```
✅ PASO 4: Arquitectura limpia
✅ PASO 5: Sistema de cuentas ← ACTUAL
⏳ PASO 6: UI para actores/directores
⏳ PASO 7: Tests completos
⏳ PASO 8: Deploy a producción
```

---

## 📞 Ayuda Rápida

| Problema | Solución |
|----------|----------|
| Migration falla | Ver [DEBUGGING-PASO-5.md](DEBUGGING-PASO-5.md) |
| Copilot no genera bien | Agregar más contexto al prompt |
| Tests fallan | Ver output, corregir service |
| Upload no funciona | Verificar carpeta existe |

---

**TIEMPO TOTAL:** 30-45 minutos  
**RESULTADO:** Sistema con gestión económica real 🏦✅
