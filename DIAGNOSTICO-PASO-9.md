# 🇺🇾 PASO 9 — CHECKLIST LEGAL + CONTABLE — DIAGNÓSTICO

## 🎯 EL PROBLEMA REAL

**Situación:**
- Tenés un sistema técnicamente impecable (PASO 1-8 ✅)
- Funciona, es auditable, es profesional
- Pero... ¿está protegido legalmente?

**Preguntas sin respuesta:**
- ¿Quién es responsable si hay un problema con un pago?
- ¿Qué pasa si el sistema se usa mal?
- ¿Cómo protegés al director?
- ¿Cómo te protegés VOS como creador?
- ¿Cumple con las leyes de Uruguay?
- ¿Qué pasa con los datos personales?

**Síntoma visible:**
Sistema funciona bien técnicamente, pero legalmente es una bomba de tiempo.

**Consecuencia:**
Problemas legales, responsabilidad solidaria, multas, quilombos.

---

## 🧠 PRINCIPIO FUNDAMENTAL

> **Tu sistema NO es el dueño de la plata.
> Tu sistema es una HERRAMIENTA de gestión.**

### ¿Qué significa esto?

**❌ MAL (Sistema como responsable):**
```
"Baco Teatro procesa tu pago"
"Baco Teatro retiene el dinero"
"Baco Teatro factura tu entrada"
```

**Problemas:**
- Responsabilidad legal tuya
- Necesitarías licencias
- Necesitarías contadores
- Pasarías a ser procesador de pagos
- Regulaciones bancarias

**✅ BIEN (Sistema como herramienta):**
```
"Baco Teatro registra operaciones entre usuarios"
"Los pagos se realizan directamente a cuentas del grupo"
"El director es responsable de validar pagos"
"Baco Teatro es una plataforma de gestión"
```

**Por qué funciona:**
- Responsabilidad clara (director/grupo)
- Sistema = intermediario técnico
- No procesás pagos, los REGISTRÁS
- Legalmente protegido

---

## 📚 ANALOGÍA CLARA (IMPORTANTE)

Tu sistema es como:

| Es como | NO es como |
|---------|------------|
| Excel con inteligencia | Un banco |
| Google Calendar compartido | Una procesadora de pagos |
| Trello para teatro | MercadoLibre |
| Sistema de gestión | Sistema de facturación |

📌 **Tu sistema AYUDA a gestionar.
No REEMPLAZA responsabilidades legales.**

---

## 🗂️ 10 PUNTOS LEGALES CRÍTICOS

### 1️⃣ QUIÉN ES QUIÉN (RESPONSABILIDADES)

**Definir claramente:**

| Rol | Responsabilidad Legal | Responsabilidad Técnica |
|-----|----------------------|-------------------------|
| **Director** | Validar pagos, facturar (si aplica), cuentas bancarias, cumplimiento fiscal | Usar el sistema correctamente |
| **Grupo** | Cuentas bancarias colectivas, cuotas de actores | Declarar cuentas en el sistema |
| **Actor** | Pagar cuotas, vender tickets asignados, reportar ventas | Subir comprobantes, usar el sistema |
| **Invitado** | Pagar entrada, usar QR | Comprar online |
| **Baco Teatro** | Mantener sistema funcionando, proteger datos | Registrar operaciones, generar reportes |

**Texto clave para el sistema:**

```
"Baco Teatro es una herramienta de gestión.
El responsable legal de todas las operaciones financieras es el director del grupo.
El sistema solo registra y facilita la organización."
```

---

### 2️⃣ TÉRMINOS Y CONDICIONES (OBLIGATORIOS)

**Archivo:** `frontend/public/terminos-y-condiciones.html`

**Debe cubrir:**

#### A. Naturaleza del servicio
```
Baco Teatro es una plataforma de gestión para grupos de teatro.
No procesamos pagos. No retenemos dinero.
No somos intermediarios financieros.
```

#### B. Responsabilidades del usuario
```
El director es responsable de:
- Validar pagos recibidos
- Cumplir obligaciones fiscales
- Declarar cuentas bancarias correctamente
- Facturar si corresponde según la ley

El actor es responsable de:
- Pagar cuotas en tiempo y forma
- Reportar ventas de tickets correctamente
- Entregar dinero al grupo cuando venda

El invitado es responsable de:
- Pagar la entrada seleccionada
- Usar el QR recibido
```

#### C. Limitación de responsabilidad
```
Baco Teatro no se responsabiliza por:
- Pagos no validados por el director
- Errores en datos bancarios declarados
- Uso indebido del sistema
- Incumplimientos fiscales de los grupos
```

#### D. Privacidad
```
Los datos personales se procesan según nuestra Política de Privacidad.
Ver: /politica-privacidad.html
```

#### E. Modificaciones
```
Baco Teatro puede modificar estos términos con previo aviso.
El uso continuado implica aceptación.
```

**Ubicación en el sistema:**
- Footer de todas las páginas públicas
- Checkbox en registro de usuario
- Link en pantalla de pago

---

### 3️⃣ POLÍTICA DE PRIVACIDAD (Ley 18.331 Uruguay)

**Archivo:** `frontend/public/politica-privacidad.html`

**Ley 18.331 dice:**
- Datos personales deben tener consentimiento
- Usuario puede pedir acceso, corrección, eliminación
- Datos deben estar protegidos
- Debe haber responsable de datos

**Tu sistema almacena:**

| Dato | Uso | Base legal |
|------|-----|------------|
| Nombre | Identificación usuario | Consentimiento |
| Email | Login, notificaciones | Consentimiento |
| Teléfono | Contacto, recuperación | Consentimiento |
| Cédula | Validación identidad | Consentimiento |
| Comprobantes de pago | Auditoría financiera | Interés legítimo |
| Historial tickets | Registro operaciones | Interés legítimo |

**Debe cubrir:**

#### A. Datos recopilados
```
Recopilamos:
- Datos de identificación (nombre, email, teléfono, cédula)
- Datos financieros (cuentas bancarias declaradas, comprobantes)
- Datos de uso (tickets comprados, funciones, cuotas)
```

#### B. Uso de datos
```
Los datos se usan para:
- Gestionar usuarios y grupos
- Registrar operaciones financieras
- Generar reportes internos
- Enviar notificaciones
- Cumplir obligaciones legales
```

#### C. Compartir datos
```
Los datos NO se comparten con terceros, excepto:
- Con tu grupo de teatro (si sos actor)
- Con autoridades si la ley lo exige
- Con MercadoPago (solo datos necesarios para pagos)
```

#### D. Protección
```
Tus datos están protegidos con:
- Cifrado de contraseñas (bcrypt)
- Acceso restringido por rol
- Servidores seguros
- Auditoría de accesos
```

#### E. Tus derechos (Ley 18.331)
```
Tenés derecho a:
- Acceder a tus datos
- Corregir datos incorrectos
- Solicitar eliminación
- Revocar consentimiento

Para ejercer tus derechos, contactá a: contacto@bacoteatro.uy
```

#### F. Responsable de datos
```
Responsable: [Nombre del creador/empresa]
Email: contacto@bacoteatro.uy
Dirección: [Dirección en Uruguay]
```

**Ubicación en el sistema:**
- Footer de todas las páginas
- Checkbox en registro
- Link en configuración de perfil

---

### 4️⃣ FACTURACIÓN (MUY IMPORTANTE)

**Regla de oro:**

> **Tu sistema NO factura.**

**Por qué:**
- No sabés si el grupo factura
- No sabés si es informal, asociación, empresa
- No tenés RUT del grupo
- No tenés responsabilidad fiscal

**Qué SÍ hacés:**
- Generás REPORTES internos
- Generás RESÚMENES de movimientos
- Generás COMPROBANTES internos (no fiscales)

**Terminología correcta:**

| ❌ NUNCA uses | ✅ SÍ usa |
|---------------|-----------|
| Factura | Registro interno |
| Factura electrónica | Resumen de operación |
| IVA | (no mencionar) |
| RUT | (no mencionar) |
| Comprobante fiscal | Comprobante interno |
| CFE | Liquidación interna |

**En reportes PDF:**

```
┌─────────────────────────────────────┐
│ REGISTRO INTERNO                    │
│ (No válido como comprobante fiscal) │
├─────────────────────────────────────┤
│ Grupo: Teatro La Esquina            │
│ Función: Hamlet 15/01/2026          │
│ ...                                 │
└─────────────────────────────────────┘
```

**Texto obligatorio en PDFs:**
```
"Este documento es un registro interno de operaciones.
No constituye factura ni comprobante fiscal.
El director es responsable de cumplir obligaciones fiscales."
```

---

### 5️⃣ CUENTAS BANCARIAS (PROTECCIÓN LEGAL)

**En TODO el sistema, donde se muestre cuenta bancaria:**

**❌ NUNCA:**
```
"Cuenta oficial de Baco Teatro"
"Cuenta del sistema"
"Transferí a esta cuenta"
```

**✅ SIEMPRE:**
```
"Cuenta declarada por el director del grupo"
"Cuenta informada por: Teatro La Esquina"
"El director es responsable de esta información"
```

**En la UI:**

```html
<div class="cuenta-bancaria">
  <p class="disclaimer">
    ⚠️ Cuenta declarada por el director del grupo.
    Verificá siempre antes de transferir.
  </p>
  <p>Banco: Nación</p>
  <p>Cuenta: 1234567890</p>
  <p>Alias: teatro.esquina</p>
</div>
```

**En base de datos:**

```sql
-- Campo responsable
CREATE TABLE cuentas_bancarias (
  ...
  declarada_por INTEGER REFERENCES usuarios(id),
  fecha_declaracion TIMESTAMP DEFAULT NOW(),
  ...
);
```

**Esto evita:**
- Responsabilidad solidaria
- Quilombos legales si hay fraude
- Confusión sobre quién es el dueño

---

### 6️⃣ PASARELAS DE PAGO (MERCADOPAGO)

**Cuando integres MercadoPago:**

**Estructura legal:**

```
Invitado → [Baco Teatro (redirect)] → MercadoPago → Cuenta del GRUPO
                                                    (no tuya)
```

**Textos obligatorios:**

**Antes de pagar:**
```
"Serás redirigido a MercadoPago para completar el pago.
El pago se realizará a la cuenta del grupo Teatro La Esquina.
Baco Teatro no procesa ni retiene tu dinero."
```

**En pantalla de confirmación:**
```
"El pago fue procesado por MercadoPago.
El dinero fue depositado en la cuenta del grupo.
Baco Teatro registró la operación para control interno."
```

**En MercadoPago:**
- **Comerciante:** Teatro La Esquina (no Baco Teatro)
- **Access Token:** del director del grupo
- **Webhook:** recibe confirmación, registra en CAJA

**Responsabilidades:**

| Rol | Responsabilidad |
|-----|-----------------|
| MercadoPago | Procesar pago, seguridad, devoluciones |
| Grupo/Director | Recibir dinero, facturar si corresponde |
| Baco Teatro | Registrar operación, generar QR, auditoría |

**Esto es CRÍTICO para estar protegido legalmente.**

---

### 7️⃣ MENORES DE EDAD (CUIDADO ESPECIAL)

**Si hay actores menores de 18:**

**Datos bancarios:**
- ❌ No guardes cuenta bancaria del menor
- ✅ Asociá cuota al responsable legal

**Cuotas:**
```sql
CREATE TABLE cuotas (
  ...
  actor_id INTEGER,
  responsable_legal_id INTEGER, -- Si es menor
  ...
);
```

**Comprobantes:**
- Si actor es menor, comprobante debe ser del responsable

**Consentimiento:**
- Menor no puede aceptar términos
- Debe aceptar responsable legal

**En registro:**
```html
<form>
  <label>Fecha de nacimiento:</label>
  <input type="date" id="fecha_nacimiento">
  
  <!-- Si fecha < 18 años -->
  <div id="responsable-legal" style="display:none;">
    <h3>Responsable Legal (requerido para menores)</h3>
    <input type="text" name="responsable_nombre" required>
    <input type="email" name="responsable_email" required>
    <input type="tel" name="responsable_tel" required>
    <input type="text" name="responsable_cedula" required>
  </div>
</form>
```

**Ley uruguaya:**
- Menores pueden actuar
- Pero contratos/dinero requieren responsable

---

### 8️⃣ LOGS Y AUDITORÍA (TE SALVA LEGALMENTE)

**Por qué es crítico:**

Si hay disputa legal:
- "¿Quién aprobó este pago?"
- "¿Cuándo se modificó este dato?"
- "¿Quién accedió a esta información?"

**Tu respuesta:**
```
"El sistema tiene auditoría completa.
Todos los cambios están registrados con fecha, hora y usuario."
```

**Tablas de auditoría existentes:**

```sql
-- Ya lo tenés en PASO 5
CREATE TABLE caja (
  ...
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  ...
);

-- Estados de tickets
CREATE TABLE ticket_movimientos (
  ticket_id INTEGER,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  usuario_id INTEGER,
  fecha TIMESTAMP DEFAULT NOW()
);
```

**Agregar tabla de auditoría general:**

```sql
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100),
  registro_id INTEGER,
  accion VARCHAR(50), -- INSERT, UPDATE, DELETE
  usuario_id INTEGER REFERENCES usuarios(id),
  ip_address VARCHAR(45),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha TIMESTAMP DEFAULT NOW()
);
```

**Trigger automático:**

```sql
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER audit_cuentas_bancarias
AFTER UPDATE ON cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER audit_usuarios
AFTER UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
```

**Esto:**
- Te protege legalmente
- Protege al director
- Permite investigar fraudes
- Es evidencia ante justicia

---

### 9️⃣ TEXTOS CLAVE EN LA UI (SÍ O SÍ)

**Ubicaciones y textos obligatorios:**

#### En pantalla de pago (invitado):
```
⚠️ IMPORTANTE:
El pago se realiza directamente a la cuenta del grupo.
Baco Teatro no procesa ni retiene tu dinero.
Solo registramos la operación para control interno.
```

#### En validar pagos (director):
```
⚠️ RESPONSABILIDAD:
Como director, sos responsable de validar que el pago
haya ingresado realmente a la cuenta del grupo.
El sistema registra tu decisión con fines de auditoría.
```

#### En configurar cuentas (director):
```
⚠️ DECLARACIÓN:
Declarás bajo tu responsabilidad que esta cuenta bancaria
pertenece al grupo y está autorizada para recibir pagos.
Baco Teatro solo almacena la información que vos proporcionás.
```

#### En reportes (director):
```
⚠️ DOCUMENTO INTERNO:
Este reporte es un registro interno de operaciones.
No constituye factura ni comprobante fiscal.
Sos responsable de cumplir las obligaciones fiscales según la ley.
```

#### En subir comprobante (actor):
```
⚠️ VERIFICACIÓN:
El director validará tu comprobante.
Asegurate de que la transferencia sea a la cuenta correcta del grupo.
Guardá el comprobante original.
```

#### En footer de todas las páginas:
```
<footer>
  <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>
  <a href="/politica-privacidad.html">Política de Privacidad</a>
  <p>Baco Teatro es una herramienta de gestión. No procesamos pagos.</p>
</footer>
```

---

### 🔟 PROTECCIÓN AL CREAR USUARIO (REGISTRO)

**En el registro, ANTES de crear cuenta:**

```html
<form id="registro">
  <!-- Campos normales -->
  
  <div class="legal-checkboxes">
    <label>
      <input type="checkbox" name="acepta_terminos" required>
      He leído y acepto los 
      <a href="/terminos-y-condiciones.html" target="_blank">Términos y Condiciones</a>
    </label>
    
    <label>
      <input type="checkbox" name="acepta_privacidad" required>
      He leído y acepto la 
      <a href="/politica-privacidad.html" target="_blank">Política de Privacidad</a>
    </label>
    
    <label>
      <input type="checkbox" name="mayor_edad" required>
      Confirmo que soy mayor de 18 años
      (Si sos menor, un responsable legal debe registrarte)
    </label>
  </div>
  
  <button type="submit">Crear Cuenta</button>
</form>
```

**En backend, al crear usuario:**

```js
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, password, acepta_terminos, acepta_privacidad } = req.body;
  
  // Validar checkboxes
  if (!acepta_terminos || !acepta_privacidad) {
    return res.status(400).json({ 
      error: 'Debés aceptar los términos y la política de privacidad' 
    });
  }
  
  // Crear usuario
  const user = await pool.query(`
    INSERT INTO usuarios (nombre, email, password, acepta_terminos, fecha_aceptacion)
    VALUES ($1, $2, $3, true, NOW())
    RETURNING id
  `, [nombre, email, hashedPassword]);
  
  res.json({ success: true });
});
```

---

## 📊 COMPARACIÓN LEGAL

### ❌ ANTES (Sistema sin protección legal)

```
Sistema: "Baco Teatro procesa tu pago"
→ Responsabilidad: Creador del sistema
→ Regulaciones: Procesador de pagos
→ Licencias: Bancarias, fiscales
→ Riesgo: Alto

Sistema: "Confirmamos tu pago"
→ ¿Quién confirma? ¿El sistema?
→ Responsabilidad confusa

Reportes: "Factura Nº 001"
→ Responsabilidad fiscal: Creador
→ RUT necesario
→ Contabilidad formal
```

**Problemas:**
- Creador asume responsabilidad legal
- Necesita licencias
- Multas si no factura correctamente
- Responsabilidad solidaria con grupos

---

### ✅ AHORA (Sistema protegido legalmente)

```
Sistema: "Baco Teatro registra operaciones entre usuarios"
→ Responsabilidad: Director del grupo
→ Regulaciones: Herramienta de gestión (ninguna especial)
→ Licencias: No requiere
→ Riesgo: Bajo

Sistema: "El director validó tu pago"
→ Responsabilidad clara: Director
→ Sistema solo registra decisión

Reportes: "Registro Interno Nº 001"
→ No es comprobante fiscal
→ Director responsable de facturar si corresponde
→ Sistema solo facilita gestión
```

**Beneficios:**
- Creador protegido
- Director con responsabilidad clara
- No requiere licencias especiales
- Legalmente impecable

---

## ⚠️ ERRORES COMUNES (EVITARLOS)

### ❌ ERROR 1: Sistema como procesador

```js
// MAL
const result = await procesarPago(monto);
res.json({ mensaje: "Baco Teatro procesó tu pago" });
```

**Problema:** Asumís responsabilidad de procesador.

**✅ Solución:**
```js
// BIEN
const result = await registrarPago(monto);
res.json({ mensaje: "Pago registrado. El director validará." });
```

---

### ❌ ERROR 2: Facturación automática

```js
// MAL
const factura = generarFactura(ticket);
// Número de factura automático
```

**Problema:** No tenés RUT, no podés facturar.

**✅ Solución:**
```js
// BIEN
const registro = generarRegistroInterno(ticket);
// Solo registro interno, no factura
```

---

### ❌ ERROR 3: Cuentas sin disclaimer

```html
<!-- MAL -->
<p>Transferí a esta cuenta:</p>
<p>Banco Nación - 1234567890</p>
```

**Problema:** Parece cuenta oficial del sistema.

**✅ Solución:**
```html
<!-- BIEN -->
<div class="cuenta-disclaimer">
  <p><strong>⚠️ Cuenta declarada por el director</strong></p>
  <p>Banco Nación - 1234567890</p>
  <p>Verificá siempre con el director antes de transferir</p>
</div>
```

---

### ❌ ERROR 4: Sin términos y condiciones

Usuario registra sin aceptar nada.

**Problema:** No tenés consentimiento legal.

**✅ Solución:**
Checkboxes obligatorios en registro.

---

### ❌ ERROR 5: Datos sin protección

Cualquier usuario ve cualquier dato.

**Problema:** Violación Ley 18.331.

**✅ Solución:**
Permisos estrictos por rol (ya implementado en PASO 7).

---

## 🎯 FLUJO COMPLETO: COMPRA CON PROTECCIÓN LEGAL

```
1. Invitado abre: /public/comprar-ticket.html

2. Ve disclaimer:
   "⚠️ El pago se realiza a la cuenta del grupo.
    Baco Teatro no procesa ni retiene dinero."

3. Selecciona medio: MercadoPago

4. Sistema muestra:
   "Serás redirigido a MercadoPago.
    El pago será procesado por ellos, no por nosotros."

5. Redirect a MercadoPago
   → Comerciante: Teatro La Esquina (NO Baco Teatro)

6. Invitado paga en MercadoPago

7. Webhook confirma a Baco Teatro

8. Sistema registra en CAJA:
   → tipo_movimiento: INGRESO
   → descripcion: "Pago procesado por MercadoPago"
   → referencia: ID de MercadoPago

9. Director ve en panel:
   "Pago confirmado por MercadoPago"
   (no "confirmado por Baco Teatro")

10. QR enviado a invitado

11. Email dice:
    "Tu pago fue procesado por MercadoPago.
     Teatro La Esquina recibió el dinero.
     Baco Teatro registró la operación."

✅ En cada paso: responsabilidad clara, sistema protegido
```

---

## ✅ CRITERIOS DE ÉXITO

### Legal

- ✅ Términos y condiciones publicados
- ✅ Política de privacidad (Ley 18.331)
- ✅ Checkboxes en registro
- ✅ Textos aclaratorios en toda la UI
- ✅ Sistema como herramienta, no procesador
- ✅ Director como responsable claro

### Protección

- ✅ No generás facturas
- ✅ No procesás pagos
- ✅ No retenés dinero
- ✅ Cuentas "declaradas por director"
- ✅ MercadoPago a nombre del grupo
- ✅ Auditoría completa

### Técnico

- ✅ Tabla auditoria
- ✅ Triggers automáticos
- ✅ Logs de acceso
- ✅ Encriptación de contraseñas
- ✅ Permisos por rol

---

## 📋 CHECKLIST EJECUTIVO (COPIABLE)

```
PROTECCIÓN LEGAL - CHECKLIST

[ ] Términos y condiciones publicados (/terminos-y-condiciones.html)
[ ] Política de privacidad publicados (/politica-privacidad.html)
[ ] Checkboxes en registro (acepta_terminos, acepta_privacidad)
[ ] Footer con links en todas las páginas
[ ] Disclaimer en pantalla de pago
[ ] Disclaimer en validar pagos
[ ] Disclaimer en configurar cuentas
[ ] Disclaimer en reportes PDF
[ ] "Registro interno" (no "Factura")
[ ] Cuentas "declaradas por director"
[ ] MercadoPago a nombre del grupo
[ ] Tabla auditoria creada
[ ] Triggers de auditoría activados
[ ] Textos "Baco Teatro no procesa pagos"
[ ] Responsable de datos declarado

✅ SISTEMA PROTEGIDO LEGALMENTE
```

---

## 📚 DOCUMENTACIÓN LEGAL NECESARIA

### Archivos a crear:

1. **frontend/public/terminos-y-condiciones.html**
   - Naturaleza del servicio
   - Responsabilidades por rol
   - Limitación de responsabilidad
   - Privacidad
   - Modificaciones

2. **frontend/public/politica-privacidad.html**
   - Datos recopilados
   - Uso de datos
   - Compartir datos
   - Protección
   - Derechos del usuario (Ley 18.331)
   - Responsable de datos

3. **frontend/public/sobre-nosotros.html**
   - Qué es Baco Teatro
   - Qué NO es (procesador de pagos)
   - Contacto

4. **Texto en código: disclaimers.js**
   - Constantes con textos legales
   - Reutilizables en toda la UI

---

## 🚀 PRÓXIMOS PASOS

1. **Leer PROMPT-PASO-9-COPILOT.md** (archivo siguiente)
2. **Crear archivos HTML legales** (15-20 min)
3. **Agregar disclaimers en UI** (30-45 min)
4. **Implementar auditoría** (20-30 min)
5. **Verificar textos en todo el sistema** (20 min)

**Tiempo total estimado:** 1.5 - 2 horas

---

## 💎 CONCLUSIÓN

**Este paso NO es opcional.**

Un sistema sin protección legal:
- Es una bomba de tiempo
- Te expone a problemas
- Expone al director
- No cumple con la ley uruguaya

**Con protección legal:**
- Responsabilidades claras
- Director protegido
- VOS protegido
- Cumple Ley 18.331
- Auditable
- Profesional

**Tu ventaja:**
El sistema ya está bien hecho técnicamente (PASO 1-8).
Solo necesitás agregar la capa legal.

🎯 **Siguiente:** [PROMPT-PASO-9-COPILOT.md](PROMPT-PASO-9-COPILOT.md)
