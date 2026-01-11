# 📊 PASO 8 — REPORTES FINANCIEROS — DIAGNÓSTICO

## 🎯 EL PROBLEMA REAL

**Situación actual:**
- Sistema tiene pagos funcionando (PASO 6 ✅)
- Sistema registra en CAJA (PASO 5 ✅)
- Pero... ¿cómo sabe el director cuánta plata hay?

**Preguntas sin respuesta:**
- ¿Cuánto ingresó este mes?
- ¿Cuánto se gastó?
- ¿Quién debe cuotas?
- ¿Cuánto vendió cada función?
- ¿Qué actor entregó cuánto?
- ¿Cómo cruzo con el banco?

**Síntoma visible:**
Director usa Excel paralelo porque el sistema no muestra la verdad financiera.

**Consecuencia:**
Sistema no genera confianza → Vuelven a papel.

---

## 🧠 PRINCIPIO FUNDAMENTAL

> **Un reporte NO calcula en vivo.
> Un reporte CONSOLIDA hechos ya validados.**

### ¿Qué significa esto?

**❌ MAL:**
```js
// Calcular ingresos sumando tickets.estado = 'vendido'
const ingresos = tickets
  .filter(t => t.estado === 'vendido')
  .reduce((sum, t) => sum + t.precio, 0);
```

**Problemas:**
- ¿Y si ticket está vendido pero no pagado?
- ¿Y si hay reembolso?
- ¿Y si cambió el estado después?
- No auditable

**✅ BIEN:**
```js
// Leer CAJA (ya validado, inmutable)
const ingresos = await pool.query(`
  SELECT SUM(monto) as total
  FROM caja
  WHERE tipo_movimiento = 'INGRESO'
    AND grupo_id = $1
    AND fecha BETWEEN $2 AND $3
`, [grupoId, from, to]);
```

**Por qué funciona:**
- CAJA = libro diario contable
- Solo se escribe cuando algo está CONFIRMADO
- Inmutable (no se edita)
- Auditable (tiene referencia a origen)
- Una fuente de verdad

---

## 📚 ANALOGÍA CONTABLE (IMPORTANTE)

Tu sistema ahora es una contabilidad profesional:

| Concepto contable | En tu sistema |
|-------------------|---------------|
| Libro Diario | tabla CAJA |
| Asiento contable | registro en CAJA |
| Debe / Haber | tipo_movimiento (INGRESO/EGRESO) |
| Saldo | campo saldo (calculado) |
| Balance | Reporte de Grupo |
| Estado de cuenta | Reporte por Actor |
| Libro de Bancos | Reporte por Cuenta |
| Cierre de caja | Reporte de Función |

📌 **Tu sistema ya tiene la base contable correcta.
Ahora solo necesitás los reportes que la MUESTREN.**

---

## 🗂️ 4 TIPOS DE REPORTES (LOS QUE REALMENTE SE USAN)

### 1️⃣ REPORTE DE FUNCIÓN

**Cuándo:** Al cerrar función (manual o automático)
**Quién:** Director, Super Usuario
**Propósito:** Cierre de caja por función

#### Datos incluidos:

**Tickets:**
- Generados: 100
- Vendidos: 85
- Pagados: 85
- Usados: 80
- Disponibles: 15

**Ingresos:**
- Por medio de pago:
  * Efectivo: $30,000
  * Transferencia: $25,000
  * MercadoPago: $40,000
- Total: $95,000

**Cuenta destino:**
- Banco Nación
- Cuenta: 1234567890
- CBU: 0110...

**Gastos:**
- Alquiler sala: $20,000
- Técnico: $10,000
- Total: $30,000

**Balance:**
- Ingresos: $95,000
- Egresos: $30,000
- **Neto: $65,000**

#### Características:
- ✅ Se guarda en BD (histórico)
- ✅ Inmutable (no cambia nunca)
- ✅ Exportable a PDF
- ✅ Auditable

**Query base:**
```sql
SELECT 
  tipo_movimiento,
  monto,
  descripcion,
  fecha
FROM caja
WHERE funcion_id = $1
ORDER BY fecha ASC
```

---

### 2️⃣ REPORTE DE GRUPO (MENSUAL/ANUAL)

**Cuándo:** Cuando director lo solicite
**Quién:** Director
**Propósito:** Ver salud financiera del grupo

#### Datos incluidos:

**INGRESOS**
- Cuotas de actores: $50,000
- Ventas de funciones: $200,000
- Otros ingresos: $10,000
- **Total ingresos: $260,000**

**EGRESOS**
- Alquileres: $80,000
- Técnicos: $30,000
- Materiales: $20,000
- Otros gastos: $15,000
- **Total egresos: $145,000**

**BALANCE**
- Ingresos: $260,000
- Egresos: $145,000
- **Resultado: +$115,000**

**SALDO ACUMULADO**
- Saldo anterior: $50,000
- Resultado período: +$115,000
- **Saldo actual: $165,000**

#### Desglose por función:
| Función | Ingresos | Egresos | Neto |
|---------|----------|---------|------|
| Hamlet 15/01 | $95,000 | $30,000 | $65,000 |
| Hamlet 22/01 | $90,000 | $28,000 | $62,000 |
| Romeo 29/01 | $85,000 | $32,000 | $53,000 |

#### Desglose por categoría:
| Categoría | Monto |
|-----------|-------|
| Alquileres | $80,000 |
| Técnicos | $30,000 |
| Materiales | $20,000 |

**Query base:**
```sql
SELECT 
  tipo_movimiento,
  SUM(monto) as total,
  COUNT(*) as cantidad
FROM caja
WHERE grupo_id = $1
  AND fecha BETWEEN $2 AND $3
GROUP BY tipo_movimiento
```

---

### 3️⃣ REPORTE POR ACTOR

**Cuándo:** Cuando se necesite
**Quién:** Director (ve todos), Actor (solo el suyo)
**Propósito:** Estado de cuenta individual

#### Datos incluidos:

**Actor:** Juan Pérez
**Grupo:** Teatro La Esquina
**Período:** Enero 2026

**CUOTAS**
- Enero: ✅ Pagada ($500)
- Febrero: 🔴 Pendiente ($500)
- Marzo: 🔴 Pendiente ($500)

**TICKETS VENDIDOS**
- Hamlet 15/01: 5 tickets × $1,500 = $7,500 ✅ Pagados
- Hamlet 22/01: 3 tickets × $1,500 = $4,500 ✅ Pagados

**RESUMEN**
- Cuotas pagadas: $500
- Cuotas pendientes: $1,000
- Tickets vendidos: $12,000
- **Total entregado: $12,500**
- **Total pendiente: $1,000**

**Query base:**
```sql
-- Cuotas pagadas
SELECT SUM(monto) 
FROM caja
WHERE actor_id = $1
  AND tipo_movimiento = 'INGRESO'
  AND descripcion LIKE 'Cuota%'

-- Tickets vendidos
SELECT SUM(monto)
FROM caja
WHERE actor_id = $1
  AND tipo_movimiento = 'INGRESO'
  AND descripcion LIKE 'Ticket%'
```

---

### 4️⃣ REPORTE POR CUENTA BANCARIA

**Cuándo:** Para cruzar con extracto bancario
**Quién:** Director
**Propósito:** Control real de transferencias

#### Datos incluidos:

**Cuenta:** Banco Nación - 1234567890
**Alias:** teatro.esquina
**Grupo/Función:** Hamlet 15/01
**Período:** 01/01/2026 - 31/01/2026

**MOVIMIENTOS**
| Fecha | Concepto | Monto | Estado | Ref |
|-------|----------|-------|--------|-----|
| 10/01 | Ticket #1234 | $1,500 | ✅ Validado | T-001 |
| 12/01 | Cuota Actor Juan | $500 | ✅ Validado | C-045 |
| 15/01 | Ticket #1235 | $1,500 | ✅ Validado | T-002 |
| 18/01 | Ticket #1236 | $1,500 | ✅ Validado | T-003 |

**TOTALES**
- Ingresos: $5,000
- Cantidad: 4 movimientos
- Todos validados

**Query base:**
```sql
SELECT 
  c.fecha,
  c.descripcion,
  c.monto,
  c.referencia
FROM caja c
JOIN cuentas_bancarias cb ON c.cuenta_bancaria_id = cb.id
WHERE cb.id = $1
  AND c.fecha BETWEEN $2 AND $3
  AND c.tipo_movimiento = 'INGRESO'
ORDER BY c.fecha ASC
```

---

## 🏗️ ARQUITECTURA DE REPORTES

### Estructura de carpetas (backend)

```
teatro-tickets-backend/
├─ reports/
│  ├─ functionReportService.js    → Reporte de función
│  ├─ groupReportService.js       → Reporte de grupo
│  ├─ actorReportService.js       → Reporte por actor
│  ├─ accountReportService.js     → Reporte por cuenta
│  ├─ pdfExporter.js              → Exportar a PDF
│  └─ reportUtils.js              → Funciones comunes
│
├─ routes/
│  └─ reportesRoutes.js           → Endpoints
│
└─ index-v3-postgres.js           → Registrar rutas
```

---

## 🔌 ENDPOINTS (API)

### GET /api/reportes/funcion/:funcionId

**Response:**
```json
{
  "funcion": {
    "id": 123,
    "obra": "Hamlet",
    "fecha": "2026-01-15T20:00:00Z",
    "grupo": "Teatro La Esquina"
  },
  "tickets": {
    "generados": 100,
    "vendidos": 85,
    "pagados": 85,
    "usados": 80,
    "disponibles": 15
  },
  "ingresos": {
    "efectivo": 30000,
    "transferencia": 25000,
    "mercadopago": 40000,
    "total": 95000
  },
  "egresos": {
    "alquiler": 20000,
    "tecnicos": 10000,
    "total": 30000
  },
  "balance": 65000,
  "cuenta_destino": {
    "banco": "Nación",
    "cuenta": "1234567890"
  },
  "fecha_generacion": "2026-01-16T10:00:00Z"
}
```

---

### GET /api/reportes/grupo/:grupoId?from=YYYY-MM-DD&to=YYYY-MM-DD

**Response:**
```json
{
  "grupo": {
    "id": 1,
    "nombre": "Teatro La Esquina"
  },
  "periodo": {
    "desde": "2026-01-01",
    "hasta": "2026-01-31"
  },
  "ingresos": {
    "cuotas": 50000,
    "funciones": 200000,
    "otros": 10000,
    "total": 260000
  },
  "egresos": {
    "alquileres": 80000,
    "tecnicos": 30000,
    "materiales": 20000,
    "otros": 15000,
    "total": 145000
  },
  "balance": 115000,
  "saldo_anterior": 50000,
  "saldo_actual": 165000,
  "funciones": [
    {
      "funcion": "Hamlet 15/01",
      "ingresos": 95000,
      "egresos": 30000,
      "neto": 65000
    }
  ],
  "fecha_generacion": "2026-02-01T10:00:00Z"
}
```

---

### GET /api/reportes/actor/:actorId?from=YYYY-MM-DD&to=YYYY-MM-DD

**Response:**
```json
{
  "actor": {
    "id": 5,
    "nombre": "Juan Pérez",
    "grupo": "Teatro La Esquina"
  },
  "periodo": {
    "desde": "2026-01-01",
    "hasta": "2026-01-31"
  },
  "cuotas": {
    "pagadas": 500,
    "pendientes": 1000,
    "detalle": [
      {
        "mes": "Enero 2026",
        "monto": 500,
        "estado": "PAGADA",
        "fecha_pago": "2026-01-10"
      }
    ]
  },
  "tickets": {
    "vendidos": 8,
    "monto_total": 12000,
    "detalle": [
      {
        "funcion": "Hamlet 15/01",
        "cantidad": 5,
        "monto": 7500,
        "estado": "PAGADO"
      }
    ]
  },
  "resumen": {
    "total_entregado": 12500,
    "total_pendiente": 1000
  },
  "fecha_generacion": "2026-02-01T10:00:00Z"
}
```

---

### GET /api/reportes/cuenta/:cuentaId?from=YYYY-MM-DD&to=YYYY-MM-DD

**Response:**
```json
{
  "cuenta": {
    "id": 10,
    "banco": "Nación",
    "numero_cuenta": "1234567890",
    "alias": "teatro.esquina",
    "grupo": "Teatro La Esquina"
  },
  "periodo": {
    "desde": "2026-01-01",
    "hasta": "2026-01-31"
  },
  "movimientos": [
    {
      "fecha": "2026-01-10",
      "concepto": "Ticket #1234",
      "monto": 1500,
      "estado": "VALIDADO",
      "referencia": "T-001"
    }
  ],
  "totales": {
    "ingresos": 5000,
    "cantidad": 4,
    "validados": 4
  },
  "fecha_generacion": "2026-02-01T10:00:00Z"
}
```

---

## 📄 EXPORTAR A PDF

Cada reporte debe ser exportable:

### GET /api/reportes/funcion/:funcionId/pdf

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="reporte-funcion-123.pdf"
```

**PDF contiene:**
- Logo del grupo (opcional)
- Título: "Reporte Financiero - Función"
- Fecha de generación
- Todos los datos del reporte
- Firma digital del sistema (opcional)

**Librería recomendada:** `pdfkit`

```js
import PDFDocument from 'pdfkit';

export function generateFunctionPDF(data) {
  const doc = new PDFDocument();
  
  doc.fontSize(20).text('Reporte Financiero - Función', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Obra: ${data.funcion.obra}`);
  doc.text(`Fecha: ${data.funcion.fecha}`);
  doc.moveDown();
  
  doc.text('TICKETS');
  doc.text(`Generados: ${data.tickets.generados}`);
  doc.text(`Vendidos: ${data.tickets.vendidos}`);
  doc.moveDown();
  
  doc.text('INGRESOS');
  doc.text(`Efectivo: $${data.ingresos.efectivo}`);
  doc.text(`Transferencia: $${data.ingresos.transferencia}`);
  doc.text(`MercadoPago: $${data.ingresos.mercadopago}`);
  doc.text(`Total: $${data.ingresos.total}`);
  
  return doc;
}
```

---

## 🔐 PERMISOS POR ROL

### Super Usuario
- ✅ Todos los reportes
- ✅ Exportar PDF
- ✅ Ver históricos

### Director
- ✅ Reporte de función (su grupo)
- ✅ Reporte de grupo (su grupo)
- ✅ Reporte por actor (su grupo)
- ✅ Reporte por cuenta (su grupo)
- ✅ Exportar PDF

### Actor
- ✅ Reporte propio (solo su estado)
- ❌ Reporte de función
- ❌ Reporte de grupo
- ❌ Reporte de otros actores

### Invitado
- ❌ Sin acceso a reportes

---

## 🧪 VALIDACIONES CRÍTICAS

### 1. Solo datos validados

**❌ NO incluir:**
- Tickets vendidos pero no pagados
- Cuotas en validación
- Pagos pendientes de aprobación
- Gastos sin aprobar

**✅ SÍ incluir:**
- Tickets pagados y confirmados
- Cuotas validadas por director
- Pagos aprobados
- Gastos registrados en CAJA

---

### 2. Inmutabilidad de reportes cerrados

**Reporte de función cerrado:**
- No debe cambiar nunca
- Guardar snapshot en BD
- Fecha de cierre

```sql
CREATE TABLE reportes_funcion (
  id SERIAL PRIMARY KEY,
  funcion_id INTEGER REFERENCES funciones(id),
  datos JSONB NOT NULL,
  fecha_cierre TIMESTAMP DEFAULT NOW(),
  generado_por INTEGER REFERENCES usuarios(id)
);
```

---

### 3. Auditoría

Cada reporte debe tener:
- Fecha de generación
- Usuario que lo generó
- Período consultado
- Datos inmutables

---

## 📊 PANTALLAS FRONTEND (DISEÑO CONCEPTUAL)

### 🎭 Director: Reportes

**Archivo:** `frontend/director/reportes.html`

**Layout:**
```
┌─────────────────────────────────────────┐
│ 📊 REPORTES FINANCIEROS                 │
├─────────────────────────────────────────┤
│                                         │
│ [Función] [Grupo] [Actor] [Cuenta]     │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ REPORTE DE GRUPO                │   │
│ │                                 │   │
│ │ Período:                        │   │
│ │ [01/01/2026] - [31/01/2026]     │   │
│ │ [Generar Reporte]               │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ INGRESOS                        │   │
│ │ Cuotas:        $50,000          │   │
│ │ Funciones:     $200,000         │   │
│ │ Otros:         $10,000          │   │
│ │ TOTAL:         $260,000         │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ EGRESOS                         │   │
│ │ Alquileres:    $80,000          │   │
│ │ Técnicos:      $30,000          │   │
│ │ Materiales:    $20,000          │   │
│ │ TOTAL:         $145,000         │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ BALANCE                         │   │
│ │ Resultado:     +$115,000        │   │
│ │ Saldo actual:  $165,000         │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Exportar PDF] [Ver Detalle]          │
└─────────────────────────────────────────┘
```

---

### 🎭 Actor: Mi Estado

**Archivo:** `frontend/actor/mi-estado.html`

**Layout:**
```
┌─────────────────────────────────────────┐
│ 👤 MI ESTADO FINANCIERO                 │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ CUOTAS                          │   │
│ │ ✅ Enero: $500 (pagada)         │   │
│ │ 🔴 Febrero: $500 (pendiente)    │   │
│ │ 🔴 Marzo: $500 (pendiente)      │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ TICKETS VENDIDOS                │   │
│ │ Hamlet 15/01: 5 × $1,500        │   │
│ │ Hamlet 22/01: 3 × $1,500        │   │
│ │ Total: $12,000                  │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ RESUMEN                         │   │
│ │ Total entregado:  $12,500       │   │
│ │ Total pendiente:  $1,000        │   │
│ └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚠️ ERRORES COMUNES (EVITARLOS)

### ❌ ERROR 1: Calcular desde tickets

```js
// MAL - No auditable
const ingresos = await pool.query(`
  SELECT SUM(precio) FROM tickets WHERE estado = 'vendido'
`);
```

**Problema:** ¿Y si hubo reembolso? ¿Y si estado cambió?

**✅ Solución:** Leer CAJA
```js
const ingresos = await pool.query(`
  SELECT SUM(monto) FROM caja WHERE tipo_movimiento = 'INGRESO'
`);
```

---

### ❌ ERROR 2: Mezclar pendientes con pagados

```js
// MAL
const total = tickets.vendidos + tickets.pendientes;
```

**Problema:** Confunde lo real con lo esperado.

**✅ Solución:** Solo validados
```js
const total = tickets.pagados; // Solo lo confirmado
```

---

### ❌ ERROR 3: Permitir editar reportes

Un reporte cerrado **NO se edita NUNCA**.

Si hay error:
1. Corregir origen (CAJA)
2. Regenerar reporte

---

### ❌ ERROR 4: Mostrar demasiado al actor

Actor no debe ver:
- Balance del grupo
- Cuotas de otros actores
- Cuentas bancarias
- Gastos del grupo

---

## 🎯 FLUJO COMPLETO: GENERAR REPORTE DE GRUPO

```
1. Director abre: /director/reportes.html
2. Selecciona: "Reporte de Grupo"
3. Ingresa período: 01/01/2026 - 31/01/2026
4. Click: "Generar Reporte"
5. Frontend: GET /api/reportes/grupo/1?from=2026-01-01&to=2026-01-31
6. Backend: Consulta CAJA con filtros
7. Backend: Agrupa por tipo_movimiento
8. Backend: Calcula totales
9. Backend: Retorna JSON
10. Frontend: Muestra tarjetas (Ingresos, Egresos, Balance)
11. Frontend: Muestra tabla detallada
12. Director: Click "Exportar PDF"
13. Frontend: GET /api/reportes/grupo/1/pdf?from=2026-01-01&to=2026-01-31
14. Backend: Genera PDF con pdfkit
15. Browser: Descarga archivo "reporte-grupo-enero-2026.pdf"
```

---

## 🔗 INTEGRACIÓN CON PASO 6 (PAGOS)

### Conexión clara:

**PASO 6 (Pagos):**
- Registra en CAJA cuando pago se confirma
- Webhook MercadoPago → CAJA
- Director valida transferencia → CAJA

**PASO 8 (Reportes):**
- Lee CAJA como fuente única
- No toca intenciones_pago
- No toca tickets directamente

**Flujo:**
```
Pago confirmado → CAJA (INSERT) → Disponible para reportes
```

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad

- ✅ Reporte de función: cierre de caja completo
- ✅ Reporte de grupo: balance mensual/anual
- ✅ Reporte por actor: estado individual
- ✅ Reporte por cuenta: cruce bancario
- ✅ Exportar a PDF: todos los reportes
- ✅ Permisos correctos por rol

### Confianza

- ✅ Números cuadran con CAJA
- ✅ Reportes inmutables (históricos)
- ✅ Director no necesita Excel
- ✅ Actor sabe qué debe
- ✅ Auditable externamente

### Técnico

- ✅ Queries optimizados (índices en CAJA)
- ✅ Caché si es necesario
- ✅ PDF bien formateado
- ✅ Sin N+1 queries

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend

- [ ] Crear carpeta `reports/`
- [ ] Implementar `functionReportService.js`
- [ ] Implementar `groupReportService.js`
- [ ] Implementar `actorReportService.js`
- [ ] Implementar `accountReportService.js`
- [ ] Implementar `pdfExporter.js`
- [ ] Crear rutas `/api/reportes/*`
- [ ] Agregar permisos por rol
- [ ] Crear tabla `reportes_funcion` (históricos)
- [ ] Optimizar queries CAJA (índices)

### Frontend

- [ ] Crear `frontend/director/reportes.html`
- [ ] Crear `frontend/actor/mi-estado.html`
- [ ] Implementar selección de período
- [ ] Implementar tabs (Función/Grupo/Actor/Cuenta)
- [ ] Mostrar tarjetas de resumen
- [ ] Mostrar tabla detallada
- [ ] Botón "Exportar PDF"
- [ ] Loading states
- [ ] Error handling

### Testing

- [ ] Test: Reporte de función con datos reales
- [ ] Test: Reporte de grupo con múltiples funciones
- [ ] Test: Reporte por actor (solo ve el suyo)
- [ ] Test: Reporte por cuenta bancaria
- [ ] Test: Exportar PDF (descarga correcta)
- [ ] Test: Permisos (actor no ve reportes ajenos)
- [ ] Test: Números cuadran con CAJA

---

## 🚀 PRÓXIMOS PASOS

1. **Leer PROMPT-PASO-8-COPILOT.md** (archivo siguiente)
2. **Ejecutar en Copilot Chat** (genera código)
3. **Implementar servicios** (30-45 min)
4. **Crear endpoints** (15-20 min)
5. **Agregar exportar PDF** (20-30 min)
6. **Crear pantallas frontend** (45-60 min)
7. **Testing manual** (20 min)

**Tiempo total estimado:** 2.5 - 3 horas

---

## 💎 CONCLUSIÓN

**Este paso es CRÍTICO.**

Un sistema sin reportes claros:
- No genera confianza
- Obliga a Excel paralelo
- No es auditable
- No escala

**Con reportes bien hechos:**
- Director tiene control real
- Actor sabe qué debe
- Grupo puede crecer
- Sistema es profesional

**Tu ventaja:**
Ya tenés CAJA como fuente de verdad.
Solo necesitás MOSTRARLA bien.

🎯 **Siguiente:** [PROMPT-PASO-8-COPILOT.md](PROMPT-PASO-8-COPILOT.md)
