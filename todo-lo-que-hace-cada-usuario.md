# 🎭 Baco Teatro - Sistema Completo de Gestión de Entradas

## 📖 Índice
- [¿Qué es Baco Teatro?](#qué-es-baco-teatro)
- [Sistema de Entradas](#sistema-de-entradas)
- [Tipos de Usuario](#tipos-de-usuario)
- [Usuario SUPREMO](#-usuario-supremo)
- [Usuario DIRECTOR/ADMIN](#-usuario-directoradmin)
- [Usuario VENDEDOR/ACTOR](#-usuario-vendedoractor)
- [Usuario INVITADO/PÚBLICO](#-usuario-invitadopúblico)
- [Flujo de Venta de Entradas](#flujo-de-venta-de-entradas)
- [Sistema de Estados de Entradas](#sistema-de-estados-de-entradas)

---

## 🎭 ¿Qué es Baco Teatro?

**Baco Teatro** es un sistema completo de gestión y venta de entradas para producciones teatrales. El sistema digitaliza todo el proceso desde la creación de obras y funciones hasta la validación de entradas en la puerta del teatro.

### ¿Quiénes son Baco Teatro?
Baco Teatro es un grupo teatral que necesitaba una solución moderna para:
- Gestionar múltiples producciones (obras) simultáneamente
- Controlar la venta de entradas a través de su elenco de actores
- Validar el pago antes de permitir el ingreso
- Mantener control financiero estricto
- Generar reportes de ventas y recaudación

---

## 🎫 Sistema de Entradas

### Arquitectura del Sistema

El sistema funciona con una estructura jerárquica de tres niveles:

```
OBRAS (Producciones Teatrales)
  ↓ contiene múltiples
FUNCIONES (Presentaciones específicas con fecha y hora)
  ↓ contienen
ENTRADAS (Tickets individuales con código QR único)
  ↓ asignadas a
VENDEDORES (Actores del elenco)
```

### ¿Cómo Funciona?

1. **Creación de Obra**: El Director crea una nueva producción teatral con nombre, descripción e imagen.

2. **Creación de Función**: Para cada función (día de presentación), se define:
   - Fecha y hora
   - Lugar
   - Capacidad total (cantidad de butacas)
   - Precio base de la entrada

3. **Generación Automática**: El sistema genera automáticamente todos los códigos QR únicos para cada entrada de la función.

4. **Distribución**: Las entradas se distribuyen entre los actores/vendedores del elenco.

5. **Venta**: Los actores venden las entradas asignadas directamente al público.

6. **Validación de Pago**: El Director cobra el dinero al actor y marca las entradas como "PAGADAS".

7. **Control de Ingreso**: En la puerta del teatro, se escanea el código QR para validar la entrada y permitir el ingreso.

### Características de Seguridad

- **Código QR Único**: Cada entrada tiene un código QR encriptado e irrepetible
- **Validación de Estado**: Solo las entradas en estado "PAGADA" permiten el ingreso
- **Verificación en Tiempo Real**: El scanner valida contra la base de datos en tiempo real
- **Anti-falsificación**: Cualquier QR modificado o generado externamente es rechazado
- **Un Solo Uso**: Una vez usada, la entrada no puede volver a utilizarse

---

## 👥 Tipos de Usuario

El sistema maneja 4 tipos de usuarios con diferentes niveles de acceso:

| Rol | Descripción | Login |
|-----|-------------|-------|
| **SUPREMO** | Administrador máximo del sistema | Cédula + Contraseña |
| **DIRECTOR/ADMIN** | Administrador de producciones | Cédula + Contraseña |
| **VENDEDOR/ACTOR** | Miembro del elenco que vende entradas | Cédula + Contraseña |
| **INVITADO/PÚBLICO** | Espectador que compra entradas | Sin login requerido |

---

## 👑 Usuario SUPREMO

**Rol en el sistema:** `SUPER`  
**Nivel de acceso:** TOTAL - Control absoluto del sistema

### 📋 Credenciales Iniciales
```
Cédula: 48376669
Nombre: Super Baco
Password: Teamomama91
```
⚠️ **IMPORTANTE:** Cambiar contraseña después del primer acceso

### ✅ Funcionalidades Completas

#### 1. Gestión de Usuarios

**Crear Directores:**
- Puede crear usuarios con rol ADMIN (Directores)
- Asigna cédula, nombre y contraseña inicial
- Solo el SUPREMO puede crear directores

**Crear Actores/Vendedores:**
- Puede crear usuarios con rol VENDEDOR (Actores)
- Asigna permisos de venta de entradas
- Puede crear vendedores para cualquier director

**Gestionar Usuarios:**
- Ver lista completa de todos los usuarios del sistema
- Activar/desactivar usuarios
- Resetear contraseñas de cualquier usuario
- Eliminar usuarios (excepto a sí mismo)
- Ver estadísticas de ventas por vendedor

**Restricciones:**
- No puede eliminarse a sí mismo
- No puede eliminar su propio rol de SUPER

#### 2. Gestión de Obras y Funciones

**Control Total:**
- Ver TODAS las obras del sistema (de todos los directores)
- Crear obras sin restricciones
- Editar cualquier obra existente
- Eliminar cualquier obra y sus funciones
- Ver obras inactivas y finalizadas

**Funciones:**
- Crear funciones para cualquier obra
- Editar funciones existentes
- Eliminar funciones y sus entradas
- Ver funciones pasadas y concluidas

#### 3. Gestión de Entradas

**Operaciones:**
- Ver todas las entradas del sistema
- Asignar entradas a vendedores
- Transferir entradas entre vendedores
- Liberar entradas reservadas
- Marcar entradas como vendidas
- Confirmar pagos (marcar como PAGADA)
- Cancelar ventas si es necesario

#### 4. Control de Elenco

**Asignación de Miembros:**
- Agregar actores al elenco de cualquier obra
- Remover actores del elenco
- Ver estadísticas de ventas por actor
- Gestionar distribución de entradas entre el elenco

#### 5. Reportes y Estadísticas

**Dashboard Global:**
- Total de usuarios por rol
- Total de obras activas e inactivas
- Total de funciones programadas
- Recaudación total del sistema
- Entradas vendidas vs. disponibles
- Ranking de vendedores

**Reportes por Obra:**
- Ventas totales por función
- Recaudación por función
- Deuda pendiente de vendedores
- Entradas usadas vs. no usadas

#### 6. Scanner Universal

**Validación de Entradas:**
- Escanear QR en la puerta
- Validación en tiempo real contra base de datos
- Ver información completa de la entrada escaneada
- Marcar entrada como "USADA" automáticamente
- Detección de entradas falsificadas
- Historial de escaneos

#### 7. Gestión de Ensayos

**Ensayos Generales:**
- Ver todos los ensayos del sistema
- Crear ensayos para cualquier obra
- Editar ensayos existentes
- Eliminar ensayos
- Gestionar participantes (actores)

#### 8. Configuración del Sistema

**Administración:**
- Ver logs del sistema
- Limpiar base de datos (manteniendo usuarios)
- Configurar parámetros globales
- Realizar backups
- Ver historial de cambios

---

## 🎬 Usuario DIRECTOR/ADMIN

**Rol en el sistema:** `ADMIN`  
**Nivel de acceso:** ALTO - Gestión de sus propias producciones

### 📋 ¿Quién es?
El Director es un administrador que gestiona sus propias obras teatrales. Puede ser el director de una o varias producciones simultáneamente.

### ✅ Funcionalidades Completas

#### 1. Gestión de Obras

**Crear Obras:**
- Crear nuevas producciones teatrales
- Definir: nombre, descripción, imagen
- Marcar obra como activa/inactiva
- Configurar elenco base

**Editar Obras:**
- Modificar información de sus obras
- Cambiar imagen de portada
- Actualizar descripción
- Activar/desactivar producción

**Eliminar Obras:**
- Eliminar sus propias obras
- Se eliminan automáticamente todas las funciones y entradas asociadas
- ⚠️ Acción irreversible

**Restricciones:**
- Solo puede gestionar SUS propias obras
- No puede ver ni editar obras de otros directores
- No puede eliminar obras de otros directores

#### 2. Gestión de Funciones

**Crear Función:**
1. Seleccionar una de sus obras
2. Definir fecha y hora
3. Establecer lugar (sala, teatro)
4. Configurar capacidad total (butacas disponibles)
5. Definir precio base de la entrada
6. El sistema genera automáticamente todos los códigos QR

**Editar Función:**
- Modificar fecha/hora (si no hay entradas vendidas)
- Cambiar lugar
- Ajustar capacidad (solo aumentar)
- Modificar precio (afecta entradas no vendidas)

**Eliminar Función:**
- Eliminar función si no tiene ventas confirmadas
- Se eliminan todas las entradas asociadas
- ⚠️ No se puede eliminar si hay entradas PAGADAS o USADAS

#### 3. Gestión de Elenco

**Asignar Actores:**
- Ver lista de vendedores disponibles
- Agregar actores al elenco de sus obras
- Asignar rol específico en la producción
- Ver historial de ventas del actor

**Remover del Elenco:**
- Quitar actores de sus obras
- Las entradas del actor se liberan automáticamente
- Se notifica al actor afectado

**Distribución de Entradas:**
1. Seleccionar función
2. Elegir actor del elenco
3. Ingresar cantidad de entradas a asignar
4. Las entradas pasan de DISPONIBLE a EN_STOCK del vendedor
5. El actor puede ahora venderlas

#### 4. Control de Caja

**Flujo de Cobro:**
1. Actor vende entrada y la marca como "VENDIDA"
2. Actor recibe el dinero del comprador
3. Actor le entrega el dinero al Director
4. Director marca las entradas como "PAGADA" en el sistema
5. Solo en ese momento la entrada es válida para ingresar

**Cobrar a Vendedor:**
- Ver lista de entradas vendidas por actor (no cobradas)
- Ver monto total adeudado
- Confirmar recepción de dinero
- Marcar entradas como PAGADA en lote
- Registrar fecha y hora de cobro

**Reportes Financieros:**
- Dinero en mano de vendedores (deuda)
- Dinero cobrado y asegurado
- Recaudación total por función
- Proyección de ingresos

#### 5. Scanner de Entradas

**Control de Puerta:**
1. Activar cámara del dispositivo
2. Apuntar al código QR del espectador
3. Sistema valida:
   - Autenticidad del QR
   - Estado PAGADA
   - Fecha correcta (función del día)
   - No haya sido usada previamente
4. Si todo está OK:
   - Luz verde ✅
   - Marca entrada como USADA
   - Permite el ingreso
5. Si hay problema:
   - Luz roja ❌
   - Muestra el motivo del rechazo
   - No permite el ingreso

**Motivos de Rechazo:**
- Entrada no existe (QR falso)
- Entrada no ha sido pagada
- Entrada ya fue usada
- Fecha incorrecta (función diferente)
- Entrada cancelada

#### 6. Reportes y Estadísticas

**Dashboard Director:**
- Total de sus obras activas
- Funciones programadas
- Entradas vendidas vs. disponibles
- Recaudación total
- Deuda pendiente de vendedores
- Próximas funciones

**Reporte por Función:**
- Capacidad total vs. vendidas
- Entradas por estado (disponible, vendida, pagada, usada)
- Ranking de vendedores
- Recaudación de la función
- Porcentaje de ocupación
- Lista de espectadores

**Reporte por Obra:**
- Total de funciones realizadas
- Recaudación histórica
- Mejor función (más vendida)
- Mejor vendedor
- Estadísticas generales

#### 7. Gestión de Ensayos

**Crear Ensayo:**
- Definir título del ensayo
- Establecer fecha y hora
- Asignar lugar
- Agregar descripción/notas
- Seleccionar actores participantes

**Notificar Elenco:**
- Los actores ven automáticamente los ensayos en su app
- Pueden confirmar asistencia
- Reciben recordatorios

**Modificar Ensayo:**
- Cambiar fecha/hora
- Actualizar lugar
- Modificar lista de participantes
- Agregar notas adicionales

#### 8. Restricciones

**No puede:**
- Ver obras de otros directores
- Gestionar funciones de otras obras
- Crear otros directores (solo el SUPER puede)
- Eliminar usuarios
- Ver reportes globales del sistema
- Modificar configuración del sistema

---

## 🎭 Usuario VENDEDOR/ACTOR

**Rol en el sistema:** `VENDEDOR`  
**Nivel de acceso:** MEDIO - Gestión de su stock de entradas

### 📋 ¿Quién es?
El Vendedor/Actor es un miembro del elenco que tiene asignadas entradas para vender. Es el puente entre el público y la obra.

### ✅ Funcionalidades Completas

#### 1. Ver Mi Stock

**Pantalla Principal:**
- Lista de todas sus entradas asignadas
- Agrupadas por obra y función
- Información visible:
  - Código de entrada
  - Obra y función
  - Fecha y hora
  - Lugar
  - Estado actual
  - Precio de venta
  - Comprador (si ya está vendida)

**Filtros:**
- Ver todas las entradas
- Ver solo disponibles
- Ver solo reservadas
- Ver solo vendidas
- Ver solo pagadas
- Ver por obra específica

#### 2. Reservar Entrada

**Proceso de Reserva:**
1. Seleccionar entrada de su stock
2. Ingresar datos del comprador:
   - Nombre completo
   - Teléfono/contacto (opcional)
3. Confirmar reserva
4. Entrada pasa de EN_STOCK a RESERVADA
5. Generar y compartir código QR

**Características:**
- La entrada queda temporalmente asignada
- Puede liberar la reserva si el cliente no paga
- Tiene un plazo para confirmar la venta

#### 3. Vender Entrada

**Proceso de Venta:**
1. Cliente le paga al actor
2. Actor marca la entrada como "VENDIDA" en la app
3. Sistema registra:
   - Fecha de venta
   - Vendedor
   - Comprador
   - Precio
4. Actor comparte el código QR con el comprador
5. Entrada pasa a estado VENDIDA

**Importante:**
⚠️ En este punto, la entrada AÚN NO PERMITE EL INGRESO  
❗ Debe informar al comprador: "Tu entrada se activará cuando yo rinda el dinero al Director"

#### 4. Compartir Entrada

**Métodos para Compartir:**
- **Mostrar en pantalla**: El comprador le toma foto al QR
- **WhatsApp**: Enviar imagen del QR directamente
- **Email**: Enviar PDF con entrada completa
- **Captura de pantalla**: Guardar y enviar por cualquier medio

**Contenido del QR:**
- Código único encriptado
- Información de la función
- Nombre del comprador
- Estado de pago (Pendiente o Confirmado)

#### 5. Quitar Reserva

**Liberar Entrada:**
1. Seleccionar entrada RESERVADA
2. Tocar "Quitar Reserva"
3. Confirmar acción
4. Entrada vuelve a EN_STOCK
5. Los datos del comprador se eliminan
6. Puede volver a venderla

**Casos de uso:**
- Cliente no completó el pago
- Cliente canceló la compra
- Reserva venció

#### 6. Transferir Entradas

**Transferir a Otro Actor:**
1. Ir a sección "Transferir"
2. Seleccionar entrada(s) a transferir
3. Elegir actor destinatario del elenco
4. Confirmar transferencia
5. Entrada desaparece de su stock
6. Aparece en el stock del receptor

**Restricciones:**
- Solo puede transferir entradas EN_STOCK
- Solo a actores del mismo elenco
- No puede transferir entradas vendidas o reservadas
- Se registra la transferencia para auditoría

#### 7. Historial de Ventas

**Ver Historial:**
- Todas las entradas vendidas
- Fecha de venta
- Comprador
- Precio
- Estado actual (Vendida/Pagada/Usada)
- Total recaudado
- Comisiones (si aplica)

**Estadísticas Personales:**
- Total vendido en el período
- Número de entradas vendidas
- Promedio de precio
- Ranking entre vendedores
- Mejor mes de ventas

#### 8. Ver Ensayos

**Mis Ensayos:**
- Lista de ensayos programados
- Fecha, hora y lugar
- Director a cargo
- Otros participantes
- Descripción del ensayo
- Confirmar asistencia

**Notificaciones:**
- Recordatorio 24h antes
- Alerta de cambios de horario
- Notificación de nuevos ensayos

#### 9. Información del Elenco

**Ver Compañeros:**
- Lista de otros actores
- Datos de contacto
- Obras en común
- Estadísticas de ventas (si el director lo permite)

#### 10. Restricciones

**No puede:**
- Crear obras o funciones
- Asignar entradas a otros vendedores
- Marcar como PAGADA (solo el Director puede)
- Ver reportes financieros completos
- Eliminar funciones o entradas
- Ver stock de otros vendedores (solo transferir)
- Modificar precios de las entradas
- Escanear entradas en la puerta (solo Director y SUPER)
- Crear o eliminar ensayos
- Gestionar el elenco

---

## 🎟️ Usuario INVITADO/PÚBLICO

**Rol en el sistema:** `INVITADO` o sin login  
**Nivel de acceso:** BAJO - Solo compra de entradas

### 📋 ¿Quién es?
El espectador que desea asistir a una función. No necesita crear cuenta ni iniciar sesión para reservar entradas.

### ✅ Funcionalidades Completas

#### 1. Ver Obras Disponibles

**Catálogo Público:**
- Lista de todas las obras activas
- Información visible:
  - Imagen de la obra
  - Nombre de la producción
  - Descripción
  - Total de funciones disponibles
  - Elenco de actores

**Sin Restricciones:**
- No necesita login
- Acceso libre desde cualquier dispositivo
- Navegación anónima

#### 2. Ver Funciones

**Por Obra:**
1. Seleccionar una obra del catálogo
2. Ver todas las funciones disponibles:
   - Fecha y hora
   - Lugar (sala/teatro)
   - Precio de entrada
   - Butacas disponibles
   - Butacas vendidas
   - Porcentaje de ocupación

**Información en Tiempo Real:**
- Disponibilidad actualizada
- No muestra funciones pasadas
- Solo funciones con entradas disponibles

#### 3. Reservar Entrada (Proceso Simplificado)

**Método 1: Compra Directa a Actor**

El proceso tradicional recomendado:

1. **Contactar Actor:**
   - Buscar al actor favorito
   - Enviar mensaje (WhatsApp, Instagram, etc.)
   - Indicar función deseada

2. **Reserva Personalizada:**
   - El actor reserva la entrada con tu nombre
   - Te envía el código QR
   - Acordar forma de pago

3. **Pago:**
   - Pagar al actor (efectivo, transferencia)
   - Actor marca como vendida
   - Actor rinde dinero al Director

4. **Activación:**
   - Director confirma pago
   - Entrada pasa a PAGADA
   - ✅ Ahora puedes ingresar al teatro

**Método 2: Reserva Online (Si está habilitada)**

Sistema de reserva automático:

1. **Seleccionar Función:**
   - Elegir fecha deseada
   - Ver disponibilidad

2. **Ingresar Datos (Opcional):**
   - Nombre completo
   - Teléfono/email de contacto
   - Cantidad de entradas

3. **Confirmar Reserva:**
   - Sistema asigna entrada(s) automáticamente
   - Genera código QR provisional
   - Envía confirmación

4. **Completar Pago:**
   - Contactar al actor asignado
   - Realizar el pago
   - Esperar activación del Director

#### 4. Mi Entrada

**Código QR:**
Una vez confirmada la compra, recibes:
- Imagen con código QR único
- Información de la función
- Nombre del comprador
- Instrucciones de uso

**Características:**
- QR encriptado de alta seguridad
- Válido para una sola persona
- Un solo uso
- No transferible (sin avisar)

#### 5. Día de la Función

**Preparación:**
1. Llegar 15 minutos antes
2. Tener el QR listo en el celular
3. Subir brillo de pantalla al máximo
4. Desactivar filtros de luz azul

**En la Puerta:**
1. Presentar QR al personal
2. Scanner valida:
   - Autenticidad
   - Estado PAGADA
   - Fecha correcta
   - No usado previamente
3. Luz verde ✅ → ¡Bienvenido!
4. Luz roja ❌ → Ver personal (falta pago, error)

**Resultado del Escaneo:**
- ✅ **Verde**: Entrada válida, ingreso permitido
- ❌ **Rojo**: Entrada rechazada por:
  - No está pagada
  - Ya fue usada
  - Fecha incorrecta
  - QR inválido/falsificado

#### 6. Preguntas Frecuentes

**¿Puedo transferir mi entrada?**
- Sí, pero debes avisar al vendedor
- El vendedor actualiza datos si es necesario
- El QR es al portador

**¿Qué pasa si llego tarde?**
- El QR funciona durante todo el evento
- Ingreso a sala puede restringirse por respeto al público
- Consultar política del teatro

**¿Sirve una captura de pantalla?**
- Sí, mientras el QR sea claro y completo
- Recomendado tener buena resolución
- Evitar brillos o reflejos en pantalla

**¿Puedo compartir mi QR?**
- ⚠️ NO recomendado
- El primero en usar el QR ingresa
- Una vez usada, nadie más puede entrar
- No publicar en redes sociales

**¿Qué pasa si mi entrada no pasa el scanner?**
- Verificar con el personal
- Puede ser que falte el pago final
- Contactar al vendedor que te la dio
- Mostrar comprobante de pago si lo tienes

#### 7. Restricciones

**No puede:**
- Acceder al panel de administración
- Ver estadísticas de ventas
- Gestionar funciones u obras
- Crear usuarios
- Transferir entradas sin autorización
- Modificar datos de la entrada
- Generar QR propios (son validados contra base de datos)
- Ver información privada del sistema
- Acceder a reportes financieros

---

## 🔄 Flujo de Venta de Entradas

### Flujo Completo del Sistema

```
1. DIRECTOR crea OBRA
   ↓
2. DIRECTOR crea FUNCIÓN (genera entradas con QR)
   ↓
3. DIRECTOR asigna ACTORES al elenco
   ↓
4. DIRECTOR distribuye ENTRADAS a cada ACTOR
   ↓
5. ACTOR reserva entrada con datos del COMPRADOR
   ↓
6. COMPRADOR paga al ACTOR
   ↓
7. ACTOR marca entrada como "VENDIDA"
   ↓
8. ACTOR entrega dinero al DIRECTOR
   ↓
9. DIRECTOR marca entrada como "PAGADA"
   ↓
10. COMPRADOR puede ingresar con QR ✅
```

### Estados de una Entrada

#### 1. DISPONIBLE
- **Descripción**: Entrada generada, disponible para asignar
- **Color**: Gris
- **Acciones**: Director puede asignar a vendedor

#### 2. EN_STOCK
- **Descripción**: Entrada asignada a un vendedor
- **Color**: Azul
- **Acciones**: Vendedor puede reservar o vender

#### 3. RESERVADA
- **Descripción**: Entrada apartada con datos del comprador
- **Color**: Amarillo
- **Acciones**: Vendedor puede confirmar venta o liberar

#### 4. VENDIDA (REPORTADA)
- **Descripción**: Vendedor reportó la venta pero no rindió dinero
- **Color**: Naranja
- **Acciones**: Director puede cobrar y marcar como PAGADA
- **⚠️ NO PERMITE INGRESO** - Falta confirmar pago

#### 5. PAGADA
- **Descripción**: Director confirmó recepción de dinero
- **Color**: Verde
- **Acciones**: Scanner puede marcar como USADA
- **✅ PERMITE INGRESO**

#### 6. USADA
- **Descripción**: Entrada validada y utilizada en puerta
- **Color**: Verde oscuro
- **Acciones**: Ninguna - Ciclo completado
- **✅ ESPECTADOR INGRESÓ**

#### 7. CANCELADA
- **Descripción**: Entrada anulada por Director
- **Color**: Rojo
- **Acciones**: No permite ninguna acción
- **❌ NO PERMITE INGRESO**

---

## 🎯 Sistema de Estados de Entradas

### Diagrama de Transiciones

```
DISPONIBLE
    ↓ (Director asigna a vendedor)
EN_STOCK
    ↓ (Vendedor reserva)
RESERVADA
    ↓ (Vendedor confirma venta + cliente paga)
VENDIDA
    ↓ (Director cobra y confirma)
PAGADA
    ↓ (Scanner en puerta)
USADA ✅
```

### Transiciones Especiales

**Liberar Reserva:**
```
RESERVADA → EN_STOCK
```
(Vendedor cancela reserva)

**Cancelar Venta:**
```
VENDIDA → EN_STOCK
```
(Director rechaza venta por error)

**Transferir Entrada:**
```
EN_STOCK (Vendedor A) → EN_STOCK (Vendedor B)
```
(Entre vendedores del mismo elenco)

**Anular Entrada:**
```
Cualquier Estado → CANCELADA
```
(Solo Director o SUPER, irreversible)

---

## 📊 Resumen de Permisos

| Acción | SUPREMO | DIRECTOR | VENDEDOR | INVITADO |
|--------|---------|----------|----------|----------|
| Crear obras | ✅ | ✅ | ❌ | ❌ |
| Crear funciones | ✅ | ✅ | ❌ | ❌ |
| Asignar entradas a vendedores | ✅ | ✅ | ❌ | ❌ |
| Reservar entradas | ✅ | ✅ | ✅ | ✅* |
| Marcar como vendida | ✅ | ✅ | ✅ | ❌ |
| Marcar como pagada | ✅ | ✅ | ❌ | ❌ |
| Escanear QR en puerta | ✅ | ✅ | ❌ | ❌ |
| Ver reportes financieros | ✅ | ✅** | ❌ | ❌ |
| Crear usuarios | ✅ | ❌*** | ❌ | ❌ |
| Eliminar usuarios | ✅ | ❌ | ❌ | ❌ |
| Ver todas las obras | ✅ | ❌**** | ❌ | ✅***** |
| Transferir entradas | ✅ | ✅ | ✅ | ❌ |
| Gestionar ensayos | ✅ | ✅ | ❌ | ❌ |
| Ver ensayos | ✅ | ✅ | ✅ | ❌ |

**Notas:**
- \* INVITADO puede reservar si el sistema público está habilitado
- \*\* DIRECTOR solo ve reportes de sus propias obras
- \*\*\* DIRECTOR puede crear VENDEDORES para sus obras (con permiso SUPER)
- \*\*\*\* DIRECTOR solo ve sus propias obras
- \*\*\*\*\* INVITADO solo ve obras activas públicamente

---

## 🔐 Seguridad del Sistema

### Autenticación
- Login con cédula + contraseña
- Contraseñas encriptadas con bcrypt (10 rounds)
- Tokens JWT para sesiones
- Expiración de tokens configurable
- Bloqueo por intentos fallidos

### Validación de Entradas
- QR encriptado con algoritmo seguro
- Validación en tiempo real contra base de datos
- Detección de QR duplicados o falsificados
- Registro de intentos de acceso no autorizado
- Auditoría completa de escaneos

### Control Financiero
- Separación clara: Vendedor → Director
- Doble verificación: Venta reportada + Pago confirmado
- Trazabilidad completa de dinero
- Reportes de deudores en tiempo real
- Histórico de transacciones

---

## 📱 Tecnología

### Backend
- **Framework**: Express.js (Node.js)
- **Base de Datos**: PostgreSQL 16
- **Autenticación**: JWT + bcrypt
- **Hosting**: Render

### Frontend
- **Framework**: React Native + Expo
- **Navegación**: React Navigation
- **Estado**: Context API
- **Diseño**: Custom (Teatral/Hipster)

### Integración
- **QR Generation**: biblioteca qrcode
- **PDF Generation**: PDFKit
- **Validación**: Scanner de cámara con expo-camera

---

## 📞 Soporte

Para cualquier consulta sobre el sistema Baco Teatro:

- **Documentación**: Ver archivos en carpeta `/docs`
- **Manuales**: 
  - [Manual Comprador](docs/MANUAL_COMPRADOR.md)
  - [Manual Director](docs/MANUAL_DIRECTOR.md)
  - [Manual Actor](docs/MANUAL_ACTOR.md)
- **Técnico**: Ver [SISTEMA-OBRAS-FUNCIONES-V3.md](SISTEMA-OBRAS-FUNCIONES-V3.md)

---

**Versión del documento**: 1.0  
**Última actualización**: Diciembre 2024  
**Sistema**: Baco Teatro v3.0
