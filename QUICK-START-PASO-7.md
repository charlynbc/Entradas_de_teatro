# ⚡ QUICK START — PASO 7: PANTALLAS POR ROL

## 🎯 Objetivo

Implementar pantallas separadas por rol en **30-45 minutos**.

---

## ✅ PRE-REQUISITOS

Antes de empezar:

- ✅ PASO 5 completado (cuentas bancarias)
- ✅ PASO 6 completado (pasarela de pagos)
- ✅ Backend corriendo
- ✅ Copilot Chat disponible (Ctrl+Shift+I)

---

## 🚀 6 PASOS RÁPIDOS

### 1️⃣ Abre Copilot Chat (10 seg)

```
VS Code → Ctrl+Shift+I
```

---

### 2️⃣ Copia el Prompt (20 seg)

**File:** `PROMPT-PASO-7-COPILOT.md`

**Selection:** TODO (Ctrl+A)

**Copy:** Ctrl+C

---

### 3️⃣ Pega en Chat (10 seg)

En Copilot Chat:

```
Ctrl+V
Enter
```

---

### 4️⃣ Espera (60-90 segundos)

Copilot generará código para:

1. `public/comprar-ticket.html`
2. `actor/mis-cuotas.html`
3. `actor/mis-tickets.html`
4. `director/validar-cuotas.html`
5. `director/validar-pagos.html`
6. `director/configuracion-financiera.html`
7. `shared/header.html`
8. `shared/styles.css`
9. `shared/api.js`
10. JavaScript específico por página

---

### 5️⃣ Copia los Archivos (15-20 min)

**Crear estructura:**

```bash
mkdir -p frontend/public
mkdir -p frontend/actor
mkdir -p frontend/director
mkdir -p frontend/shared
```

**Copiar cada archivo:**

```bash
# Públicas
→ frontend/public/comprar-ticket.html

# Actor
→ frontend/actor/mis-cuotas.html
→ frontend/actor/mis-tickets.html

# Director
→ frontend/director/validar-cuotas.html
→ frontend/director/validar-pagos.html
→ frontend/director/configuracion-financiera.html

# Compartidos
→ frontend/shared/header.html
→ frontend/shared/styles.css
→ frontend/shared/api.js
→ frontend/shared/utils.js
```

**Actualizar rutas en API:**

Si tu backend corre en otro puerto, edita `shared/api.js`:

```js
const API = {
  baseURL: 'http://localhost:5000/api', // Ajustar si es necesario
  // ...
};
```

---

### 6️⃣ Probar en Navegador (5-10 min)

**Opción A: Servidor simple con Python**

```bash
cd frontend
python3 -m http.server 8080
```

Abre: `http://localhost:8080/public/comprar-ticket.html`

**Opción B: Live Server (VS Code extension)**

- Instala "Live Server" extension
- Right-click en `frontend/public/comprar-ticket.html`
- "Open with Live Server"

---

## 🧪 TESTS MANUALES (5 min)

### Test 1: Invitado compra ticket

```
1. Abre: http://localhost:8080/public/comprar-ticket.html?funcionId=1
2. Completa datos (nombre, email)
3. Selecciona "MercadoPago"
4. Click "Comprar entrada"
5. Debe redirigir a URL de MercadoPago (o mostrar error si no hay credenciales)
```

**Respuesta esperada:**
- Formulario claro
- Botones visibles
- Texto: "Tu entrada se enviará por email una vez confirmado el pago"

---

### Test 2: Actor ve cuotas

```
1. Login como actor
2. Abre: http://localhost:8080/actor/mis-cuotas.html
3. Debe ver:
   - Cuotas pendientes
   - Datos bancarios del grupo
   - Botón "Subir comprobante"
```

**Respuesta esperada:**
- Lista de cuotas con estados claros (🔴 🟡 🟢)
- Datos bancarios visibles
- NO ve opciones de director

---

### Test 3: Director valida cuotas

```
1. Login como director
2. Abre: http://localhost:8080/director/validar-cuotas.html
3. Debe ver:
   - Cuotas pendientes de validación
   - Botones "Aprobar" y "Rechazar"
4. Click "Aprobar"
5. Cuota desaparece de la lista
```

**Respuesta esperada:**
- Solo cuotas pendientes
- Comprobantes visibles
- Botones claros

---

## 🐛 DEBUGGING RÁPIDO

### Error: "Failed to fetch"

**Causa:** Backend no está corriendo o CORS

**Solución:**

```bash
# Verificar backend
curl http://localhost:5000/api/health

# Si no responde, iniciar backend
cd teatro-tickets-backend
npm run dev
```

**Si es CORS:**

```js
// En index-v3-postgres.js
const cors = require('cors');
app.use(cors()); // Permitir todos los orígenes en desarrollo
```

---

### Error: "Unauthorized"

**Causa:** Token no existe o expiró

**Solución:**

```js
// Verificar token en consola del navegador
console.log(localStorage.getItem('token'));

// Si no hay token, hacer login primero
// Redirigir a /login.html
```

---

### Error: "Cannot read property 'map' of undefined"

**Causa:** API devolvió estructura inesperada

**Solución:**

```js
// En el JS de la página, agregar logs
console.log('Response:', response);

// Verificar que el backend devuelve el formato esperado
// Ejemplo: { cuotas: [...] } vs solo [...]
```

---

## ✅ CHECKLIST FINAL (15 items)

### Archivos creados

- [ ] `frontend/public/comprar-ticket.html`
- [ ] `frontend/actor/mis-cuotas.html`
- [ ] `frontend/actor/mis-tickets.html`
- [ ] `frontend/director/validar-cuotas.html`
- [ ] `frontend/director/validar-pagos.html`
- [ ] `frontend/director/configuracion-financiera.html`
- [ ] `frontend/shared/header.html`
- [ ] `frontend/shared/styles.css`
- [ ] `frontend/shared/api.js`
- [ ] `frontend/shared/utils.js`

### Funcionalidad

- [ ] Servidor frontend corriendo (port 8080)
- [ ] Backend corriendo (port 5000)
- [ ] Pantalla invitado: muestra función y medios de pago
- [ ] Pantalla actor cuotas: muestra lista y botón subir
- [ ] Pantalla actor tickets: muestra lista y botón reportar
- [ ] Pantalla director validar: muestra pendientes y botones aprobar/rechazar
- [ ] Header dinámico según rol
- [ ] Navegación funciona entre páginas
- [ ] CORS habilitado en backend
- [ ] Estilos CSS aplicados correctamente

---

## ⏱️ TIME ESTIMATE

| Paso | Tiempo     |
| ---- | ---------- |
| 1-4  | 2-3 min    |
| 5    | 15-20 min  |
| 6    | 2-3 min    |
| 7    | 5-10 min   |
| **TOTAL** | **24-36 min** |

**+ 5-10 min** de debugging si hay errores = **30-45 min total**

---

## 🎯 LO QUE TENÉS AHORA

### ✅ Pantallas separadas por rol

- **Invitado:** Comprar tickets (sin login)
- **Actor:** Pagar cuotas, vender tickets
- **Director:** Validar pagos, configurar cuentas

### ✅ UX mejorada

- Una acción clara por pantalla
- Textos simples (no técnicos)
- Estados visibles solo cuando importan
- Navegación intuitiva por rol

### ✅ Componentes reutilizables

- API client compartido
- Header dinámico
- Estilos base
- Utilidades JS

---

## 🚀 PRÓXIMOS PASOS (OPCIONALES)

### Mejoras inmediatas

1. **Login/Registro:**
   - `public/login.html`
   - `public/registro.html`
   - Guardar token en localStorage

2. **Notificaciones:**
   - Toast messages al aprobar/rechazar
   - Mejor feedback visual

3. **Carga de datos:**
   - Loading spinners
   - Placeholders mientras carga

4. **Validaciones:**
   - Formularios con validación en tiempo real
   - Mensajes de error específicos

### Integraciones

1. **Email:**
   - Enviar QR después de pago aprobado
   - Notificar a actor cuando cuota aprobada

2. **Dashboard:**
   - Reportes visuales para director
   - Gráficos de ventas

3. **Mobile:**
   - PWA (Progressive Web App)
   - Instalar en home screen

---

## 📊 COMANDOS ÚTILES

### Iniciar frontend (Python)

```bash
cd frontend
python3 -m http.server 8080
```

### Iniciar frontend (Node)

```bash
cd frontend
npx http-server -p 8080
```

### Iniciar backend

```bash
cd teatro-tickets-backend
npm run dev
```

### Ver logs del backend

```bash
# En otra terminal
tail -f teatro-tickets-backend/logs/app.log
```

---

## 🔗 RECURSOS

- [Fetch API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [FormData MDN](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [LocalStorage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [DIAGNOSTICO-PASO-7.md](DIAGNOSTICO-PASO-7.md) — Flujos UX completos

---

## ✨ VEREDICTO

**Si llegaste acá:**

✅ Frontend separado por roles
✅ UX clara y directa
✅ Integración con backend
✅ Componentes reutilizables

**"No es teatro con HTML.
Es experiencia de usuario profesional."**

🎯 **Cada quien sabe exactamente qué hacer.**
