# 🤖 PROMPT PASO 8 — REPORTES FINANCIEROS — COPILOT

## 📋 CONTEXTO DEL SISTEMA

Estás trabajando en un sistema de gestión de entradas de teatro que ya tiene:

- **PASO 5:** Sistema de CAJA (registro contable de todos los movimientos financieros)
- **PASO 6:** Pasarela de pagos (MercadoPago, Transferencia, Efectivo)
- **PASO 7:** Pantallas separadas por rol (Invitado, Actor, Director)

**Ahora necesitamos:** Sistema de reportes financieros que consolide datos validados de CAJA.

---

## 🎯 TU TAREA

Implementar **4 tipos de reportes financieros** que lean exclusivamente de la tabla CAJA:

1. **Reporte de Función** (cierre de caja por función)
2. **Reporte de Grupo** (balance mensual/anual)
3. **Reporte por Actor** (estado individual)
4. **Reporte por Cuenta Bancaria** (cruce con banco)

Todos deben ser:
- ✅ Basados en CAJA (fuente única de verdad)
- ✅ Solo datos validados (pagados, confirmados)
- ✅ Exportables a PDF
- ✅ Con permisos por rol
- ✅ Auditables

---

## 🚨 REGLAS CRÍTICAS (SEGUIR AL PIE DE LA LETRA)

### 1. FUENTE ÚNICA: CAJA

**✅ BIEN:**
```js
// Leer de CAJA
const ingresos = await pool.query(`
  SELECT SUM(monto) as total
  FROM caja
  WHERE tipo_movimiento = 'INGRESO'
    AND grupo_id = $1
`, [grupoId]);
```

**❌ MAL:**
```js
// NO calcular desde tickets o cuotas
const ingresos = await pool.query(`
  SELECT SUM(precio) FROM tickets WHERE estado = 'vendido'
`);
```

**Por qué:** CAJA es el libro contable. Los tickets/cuotas son documentos de origen, no contabilidad.

---

### 2. SOLO DATOS VALIDADOS

**Incluir:**
- ✅ Tickets pagados y confirmados
- ✅ Cuotas validadas por director
- ✅ Pagos aprobados (webhook o manual)
- ✅ Gastos registrados en CAJA

**NO incluir:**
- ❌ Tickets vendidos pero no pagados
- ❌ Cuotas en validación
- ❌ Pagos pendientes de aprobación

---

### 3. INMUTABILIDAD DE REPORTES CERRADOS

**Reporte de función cerrado:**
- Guardar snapshot en BD (`reportes_funcion` table)
- No cambiar nunca
- Si hay error: corregir origen → regenerar

---

### 4. PERMISOS POR ROL

| Reporte | Super Usuario | Director | Actor |
|---------|---------------|----------|-------|
| Función | ✅ Todos | ✅ Su grupo | ❌ No |
| Grupo | ✅ Todos | ✅ Su grupo | ❌ No |
| Actor | ✅ Todos | ✅ Su grupo | ✅ Solo suyo |
| Cuenta | ✅ Todos | ✅ Su grupo | ❌ No |

---

### 5. EXPORTAR A PDF

Cada reporte debe tener endpoint `/pdf` que:
- Genera PDF con `pdfkit`
- Headers: `Content-Type: application/pdf`
- Nombre descriptivo: `reporte-grupo-enero-2026.pdf`

---

## 📦 DELIVERABLE 1: functionReportService.js

### Ubicación:
```
teatro-tickets-backend/reports/functionReportService.js
```

### Funciones a implementar:

#### 1. `getFunctionReport(funcionId)`

**Retorna:**
```js
{
  funcion: {
    id: 123,
    obra: "Hamlet",
    fecha: "2026-01-15T20:00:00Z",
    grupo: "Teatro La Esquina"
  },
  tickets: {
    generados: 100,
    vendidos: 85,
    pagados: 85,
    usados: 80,
    disponibles: 15
  },
  ingresos: {
    efectivo: 30000,
    transferencia: 25000,
    mercadopago: 40000,
    total: 95000
  },
  egresos: {
    por_categoria: [
      { categoria: "Alquiler", monto: 20000 },
      { categoria: "Técnicos", monto: 10000 }
    ],
    total: 30000
  },
  balance: 65000,
  cuenta_destino: {
    banco: "Nación",
    cuenta: "1234567890",
    cbu: "0110...",
    alias: "teatro.funcion"
  },
  detalles: [
    {
      fecha: "2026-01-15T20:30:00Z",
      tipo: "INGRESO",
      descripcion: "Ticket #1234 - MercadoPago",
      monto: 1500,
      referencia: "T-001"
    }
  ],
  fecha_generacion: "2026-01-16T10:00:00Z"
}
```

**Query sugerido:**
```sql
-- Ingresos
SELECT 
  CASE 
    WHEN descripcion LIKE '%MercadoPago%' THEN 'mercadopago'
    WHEN descripcion LIKE '%Transferencia%' THEN 'transferencia'
    WHEN descripcion LIKE '%Efectivo%' THEN 'efectivo'
  END as medio,
  SUM(monto) as total
FROM caja
WHERE funcion_id = $1
  AND tipo_movimiento = 'INGRESO'
GROUP BY medio;

-- Egresos
SELECT 
  categoria,
  SUM(monto) as total
FROM caja
WHERE funcion_id = $1
  AND tipo_movimiento = 'EGRESO'
GROUP BY categoria;

-- Tickets (estadísticas)
SELECT 
  COUNT(*) as generados,
  COUNT(CASE WHEN estado = 'vendido' THEN 1 END) as vendidos,
  COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
  COUNT(CASE WHEN usado = true THEN 1 END) as usados
FROM tickets
WHERE funcion_id = $1;
```

---

#### 2. `saveFunctionReportSnapshot(funcionId, data)`

Guardar reporte cerrado en BD (inmutable).

**Tabla:**
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

**Función:**
```js
export async function saveFunctionReportSnapshot(funcionId, data, userId) {
  const query = `
    INSERT INTO reportes_funcion (funcion_id, datos, generado_por)
    VALUES ($1, $2, $3)
    ON CONFLICT (funcion_id) DO NOTHING
    RETURNING id
  `;
  
  const result = await pool.query(query, [
    funcionId,
    JSON.stringify(data),
    userId
  ]);
  
  return result.rows[0];
}
```

---

## 📦 DELIVERABLE 2: groupReportService.js

### Ubicación:
```
teatro-tickets-backend/reports/groupReportService.js
```

### Funciones a implementar:

#### 1. `getGroupReport(grupoId, from, to)`

**Parámetros:**
- `grupoId`: ID del grupo
- `from`: Fecha inicio (YYYY-MM-DD)
- `to`: Fecha fin (YYYY-MM-DD)

**Retorna:**
```js
{
  grupo: {
    id: 1,
    nombre: "Teatro La Esquina"
  },
  periodo: {
    desde: "2026-01-01",
    hasta: "2026-01-31"
  },
  ingresos: {
    cuotas: 50000,
    funciones: 200000,
    otros: 10000,
    total: 260000,
    detalle: [
      {
        concepto: "Cuotas de actores",
        monto: 50000,
        cantidad: 100
      }
    ]
  },
  egresos: {
    alquileres: 80000,
    tecnicos: 30000,
    materiales: 20000,
    otros: 15000,
    total: 145000,
    detalle: [
      {
        categoria: "Alquileres",
        monto: 80000,
        cantidad: 4
      }
    ]
  },
  balance: 115000,
  saldo_anterior: 50000,
  saldo_actual: 165000,
  funciones: [
    {
      id: 123,
      nombre: "Hamlet 15/01",
      ingresos: 95000,
      egresos: 30000,
      neto: 65000
    }
  ],
  fecha_generacion: "2026-02-01T10:00:00Z"
}
```

**Query sugerido:**
```sql
-- Ingresos totales
SELECT 
  CASE
    WHEN descripcion LIKE '%Cuota%' THEN 'cuotas'
    WHEN descripcion LIKE '%Ticket%' THEN 'funciones'
    ELSE 'otros'
  END as tipo,
  SUM(monto) as total,
  COUNT(*) as cantidad
FROM caja
WHERE grupo_id = $1
  AND tipo_movimiento = 'INGRESO'
  AND fecha BETWEEN $2 AND $3
GROUP BY tipo;

-- Egresos por categoría
SELECT 
  categoria,
  SUM(monto) as total,
  COUNT(*) as cantidad
FROM caja
WHERE grupo_id = $1
  AND tipo_movimiento = 'EGRESO'
  AND fecha BETWEEN $2 AND $3
GROUP BY categoria;

-- Saldo anterior (antes del período)
SELECT saldo
FROM caja
WHERE grupo_id = $1
  AND fecha < $2
ORDER BY fecha DESC, id DESC
LIMIT 1;

-- Por función
SELECT 
  f.id,
  f.obra || ' ' || TO_CHAR(f.fecha, 'DD/MM') as nombre,
  SUM(CASE WHEN c.tipo_movimiento = 'INGRESO' THEN c.monto ELSE 0 END) as ingresos,
  SUM(CASE WHEN c.tipo_movimiento = 'EGRESO' THEN c.monto ELSE 0 END) as egresos,
  SUM(CASE WHEN c.tipo_movimiento = 'INGRESO' THEN c.monto ELSE -c.monto END) as neto
FROM funciones f
LEFT JOIN caja c ON c.funcion_id = f.id
WHERE f.grupo_id = $1
  AND f.fecha BETWEEN $2 AND $3
GROUP BY f.id, f.obra, f.fecha
ORDER BY f.fecha;
```

---

## 📦 DELIVERABLE 3: actorReportService.js

### Ubicación:
```
teatro-tickets-backend/reports/actorReportService.js
```

### Funciones a implementar:

#### 1. `getActorReport(actorId, from, to)`

**Retorna:**
```js
{
  actor: {
    id: 5,
    nombre: "Juan Pérez",
    grupo: "Teatro La Esquina"
  },
  periodo: {
    desde: "2026-01-01",
    hasta: "2026-01-31"
  },
  cuotas: {
    pagadas: 500,
    pendientes: 1000,
    cantidad_pagadas: 1,
    cantidad_pendientes: 2,
    detalle: [
      {
        id: 10,
        mes: "Enero 2026",
        monto: 500,
        estado: "PAGADA",
        fecha_pago: "2026-01-10T10:00:00Z",
        comprobante: "uploads/comp-123.jpg"
      },
      {
        id: 11,
        mes: "Febrero 2026",
        monto: 500,
        estado: "PENDIENTE",
        fecha_vencimiento: "2026-02-05"
      }
    ]
  },
  tickets: {
    vendidos: 8,
    monto_total: 12000,
    detalle: [
      {
        funcion_id: 123,
        funcion: "Hamlet 15/01",
        cantidad: 5,
        precio_unitario: 1500,
        monto: 7500,
        estado: "PAGADO",
        fecha_venta: "2026-01-10"
      }
    ]
  },
  resumen: {
    total_entregado: 12500,
    total_pendiente: 1000,
    balance: 11500
  },
  fecha_generacion: "2026-02-01T10:00:00Z"
}
```

**Query sugerido:**
```sql
-- Cuotas pagadas (desde CAJA)
SELECT 
  c.id,
  cu.mes,
  cu.monto,
  cu.estado,
  cu.fecha_pago,
  cu.comprobante
FROM cuotas cu
LEFT JOIN caja c ON c.referencia LIKE 'CUOTA-' || cu.id || '%'
WHERE cu.actor_id = $1
  AND cu.fecha_pago BETWEEN $2 AND $3
ORDER BY cu.mes;

-- Cuotas pendientes (no en CAJA)
SELECT 
  id,
  mes,
  monto,
  estado,
  fecha_vencimiento
FROM cuotas
WHERE actor_id = $1
  AND estado != 'PAGADA'
ORDER BY fecha_vencimiento;

-- Tickets vendidos (desde CAJA)
SELECT 
  f.id as funcion_id,
  f.obra || ' ' || TO_CHAR(f.fecha, 'DD/MM') as funcion,
  COUNT(t.id) as cantidad,
  t.precio as precio_unitario,
  SUM(t.precio) as monto,
  t.estado,
  MIN(t.fecha_venta) as fecha_venta
FROM tickets t
JOIN funciones f ON t.funcion_id = f.id
WHERE t.actor_id = $1
  AND t.estado = 'pagado'
  AND t.fecha_venta BETWEEN $2 AND $3
GROUP BY f.id, f.obra, f.fecha, t.precio, t.estado
ORDER BY f.fecha;
```

---

## 📦 DELIVERABLE 4: accountReportService.js

### Ubicación:
```
teatro-tickets-backend/reports/accountReportService.js
```

### Funciones a implementar:

#### 1. `getAccountReport(cuentaId, from, to)`

**Retorna:**
```js
{
  cuenta: {
    id: 10,
    banco: "Nación",
    numero_cuenta: "1234567890",
    cbu: "0110123456789012345678",
    alias: "teatro.esquina",
    tipo: "FUNCION", // o "GRUPO"
    grupo: "Teatro La Esquina",
    funcion: "Hamlet 15/01" // si aplica
  },
  periodo: {
    desde: "2026-01-01",
    hasta: "2026-01-31"
  },
  movimientos: [
    {
      fecha: "2026-01-10T14:30:00Z",
      concepto: "Ticket #1234",
      origen: "Compra online",
      monto: 1500,
      estado: "VALIDADO",
      referencia: "T-001",
      comprobante: "uploads/comp-456.jpg"
    }
  ],
  totales: {
    ingresos: 5000,
    cantidad_movimientos: 4,
    validados: 4,
    pendientes: 0
  },
  por_origen: [
    {
      origen: "Tickets online",
      cantidad: 3,
      monto: 4500
    },
    {
      origen: "Cuotas actores",
      cantidad: 1,
      monto: 500
    }
  ],
  fecha_generacion: "2026-02-01T10:00:00Z"
}
```

**Query sugerido:**
```sql
-- Movimientos
SELECT 
  c.fecha,
  c.descripcion as concepto,
  CASE
    WHEN c.descripcion LIKE '%Ticket%' THEN 'Compra online'
    WHEN c.descripcion LIKE '%Cuota%' THEN 'Cuota actor'
    ELSE 'Otro'
  END as origen,
  c.monto,
  'VALIDADO' as estado,
  c.referencia,
  COALESCE(co.archivo, '') as comprobante
FROM caja c
LEFT JOIN comprobantes co ON c.referencia LIKE '%' || co.id || '%'
WHERE c.cuenta_bancaria_id = $1
  AND c.tipo_movimiento = 'INGRESO'
  AND c.fecha BETWEEN $2 AND $3
ORDER BY c.fecha DESC;

-- Totales
SELECT 
  SUM(monto) as ingresos,
  COUNT(*) as cantidad_movimientos
FROM caja
WHERE cuenta_bancaria_id = $1
  AND tipo_movimiento = 'INGRESO'
  AND fecha BETWEEN $2 AND $3;

-- Por origen
SELECT 
  CASE
    WHEN descripcion LIKE '%Ticket%' THEN 'Tickets online'
    WHEN descripcion LIKE '%Cuota%' THEN 'Cuotas actores'
    ELSE 'Otros'
  END as origen,
  COUNT(*) as cantidad,
  SUM(monto) as monto
FROM caja
WHERE cuenta_bancaria_id = $1
  AND tipo_movimiento = 'INGRESO'
  AND fecha BETWEEN $2 AND $3
GROUP BY origen;
```

---

## 📦 DELIVERABLE 5: pdfExporter.js

### Ubicación:
```
teatro-tickets-backend/reports/pdfExporter.js
```

### Funciones a implementar:

#### 1. `generateFunctionPDF(data)`

```js
import PDFDocument from 'pdfkit';

export function generateFunctionPDF(data) {
  const doc = new PDFDocument({ margin: 50 });
  
  // Header
  doc.fontSize(20).text('REPORTE FINANCIERO - FUNCIÓN', { align: 'center' });
  doc.moveDown();
  
  // Info función
  doc.fontSize(12);
  doc.text(`Obra: ${data.funcion.obra}`);
  doc.text(`Fecha: ${new Date(data.funcion.fecha).toLocaleDateString('es-AR')}`);
  doc.text(`Grupo: ${data.funcion.grupo}`);
  doc.moveDown();
  
  // Tickets
  doc.fontSize(14).text('TICKETS', { underline: true });
  doc.fontSize(11);
  doc.text(`Generados: ${data.tickets.generados}`);
  doc.text(`Vendidos: ${data.tickets.vendidos}`);
  doc.text(`Pagados: ${data.tickets.pagados}`);
  doc.text(`Usados: ${data.tickets.usados}`);
  doc.moveDown();
  
  // Ingresos
  doc.fontSize(14).text('INGRESOS', { underline: true });
  doc.fontSize(11);
  doc.text(`Efectivo: $${data.ingresos.efectivo.toLocaleString('es-AR')}`);
  doc.text(`Transferencia: $${data.ingresos.transferencia.toLocaleString('es-AR')}`);
  doc.text(`MercadoPago: $${data.ingresos.mercadopago.toLocaleString('es-AR')}`);
  doc.fontSize(12).text(`TOTAL: $${data.ingresos.total.toLocaleString('es-AR')}`, { bold: true });
  doc.moveDown();
  
  // Egresos
  doc.fontSize(14).text('EGRESOS', { underline: true });
  doc.fontSize(11);
  data.egresos.por_categoria.forEach(cat => {
    doc.text(`${cat.categoria}: $${cat.monto.toLocaleString('es-AR')}`);
  });
  doc.fontSize(12).text(`TOTAL: $${data.egresos.total.toLocaleString('es-AR')}`, { bold: true });
  doc.moveDown();
  
  // Balance
  doc.fontSize(16).text('BALANCE NETO', { underline: true });
  doc.fontSize(14).text(`$${data.balance.toLocaleString('es-AR')}`, { bold: true });
  doc.moveDown();
  
  // Footer
  doc.fontSize(9).text(
    `Generado el ${new Date(data.fecha_generacion).toLocaleString('es-AR')}`,
    { align: 'center' }
  );
  
  return doc;
}
```

---

#### 2. `generateGroupPDF(data)`

Similar estructura, adaptado a reporte de grupo:
- Período
- Ingresos (cuotas, funciones, otros)
- Egresos (por categoría)
- Balance
- Funciones (tabla)

---

#### 3. `generateActorPDF(data)`

Similar estructura:
- Actor info
- Cuotas (pagadas/pendientes)
- Tickets vendidos
- Resumen

---

#### 4. `generateAccountPDF(data)`

Similar estructura:
- Cuenta bancaria info
- Movimientos (tabla)
- Totales
- Por origen

---

## 📦 DELIVERABLE 6: reportesRoutes.js

### Ubicación:
```
teatro-tickets-backend/routes/reportesRoutes.js
```

### Endpoints a implementar:

```js
import express from 'express';
import * as functionReport from '../reports/functionReportService.js';
import * as groupReport from '../reports/groupReportService.js';
import * as actorReport from '../reports/actorReportService.js';
import * as accountReport from '../reports/accountReportService.js';
import * as pdfExporter from '../reports/pdfExporter.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// REPORTE DE FUNCIÓN
// ==========================================

// GET /api/reportes/funcion/:funcionId
router.get('/funcion/:funcionId', authenticateToken, async (req, res) => {
  try {
    const { funcionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    // Verificar permisos
    if (userRole !== 'SUPREMO') {
      // Director solo puede ver reportes de su grupo
      const funcion = await pool.query(
        'SELECT grupo_id FROM funciones WHERE id = $1',
        [funcionId]
      );
      
      if (funcion.rows.length === 0) {
        return res.status(404).json({ error: 'Función no encontrada' });
      }
      
      const userGrupo = await pool.query(
        'SELECT grupo_id FROM usuarios WHERE id = $1',
        [userId]
      );
      
      if (userGrupo.rows[0].grupo_id !== funcion.rows[0].grupo_id) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    
    const report = await functionReport.getFunctionReport(funcionId);
    res.json(report);
    
  } catch (error) {
    console.error('Error generando reporte de función:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/funcion/:funcionId/pdf
router.get('/funcion/:funcionId/pdf', authenticateToken, async (req, res) => {
  try {
    const { funcionId } = req.params;
    
    // Mismo control de permisos que arriba
    // ...
    
    const report = await functionReport.getFunctionReport(funcionId);
    const pdf = pdfExporter.generateFunctionPDF(report);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-funcion-${funcionId}.pdf"`);
    
    pdf.pipe(res);
    pdf.end();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// ==========================================
// REPORTE DE GRUPO
// ==========================================

// GET /api/reportes/grupo/:grupoId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/grupo/:grupoId', authenticateToken, requireRole(['SUPREMO', 'DIRECTOR']), async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    // Validar fechas
    if (!from || !to) {
      return res.status(400).json({ error: 'Parámetros from y to son requeridos (YYYY-MM-DD)' });
    }
    
    // Verificar permisos
    if (userRole === 'DIRECTOR') {
      const userGrupo = await pool.query(
        'SELECT grupo_id FROM usuarios WHERE id = $1',
        [userId]
      );
      
      if (userGrupo.rows[0].grupo_id !== parseInt(grupoId)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    
    const report = await groupReport.getGroupReport(grupoId, from, to);
    res.json(report);
    
  } catch (error) {
    console.error('Error generando reporte de grupo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/grupo/:grupoId/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/grupo/:grupoId/pdf', authenticateToken, requireRole(['SUPREMO', 'DIRECTOR']), async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { from, to } = req.query;
    
    // Mismo control de permisos
    // ...
    
    const report = await groupReport.getGroupReport(grupoId, from, to);
    const pdf = pdfExporter.generateGroupPDF(report);
    
    const filename = `reporte-grupo-${grupoId}-${from}-${to}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    pdf.pipe(res);
    pdf.end();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// ==========================================
// REPORTE POR ACTOR
// ==========================================

// GET /api/reportes/actor/:actorId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/actor/:actorId', authenticateToken, async (req, res) => {
  try {
    const { actorId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    // Validar fechas
    if (!from || !to) {
      return res.status(400).json({ error: 'Parámetros from y to son requeridos' });
    }
    
    // Permisos: Actor solo puede ver el suyo
    if (userRole === 'ACTOR' && userId !== parseInt(actorId)) {
      return res.status(403).json({ error: 'Solo puedes ver tu propio reporte' });
    }
    
    // Director solo puede ver actores de su grupo
    if (userRole === 'DIRECTOR') {
      const actorGrupo = await pool.query(
        'SELECT grupo_id FROM usuarios WHERE id = $1',
        [actorId]
      );
      
      const userGrupo = await pool.query(
        'SELECT grupo_id FROM usuarios WHERE id = $1',
        [userId]
      );
      
      if (actorGrupo.rows[0].grupo_id !== userGrupo.rows[0].grupo_id) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    
    const report = await actorReport.getActorReport(actorId, from, to);
    res.json(report);
    
  } catch (error) {
    console.error('Error generando reporte de actor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/actor/:actorId/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/actor/:actorId/pdf', authenticateToken, async (req, res) => {
  try {
    const { actorId } = req.params;
    const { from, to } = req.query;
    
    // Mismo control de permisos
    // ...
    
    const report = await actorReport.getActorReport(actorId, from, to);
    const pdf = pdfExporter.generateActorPDF(report);
    
    const filename = `reporte-actor-${actorId}-${from}-${to}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    pdf.pipe(res);
    pdf.end();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// ==========================================
// REPORTE POR CUENTA BANCARIA
// ==========================================

// GET /api/reportes/cuenta/:cuentaId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/cuenta/:cuentaId', authenticateToken, requireRole(['SUPREMO', 'DIRECTOR']), async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;
    const userRole = req.user.rol;
    
    // Validar fechas
    if (!from || !to) {
      return res.status(400).json({ error: 'Parámetros from y to son requeridos' });
    }
    
    // Verificar que cuenta pertenece al grupo del director
    if (userRole === 'DIRECTOR') {
      const cuenta = await pool.query(
        'SELECT grupo_id FROM cuentas_bancarias WHERE id = $1',
        [cuentaId]
      );
      
      const userGrupo = await pool.query(
        'SELECT grupo_id FROM usuarios WHERE id = $1',
        [userId]
      );
      
      if (cuenta.rows[0].grupo_id !== userGrupo.rows[0].grupo_id) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    
    const report = await accountReport.getAccountReport(cuentaId, from, to);
    res.json(report);
    
  } catch (error) {
    console.error('Error generando reporte de cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/cuenta/:cuentaId/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/cuenta/:cuentaId/pdf', authenticateToken, requireRole(['SUPREMO', 'DIRECTOR']), async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { from, to } = req.query;
    
    // Mismo control de permisos
    // ...
    
    const report = await accountReport.getAccountReport(cuentaId, from, to);
    const pdf = pdfExporter.generateAccountPDF(report);
    
    const filename = `reporte-cuenta-${cuentaId}-${from}-${to}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    pdf.pipe(res);
    pdf.end();
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

export default router;
```

---

## 📦 DELIVERABLE 7: Registrar rutas en index-v3-postgres.js

### Archivo:
```
teatro-tickets-backend/index-v3-postgres.js
```

### Agregar:
```js
// Importar rutas de reportes
import reportesRoutes from './routes/reportesRoutes.js';

// Registrar rutas (después de las otras rutas)
app.use('/api/reportes', reportesRoutes);
```

---

## 📦 DELIVERABLE 8: reportes.html (Frontend Director)

### Ubicación:
```
frontend/director/reportes.html
```

### HTML:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reportes Financieros</title>
  <link rel="stylesheet" href="../shared/styles.css">
</head>
<body>
  <div id="header-container"></div>
  
  <main class="container">
    <h1>📊 Reportes Financieros</h1>
    
    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="showTab('grupo')">Reporte de Grupo</button>
      <button class="tab-btn" onclick="showTab('funcion')">Reporte de Función</button>
      <button class="tab-btn" onclick="showTab('actor')">Reporte por Actor</button>
      <button class="tab-btn" onclick="showTab('cuenta')">Reporte por Cuenta</button>
    </div>
    
    <!-- Tab: Grupo -->
    <div id="tab-grupo" class="tab-content active">
      <h2>Reporte de Grupo</h2>
      
      <div class="form-group">
        <label>Período:</label>
        <input type="date" id="grupo-from" required>
        <input type="date" id="grupo-to" required>
        <button class="btn-primary" onclick="generarReporteGrupo()">Generar Reporte</button>
      </div>
      
      <div id="resultado-grupo" style="display:none;">
        <!-- Ingresos -->
        <div class="card">
          <h3>💰 INGRESOS</h3>
          <p>Cuotas: <strong>$<span id="grupo-ingresos-cuotas">0</span></strong></p>
          <p>Funciones: <strong>$<span id="grupo-ingresos-funciones">0</span></strong></p>
          <p>Otros: <strong>$<span id="grupo-ingresos-otros">0</span></strong></p>
          <hr>
          <p>TOTAL: <strong>$<span id="grupo-ingresos-total">0</span></strong></p>
        </div>
        
        <!-- Egresos -->
        <div class="card">
          <h3>💸 EGRESOS</h3>
          <div id="grupo-egresos-detalle"></div>
          <hr>
          <p>TOTAL: <strong>$<span id="grupo-egresos-total">0</span></strong></p>
        </div>
        
        <!-- Balance -->
        <div class="card card-balance">
          <h3>📊 BALANCE</h3>
          <p>Resultado período: <strong id="grupo-balance">$0</strong></p>
          <p>Saldo anterior: <strong>$<span id="grupo-saldo-anterior">0</span></strong></p>
          <p>Saldo actual: <strong>$<span id="grupo-saldo-actual">0</span></strong></p>
        </div>
        
        <!-- Funciones -->
        <div class="card">
          <h3>🎭 Por Función</h3>
          <table id="grupo-funciones-tabla">
            <thead>
              <tr>
                <th>Función</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Neto</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        
        <button class="btn-success" onclick="exportarGrupoPDF()">📄 Exportar PDF</button>
      </div>
    </div>
    
    <!-- Tab: Función -->
    <div id="tab-funcion" class="tab-content">
      <h2>Reporte de Función</h2>
      
      <div class="form-group">
        <label>Función:</label>
        <select id="funcion-select" required>
          <option value="">Seleccionar...</option>
        </select>
        <button class="btn-primary" onclick="generarReporteFuncion()">Generar Reporte</button>
      </div>
      
      <div id="resultado-funcion" style="display:none;">
        <!-- Contenido similar a grupo pero específico de función -->
      </div>
    </div>
    
    <!-- Tab: Actor -->
    <div id="tab-actor" class="tab-content">
      <h2>Reporte por Actor</h2>
      
      <div class="form-group">
        <label>Actor:</label>
        <select id="actor-select" required>
          <option value="">Seleccionar...</option>
        </select>
        <label>Período:</label>
        <input type="date" id="actor-from" required>
        <input type="date" id="actor-to" required>
        <button class="btn-primary" onclick="generarReporteActor()">Generar Reporte</button>
      </div>
      
      <div id="resultado-actor" style="display:none;">
        <!-- Cuotas y tickets -->
      </div>
    </div>
    
    <!-- Tab: Cuenta -->
    <div id="tab-cuenta" class="tab-content">
      <h2>Reporte por Cuenta Bancaria</h2>
      
      <div class="form-group">
        <label>Cuenta:</label>
        <select id="cuenta-select" required>
          <option value="">Seleccionar...</option>
        </select>
        <label>Período:</label>
        <input type="date" id="cuenta-from" required>
        <input type="date" id="cuenta-to" required>
        <button class="btn-primary" onclick="generarReporteCuenta()">Generar Reporte</button>
      </div>
      
      <div id="resultado-cuenta" style="display:none;">
        <!-- Movimientos bancarios -->
      </div>
    </div>
  </main>
  
  <script src="../shared/api.js"></script>
  <script src="reportes.js"></script>
</body>
</html>
```

---

## 📦 DELIVERABLE 9: reportes.js (Frontend Logic)

### Ubicación:
```
frontend/director/reportes.js
```

### JavaScript:
```js
// ==========================================
// TABS
// ==========================================

function showTab(tabName) {
  // Ocultar todos
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Mostrar seleccionado
  document.getElementById(`tab-${tabName}`).classList.add('active');
  event.target.classList.add('active');
}

// ==========================================
// REPORTE DE GRUPO
// ==========================================

async function generarReporteGrupo() {
  const from = document.getElementById('grupo-from').value;
  const to = document.getElementById('grupo-to').value;
  
  if (!from || !to) {
    alert('Por favor seleccioná un período');
    return;
  }
  
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const grupoId = user.grupo_id;
    
    const response = await API.get(`/reportes/grupo/${grupoId}?from=${from}&to=${to}`);
    
    // Mostrar ingresos
    document.getElementById('grupo-ingresos-cuotas').textContent = response.ingresos.cuotas.toLocaleString('es-AR');
    document.getElementById('grupo-ingresos-funciones').textContent = response.ingresos.funciones.toLocaleString('es-AR');
    document.getElementById('grupo-ingresos-otros').textContent = response.ingresos.otros.toLocaleString('es-AR');
    document.getElementById('grupo-ingresos-total').textContent = response.ingresos.total.toLocaleString('es-AR');
    
    // Mostrar egresos
    const egresosDiv = document.getElementById('grupo-egresos-detalle');
    egresosDiv.innerHTML = '';
    response.egresos.detalle.forEach(cat => {
      egresosDiv.innerHTML += `<p>${cat.categoria}: <strong>$${cat.monto.toLocaleString('es-AR')}</strong></p>`;
    });
    document.getElementById('grupo-egresos-total').textContent = response.egresos.total.toLocaleString('es-AR');
    
    // Mostrar balance
    const balance = response.balance;
    const balanceEl = document.getElementById('grupo-balance');
    balanceEl.textContent = `$${balance.toLocaleString('es-AR')}`;
    balanceEl.className = balance >= 0 ? 'positivo' : 'negativo';
    
    document.getElementById('grupo-saldo-anterior').textContent = response.saldo_anterior.toLocaleString('es-AR');
    document.getElementById('grupo-saldo-actual').textContent = response.saldo_actual.toLocaleString('es-AR');
    
    // Mostrar funciones
    const tbody = document.querySelector('#grupo-funciones-tabla tbody');
    tbody.innerHTML = '';
    response.funciones.forEach(f => {
      tbody.innerHTML += `
        <tr>
          <td>${f.nombre}</td>
          <td>$${f.ingresos.toLocaleString('es-AR')}</td>
          <td>$${f.egresos.toLocaleString('es-AR')}</td>
          <td class="${f.neto >= 0 ? 'positivo' : 'negativo'}">$${f.neto.toLocaleString('es-AR')}</td>
        </tr>
      `;
    });
    
    // Mostrar resultado
    document.getElementById('resultado-grupo').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generando reporte');
  }
}

async function exportarGrupoPDF() {
  const from = document.getElementById('grupo-from').value;
  const to = document.getElementById('grupo-to').value;
  const user = JSON.parse(localStorage.getItem('user'));
  const grupoId = user.grupo_id;
  
  const url = `${API.baseURL}/reportes/grupo/${grupoId}/pdf?from=${from}&to=${to}`;
  
  // Abrir en nueva pestaña (el browser maneja la descarga)
  window.open(url, '_blank');
}

// ==========================================
// REPORTE DE FUNCIÓN
// ==========================================

async function cargarFunciones() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const grupoId = user.grupo_id;
    
    const funciones = await API.get(`/funciones?grupoId=${grupoId}`);
    
    const select = document.getElementById('funcion-select');
    funciones.forEach(f => {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = `${f.obra} - ${new Date(f.fecha).toLocaleDateString('es-AR')}`;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error cargando funciones:', error);
  }
}

async function generarReporteFuncion() {
  const funcionId = document.getElementById('funcion-select').value;
  
  if (!funcionId) {
    alert('Por favor seleccioná una función');
    return;
  }
  
  try {
    const response = await API.get(`/reportes/funcion/${funcionId}`);
    
    // Mostrar datos (similar a grupo)
    // ...
    
    document.getElementById('resultado-funcion').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generando reporte');
  }
}

// ==========================================
// REPORTE POR ACTOR
// ==========================================

async function cargarActores() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const grupoId = user.grupo_id;
    
    const actores = await API.get(`/usuarios/actores?grupoId=${grupoId}`);
    
    const select = document.getElementById('actor-select');
    actores.forEach(a => {
      const option = document.createElement('option');
      option.value = a.id;
      option.textContent = a.nombre;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error cargando actores:', error);
  }
}

async function generarReporteActor() {
  const actorId = document.getElementById('actor-select').value;
  const from = document.getElementById('actor-from').value;
  const to = document.getElementById('actor-to').value;
  
  if (!actorId || !from || !to) {
    alert('Por favor completá todos los campos');
    return;
  }
  
  try {
    const response = await API.get(`/reportes/actor/${actorId}?from=${from}&to=${to}`);
    
    // Mostrar cuotas y tickets
    // ...
    
    document.getElementById('resultado-actor').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generando reporte');
  }
}

// ==========================================
// REPORTE POR CUENTA
// ==========================================

async function cargarCuentas() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const grupoId = user.grupo_id;
    
    const cuentas = await API.get(`/cuentas?grupoId=${grupoId}`);
    
    const select = document.getElementById('cuenta-select');
    cuentas.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = `${c.banco} - ${c.alias}`;
      select.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error cargando cuentas:', error);
  }
}

async function generarReporteCuenta() {
  const cuentaId = document.getElementById('cuenta-select').value;
  const from = document.getElementById('cuenta-from').value;
  const to = document.getElementById('cuenta-to').value;
  
  if (!cuentaId || !from || !to) {
    alert('Por favor completá todos los campos');
    return;
  }
  
  try {
    const response = await API.get(`/reportes/cuenta/${cuentaId}?from=${from}&to=${to}`);
    
    // Mostrar movimientos
    // ...
    
    document.getElementById('resultado-cuenta').style.display = 'block';
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error generando reporte');
  }
}

// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  cargarFunciones();
  cargarActores();
  cargarCuentas();
  
  // Cargar header
  fetch('../shared/header.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('header-container').innerHTML = html;
    });
});
```

---

## 📦 DELIVERABLE 10: mi-estado.html (Frontend Actor)

### Ubicación:
```
frontend/actor/mi-estado.html
```

### HTML (simplificado):
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Estado Financiero</title>
  <link rel="stylesheet" href="../shared/styles.css">
</head>
<body>
  <div id="header-container"></div>
  
  <main class="container">
    <h1>👤 Mi Estado Financiero</h1>
    
    <div class="form-group">
      <label>Período:</label>
      <input type="date" id="from" value="">
      <input type="date" id="to" value="">
      <button class="btn-primary" onclick="cargarEstado()">Ver Estado</button>
    </div>
    
    <!-- Cuotas -->
    <div class="card">
      <h2>💳 Cuotas</h2>
      <div id="cuotas-lista"></div>
    </div>
    
    <!-- Tickets -->
    <div class="card">
      <h2>🎟️ Tickets Vendidos</h2>
      <div id="tickets-lista"></div>
    </div>
    
    <!-- Resumen -->
    <div class="card card-balance">
      <h2>📊 Resumen</h2>
      <p>Total entregado: <strong>$<span id="total-entregado">0</span></strong></p>
      <p>Total pendiente: <strong>$<span id="total-pendiente">0</span></strong></p>
    </div>
  </main>
  
  <script src="../shared/api.js"></script>
  <script src="mi-estado.js"></script>
</body>
</html>
```

---

## ✅ CHECKLIST FINAL

### Backend
- [ ] Crear carpeta `reports/`
- [ ] `functionReportService.js` implementado
- [ ] `groupReportService.js` implementado
- [ ] `actorReportService.js` implementado
- [ ] `accountReportService.js` implementado
- [ ] `pdfExporter.js` implementado
- [ ] `reportesRoutes.js` creado
- [ ] Rutas registradas en `index-v3-postgres.js`
- [ ] Tabla `reportes_funcion` creada
- [ ] Permisos verificados por rol

### Frontend
- [ ] `director/reportes.html` creado
- [ ] `director/reportes.js` creado
- [ ] `actor/mi-estado.html` creado
- [ ] `actor/mi-estado.js` creado
- [ ] Tabs funcionando
- [ ] Exportar PDF funciona
- [ ] Datos se muestran correctamente

### Testing
- [ ] Test: Reporte de función genera correctamente
- [ ] Test: Reporte de grupo con múltiples funciones
- [ ] Test: Actor solo ve su propio reporte
- [ ] Test: PDF se descarga correctamente
- [ ] Test: Permisos (director no ve otros grupos)
- [ ] Test: Números cuadran con CAJA

---

## 🎯 RESULTADO ESPERADO

Después de implementar:

**Director puede:**
- ✅ Ver balance de su grupo por período
- ✅ Ver cierre de cada función
- ✅ Ver estado de cada actor
- ✅ Ver movimientos por cuenta bancaria
- ✅ Exportar todo a PDF

**Actor puede:**
- ✅ Ver sus cuotas (pagadas/pendientes)
- ✅ Ver sus tickets vendidos
- ✅ Ver cuánto debe

**Sistema tiene:**
- ✅ Fuente única de verdad (CAJA)
- ✅ Reportes inmutables (históricos)
- ✅ Auditable externamente
- ✅ Números siempre cuadran

---

## 💎 PRINCIPIO A RECORDAR

> **"Si el reporte no lee CAJA, el reporte miente."**

---

**¡LISTO PARA EJECUTAR!**

Copiá este prompt completo en Copilot Chat y esperá 60-90 segundos.
