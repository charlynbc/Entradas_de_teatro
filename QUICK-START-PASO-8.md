# ⚡ QUICK START — PASO 8 — REPORTES FINANCIEROS

## 🎯 OBJETIVO

Implementar sistema de reportes financieros en **2.5 - 3 horas**.

---

## 📋 PRE-REQUISITOS

- ✅ PASO 5 completado (sistema CAJA funcionando)
- ✅ PASO 6 completado (pagos registrando en CAJA)
- ✅ Backend corriendo (PostgreSQL + Node.js)
- ✅ Datos de prueba en CAJA

---

## ⚡ 6 PASOS RÁPIDOS

### PASO 1: Abrir Copilot Chat (10 seg)

```
Ctrl + Shift + I (Windows/Linux)
Cmd + Shift + I (Mac)
```

---

### PASO 2: Copiar prompt (20 seg)

1. Abrir archivo: `PROMPT-PASO-8-COPILOT.md`
2. Ctrl+A → Ctrl+C (todo el archivo)

---

### PASO 3: Pegar en Copilot (10 seg)

1. Pegar en Copilot Chat
2. Enter
3. Esperar 60-90 segundos

**Copilot generará:**
- 5 servicios (function, group, actor, account, pdf)
- 1 archivo de rutas
- 2 pantallas frontend (reportes, mi-estado)
- 2 archivos JS frontend

---

### PASO 4: Implementar servicios backend (45-60 min)

#### 4.1 Crear estructura

```bash
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend

mkdir -p reports
mkdir -p routes

touch reports/functionReportService.js
touch reports/groupReportService.js
touch reports/actorReportService.js
touch reports/accountReportService.js
touch reports/pdfExporter.js
touch reports/reportUtils.js

touch routes/reportesRoutes.js
```

**Tiempo:** 2 min

---

#### 4.2 Copiar servicios generados

**Copilot te dará bloques de código como:**

```js
// functionReportService.js
export async function getFunctionReport(funcionId) {
  // ... código
}
```

**Acción:**
1. Copiar código de `functionReportService.js` → pegar en archivo
2. Copiar código de `groupReportService.js` → pegar en archivo
3. Copiar código de `actorReportService.js` → pegar en archivo
4. Copiar código de `accountReportService.js` → pegar en archivo
5. Copiar código de `pdfExporter.js` → pegar en archivo

**Tiempo:** 10-15 min

---

#### 4.3 Instalar pdfkit

```bash
cd teatro-tickets-backend
npm install pdfkit
```

**Tiempo:** 30 seg

---

#### 4.4 Crear tabla reportes_funcion

```bash
# Conectar a PostgreSQL
psql -U postgres -d teatro
```

```sql
CREATE TABLE IF NOT EXISTS reportes_funcion (
  id SERIAL PRIMARY KEY,
  funcion_id INTEGER REFERENCES funciones(id),
  datos JSONB NOT NULL,
  fecha_cierre TIMESTAMP DEFAULT NOW(),
  generado_por INTEGER REFERENCES usuarios(id),
  UNIQUE(funcion_id)
);
```

**Tiempo:** 1 min

---

#### 4.5 Copiar rutas

**Copilot genera:**

```js
// routes/reportesRoutes.js
import express from 'express';
// ...
```

**Acción:**
1. Copiar código completo → pegar en `routes/reportesRoutes.js`

**Tiempo:** 2 min

---

#### 4.6 Registrar rutas en index-v3-postgres.js

**Abrir:** `teatro-tickets-backend/index-v3-postgres.js`

**Agregar al inicio:**
```js
import reportesRoutes from './routes/reportesRoutes.js';
```

**Agregar después de otras rutas:**
```js
app.use('/api/reportes', reportesRoutes);
```

**Tiempo:** 1 min

---

#### 4.7 Verificar imports

**Cada service debe importar pool:**

```js
import pool from '../db.js'; // Ajustar path si es necesario
```

**Tiempo:** 5 min

---

### PASO 5: Implementar frontend (45-60 min)

#### 5.1 Crear estructura

```bash
cd /workspaces/Entradas_de_teatro

mkdir -p frontend/director
mkdir -p frontend/actor

touch frontend/director/reportes.html
touch frontend/director/reportes.js

touch frontend/actor/mi-estado.html
touch frontend/actor/mi-estado.js
```

**Tiempo:** 1 min

---

#### 5.2 Copiar HTML/JS

**Copilot genera:**

```html
<!-- director/reportes.html -->
<!DOCTYPE html>
<html>
...
</html>
```

**Acción:**
1. Copiar `reportes.html` → pegar en `frontend/director/reportes.html`
2. Copiar `reportes.js` → pegar en `frontend/director/reportes.js`
3. Copiar `mi-estado.html` → pegar en `frontend/actor/mi-estado.html`
4. Copiar `mi-estado.js` → pegar en `frontend/actor/mi-estado.js`

**Tiempo:** 10 min

---

#### 5.3 Verificar paths

**En HTML, verificar:**

```html
<link rel="stylesheet" href="../shared/styles.css">
<script src="../shared/api.js"></script>
```

**Ajustar si tu estructura es diferente.**

**Tiempo:** 2 min

---

#### 5.4 Actualizar header.html

**Agregar link en navegación de director:**

```html
<!-- shared/header.html -->
<nav>
  <a href="validar-cuotas.html">Validar Cuotas</a>
  <a href="validar-pagos.html">Validar Pagos</a>
  <a href="reportes.html">📊 Reportes</a> <!-- NUEVO -->
  <a href="configuracion-financiera.html">Configuración</a>
  <a href="#" onclick="logout()">Salir</a>
</nav>
```

**Agregar link en navegación de actor:**

```html
<!-- shared/header.html -->
<nav>
  <a href="mis-cuotas.html">Mis Cuotas</a>
  <a href="mis-tickets.html">Mis Tickets</a>
  <a href="mi-estado.html">📊 Mi Estado</a> <!-- NUEVO -->
  <a href="#" onclick="logout()">Salir</a>
</nav>
```

**Tiempo:** 3 min

---

### PASO 6: Testing manual (20-30 min)

#### Test 1: Reporte de Grupo

1. **Iniciar backend:**
   ```bash
   cd teatro-tickets-backend
   npm run dev
   ```

2. **Iniciar frontend:**
   ```bash
   cd frontend
   python3 -m http.server 8080
   # o
   npx http-server -p 8080
   ```

3. **Abrir browser:**
   ```
   http://localhost:8080/director/reportes.html
   ```

4. **Login como director**

5. **Tab "Reporte de Grupo":**
   - Seleccionar período: `2026-01-01` → `2026-01-31`
   - Click "Generar Reporte"

6. **Verificar:**
   - ✅ Muestra ingresos (cuotas, funciones, otros)
   - ✅ Muestra egresos por categoría
   - ✅ Muestra balance
   - ✅ Tabla de funciones
   - ✅ Botón "Exportar PDF" funciona

**Tiempo:** 5 min

---

#### Test 2: Reporte de Función

1. **Tab "Reporte de Función":**
   - Seleccionar función del dropdown
   - Click "Generar Reporte"

2. **Verificar:**
   - ✅ Muestra tickets (generados, vendidos, pagados)
   - ✅ Muestra ingresos por medio de pago
   - ✅ Muestra egresos
   - ✅ Muestra balance
   - ✅ Muestra cuenta bancaria
   - ✅ Exportar PDF funciona

**Tiempo:** 5 min

---

#### Test 3: Reporte por Actor (Director)

1. **Tab "Reporte por Actor":**
   - Seleccionar actor del dropdown
   - Seleccionar período
   - Click "Generar Reporte"

2. **Verificar:**
   - ✅ Muestra cuotas (pagadas/pendientes)
   - ✅ Muestra tickets vendidos
   - ✅ Muestra resumen (total entregado/pendiente)
   - ✅ Exportar PDF funciona

**Tiempo:** 5 min

---

#### Test 4: Mi Estado (Actor)

1. **Abrir:**
   ```
   http://localhost:8080/actor/mi-estado.html
   ```

2. **Login como actor**

3. **Seleccionar período**

4. **Click "Ver Estado"**

5. **Verificar:**
   - ✅ Muestra solo SUS cuotas
   - ✅ Muestra solo SUS tickets
   - ✅ NO ve reportes de otros actores
   - ✅ NO ve balance del grupo

**Tiempo:** 5 min

---

#### Test 5: Exportar PDF

1. **En cualquier reporte:**
   - Click "Exportar PDF"

2. **Verificar:**
   - ✅ Se descarga archivo PDF
   - ✅ Nombre descriptivo: `reporte-grupo-1-2026-01-01-2026-01-31.pdf`
   - ✅ PDF contiene todos los datos
   - ✅ PDF está bien formateado

**Tiempo:** 3 min

---

#### Test 6: Permisos

1. **Login como actor**

2. **Intentar acceder:**
   ```
   http://localhost:8080/director/reportes.html
   ```

3. **Verificar:**
   - ❌ No debe poder acceder
   - ❌ O debe mostrar error "No autorizado"

4. **Intentar API directamente:**
   ```bash
   curl http://localhost:5000/api/reportes/grupo/1?from=2026-01-01&to=2026-01-31 \
     -H "Authorization: Bearer <token-de-actor>"
   ```

5. **Verificar:**
   - ❌ Debe retornar 403 Forbidden

**Tiempo:** 5 min

---

## 🐛 DEBUGGING COMÚN

### Error 1: "Cannot find module 'pdfkit'"

**Causa:** No instalaste pdfkit

**Solución:**
```bash
cd teatro-tickets-backend
npm install pdfkit
```

---

### Error 2: "pool is not defined"

**Causa:** Falta importar pool en los services

**Solución:**
```js
// Al inicio de cada service
import pool from '../db.js';
```

---

### Error 3: Reporte vacío (sin datos)

**Causa:** No hay datos en CAJA en ese período

**Solución 1:** Cambiar fechas del período

**Solución 2:** Crear datos de prueba
```bash
cd teatro-tickets-backend
node create-test-data.js
```

---

### Error 4: PDF no descarga

**Causa:** Headers incorrectos

**Solución:**
```js
// En reportesRoutes.js, verificar:
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="reporte.pdf"');

pdf.pipe(res);
pdf.end();
```

---

### Error 5: CORS al exportar PDF

**Causa:** Frontend en puerto diferente

**Solución:**
```js
// En index-v3-postgres.js
import cors from 'cors';
app.use(cors());
```

---

### Error 6: "No autorizado" para director

**Causa:** Token expirado o grupo_id no coincide

**Solución:**
```bash
# Verificar token en localStorage (DevTools → Application → Local Storage)
# Verificar grupo_id del usuario en BD
```

---

## 📊 VERIFICACIÓN FINAL (15 items)

### Backend
- [ ] Carpeta `reports/` creada con 5 servicios
- [ ] `routes/reportesRoutes.js` existe
- [ ] Rutas registradas en `index-v3-postgres.js`
- [ ] Tabla `reportes_funcion` creada
- [ ] `pdfkit` instalado
- [ ] Backend reiniciado sin errores

### Frontend
- [ ] `director/reportes.html` y `.js` creados
- [ ] `actor/mi-estado.html` y `.js` creados
- [ ] Links agregados en header
- [ ] Frontend servido en http://localhost:8080

### Funcionalidad
- [ ] Reporte de grupo genera correctamente
- [ ] Reporte de función genera correctamente
- [ ] Reporte por actor genera correctamente
- [ ] Exportar PDF funciona
- [ ] Actor solo ve su propio reporte

---

## ⏱️ TIEMPO ESTIMADO TOTAL

| Paso | Tiempo |
|------|--------|
| 1-3: Copilot | 2 min |
| 4: Backend | 45-60 min |
| 5: Frontend | 45-60 min |
| 6: Testing | 20-30 min |
| **TOTAL** | **2.5 - 3 horas** |

---

## 🎯 PRÓXIMO PASO

Una vez completado:

1. **Verificar que números cuadran:**
   - Sumar ingresos de CAJA manualmente
   - Comparar con reporte
   - Deben coincidir

2. **Probar con datos reales:**
   - Crear funciones reales
   - Vender tickets
   - Pagar cuotas
   - Generar reportes

3. **Feedback de usuarios:**
   - Mostrar a un director real
   - ¿Entiende los números?
   - ¿Falta algo?

---

## 💡 TIPS

### Tip 1: Usa fechas amplias al principio

```
Desde: 2020-01-01
Hasta: 2030-12-31
```

Así verás TODOS los datos mientras testeas.

---

### Tip 2: Verifica CAJA primero

Antes de generar reportes:

```sql
SELECT * FROM caja WHERE grupo_id = 1 ORDER BY fecha DESC LIMIT 20;
```

Si CAJA está vacía, los reportes también estarán vacíos.

---

### Tip 3: Usa console.log

En services:

```js
export async function getGroupReport(grupoId, from, to) {
  console.log('Generando reporte para grupo:', grupoId);
  console.log('Período:', from, 'a', to);
  
  const ingresos = await getCajaMovimientos(...);
  console.log('Ingresos encontrados:', ingresos.length);
  
  // ...
}
```

---

### Tip 4: Testea queries en psql directamente

```bash
psql -U postgres -d teatro
```

```sql
-- Probar query de ingresos
SELECT 
  SUM(monto) as total
FROM caja
WHERE grupo_id = 1
  AND tipo_movimiento = 'INGRESO'
  AND fecha BETWEEN '2026-01-01' AND '2026-01-31';
```

Si esto no retorna datos, el reporte tampoco lo hará.

---

## 🔗 ARCHIVOS RELACIONADOS

- [DIAGNOSTICO-PASO-8.md](DIAGNOSTICO-PASO-8.md) — Problema y solución completa
- [PROMPT-PASO-8-COPILOT.md](PROMPT-PASO-8-COPILOT.md) — Prompt ejecutable
- [PASO-8-COMPLETADO.md](PASO-8-COMPLETADO.md) — Resumen visual (siguiente)

---

## ✅ CHECKLIST EJECUTIVO

Marca según avances:

```
[ ] Copié prompt en Copilot
[ ] Copilot generó código
[ ] Creé carpeta reports/
[ ] Copié 5 servicios
[ ] Instalé pdfkit
[ ] Creé tabla reportes_funcion
[ ] Copié rutas
[ ] Registré rutas en index
[ ] Creé estructura frontend
[ ] Copié HTML/JS
[ ] Actualicé header
[ ] Reinicié backend sin errores
[ ] Reinicié frontend
[ ] Test 1: Reporte de grupo ✅
[ ] Test 2: Reporte de función ✅
[ ] Test 3: Reporte por actor ✅
[ ] Test 4: Mi estado (actor) ✅
[ ] Test 5: Exportar PDF ✅
[ ] Test 6: Permisos ✅
[ ] Números cuadran con CAJA
```

---

## 🎊 AL TERMINAR

**¡Felicitaciones!**

Ahora tu sistema tiene:
- ✅ Reportes financieros claros
- ✅ Basados en CAJA (auditable)
- ✅ Exportables a PDF
- ✅ Permisos correctos por rol
- ✅ Director no necesita Excel

**Siguiente:** [PASO-8-COMPLETADO.md](PASO-8-COMPLETADO.md) para ver resumen visual.

---

**Tiempo real de implementación:** 2.5 - 3 horas
**Nivel de dificultad:** Medio-Alto
**Complejidad técnica:** ⭐⭐⭐⭐☆

🎯 **¡Ahora sí: tu sistema es profesional y confiable!**
