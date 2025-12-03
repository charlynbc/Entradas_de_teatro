# ✅ Fix Deploy - Imports Corregidos

## 🐛 Error Encontrado

```
SyntaxError: The requested module '../db.js' does not provide an export named 'query'
```

**Causa:** Los 4 nuevos controladores importaban `query()` desde `../db.js` pero ese archivo exporta funciones de `dataStore.js` (JSON), no de PostgreSQL.

## 🔧 Solución Aplicada

**Commit:** `9f31fc8`  
**Branch:** `prototipo`

### Archivos Modificados

1. `controllers/obras.controller.js`
2. `controllers/funciones.controller.js`
3. `controllers/entradas.controller.js`
4. `controllers/cast.controller.js`

**Cambio:**
```diff
- import { query } from '../db.js';
+ import { query } from '../db/postgres.js';
```

## 📂 Estructura de DB en Backend

```
teatro-tickets-backend/
├── db.js                    → Exporta dataStore (JSON, legacy)
├── db/
│   └── postgres.js          → Exporta query() para PostgreSQL ✅
├── utils/
│   └── dataStore.js         → Manejo de data.json (legacy)
└── controllers/
    ├── obras.controller.js        → Usa query() de postgres.js ✅
    ├── funciones.controller.js    → Usa query() de postgres.js ✅
    ├── entradas.controller.js     → Usa query() de postgres.js ✅
    └── cast.controller.js         → Usa query() de postgres.js ✅
```

## ✅ Verificación Post-Deploy

### 1. Verificar que el servidor arranca

```bash
# En los logs de Render deberías ver:
✅ Conectado a PostgreSQL
🔄 Inicializando schema de base de datos...
✅ Schema inicializado correctamente
🚀 Servidor escuchando en puerto 3000
```

### 2. Test de endpoints nuevos

```bash
# 1. Listar obras (público)
curl https://baco-teatro-1jxj.onrender.com/api/obras

# Respuesta esperada:
# []  (vacío porque no hay obras creadas aún)

# 2. Health check
curl https://baco-teatro-1jxj.onrender.com/health

# Respuesta esperada:
# {"status":"ok","storage":"postgresql","database":"connected","totals":{...}}

# 3. API info
curl https://baco-teatro-1jxj.onrender.com/api

# Respuesta esperada:
# {"ok":true,"message":"API Teatro Tickets - PostgreSQL","version":"3.0.0"}
```

### 3. Test desde frontend

Una vez que el backend esté funcionando:

1. **Abrir frontend:** https://baco-teatro-app.onrender.com
2. **Ir a ObrasPublicScreen** (botón "Ver Todas las Obras")
3. **Verificar que carga sin errores** (puede estar vacío si no hay obras)

### 4. Crear primera obra (como Admin/Super)

```bash
# Login primero para obtener token
curl -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"SUPREMO_USER","password":"tu_password"}'

# Crear obra
curl -X POST https://baco-teatro-1jxj.onrender.com/api/obras \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Hamlet",
    "descripcion": "Tragedia clásica de Shakespeare",
    "imagen_url": "",
    "activa": true
  }'

# Respuesta esperada:
# {"ok":true,"data":{"id":1,"nombre":"Hamlet",...},"mensaje":"Obra creada exitosamente"}
```

## 🎯 Flujo Completo de Testing

### Paso 1: Backend arranca ✅
- Render muestra "Deployed" en verde
- Logs no muestran errores de sintaxis
- `/health` responde con `{"status":"ok"}`

### Paso 2: Crear datos de prueba
1. Login como SUPER
2. Crear obra "Hamlet"
3. Agregar vendedor al elenco
4. Crear función (fecha futura)
5. Asignar entradas al vendedor

### Paso 3: Test público
1. Abrir app como invitado
2. Ver obra "Hamlet" en ObrasPublicScreen
3. Ver función disponible
4. Hacer reserva

### Paso 4: Test vendedor
1. Login como vendedor
2. Ver "Mis Entradas"
3. Ver entrada RESERVADA
4. Quitar reserva
5. Ver entrada EN_STOCK

## 📊 Status Actual

- ✅ Código corregido y pusheado
- ⏳ Esperando redeploy de Render
- ⏳ Testing pendiente

## 🔗 Links Útiles

- **Backend:** https://baco-teatro-1jxj.onrender.com
- **Frontend:** https://baco-teatro-app.onrender.com
- **Logs Render:** https://dashboard.render.com/web/srv-your-service-id/logs
- **Repo GitHub:** https://github.com/charlynbc/Entradas_de_teatro/tree/prototipo

## 🐞 Troubleshooting

### Si el servidor no arranca:

1. **Verificar DATABASE_URL en Render:**
   - Dashboard → Settings → Environment
   - Debe estar configurado: `postgresql://...`

2. **Verificar Node version:**
   - Render debe usar Node.js v22.16.0
   - Compatible con ES modules

3. **Verificar package.json:**
   ```json
   {
     "type": "module",
     "scripts": {
       "start": "node index-v3-postgres.js"
     }
   }
   ```

### Si hay errores en controladores:

- Verificar que TODOS los controladores usen:
  ```javascript
  import { query } from '../db/postgres.js';
  ```
- NO deben importar de `../db.js`

---

**Próximo paso:** Monitorear logs de Render y ejecutar tests una vez deployado ✅
