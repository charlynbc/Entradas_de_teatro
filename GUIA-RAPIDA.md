# 🎭 BACO TEATRO - GUÍA RÁPIDA DE REFERENCIA
## 3 Mejoras Profesionales Implementadas

---

## ⚡ INICIO RÁPIDO

```bash
# 1. Compilar y validar
cd teatro-tickets-backend
npm run ts:check

# 2. Iniciar servidor
npm run dev

# 3. Probar endpoints en otra terminal
curl http://localhost:3000/api/auditoria/logs?grupo_id=1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl http://localhost:3000/api/reportes/ventas?grupo_id=1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl http://localhost:3000/api/auditoria/public/obras/1
```

---

## 🔗 ENDPOINTS NUEVOS

### Auditoría (SUPER/ADMIN only)

| Método | Endpoint | Parámetros | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/auditoria/logs` | `grupo_id`, `accion`, `page` | Historial filtrado |
| GET | `/api/auditoria/logs/export/csv` | `grupo_id` | Descargar CSV |
| GET | `/api/auditoria/logs/export/pdf` | `grupo_id` | Descargar PDF |

### Reportes (SUPER/ADMIN only)

| Método | Endpoint | Parámetros | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/reportes/ventas` | `grupo_id`, `fecha_inicio`, `fecha_fin` | Ventas agregadas |
| GET | `/api/reportes/ventas/export/csv` | `grupo_id` | Descargar CSV |
| GET | `/api/reportes/ventas/export/pdf` | `grupo_id` | Descargar PDF |

### Público (Acceso libre)

| Método | Endpoint | Parámetros | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/auditoria/public/obras/:obraId` | - | Info pública |
| GET | `/api/auditoria/public/obras/:obraId/funciones` | - | Funciones próximas |
| GET | `/obra.html` | `?id=obraId` | Página HTML |

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
teatro-tickets-backend/
├── db/migrations/
│   └── 008-action-logs.sql          ← Tabla de auditoría
│
├── services/
│   └── action-logs.service.js       ← logAction()
│
├── routes/
│   └── auditoria-reportes.routes.js ← 11 endpoints
│
├── controllers/
│   ├── auditoria-reportes.controller.js  ← 6 funciones
│   ├── tickets.controller.js   (MODIFICADO) ← Logging en acciones
│   └── grupos.controller.js    (MODIFICADO) ← Logging en cierre
│
├── public/
│   ├── obra.html              ← Página pública
│   └── js/
│       └── obra-detalle.js    ← API integration
│
└── index-v3-postgres.js  (MODIFICADO) ← Registrar rutas
```

---

## 🔐 AUTENTICACIÓN

Todos los endpoints `/api/auditoria` y `/api/reportes` requieren JWT:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/auditoria/logs?grupo_id=1
```

Token se obtiene en `/api/auth/login`

---

## 📊 ACCIONES REGISTRADAS

| Acción | Función | Evento |
|--------|---------|--------|
| `venta` | `actualizarEstadoTicket()` | Reportada como REPORTADA_VENDIDA |
| `cobro` | `cobrarTickets()` | Admin aprueba pago |
| `transferencia` | `transferirTicket()` | Vendedor → Vendedor |
| `anulacion` | `anularTicket()` | Admin anula ticket |
| `cierre_grupo` | `finalizarGrupo()` | Grupo archivado |

---

## 🧪 TESTING RÁPIDO

### Crear datos de prueba
```bash
npm run db:seed-minimo
```

### Ver logs de un grupo
```bash
# Primero necesitas token JWT
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"123","password":"123"}' | jq -r '.token')

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/auditoria/logs?grupo_id=1&page=1"
```

### Ver reportes
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/reportes/ventas?grupo_id=1"
```

### Descargar CSV
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/reportes/ventas/export/csv?grupo_id=1" > ventas.csv
```

---

## 📝 ARCHIVOS DE DOCUMENTACIÓN

1. **IMPLEMENTACION-COMPLETADA.md**
   - Resumen ejecutivo
   - Endpoints documentados
   - Checklist de reglas

2. **BACO-TEATRO-PROGRAMA-COSTOS.md**
   - Descripción de funcionalidades
   - Valor de mercado ($30K-40K USD)
   - Costos anuales ($46,840)
   - Modelos de negocio

---

## 🚀 HACER COMMIT

```bash
# Opción 1: Script automático
./hacer-commit.sh

# Opción 2: Manual
git add .
git commit -m "feat: Implementar auditoría, reportes y página pública"
git push origin 30/12
```

---

## ✅ VERIFICACIÓN

```bash
# Validar sintaxis
npm run ts:check

# Verificar archivos creados
ls -lh db/migrations/008-action-logs.sql
ls -lh services/action-logs.service.js
ls -lh routes/auditoria-reportes.routes.js
ls -lh controllers/auditoria-reportes.controller.js
ls -lh public/obra.html
ls -lh public/js/obra-detalle.js
```

---

## 🔍 TROUBLESHOOTING

### Errores comunes

**"logAction is not defined"**
→ Verificar import en controller: `import { logAction } from '../services/action-logs.service.js';`

**"auditoriaReportesRoutes is not defined"**
→ Verificar import en index.js: `import auditoriaReportesRoutes from './routes/auditoria-reportes.routes.js';`

**"action_logs table does not exist"**
→ Ejecutar migración: `npm run db:migrate-phone-fk`

**"No token provided"**
→ Endpoints protegidos requieren header: `Authorization: Bearer TOKEN`

---

## 📞 SOPORTE

Archivos relacionados:
- [IMPLEMENTACION-COMPLETADA.md](./IMPLEMENTACION-COMPLETADA.md)
- [BACO-TEATRO-PROGRAMA-COSTOS.md](./BACO-TEATRO-PROGRAMA-COSTOS.md)

---

**Última actualización:** 2025-01-07  
**Estado:** ✅ Listo para deploy
