# 🎭 Baco Teatro - Sistema de Gestión de Tickets v2.0

## 📱 ¿Qué acabamos de hacer?

Hemos creado un **sistema completo de gestión de tickets** con dos componentes:

### 1. **Backend (Node.js + Express)**
Sistema de gestión de tickets con roles de usuario y estados de tickets

### 2. **App Móvil (React Native + Expo)**
Aplicación móvil con interfaces diferentes para Admins y Vendedores

---

## 🎯 Flujo Completo del Sistema

```
ADMIN                          VENDEDOR                       CLIENTE
  │                               │                              │
  ├─ 1. Crea función             │                              │
  │    └─ Se generan tickets     │                              │
  │       (DISPONIBLE)            │                              │
  │                               │                              │
  ├─ 2. Asigna 10 tickets  ───────>                             │
  │    al vendedor                │                              │
  │                               ├─ Recibe tickets              │
  │                               │  (STOCK_VENDEDOR)            │
  │                               │                              │
  │                               ├─ 3. Cliente pide entrada ◄───┤
  │                               │                              │
  │                               ├─ 4. Reserva ticket  ─────────>
  │                               │    (RESERVADO)               │
  │                               │                              │
  │ ◄───────── 5. Cliente va a pagar ──────────────────────────  │
  │                               │                              │
  ├─ 6. Busca ticket reservado   │                              │
  │                               │                              │
  ├─ 7. Marca como PAGADO ─────────────────────────────────────> ✅
  │                               │                              │
  │                               │                              │
  │ ◄──────────── 8. Día del show ───────────────────────────────┤
  │                               │                              │
  ├─ 9. Escanea QR               │                              │
  │                               │                              │
  └─ 10. Ticket validado         │                              ✅
     (USADO)                      │
```

---

## 🚀 Cómo Iniciar el Sistema

### **Backend**

```bash
cd teatro-tickets-backend
node index.js
```

El servidor escuchará en `http://localhost:3000`

### **App Móvil**

```bash
cd baco-teatro-app
npx expo start
```

Luego:
- Presiona `a` para Android
- Presiona `i` para iOS
- Escanea el QR con Expo Go en tu teléfono

---

## 👥 Usuarios Pre-configurados

El sistema viene con 3 administradores por defecto:

| ID | Nombre | Email | Rol |
|----|--------|-------|-----|
| 1 | Admin Baco | admin@baco.com | ADMIN |
| 2 | Javier Director | javier@baco.com | ADMIN |
| 3 | Carolina Producción | carolina@baco.com | ADMIN |

---

## 🎨 Pantallas de la App

### **Para ADMIN:**

1. **📦 Distribuir**
   - Selecciona función
   - Selecciona vendedor
   - Asigna cantidad de tickets
   - Los tickets pasan de DISPONIBLE a STOCK_VENDEDOR

2. **💰 Cobrar**
   - Busca por código de ticket o nombre de comprador
   - Marca tickets RESERVADOS como PAGADOS
   - Solo tickets pagados pueden entrar al show

3. **📷 Validar (Scanner QR)**
   - Escanea el QR del ticket
   - Valida que esté PAGADO
   - Marca como USADO al entrar

4. **📊 Reportes**
   - Ve estadísticas por vendedor
   - Cantidad en stock, reservados, vendidos
   - Total recaudado

### **Para VENDEDOR:**

1. **🎟️ Mis Tickets**
   - Ve tus tickets asignados
   - Muestra estado (STOCK_VENDEDOR o RESERVADO)
   - Opción de transferir a otro vendedor

2. **✅ Reservar**
   - Selecciona uno de tus tickets
   - Ingresa datos del comprador
   - Reserva el ticket (pasa a RESERVADO)
   - Cliente debe ir con admin a pagar

3. **📊 Reportes**
   - Ve tus propias estadísticas

---

## 📊 Estados de los Tickets

| Estado | Color | Descripción |
|--------|-------|-------------|
| **DISPONIBLE** | 🔘 Gris | Ticket creado, sin asignar |
| **STOCK_VENDEDOR** | 🟠 Naranja | Ticket asignado a un vendedor |
| **RESERVADO** | 🔵 Azul | Vendedor lo reservó para un cliente |
| **PAGADO** | 🟢 Verde | Admin confirmó el pago |
| **USADO** | ⚫ Gris oscuro | Ticket escaneado y validado en puerta |

---

## 🔐 Permisos por Rol

### **ADMIN puede:**
- ✅ Crear funciones
- ✅ Asignar tickets a vendedores
- ✅ Buscar tickets
- ✅ Marcar tickets como pagados
- ✅ Validar tickets (escanear QR)
- ✅ Ver todos los reportes

### **VENDEDOR puede:**
- ✅ Ver sus propios tickets
- ✅ Reservar tickets
- ✅ Transferir tickets a otros vendedores
- ✅ Ver sus propios reportes
- ❌ NO puede marcar como pagado
- ❌ NO puede validar en puerta

---

## 🧪 Prueba Manual del Sistema

### **1. Crear una función (Admin)**

```bash
curl -X POST http://localhost:3000/api/shows \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-03-15",
    "capacidad": 50
  }'
```

### **2. Crear un vendedor**

```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pedro Actorini",
    "email": "pedro@baco.com",
    "password": "pass123",
    "rol": "VENDEDOR"
  }'
```

### **3. Asignar tickets al vendedor (Admin)**

```bash
curl -X POST http://localhost:3000/api/shows/1/assign-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "vendedorId": 4,
    "cantidad": 10
  }'
```

### **4. Reservar un ticket (Vendedor)**

```bash
# Primero obtener un código de ticket del vendedor
curl http://localhost:3000/api/vendedores/4/tickets

# Luego reservar usando el código obtenido
curl -X POST http://localhost:3000/api/tickets/T-XXXXXXXX/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "nombreComprador": "Juan Pérez",
    "emailComprador": "juan@email.com"
  }'
```

### **5. Buscar y cobrar (Admin)**

```bash
# Buscar por nombre
curl http://localhost:3000/api/tickets/search?q=Juan

# Marcar como pagado
curl -X POST http://localhost:3000/api/tickets/T-XXXXXXXX/mark-paid \
  -H "Content-Type: application/json"
```

### **6. Validar en puerta (Admin)**

```bash
curl -X POST http://localhost:3000/api/tickets/T-XXXXXXXX/validate \
  -H "Content-Type: application/json"
```

---

## 🔧 Endpoints de la API

### **Usuarios**
- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios` - Listar todos
- `GET /api/vendedores` - Solo vendedores activos

### **Funciones**
- `POST /api/shows` - Crear función (genera tickets automáticamente)
- `GET /api/shows` - Listar funciones
- `GET /api/shows/:id/tickets` - Tickets de una función

### **Tickets - Admin**
- `POST /api/shows/:id/assign-tickets` - Asignar tickets a vendedor
- `GET /api/tickets/search?q=...` - Buscar tickets
- `POST /api/tickets/:code/mark-paid` - Marcar como pagado
- `POST /api/tickets/:code/validate` - Validar en puerta

### **Tickets - Vendedor**
- `GET /api/vendedores/:id/tickets` - Mis tickets
- `POST /api/tickets/:code/reserve` - Reservar ticket
- `POST /api/tickets/:code/transfer` - Transferir a otro vendedor

### **Reportes**
- `GET /api/reportes/ventas` - Reporte general
- `GET /api/reportes/ventas?showId=X` - Reporte de una función

---

## 🎨 Colores de Baco Teatro

- **Primario (Naranja):** `#C84A1B`
- **Fondo (Blanco):** `#FEFEFE`
- **Texto:** `#2C2C2C`
- **Texto Secundario:** `#666666`

---

## 📝 Próximos Pasos (Opcional)

1. **Base de datos real:** Migrar de memoria a PostgreSQL/MongoDB
2. **Autenticación:** Login con contraseña y tokens JWT
3. **Notificaciones:** Push notifications cuando un ticket se reserva
4. **Pagos online:** Integración con Mercado Pago/Stripe
5. **Analytics:** Dashboard con gráficos de ventas
6. **Multi-idioma:** Soporte para inglés/portugués

---

## 🐛 Solución de Problemas

### **El backend no inicia**
```bash
# Verifica que el puerto 3000 esté libre
lsof -i :3000
# Si está ocupado, mata el proceso
kill -9 <PID>
```

### **La app no se conecta al backend**
- Cambia `localhost` por tu IP local en `api.js`
- En Mac/Linux: `ifconfig | grep "inet "`
- En Windows: `ipconfig`

### **Expo no funciona**
```bash
# Reinstala dependencias
rm -rf node_modules
npm install
# Limpia caché
npx expo start -c
```

---

## 💡 Tips de Uso

1. **Siempre** crea vendedores antes de asignar tickets
2. Los tickets **RESERVADOS deben cobrarse** antes del show
3. Solo se pueden validar tickets en estado **PAGADO**
4. Los vendedores pueden **transferirse tickets** entre ellos
5. El admin puede **buscar por nombre** para encontrar tickets reservados

---

## 📞 Soporte

Si encontrás algún bug o tenés preguntas:
- Revisa la documentación en `SISTEMA_V2.md`
- Revisa los logs del backend en la terminal
- Verifica que todos los campos requeridos estén presentes

---

**¡Listo para gestionar las entradas de Baco Teatro! 🎭🍷**
