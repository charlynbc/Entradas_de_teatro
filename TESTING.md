# Reporte de Pruebas y Verificación

## 1. Verificación de Lógica de Negocio (Backend Mock)

### Gestión de Ensayos (Rehearsals)
- **Bug Encontrado**: La función `createRehearsal` en `api/mock.js` estaba desestructurando los argumentos (`{ showId, fecha, lugar }`), lo que provocaba que otros campos como `title` y `notes` (enviados desde el formulario) se perdieran.
- **Corrección**: Se actualizó `createRehearsal` para aceptar un objeto `payload` completo y guardarlo íntegramente.
- **Estado**: ✅ Corregido.

### Reserva de Invitados (Guest Mode)
- **Flujo**: `GuestShowDetailScreen` -> `guestReserveTicket` (API).
- **Validación**:
    - La API `getPublicShowDetails` filtra correctamente solo los actores que tienen stock (`STOCK_VENDEDOR`).
    - La función `guestReserveTicket` busca un ticket específico de ese actor y lo marca como `RESERVADO`.
    - Se guardan `comprador_nombre` y `comprador_telefono`.
- **Estado**: ✅ Lógica verificada.

### Asignación de Entradas (Director)
- **Flujo**: `DirectorShowDetailScreen` -> `assignTicketsToActor` (API).
- **Validación**:
    - El director selecciona una función y ve la lista de actores.
    - Al asignar, se llama a `assignTicketsToActor` con el ID del actor y la cantidad.
    - La API verifica que existan entradas `DISPONIBLE` suficientes.
    - Las entradas pasan a estado `STOCK_VENDEDOR` y se asignan al `actorId`.
- **Estado**: ✅ Lógica verificada.

## 2. Verificación de Navegación

### Director
- **Nueva Pantalla**: `DirectorShowDetailScreen` añadida al stack.
- **Acceso**: Desde `DirectorShowsScreen`, al hacer clic en una tarjeta de función.
- **Tabs**: Se agregó la pestaña "Ensayos" (`DirectorRehearsalsScreen`).

### Actor
- **Tabs**: Se agregó la pestaña "Ensayos" (`ActorRehearsalsScreen`).

### Invitado
- **Acceso**: Botón "Entrar como Invitado" en `LoginScreen`.
- **Restricción**: El `GuestNavigator` no permite acceso a pantallas protegidas.

## 3. Pruebas Manuales Recomendadas (En Simulador)

1. **Crear Ensayo**:
   - Entrar como Director -> Pestaña Ensayos -> Nuevo.
   - Llenar Título, Lugar, Notas. Guardar.
   - Verificar que aparece en la lista con todos los datos.

2. **Ver Ensayo como Actor**:
   - Salir -> Entrar como Actor (Lucas).
   - Ir a pestaña Ensayos.
   - Verificar que ve el ensayo creado.

3. **Reserva Pública**:
   - Salir -> Entrar como Invitado.
   - Seleccionar una función.
   - Seleccionar un vendedor (asegurarse que tenga stock).
   - Llenar nombre y teléfono. Reservar.
   - Verificar mensaje de éxito.

4. **Verificación de Reserva**:
   - Entrar como el Actor vendedor.
   - Verificar si su stock bajó o si la entrada aparece como reservada (dependiendo de cómo se muestre en `ActorStockScreen`).
   *Nota: Actualmente `ActorStockScreen` muestra el stock disponible. La entrada reservada ya no cuenta como stock libre.*

## Conclusión
El código ha sido revisado estáticamente y se han corregido errores lógicos detectados. La estructura es consistente con los requerimientos.
