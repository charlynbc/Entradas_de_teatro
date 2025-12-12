# 🎯 GUÍA RÁPIDA PARA ENTREGA

## ✅ Lo Que Ya Está Hecho

1. ✅ Código limpio sin datos de prueba
2. ✅ `data.json` vacío
3. ✅ `init-obras.js` eliminado
4. ✅ Scripts de limpieza creados
5. ✅ Documentación completa
6. ✅ Todo committeado y pusheado a GitHub

## 🚨 LO QUE DEBES HACER ANTES DE ENTREGAR

### Paso 1: Limpiar Base de Datos en Render (IMPORTANTE)

**Opción A: Mediante Dashboard de Render (Recomendado)**

1. Ve a https://dashboard.render.com
2. Click en tu base de datos PostgreSQL (`baco_teatro_db`)
3. Click en la pestaña "**Query**" o "**Console**"
4. Copia TODO el contenido del archivo `teatro-tickets-backend/limpiar-db.sql`
5. Pégalo en la consola SQL
6. Click en "**Run**" o "**Execute**"
7. Verifica que solo quede 1 usuario (el SUPER)

**Contenido de limpiar-db.sql:**
```sql
-- Copiar todo este contenido:

DELETE FROM reportes_obras;
DELETE FROM ensayos_generales;
DELETE FROM tickets;
DELETE FROM shows;
DELETE FROM users WHERE rol != 'SUPER';

ALTER SEQUENCE IF EXISTS shows_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ensayos_generales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reportes_obras_id_seq RESTART WITH 1;

-- Verificar (debe mostrar solo 1 usuario):
SELECT cedula, nombre, rol FROM users;
```

### Paso 2: Verificar que el Backend en Render esté actualizado

1. Ve a https://dashboard.render.com
2. Click en tu web service (`baco-teatro-backend` o similar)
3. Verifica que el último deploy sea de hoy
4. Si no, haz click en "**Manual Deploy**" > "**Deploy latest commit**"
5. Espera a que termine (status: Live)

### Paso 3: Verificación Final

Ejecuta en tu terminal:
```bash
cd /workspaces/Entradas_de_teatro
./verificar-limpieza.sh
```

Debes ver todos ✅ verdes.

## 🔐 Credenciales para la Entrega

**Usuario SUPER (único usuario en el sistema):**
```
Cédula: 48376669
Nombre: Usuario Supremo
Password: super123
Rol: SUPER
```

## 📱 URLs para la Entrega

**Backend:**
```
https://baco-teatro-1jxj.onrender.com
```

**Frontend Web:**
```
https://baco-teatro-1jxj.onrender.com/
```

**Pantalla de Desarrollador:**
```
https://baco-teatro-1jxj.onrender.com/desarrollador
```

## 🎭 Demostración del Sistema Vacío

Al entrar al sistema verás:

1. **Login** → Solo funciona con usuario SUPER
2. **Home SUPER** → Sin obras, sin usuarios excepto el SUPER
3. **Crear Director** → Crea tu primer ADMIN
4. **Director crea Obra** → Primera obra del sistema
5. **Director crea Vendedor** → Para vender tickets
6. **Vender Tickets** → Generar QRs
7. **Ver Reportes** → Todo en 0 al inicio

## 📊 Estado Actual del Sistema

```
✅ Usuarios: 1 (solo SUPER)
✅ Obras: 0
✅ Tickets: 0
✅ Ensayos: 0
✅ Reportes: 0
✅ data.json: vacío
✅ Código: sin datos hardcodeados
```

## 📋 Checklist Final de Entrega

- [ ] Ejecutaste `limpiar-db.sql` en Render Dashboard
- [ ] Verificaste que solo existe el usuario SUPER en la base de datos
- [ ] El backend en Render está actualizado (último commit)
- [ ] Ejecutaste `./verificar-limpieza.sh` y todo salió ✅
- [ ] Probaste el login con las credenciales del SUPER
- [ ] El sistema muestra 0 obras, 0 tickets, etc.

## 🎉 Listo para Entregar

Una vez completados todos los pasos del checklist, tu sistema está:

✅ **100% Limpio**
✅ **Sin datos de prueba**
✅ **Solo usuario SUPER configurado**
✅ **Todas las funcionalidades operativas**
✅ **Listo para demostración desde cero**

---

## 🆘 Si Algo Sale Mal

**Problema:** No puedo conectar a Render Dashboard
- Solución: Usa las credenciales de tu cuenta de Render

**Problema:** El script SQL da error
- Solución: Ejecuta cada línea DELETE por separado

**Problema:** Quedan datos en la base de datos
- Solución: Ejecuta el script completo de nuevo

**Problema:** No aparece el usuario SUPER
- Solución: Ejecuta `node init-supremo.js` en el backend

---

**¡Tu sistema está LISTO para entregar! 🎭✨**
