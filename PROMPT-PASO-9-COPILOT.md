# 🤖 PROMPT PASO 9 — PROTECCIÓN LEGAL — COPILOT

## 📋 CONTEXTO DEL SISTEMA

Estás trabajando en un sistema de gestión de entradas de teatro que ya tiene:

- **PASO 1-5:** Backend con PostgreSQL, autenticación, CAJA contable
- **PASO 6:** Pasarela de pagos (MercadoPago, Transferencia, Efectivo)
- **PASO 7:** UX separada por rol (Invitado, Actor, Director)
- **PASO 8:** Reportes financieros desde CAJA

**Ahora necesitamos:** Protección legal para cumplir con leyes uruguayas y proteger a todos los involucrados.

---

## 🎯 TU TAREA

Implementar **capa legal completa** para el sistema:

1. **Términos y Condiciones**
2. **Política de Privacidad** (Ley 18.331 Uruguay)
3. **Disclaimers en UI**
4. **Sistema de auditoría**
5. **Textos de protección**

Todos deben:
- ✅ Proteger al creador del sistema
- ✅ Proteger al director/grupo
- ✅ Cumplir Ley 18.331 (Privacidad Uruguay)
- ✅ Dejar responsabilidades claras
- ✅ Ser comprensibles (no jerga legal)

---

## 🚨 REGLAS CRÍTICAS (SEGUIR AL PIE DE LA LETRA)

### 1. SISTEMA COMO HERRAMIENTA (NO PROCESADOR)

**✅ BIEN:**
```
"Baco Teatro es una herramienta de gestión"
"El director es responsable de validar pagos"
"Los pagos se realizan a cuentas del grupo"
```

**❌ MAL:**
```
"Baco Teatro procesa tu pago"
"Confirmamos tu pago"
"Facturamos tu entrada"
```

**Por qué:** Si el sistema "procesa" pagos, asumís responsabilidad legal de procesador de pagos (licencias, regulaciones bancarias).

---

### 2. NO FACTURACIÓN

**Incluir:**
- ✅ "Registro interno"
- ✅ "Resumen de operación"
- ✅ "Liquidación interna"

**NO incluir:**
- ❌ "Factura"
- ❌ "IVA"
- ❌ "RUT"
- ❌ "CFE"
- ❌ "Comprobante fiscal"

---

### 3. CUENTAS CON DISCLAIMER

**Siempre que se muestre cuenta bancaria:**

```html
<div class="cuenta-disclaimer">
  <p><strong>⚠️ Cuenta declarada por el director del grupo</strong></p>
  <p>Banco: {{ banco }}</p>
  <p>El director es responsable de esta información</p>
</div>
```

---

### 4. AUDITORÍA OBLIGATORIA

Todo cambio en datos financieros debe quedar registrado:
- Usuario que hizo el cambio
- Fecha y hora
- Datos anteriores y nuevos

---

## 📦 DELIVERABLE 1: terminos-y-condiciones.html

### Ubicación:
```
frontend/public/terminos-y-condiciones.html
```

### HTML:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Términos y Condiciones - Baco Teatro</title>
  <link rel="stylesheet" href="../shared/styles.css">
  <style>
    .legal-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
    }
    .legal-content h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .legal-content h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }
    .legal-content h3 {
      font-size: 1.2rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #34495e;
    }
    .legal-content p {
      margin-bottom: 1rem;
    }
    .legal-content ul {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }
    .highlight-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 1rem;
      margin: 1.5rem 0;
    }
  </style>
</head>
<body>
  <div class="legal-content">
    <h1>Términos y Condiciones de Uso</h1>
    
    <p><strong>Última actualización:</strong> {{ fecha_actual }}</p>
    
    <div class="highlight-box">
      <p><strong>⚠️ IMPORTANTE:</strong></p>
      <p>Baco Teatro es una <strong>herramienta de gestión</strong> para grupos de teatro.</p>
      <p>NO procesamos pagos. NO retenemos dinero. NO somos intermediarios financieros.</p>
    </div>
    
    <h2>1. Naturaleza del Servicio</h2>
    
    <h3>1.1 ¿Qué es Baco Teatro?</h3>
    <p>
      Baco Teatro es una plataforma web que facilita la gestión de:
    </p>
    <ul>
      <li>Funciones de teatro</li>
      <li>Venta y asignación de entradas</li>
      <li>Cuotas de actores</li>
      <li>Registro de operaciones financieras</li>
      <li>Reportes internos</li>
    </ul>
    
    <h3>1.2 ¿Qué NO es Baco Teatro?</h3>
    <p>
      Baco Teatro NO es:
    </p>
    <ul>
      <li>Un procesador de pagos</li>
      <li>Una entidad financiera</li>
      <li>Un intermediario de dinero</li>
      <li>Una plataforma de facturación fiscal</li>
    </ul>
    
    <h3>1.3 Flujo de Dinero</h3>
    <p>
      Los pagos se realizan:
    </p>
    <ul>
      <li><strong>Directamente</strong> a cuentas bancarias declaradas por el director del grupo</li>
      <li>A través de <strong>MercadoPago</strong> (cuenta del grupo, no de Baco Teatro)</li>
      <li><strong>Entre usuarios</strong> (actor a director, invitado a grupo)</li>
    </ul>
    <p>
      Baco Teatro <strong>solo registra</strong> las operaciones con fines de organización interna.
    </p>
    
    <h2>2. Responsabilidades del Director</h2>
    
    <p>El director de un grupo teatral es responsable de:</p>
    
    <h3>2.1 Validación de Pagos</h3>
    <ul>
      <li>Verificar que los pagos hayan ingresado realmente a la cuenta del grupo</li>
      <li>Aprobar o rechazar comprobantes de pago subidos por actores</li>
      <li>Validar pagos online realizados por transferencia</li>
    </ul>
    
    <h3>2.2 Cuentas Bancarias</h3>
    <ul>
      <li>Declarar cuentas bancarias correctamente</li>
      <li>Asegurar que las cuentas pertenezcan al grupo</li>
      <li>Mantener actualizada la información</li>
    </ul>
    
    <h3>2.3 Obligaciones Fiscales</h3>
    <ul>
      <li>Cumplir con todas las obligaciones fiscales según la ley uruguaya</li>
      <li>Facturar si corresponde</li>
      <li>Declarar ingresos ante DGI si aplica</li>
    </ul>
    <p>
      <strong>Baco Teatro no factura en nombre del grupo.</strong> Los reportes generados son documentos internos, 
      no comprobantes fiscales.
    </p>
    
    <h3>2.4 Gestión del Grupo</h3>
    <ul>
      <li>Administrar actores del grupo</li>
      <li>Crear y gestionar funciones</li>
      <li>Asignar tickets a actores</li>
      <li>Registrar gastos del grupo</li>
    </ul>
    
    <h2>3. Responsabilidades del Actor</h2>
    
    <p>El actor miembro de un grupo es responsable de:</p>
    
    <h3>3.1 Pago de Cuotas</h3>
    <ul>
      <li>Pagar cuotas en tiempo y forma</li>
      <li>Transferir a la cuenta declarada por el director</li>
      <li>Subir comprobante de pago correcto y legible</li>
      <li>Guardar el comprobante original</li>
    </ul>
    
    <h3>3.2 Venta de Tickets</h3>
    <ul>
      <li>Vender únicamente tickets asignados por el director</li>
      <li>Cobrar el precio establecido</li>
      <li>Reportar ventas correctamente en el sistema</li>
      <li>Entregar dinero al grupo según lo acordado</li>
    </ul>
    
    <h3>3.3 Uso del Sistema</h3>
    <ul>
      <li>Mantener sus datos actualizados</li>
      <li>No compartir credenciales de acceso</li>
      <li>Usar el sistema solo para fines legítimos</li>
    </ul>
    
    <h2>4. Responsabilidades del Invitado</h2>
    
    <p>El invitado (comprador de entrada) es responsable de:</p>
    
    <h3>4.1 Compra de Entrada</h3>
    <ul>
      <li>Pagar la entrada seleccionada</li>
      <li>Proporcionar datos correctos (nombre, email)</li>
      <li>Verificar cuenta bancaria antes de transferir</li>
    </ul>
    
    <h3>4.2 Uso de la Entrada</h3>
    <ul>
      <li>Presentar el QR recibido en la función</li>
      <li>No duplicar ni compartir el QR</li>
      <li>Llegar a horario</li>
    </ul>
    
    <h2>5. Limitación de Responsabilidad</h2>
    
    <div class="highlight-box">
      <p><strong>Baco Teatro NO se responsabiliza por:</strong></p>
    </div>
    
    <h3>5.1 Pagos No Validados</h3>
    <ul>
      <li>Pagos que el director no valide</li>
      <li>Errores en datos bancarios declarados por el director</li>
      <li>Transferencias a cuentas incorrectas</li>
      <li>Pagos no recibidos por el grupo</li>
    </ul>
    
    <h3>5.2 Uso Indebido</h3>
    <ul>
      <li>Fraudes entre usuarios</li>
      <li>Información falsa proporcionada por usuarios</li>
      <li>Uso del sistema para actividades ilegales</li>
    </ul>
    
    <h3>5.3 Obligaciones Fiscales</h3>
    <ul>
      <li>Incumplimientos fiscales de los grupos</li>
      <li>Falta de facturación por parte del grupo</li>
      <li>Problemas con DGI o BPS</li>
    </ul>
    
    <h3>5.4 Terceros</h3>
    <ul>
      <li>Fallas en MercadoPago (proveedor externo)</li>
      <li>Problemas bancarios</li>
      <li>Caída de servicios de terceros</li>
    </ul>
    
    <h3>5.5 Contenido de Usuarios</h3>
    <ul>
      <li>Contenido ofensivo o inapropiado subido por usuarios</li>
      <li>Comprobantes falsos</li>
      <li>Información errónea en perfiles</li>
    </ul>
    
    <h2>6. Privacidad</h2>
    
    <p>
      El manejo de datos personales está regulado por nuestra 
      <a href="/politica-privacidad.html">Política de Privacidad</a>, 
      que cumple con la Ley 18.331 de Protección de Datos Personales de Uruguay.
    </p>
    
    <h2>7. Propiedad Intelectual</h2>
    
    <h3>7.1 Del Sistema</h3>
    <p>
      Baco Teatro y su código fuente son propiedad de {{ nombre_responsable }}.
      Está prohibido copiar, modificar o distribuir el sistema sin autorización.
    </p>
    
    <h3>7.2 De los Usuarios</h3>
    <p>
      Los usuarios mantienen todos los derechos sobre:
    </p>
    <ul>
      <li>Nombres de obras</li>
      <li>Imágenes de funciones</li>
      <li>Contenido creado por ellos</li>
    </ul>
    <p>
      Al usar el sistema, otorgan a Baco Teatro una licencia no exclusiva para 
      mostrar ese contenido dentro de la plataforma.
    </p>
    
    <h2>8. Modificaciones</h2>
    
    <p>
      Baco Teatro puede modificar estos Términos y Condiciones en cualquier momento.
    </p>
    
    <h3>8.1 Notificación</h3>
    <ul>
      <li>Los cambios se notificarán por email</li>
      <li>Se publicará aviso en la página principal</li>
      <li>Se actualizará la fecha al inicio de este documento</li>
    </ul>
    
    <h3>8.2 Aceptación</h3>
    <p>
      El uso continuado del sistema después de la notificación implica aceptación de los nuevos términos.
    </p>
    
    <h3>8.3 Rechazo</h3>
    <p>
      Si no aceptás los nuevos términos, podés dejar de usar el sistema y solicitar 
      la eliminación de tu cuenta.
    </p>
    
    <h2>9. Suspensión y Terminación</h2>
    
    <h3>9.1 Por Parte de Baco Teatro</h3>
    <p>
      Baco Teatro puede suspender o eliminar cuentas que:
    </p>
    <ul>
      <li>Violen estos términos</li>
      <li>Usen el sistema de forma fraudulenta</li>
      <li>Generen contenido ofensivo</li>
      <li>Perjudiquen a otros usuarios</li>
    </ul>
    
    <h3>9.2 Por Parte del Usuario</h3>
    <p>
      Los usuarios pueden eliminar su cuenta en cualquier momento desde 
      Configuración → Eliminar Cuenta.
    </p>
    
    <h2>10. Ley Aplicable</h2>
    
    <p>
      Estos Términos y Condiciones se rigen por las leyes de la República Oriental del Uruguay.
    </p>
    <p>
      Cualquier disputa se resolverá en los tribunales de Montevideo, Uruguay.
    </p>
    
    <h2>11. Contacto</h2>
    
    <p>Para consultas sobre estos términos:</p>
    <ul>
      <li><strong>Email:</strong> contacto@bacoteatro.uy</li>
      <li><strong>Dirección:</strong> {{ direccion }}</li>
    </ul>
    
    <hr style="margin: 3rem 0;">
    
    <p style="text-align: center; color: #7f8c8d;">
      Al usar Baco Teatro, aceptás estos Términos y Condiciones.
    </p>
    
  </div>
  
  <footer>
    <a href="/">Volver al inicio</a>
  </footer>
</body>
</html>
```

---

## 📦 DELIVERABLE 2: politica-privacidad.html

### Ubicación:
```
frontend/public/politica-privacidad.html
```

### HTML:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidad - Baco Teatro</title>
  <link rel="stylesheet" href="../shared/styles.css">
  <style>
    .legal-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
    }
    .legal-content h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .legal-content h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }
    .legal-content h3 {
      font-size: 1.2rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #34495e;
    }
    .legal-content p {
      margin-bottom: 1rem;
    }
    .legal-content ul {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }
    .highlight-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    .important-box {
      background: #ffebee;
      border-left: 4px solid #f44336;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    table th {
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="legal-content">
    <h1>Política de Privacidad</h1>
    
    <p><strong>Última actualización:</strong> {{ fecha_actual }}</p>
    
    <div class="highlight-box">
      <p><strong>📌 Cumplimiento Legal:</strong></p>
      <p>Esta política cumple con la <strong>Ley 18.331 de Protección de Datos Personales</strong> de Uruguay.</p>
    </div>
    
    <h2>1. Responsable del Tratamiento de Datos</h2>
    
    <table>
      <tr>
        <th>Campo</th>
        <th>Información</th>
      </tr>
      <tr>
        <td>Responsable</td>
        <td>{{ nombre_responsable }}</td>
      </tr>
      <tr>
        <td>Email</td>
        <td>contacto@bacoteatro.uy</td>
      </tr>
      <tr>
        <td>Dirección</td>
        <td>{{ direccion }}</td>
      </tr>
      <tr>
        <td>Teléfono</td>
        <td>{{ telefono }}</td>
      </tr>
    </table>
    
    <h2>2. Datos Personales que Recopilamos</h2>
    
    <h3>2.1 Datos de Identificación</h3>
    <ul>
      <li><strong>Nombre completo:</strong> Para identificarte en el sistema</li>
      <li><strong>Email:</strong> Para login y notificaciones</li>
      <li><strong>Teléfono:</strong> Para contacto y recuperación de cuenta</li>
      <li><strong>Cédula de identidad:</strong> Para validación (solo si es necesario)</li>
      <li><strong>Fecha de nacimiento:</strong> Para verificar mayoría de edad</li>
    </ul>
    
    <h3>2.2 Datos Financieros</h3>
    <ul>
      <li><strong>Cuentas bancarias declaradas:</strong> Solo para directores (banco, número, CBU, alias)</li>
      <li><strong>Comprobantes de pago:</strong> Imágenes/PDFs subidos por actores</li>
      <li><strong>Historial de pagos:</strong> Registro de cuotas y tickets pagados</li>
    </ul>
    
    <h3>2.3 Datos de Uso</h3>
    <ul>
      <li><strong>Tickets comprados:</strong> Funciones, precios, fechas</li>
      <li><strong>Cuotas asignadas:</strong> Montos, vencimientos, estados</li>
      <li><strong>Acceso al sistema:</strong> IP, fecha/hora, navegador</li>
    </ul>
    
    <h3>2.4 Datos de Menores</h3>
    <p>
      Si el usuario es menor de 18 años, también recopilamos:
    </p>
    <ul>
      <li><strong>Datos del responsable legal:</strong> Nombre, email, teléfono, cédula</li>
      <li><strong>Consentimiento del responsable:</strong> Aceptación explícita</li>
    </ul>
    
    <h2>3. Base Legal para el Tratamiento</h2>
    
    <table>
      <tr>
        <th>Dato</th>
        <th>Base Legal</th>
      </tr>
      <tr>
        <td>Nombre, email, teléfono</td>
        <td>Consentimiento (al registrarte)</td>
      </tr>
      <tr>
        <td>Cédula de identidad</td>
        <td>Consentimiento explícito</td>
      </tr>
      <tr>
        <td>Historial de pagos</td>
        <td>Interés legítimo (auditoría interna)</td>
      </tr>
      <tr>
        <td>Comprobantes</td>
        <td>Interés legítimo (validación financiera)</td>
      </tr>
      <tr>
        <td>Acceso al sistema</td>
        <td>Interés legítimo (seguridad)</td>
      </tr>
    </table>
    
    <h2>4. Uso de los Datos</h2>
    
    <h3>4.1 Gestión de Usuarios</h3>
    <p>Usamos tus datos para:</p>
    <ul>
      <li>Crear y gestionar tu cuenta</li>
      <li>Autenticar tu acceso al sistema</li>
      <li>Asignarte roles (actor, director, etc.)</li>
      <li>Asociarte a grupos de teatro</li>
    </ul>
    
    <h3>4.2 Operaciones Financieras</h3>
    <p>Usamos tus datos para:</p>
    <ul>
      <li>Registrar cuotas y tickets</li>
      <li>Validar pagos (comprobantes)</li>
      <li>Generar reportes internos</li>
      <li>Llevar libro contable (CAJA)</li>
    </ul>
    
    <h3>4.3 Notificaciones</h3>
    <p>Usamos tu email para enviarte:</p>
    <ul>
      <li>Confirmación de compra de ticket</li>
      <li>QR de entrada</li>
      <li>Recordatorios de cuotas</li>
      <li>Cambios en funciones</li>
      <li>Actualizaciones del sistema</li>
    </ul>
    <p>
      Podés desactivar notificaciones no esenciales desde Configuración → Notificaciones.
    </p>
    
    <h3>4.4 Seguridad y Auditoría</h3>
    <p>Usamos logs de acceso para:</p>
    <ul>
      <li>Detectar actividad sospechosa</li>
      <li>Investigar fraudes</li>
      <li>Cumplir con obligaciones legales</li>
      <li>Resolver disputas</li>
    </ul>
    
    <h2>5. Compartir Datos con Terceros</h2>
    
    <div class="important-box">
      <p><strong>⚠️ IMPORTANTE:</strong></p>
      <p>Tus datos <strong>NO se venden ni se comparten con terceros</strong>, excepto en los siguientes casos:</p>
    </div>
    
    <h3>5.1 Con tu Grupo de Teatro</h3>
    <p>
      Si sos actor, tu director puede ver:
    </p>
    <ul>
      <li>Tu nombre y datos de contacto</li>
      <li>Tus cuotas (pagadas/pendientes)</li>
      <li>Tus tickets asignados y vendidos</li>
      <li>Comprobantes que hayas subido</li>
    </ul>
    <p>
      <strong>Esto es necesario</strong> para la gestión del grupo.
    </p>
    
    <h3>5.2 Con MercadoPago</h3>
    <p>
      Si elegís pagar con MercadoPago, compartimos:
    </p>
    <ul>
      <li>Tu nombre</li>
      <li>Tu email</li>
      <li>Monto del pago</li>
    </ul>
    <p>
      MercadoPago tiene su propia política de privacidad: 
      <a href="https://www.mercadopago.com.uy/privacidad" target="_blank">ver aquí</a>
    </p>
    
    <h3>5.3 Con Autoridades</h3>
    <p>
      Podemos compartir datos si:
    </p>
    <ul>
      <li>La ley lo exige (orden judicial)</li>
      <li>Hay investigación penal</li>
      <li>Es necesario para proteger derechos de terceros</li>
    </ul>
    
    <h2>6. Protección de Datos</h2>
    
    <h3>6.1 Medidas Técnicas</h3>
    <ul>
      <li><strong>Cifrado de contraseñas:</strong> Usamos bcrypt (no guardamos contraseñas en texto plano)</li>
      <li><strong>HTTPS:</strong> Todas las comunicaciones cifradas</li>
      <li><strong>Autenticación por token:</strong> JWT para sesiones seguras</li>
      <li><strong>Permisos por rol:</strong> Actor solo ve sus datos, director solo ve su grupo</li>
    </ul>
    
    <h3>6.2 Medidas Organizativas</h3>
    <ul>
      <li><strong>Acceso restringido:</strong> Solo personal autorizado</li>
      <li><strong>Auditoría:</strong> Logs de todos los accesos a datos sensibles</li>
      <li><strong>Respaldos:</strong> Backups diarios encriptados</li>
    </ul>
    
    <h3>6.3 Retención de Datos</h3>
    <p>
      Conservamos tus datos:
    </p>
    <ul>
      <li><strong>Datos de usuario:</strong> Mientras tu cuenta esté activa</li>
      <li><strong>Historial financiero:</strong> 5 años (por obligaciones contables)</li>
      <li><strong>Logs de acceso:</strong> 1 año</li>
    </ul>
    <p>
      Después de esos períodos, los datos se eliminan o anonimizan.
    </p>
    
    <h2>7. Tus Derechos (Ley 18.331)</h2>
    
    <div class="highlight-box">
      <p><strong>📌 Tenés derecho a:</strong></p>
    </div>
    
    <h3>7.1 Derecho de Acceso</h3>
    <p>
      Podés solicitar una copia de todos tus datos personales que tenemos.
    </p>
    <p>
      <strong>Cómo:</strong> Enviá un email a contacto@bacoteatro.uy con asunto "Solicitud de Acceso".
    </p>
    
    <h3>7.2 Derecho de Rectificación</h3>
    <p>
      Podés corregir datos incorrectos o desactualizados.
    </p>
    <p>
      <strong>Cómo:</strong> Desde Configuración → Editar Perfil, o contactándonos por email.
    </p>
    
    <h3>7.3 Derecho de Eliminación</h3>
    <p>
      Podés solicitar la eliminación de tus datos personales.
    </p>
    <p>
      <strong>Excepciones:</strong> No podemos eliminar datos si:
    </p>
    <ul>
      <li>Hay obligación legal de conservarlos (ej: historial financiero)</li>
      <li>Son necesarios para resolver una disputa en curso</li>
    </ul>
    <p>
      <strong>Cómo:</strong> Desde Configuración → Eliminar Cuenta, o por email.
    </p>
    
    <h3>7.4 Derecho de Oposición</h3>
    <p>
      Podés oponerte al uso de tus datos para:
    </p>
    <ul>
      <li>Marketing (si lo implementamos en el futuro)</li>
      <li>Análisis estadísticos</li>
    </ul>
    <p>
      <strong>No podés oponerte</strong> al uso necesario para el funcionamiento del sistema 
      (ej: registro de pagos).
    </p>
    
    <h3>7.5 Derecho de Portabilidad</h3>
    <p>
      Podés solicitar tus datos en formato estructurado (CSV, JSON) para transferir a otro sistema.
    </p>
    <p>
      <strong>Cómo:</strong> Envía email con asunto "Solicitud de Portabilidad".
    </p>
    
    <h3>7.6 Revocar Consentimiento</h3>
    <p>
      Podés revocar el consentimiento que diste al registrarte.
    </p>
    <p>
      <strong>Consecuencia:</strong> Tu cuenta será eliminada y no podrás usar el sistema.
    </p>
    
    <h2>8. Cookies y Tecnologías Similares</h2>
    
    <h3>8.1 Cookies que Usamos</h3>
    <table>
      <tr>
        <th>Cookie</th>
        <th>Propósito</th>
        <th>Duración</th>
      </tr>
      <tr>
        <td>auth_token</td>
        <td>Mantener sesión iniciada</td>
        <td>7 días</td>
      </tr>
      <tr>
        <td>user_preferences</td>
        <td>Recordar configuración (idioma, tema)</td>
        <td>30 días</td>
      </tr>
    </table>
    
    <h3>8.2 Gestionar Cookies</h3>
    <p>
      Podés eliminar cookies desde tu navegador:
    </p>
    <ul>
      <li>Chrome: Configuración → Privacidad → Borrar datos</li>
      <li>Firefox: Opciones → Privacidad → Borrar historial</li>
      <li>Safari: Preferencias → Privacidad → Gestionar datos</li>
    </ul>
    
    <h2>9. Transferencias Internacionales</h2>
    
    <p>
      Tus datos se almacenan en servidores ubicados en:
    </p>
    <ul>
      <li>{{ ubicacion_servidor }}</li>
    </ul>
    <p>
      Si los servidores están fuera de Uruguay, aseguramos que el país tenga 
      nivel de protección adecuado o usamos cláusulas contractuales estándar.
    </p>
    
    <h2>10. Menores de Edad</h2>
    
    <div class="important-box">
      <p><strong>⚠️ Atención:</strong></p>
      <p>Si tenés menos de 18 años, un responsable legal debe registrarte y dar consentimiento.</p>
    </div>
    
    <p>
      El responsable legal es responsable de:
    </p>
    <ul>
      <li>Supervisar el uso que el menor hace del sistema</li>
      <li>Gestionar datos del menor</li>
      <li>Ejercer derechos del menor (acceso, rectificación, eliminación)</li>
    </ul>
    
    <h2>11. Cambios en esta Política</h2>
    
    <p>
      Podemos actualizar esta política en cualquier momento.
    </p>
    
    <h3>11.1 Notificación</h3>
    <ul>
      <li>Te enviaremos un email</li>
      <li>Publicaremos aviso en la página principal</li>
      <li>Actualizaremos la fecha al inicio de este documento</li>
    </ul>
    
    <h3>11.2 Aceptación</h3>
    <p>
      El uso continuado del sistema después de la notificación implica aceptación.
    </p>
    
    <h2>12. Contacto y Consultas</h2>
    
    <p>
      Para ejercer tus derechos o consultas sobre privacidad:
    </p>
    
    <table>
      <tr>
        <th>Medio</th>
        <th>Información</th>
      </tr>
      <tr>
        <td>Email</td>
        <td>contacto@bacoteatro.uy</td>
      </tr>
      <tr>
        <td>Dirección</td>
        <td>{{ direccion }}</td>
      </tr>
      <tr>
        <td>Teléfono</td>
        <td>{{ telefono }}</td>
      </tr>
    </table>
    
    <p>
      <strong>Tiempo de respuesta:</strong> Máximo 15 días hábiles.
    </p>
    
    <h2>13. Autoridad de Control</h2>
    
    <p>
      Si considerás que se han violado tus derechos, podés presentar reclamo ante:
    </p>
    
    <div class="highlight-box">
      <p><strong>Unidad Reguladora y de Control de Datos Personales (URCDP)</strong></p>
      <ul>
        <li>Web: <a href="https://www.gub.uy/unidad-reguladora-control-datos-personales/" target="_blank">www.gub.uy/urcdp</a></li>
        <li>Email: urcdp@agesic.gub.uy</li>
        <li>Teléfono: 2901 2929</li>
      </ul>
    </div>
    
    <hr style="margin: 3rem 0;">
    
    <p style="text-align: center; color: #7f8c8d;">
      Al usar Baco Teatro, aceptás esta Política de Privacidad.
    </p>
    
  </div>
  
  <footer>
    <a href="/">Volver al inicio</a>
  </footer>
</body>
</html>
```

---

## 📦 DELIVERABLE 3: disclaimers.js (Textos Reutilizables)

### Ubicación:
```
frontend/shared/disclaimers.js
```

### JavaScript:
```js
// Textos legales reutilizables en toda la UI

export const DISCLAIMERS = {
  // Sistema no procesa pagos
  SISTEMA_NO_PROCESA: `
    ⚠️ IMPORTANTE: Baco Teatro no procesa ni retiene dinero.
    Los pagos se realizan directamente a cuentas del grupo.
    Solo registramos operaciones con fines de organización interna.
  `,
  
  // Cuenta bancaria declarada por director
  CUENTA_DECLARADA: `
    ⚠️ Cuenta declarada por el director del grupo.
    Verificá siempre antes de transferir.
    El director es responsable de esta información.
  `,
  
  // Responsabilidad del director al validar
  DIRECTOR_VALIDA: `
    ⚠️ RESPONSABILIDAD: Como director, sos responsable de validar
    que el pago haya ingresado realmente a la cuenta del grupo.
    El sistema registra tu decisión con fines de auditoría.
  `,
  
  // Antes de pagar con MercadoPago
  MERCADOPAGO_REDIRECT: `
    Serás redirigido a MercadoPago para completar el pago.
    El pago se realizará a la cuenta del grupo.
    Baco Teatro no procesa ni retiene tu dinero.
  `,
  
  // Reporte interno (no factura)
  REPORTE_INTERNO: `
    ⚠️ DOCUMENTO INTERNO: Este reporte es un registro interno de operaciones.
    No constituye factura ni comprobante fiscal.
    Sos responsable de cumplir las obligaciones fiscales según la ley.
  `,
  
  // Actor sube comprobante
  ACTOR_COMPROBANTE: `
    ⚠️ El director validará tu comprobante.
    Asegurate de que la transferencia sea a la cuenta correcta del grupo.
    Guardá el comprobante original.
  `,
  
  // Invitado compra ticket
  INVITADO_COMPRA: `
    El pago se realiza directamente a la cuenta del grupo.
    El director validará y recibirás tu entrada por email.
  `,
  
  // Footer de todas las páginas
  FOOTER: `
    Baco Teatro es una herramienta de gestión. No procesamos pagos.
  `
};

// Función para mostrar disclaimer en la UI
export function mostrarDisclaimer(tipo, contenedor) {
  const texto = DISCLAIMERS[tipo];
  if (!texto) {
    console.warn(`Disclaimer '${tipo}' no encontrado`);
    return;
  }
  
  const div = document.createElement('div');
  div.className = 'disclaimer-box';
  div.innerHTML = `<p>${texto.trim()}</p>`;
  
  contenedor.insertBefore(div, contenedor.firstChild);
}
```

---

## 📦 DELIVERABLE 4: auditoria.sql (Tabla de Auditoría)

### Ubicación:
```
teatro-tickets-backend/migrations/auditoria.sql
```

### SQL:
```sql
-- =============================================
-- TABLA DE AUDITORÍA
-- =============================================

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id INTEGER,
  accion VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
  usuario_id INTEGER REFERENCES usuarios(id),
  ip_address VARCHAR(45),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_auditoria_tabla (tabla),
  INDEX idx_auditoria_usuario (usuario_id),
  INDEX idx_auditoria_fecha (fecha)
);

-- =============================================
-- FUNCIÓN TRIGGER PARA AUDITORÍA
-- =============================================

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- APLICAR TRIGGERS A TABLAS CRÍTICAS
-- =============================================

-- Cuentas bancarias
DROP TRIGGER IF EXISTS audit_cuentas_bancarias ON cuentas_bancarias;
CREATE TRIGGER audit_cuentas_bancarias
AFTER INSERT OR UPDATE OR DELETE ON cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- Usuarios
DROP TRIGGER IF EXISTS audit_usuarios ON usuarios;
CREATE TRIGGER audit_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- CAJA (movimientos financieros)
DROP TRIGGER IF EXISTS audit_caja ON caja;
CREATE TRIGGER audit_caja
AFTER INSERT OR UPDATE OR DELETE ON caja
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- Comprobantes
DROP TRIGGER IF EXISTS audit_comprobantes ON comprobantes;
CREATE TRIGGER audit_comprobantes
AFTER INSERT OR UPDATE OR DELETE ON comprobantes
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- Intenciones de pago
DROP TRIGGER IF EXISTS audit_intenciones_pago ON intenciones_pago;
CREATE TRIGGER audit_intenciones_pago
AFTER INSERT OR UPDATE OR DELETE ON intenciones_pago
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- =============================================
-- CONSULTAS ÚTILES
-- =============================================

-- Ver auditoría de un usuario específico
-- SELECT * FROM auditoria WHERE usuario_id = 5 ORDER BY fecha DESC LIMIT 20;

-- Ver cambios en cuentas bancarias
-- SELECT * FROM auditoria WHERE tabla = 'cuentas_bancarias' ORDER BY fecha DESC;

-- Ver quién modificó un registro específico
-- SELECT * FROM auditoria WHERE tabla = 'cuentas_bancarias' AND registro_id = 10;
```

---

## 📦 DELIVERABLE 5: Agregar checkboxes en registro

### Archivo:
```
frontend/public/registro.html (o crear si no existe)
```

### HTML (ejemplo):
```html
<form id="registro">
  <h1>Crear Cuenta</h1>
  
  <!-- Campos normales -->
  <div class="form-group">
    <label>Nombre completo:</label>
    <input type="text" name="nombre" required>
  </div>
  
  <div class="form-group">
    <label>Email:</label>
    <input type="email" name="email" required>
  </div>
  
  <div class="form-group">
    <label>Contraseña:</label>
    <input type="password" name="password" required minlength="8">
  </div>
  
  <div class="form-group">
    <label>Fecha de nacimiento:</label>
    <input type="date" name="fecha_nacimiento" required id="fecha_nacimiento">
  </div>
  
  <!-- Responsable legal (si es menor) -->
  <div id="responsable-legal" style="display:none;">
    <h3>Responsable Legal (requerido para menores de 18 años)</h3>
    <div class="form-group">
      <label>Nombre del responsable:</label>
      <input type="text" name="responsable_nombre">
    </div>
    <div class="form-group">
      <label>Email del responsable:</label>
      <input type="email" name="responsable_email">
    </div>
    <div class="form-group">
      <label>Cédula del responsable:</label>
      <input type="text" name="responsable_cedula">
    </div>
  </div>
  
  <!-- Checkboxes legales (OBLIGATORIOS) -->
  <div class="legal-checkboxes">
    <label class="checkbox-label">
      <input type="checkbox" name="acepta_terminos" required>
      He leído y acepto los 
      <a href="/terminos-y-condiciones.html" target="_blank">Términos y Condiciones</a>
    </label>
    
    <label class="checkbox-label">
      <input type="checkbox" name="acepta_privacidad" required>
      He leído y acepto la 
      <a href="/politica-privacidad.html" target="_blank">Política de Privacidad</a>
    </label>
    
    <label class="checkbox-label" id="mayor-edad-checkbox">
      <input type="checkbox" name="mayor_edad" required>
      Confirmo que soy mayor de 18 años
      (Si sos menor, un responsable legal debe aceptar por vos)
    </label>
  </div>
  
  <button type="submit" class="btn-primary">Crear Cuenta</button>
</form>

<script>
// Detectar si es menor de edad
document.getElementById('fecha_nacimiento').addEventListener('change', (e) => {
  const fecha = new Date(e.target.value);
  const hoy = new Date();
  const edad = Math.floor((hoy - fecha) / (365.25 * 24 * 60 * 60 * 1000));
  
  const responsableDiv = document.getElementById('responsable-legal');
  const mayorEdadCheckbox = document.getElementById('mayor-edad-checkbox');
  
  if (edad < 18) {
    responsableDiv.style.display = 'block';
    responsableDiv.querySelectorAll('input').forEach(input => {
      input.required = true;
    });
    mayorEdadCheckbox.style.display = 'none';
  } else {
    responsableDiv.style.display = 'none';
    responsableDiv.querySelectorAll('input').forEach(input => {
      input.required = false;
    });
    mayorEdadCheckbox.style.display = 'block';
  }
});
</script>
```

---

## 📦 DELIVERABLE 6: Agregar disclaimer en comprar ticket

### Archivo:
```
frontend/public/comprar-ticket.html
```

### Agregar antes del formulario de pago:
```html
<div class="disclaimer-box">
  <h3>⚠️ IMPORTANTE</h3>
  <p>
    El pago se realiza directamente a la cuenta del grupo {{ grupo_nombre }}.
    Baco Teatro no procesa ni retiene tu dinero.
    Solo registramos la operación para control interno.
  </p>
</div>

<!-- Resto del formulario -->
```

---

## 📦 DELIVERABLE 7: Agregar disclaimer en validar pagos

### Archivo:
```
frontend/director/validar-pagos.html
```

### Agregar al inicio:
```html
<div class="disclaimer-box disclaimer-warning">
  <h3>⚠️ RESPONSABILIDAD DEL DIRECTOR</h3>
  <p>
    Como director, sos responsable de validar que el pago haya ingresado 
    realmente a la cuenta del grupo.
  </p>
  <p>
    El sistema registra tu decisión con fines de auditoría.
  </p>
</div>
```

---

## 📦 DELIVERABLE 8: Agregar disclaimer en configurar cuentas

### Archivo:
```
frontend/director/configuracion-financiera.html
```

### Agregar antes del formulario:
```html
<div class="disclaimer-box">
  <h3>⚠️ DECLARACIÓN DE CUENTA BANCARIA</h3>
  <p>
    Declarás bajo tu responsabilidad que esta cuenta bancaria pertenece 
    al grupo y está autorizada para recibir pagos.
  </p>
  <p>
    Baco Teatro solo almacena la información que vos proporcionás.
    No verificamos ni validamos cuentas bancarias.
  </p>
</div>
```

---

## 📦 DELIVERABLE 9: Footer en todas las páginas

### Archivo:
```
frontend/shared/footer.html (crear si no existe)
```

### HTML:
```html
<footer class="site-footer">
  <div class="footer-content">
    <div class="footer-links">
      <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>
      <span>|</span>
      <a href="/politica-privacidad.html">Política de Privacidad</a>
      <span>|</span>
      <a href="/sobre-nosotros.html">Sobre Nosotros</a>
      <span>|</span>
      <a href="mailto:contacto@bacoteatro.uy">Contacto</a>
    </div>
    <div class="footer-disclaimer">
      <p>Baco Teatro es una herramienta de gestión. No procesamos pagos.</p>
    </div>
    <div class="footer-copyright">
      <p>&copy; 2026 Baco Teatro. Todos los derechos reservados.</p>
    </div>
  </div>
</footer>

<style>
.site-footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 2rem 0;
  margin-top: 4rem;
  text-align: center;
}

.footer-links a {
  color: #3498db;
  text-decoration: none;
  margin: 0 0.5rem;
}

.footer-links a:hover {
  text-decoration: underline;
}

.footer-disclaimer {
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.footer-copyright {
  font-size: 0.8rem;
  color: #95a5a6;
}
</style>
```

---

## 📦 DELIVERABLE 10: Estilos para disclaimers

### Archivo:
```
frontend/shared/styles.css
```

### Agregar CSS:
```css
/* ========================================= */
/* DISCLAIMERS Y AVISOS LEGALES */
/* ========================================= */

.disclaimer-box {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 4px;
}

.disclaimer-box h3 {
  margin-top: 0;
  font-size: 1.1rem;
  color: #856404;
}

.disclaimer-box p {
  margin-bottom: 0.5rem;
  color: #856404;
}

.disclaimer-box p:last-child {
  margin-bottom: 0;
}

/* Disclaimer de advertencia (más grave) */
.disclaimer-warning {
  background: #ffebee;
  border-left-color: #f44336;
}

.disclaimer-warning h3,
.disclaimer-warning p {
  color: #c62828;
}

/* Disclaimer informativo (menos grave) */
.disclaimer-info {
  background: #e3f2fd;
  border-left-color: #2196f3;
}

.disclaimer-info h3,
.disclaimer-info p {
  color: #1565c0;
}

/* Cuenta bancaria con disclaimer */
.cuenta-disclaimer {
  border: 2px solid #ffc107;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.cuenta-disclaimer strong {
  color: #f57c00;
}

/* Checkboxes legales */
.legal-checkboxes {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 1.5rem;
  border-radius: 4px;
  margin: 1.5rem 0;
}

.checkbox-label {
  display: block;
  margin-bottom: 1rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 0.5rem;
  width: 18px;
  height: 18px;
  vertical-align: middle;
}

.checkbox-label a {
  color: #2196f3;
  text-decoration: none;
  font-weight: 500;
}

.checkbox-label a:hover {
  text-decoration: underline;
}
```

---

## ✅ CHECKLIST FINAL

### Archivos creados
- [ ] `frontend/public/terminos-y-condiciones.html`
- [ ] `frontend/public/politica-privacidad.html`
- [ ] `frontend/shared/disclaimers.js`
- [ ] `teatro-tickets-backend/migrations/auditoria.sql`
- [ ] `frontend/shared/footer.html`

### Modificaciones en archivos existentes
- [ ] `frontend/public/registro.html` - Checkboxes legales
- [ ] `frontend/public/comprar-ticket.html` - Disclaimer
- [ ] `frontend/director/validar-pagos.html` - Disclaimer
- [ ] `frontend/director/configuracion-financiera.html` - Disclaimer
- [ ] `frontend/shared/styles.css` - Estilos disclaimers
- [ ] Todas las páginas - Incluir footer

### Base de datos
- [ ] Ejecutar `auditoria.sql` en PostgreSQL
- [ ] Verificar triggers funcionando
- [ ] Probar logs de auditoría

### Verificaciones
- [ ] Links "Términos y Condiciones" funcionan en todas las páginas
- [ ] Links "Política de Privacidad" funcionan en todas las páginas
- [ ] Checkboxes obligatorios en registro
- [ ] Disclaimers visibles donde corresponde
- [ ] Footer en todas las páginas públicas
- [ ] Tabla auditoria registrando cambios

---

## 🎯 RESULTADO ESPERADO

Después de implementar:

**Sistema protegido:**
- ✅ Términos y condiciones publicados
- ✅ Política de privacidad (Ley 18.331)
- ✅ Disclaimers en toda la UI
- ✅ Auditoría completa funcionando
- ✅ Responsabilidades claras

**Usuarios informados:**
- ✅ Saben que el sistema no procesa pagos
- ✅ Saben quién es responsable de qué
- ✅ Aceptan términos explícitamente
- ✅ Conocen sus derechos

**Legalmente impecable:**
- ✅ Cumple Ley 18.331
- ✅ Protege al creador
- ✅ Protege al director
- ✅ Auditable externamente

---

## 💎 PRINCIPIO A RECORDAR

> **"Tu sistema es una HERRAMIENTA, no un PROCESADOR.
> Director es RESPONSABLE, sistema solo REGISTRA."**

---

**¡LISTO PARA EJECUTAR!**

Copiá este prompt completo en Copilot Chat y esperá 60-90 segundos.
