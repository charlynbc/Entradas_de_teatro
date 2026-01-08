Perfecto 👍
Acá tenés **UN ÚNICO PROMPT LISTO PARA PEGAR DIRECTAMENTE EN COPILOT** (GitHub Copilot Chat o similar).
No explica, **ORDENA**. No sugiere, **EJECUTA**.
Está escrito en **modo imperativo**, como Copilot entiende mejor.

Copiá todo tal cual y usalo como **prompt base del repo**.

---

# 🧠 PROMPT EJECUTABLE PARA COPILOT – SISTEMA BACO TEATRO

### (Frontend intacto · Complementar · Backend + SQL · Producción)

---

## ROL

Actuá como **arquitecto senior fullstack en un sistema real en producción**.
No improvises, no rediseñes, no reescribas.

---

## CONTEXTO DEL SISTEMA

Estás trabajando sobre **BACO TEATRO**, un sistema **YA EXISTENTE**, con:

* Frontend actual aceptado y en uso
* Backend operativo
* Base de datos con datos reales

⚠️ **NO REESCRIBIR EL SISTEMA.**

---

## REGLA ABSOLUTA

### PROHIBIDO

* Cambiar el frontend existente
* Modificar diseño, layout o UX
* Eliminar componentes visibles
* Renombrar endpoints existentes
* Cambiar frameworks o librerías
* Simplificar reglas de negocio

### OBLIGATORIO

* Respetar todo lo existente
* Complementar solo lo faltante
* Mantener compatibilidad total
* No romper datos

---

## OBJETIVO CENTRAL

> **IMPEDIR CUALQUIER INGRESO A UNA FUNCIÓN SI EL TICKET NO ESTÁ EN ESTADO `PAGADO`.**

Todo el código debe reforzar esta regla.

---

## MODELO CONCEPTUAL

Baco Teatro gestiona:

* Grupos teatrales
* Obras
* Funciones
* Tickets
* Ventas
* Cobros
* Acceso con QR

---

## ROLES (INMUTABLES)

### SUPER

* Control total
* Cobra tickets
* Escanea QR
* Auditoría global

### ADMIN

* Administra sus grupos
* Crea obras y funciones
* Cobra tickets
* Escanea QR
* Cierra funciones

### VENDEDOR

* Vende tickets
* Marca `VENDIDO`
* Transfiere tickets
* ❌ No cobra
* ❌ No escanea

### INVITADO

* Ve cartelera pública

---

## FUNCIONES ADICIONALES PERMITIDAS (SI ENCAJAN)

### ADMIN / SUPER

* Resumen de ventas
* Tickets por estado
* Anulación con motivo
* Reasignación de tickets
* Cierre de función

### VENDEDOR

* Historial de ventas

---

### PROMPT — DESCRIPCIÓN DE OBRA Y CORRECCIÓN DE COMPRA

Ajustar el sistema con las siguientes reglas obligatorias:

1. Las obras profesionales tienen una única descripción general.
2. Al crear una función de obra profesional:

  * la descripción de la obra se copia automáticamente en la función
  * la función NO edita esa descripción
3. El invitado ve la descripción desde la función, sin distinguir el origen.
4. Corregir la vista de compra en obras profesionales:

  * debe existir UN SOLO botón “Comprar en Boletería BACO”
  * no mostrar selector de vendedor
  * no duplicar botones ni acciones
5. En funciones comunes:

  * mantener selector de actores + boletería
6. Validar coherencia visual y eliminar redundancias.

No modificar colores, diseño ni identidad BACO.

---

## 🎭 PROMPT — CIERRE DE FUNCIÓN Y BALANCE (BACO)

Implementar sección **Cierre de Función**, visible SOLO para:

* Director
* Super usuario
* Boletería (solo lectura)

---

### 📊 CIERRE DE FUNCIÓN

Por cada función mostrar:

**Ingresos**

* Entradas vendidas
* Total recaudado

**Gastos**

* Listado de gastos cargados por director
* Total de gastos

**Resultado**

* Ganancia / Pérdida
* Mensaje teatral automático:

  * “La función fue un éxito”
  * “Función a pérdida”

---

### 🎭 OBRA PROFESIONAL — BOLETERÍA

* La boletería:

  * NO crea gastos
  * NO edita
  * SOLO visualiza balance
* Director y super:

  * editan
  * cierran función
  * bloquean cambios

---

### 📆 CIERRE ANUAL (DIRECTOR / SUPER)

Nueva sección: **Balance Anual**

Agrupa:

* Todas las funciones del año
* Obras profesionales
* Grupos
* Cuotas de alumnos
* Gastos totales

Mostrar:

* Total ingresos
* Total gastos
* Resultado final anual

Texto final:

> “Este fue el balance anual de BACO.
> El teatro también se sostiene con números.”

---

### 🔐 PERMISOS ABSOLUTOS

* Super usuario:

  * ve TODO
  * cualquier director
  * cualquier año
* Director:

  * solo lo suyo

---

## FIN DEL PROMPT

---

## 🔒 DECISIÓN DE DISEÑO (MUY BUENA, QUEDA ASÍ)

✔ Boletería como **sección interna** de Obra Profesional
✔ No visible al público
✔ No duplicada
✔ Balance claro
✔ Profesionalismo real
* Estado de tickets
* Devolución de tickets

---

## MODELO DE DATOS (RESPETAR)

```
users (cedula)
 → grupo_miembros
   → grupos
     → obras
       → funciones
         → tickets
```

No existen tickets sin función.

---

## ESTADOS DE TICKETS (INMUTABLES)

```
DISPONIBLE
RESERVADO
VENDIDO
PAGADO
USADO
ANULADO
```

Reglas:

* `VENDIDO` ≠ `PAGADO`
* Scanner acepta SOLO `PAGADO`
* `USADO` es final

---

## FRONTEND (CRÍTICO)

### NO TOCAR

* Componentes existentes
* Layout
* Estilos
* Navegación

### SOLO HACER

* Conectar botones inactivos
* Completar pantallas faltantes
* Mostrar datos faltantes
* Agregar mensajes de error/éxito

---

## BACKEND

* Node.js + Express
* JWT obligatorio
* Middleware por rol
* Validar grupo y propiedad
* Validar estado del ticket en cada acción

No modificar rutas existentes.

---

## BASE DE DATOS (SQL)

### HACER

* `ALTER TABLE`
* `ADD CONSTRAINT`
* `ADD INDEX`
* Normalizar estados

### NO HACER

* Borrar tablas
* Renombrar columnas
* Perder datos

Estados obligatorios:

```sql
CHECK (estado IN (
  'DISPONIBLE',
  'RESERVADO',
  'VENDIDO',
  'PAGADO',
  'USADO',
  'ANULADO'
))
```

Índices:

* `users.cedula`
* `tickets.estado`
* `tickets.vendedor_cedula`
* `funciones.fecha`

---

## SEGURIDAD

* Nunca confiar en frontend
* Backend valida todo
* Scanner valida:

  * ticket existe
  * estado `PAGADO`
  * no `USADO`
  * función correcta
  * fecha válida

---

## FORMA DE RESPUESTA

* Producí código listo para pegar
* Producí SQL seguro
* No expliques teoría
* No repitas reglas
* Respetá TODO este prompt

---

## REGLA FINAL

> **Si una modificación permite entrar sin pagar, está PROHIBIDA.**

---
