# ⚡ QUICK START — PASO 9 — PROTECCIÓN LEGAL

## ⏱️ Tiempo estimado: 1.5 - 2 horas

---

## 🎯 ¿QUÉ VAS A HACER?

Implementar **protección legal completa** para el sistema:
- ✅ Términos y condiciones
- ✅ Política de privacidad (Ley 18.331)
- ✅ Disclaimers en toda la UI
- ✅ Sistema de auditoría automática
- ✅ Textos de protección

---

## 📋 ANTES DE EMPEZAR

### Prerequisitos
- [ ] PostgreSQL corriendo
- [ ] Backend corriendo
- [ ] Frontend accesible
- [ ] Git repositorio limpio

### Archivos que vas a modificar
- `teatro-tickets-backend/migrations/auditoria.sql` (nuevo)
- `frontend/public/terminos-y-condiciones.html` (nuevo)
- `frontend/public/politica-privacidad.html` (nuevo)
- `frontend/shared/disclaimers.js` (nuevo)
- `frontend/shared/footer.html` (nuevo)
- `frontend/shared/styles.css` (agregar estilos)
- `frontend/public/registro.html` (agregar checkboxes)
- `frontend/public/comprar-ticket.html` (agregar disclaimer)
- `frontend/director/validar-pagos.html` (agregar disclaimer)
- `frontend/director/configuracion-financiera.html` (agregar disclaimer)

---

## 🚀 PASO A PASO

### 1️⃣ Ejecutar Prompt en Copilot (10 min)

1. Abrí **GitHub Copilot Chat** en VS Code
2. Copiá TODO el contenido de `PROMPT-PASO-9-COPILOT.md`
3. Pegalo en el chat
4. Esperá 60-90 segundos
5. Copilot generará todos los archivos

**Lo que Copilot va a crear:**
- `terminos-y-condiciones.html` (términos completos)
- `politica-privacidad.html` (Ley 18.331 completa)
- `disclaimers.js` (textos reutilizables)
- `auditoria.sql` (tabla + triggers)
- `footer.html` (footer legal)
- Estilos CSS para disclaimers
- Modificaciones en registro, comprar ticket, validar pagos

---

### 2️⃣ Crear Base de Datos - Auditoría (5 min)

```bash
# Conectar a PostgreSQL
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro

# Ejecutar migración
psql $DATABASE_URL -f teatro-tickets-backend/migrations/auditoria.sql
```

**Verificar tabla creada:**
```sql
psql $DATABASE_URL -c "SELECT * FROM auditoria LIMIT 5;"
```

**Verificar triggers:**
```sql
psql $DATABASE_URL -c "\dt auditoria"
```

---

### 3️⃣ Personalizar Datos (10 min)

#### En `terminos-y-condiciones.html`:

Reemplazar:
```html
{{ fecha_actual }} → 08 de enero de 2026
{{ nombre_responsable }} → Tu nombre
{{ direccion }} → Tu dirección
```

#### En `politica-privacidad.html`:

Reemplazar:
```html
{{ fecha_actual }} → 08 de enero de 2026
{{ nombre_responsable }} → Tu nombre
{{ direccion }} → Tu dirección
{{ telefono }} → Tu teléfono
{{ ubicacion_servidor }} → Uruguay / AWS US-East-1 / etc
```

---

### 4️⃣ Agregar Footer a Todas las Páginas (15 min)

**Opción A: Include en cada HTML**
```html
<!-- Al final de cada página, antes de </body> -->
<div id="footer-container"></div>
<script>
  fetch('/shared/footer.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('footer-container').innerHTML = html;
    });
</script>
```

**Opción B: PHP/Node include**
```php
<?php include 'shared/footer.html'; ?>
```

**Páginas donde agregar:**
- `frontend/public/index.html`
- `frontend/public/registro.html`
- `frontend/public/comprar-ticket.html`
- `frontend/actor/*.html`
- `frontend/director/*.html`

---

### 5️⃣ Agregar Checkboxes en Registro (10 min)

**Archivo:** `frontend/public/registro.html`

**Agregar antes del botón submit:**
```html
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
  
  <label class="checkbox-label">
    <input type="checkbox" name="mayor_edad" required>
    Confirmo que soy mayor de 18 años
  </label>
</div>
```

**En el backend (teatro-tickets-backend/index-v3-postgres.js):**
```js
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, password, acepta_terminos, acepta_privacidad, mayor_edad } = req.body;
  
  // Validación legal
  if (!acepta_terminos || !acepta_privacidad) {
    return res.status(400).json({ 
      error: 'Debés aceptar los términos y la política de privacidad' 
    });
  }
  
  if (!mayor_edad) {
    return res.status(400).json({ 
      error: 'Debés ser mayor de 18 años o proporcionar datos del responsable legal' 
    });
  }
  
  // ... resto del registro
});
```

---

### 6️⃣ Agregar Disclaimers en UI (15 min)

#### A) Comprar Ticket

**Archivo:** `frontend/public/comprar-ticket.html`

**Agregar al inicio del formulario:**
```html
<div class="disclaimer-box">
  <h3>⚠️ IMPORTANTE</h3>
  <p>
    El pago se realiza directamente a la cuenta del grupo.
    Baco Teatro no procesa ni retiene tu dinero.
    Solo registramos la operación para control interno.
  </p>
</div>
```

#### B) Validar Pagos (Director)

**Archivo:** `frontend/director/validar-pagos.html`

**Agregar al inicio:**
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

#### C) Configurar Cuentas (Director)

**Archivo:** `frontend/director/configuracion-financiera.html`

**Agregar antes del formulario:**
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

### 7️⃣ Agregar Estilos CSS (5 min)

**Archivo:** `frontend/shared/styles.css`

**Agregar al final:**
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

.disclaimer-warning {
  background: #ffebee;
  border-left-color: #f44336;
}

.disclaimer-warning h3,
.disclaimer-warning p {
  color: #c62828;
}

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

.site-footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 2rem 0;
  margin-top: 4rem;
  text-align: center;
}
```

---

### 8️⃣ Probar Flujo Completo (30 min)

#### A) Registro con checkboxes
1. Ir a `/registro.html`
2. Intentar registrar sin aceptar checkboxes → debe fallar
3. Aceptar todos los checkboxes → debe funcionar
4. Verificar en base de datos:
```sql
SELECT id, nombre, acepta_terminos, fecha_aceptacion FROM usuarios ORDER BY id DESC LIMIT 1;
```

#### B) Ver documentos legales
1. Ir a `/terminos-y-condiciones.html` → debe cargar
2. Ir a `/politica-privacidad.html` → debe cargar
3. Verificar que los datos personalizados (nombre, dirección) estén correctos

#### C) Comprar ticket con disclaimer
1. Ir a `/comprar-ticket.html` (como invitado)
2. Verificar que se vea el disclaimer amarillo
3. Leer texto: "El pago se realiza directamente a la cuenta del grupo"

#### D) Validar pagos con disclaimer
1. Login como director
2. Ir a validar pagos
3. Verificar disclaimer rojo de responsabilidad
4. Validar un pago → verificar que quede registrado en auditoría:
```sql
SELECT * FROM auditoria WHERE tabla = 'caja' ORDER BY fecha DESC LIMIT 5;
```

#### E) Footer en todas las páginas
1. Abrir cualquier página
2. Scrollear hasta abajo
3. Verificar footer con links:
   - Términos y Condiciones
   - Política de Privacidad
   - Contacto
   - Texto: "Baco Teatro es una herramienta de gestión. No procesamos pagos."

---

### 9️⃣ Verificar Auditoría (10 min)

**Probar que se registran cambios:**

```bash
# 1. Modificar una cuenta bancaria
psql $DATABASE_URL -c "UPDATE cuentas_bancarias SET numero = '9999999' WHERE id = 1;"

# 2. Ver auditoría
psql $DATABASE_URL -c "SELECT * FROM auditoria WHERE tabla = 'cuentas_bancarias' ORDER BY fecha DESC LIMIT 1;"

# 3. Ver datos anteriores y nuevos (JSONB)
psql $DATABASE_URL -c "SELECT datos_anteriores->>'numero' AS anterior, datos_nuevos->>'numero' AS nuevo FROM auditoria WHERE tabla = 'cuentas_bancarias' ORDER BY fecha DESC LIMIT 1;"
```

**Debería mostrar:**
- `anterior`: valor anterior del número de cuenta
- `nuevo`: 9999999
- `fecha`: timestamp del cambio
- `usuario_id`: null (porque lo hiciste manualmente)

---

## ✅ CHECKLIST FINAL

### Archivos creados
- [ ] `frontend/public/terminos-y-condiciones.html` (existe y carga)
- [ ] `frontend/public/politica-privacidad.html` (existe y carga)
- [ ] `frontend/shared/disclaimers.js` (existe)
- [ ] `teatro-tickets-backend/migrations/auditoria.sql` (ejecutado)
- [ ] `frontend/shared/footer.html` (existe)

### Modificaciones
- [ ] Checkboxes en registro funcionando
- [ ] Backend valida checkboxes
- [ ] Disclaimer en comprar-ticket visible
- [ ] Disclaimer en validar-pagos visible
- [ ] Disclaimer en configurar-cuentas visible
- [ ] Footer en todas las páginas
- [ ] Estilos CSS aplicados

### Base de datos
- [ ] Tabla `auditoria` creada
- [ ] Triggers en `cuentas_bancarias` funcionando
- [ ] Triggers en `usuarios` funcionando
- [ ] Triggers en `caja` funcionando

### Testing
- [ ] Registro sin checkboxes falla ❌
- [ ] Registro con checkboxes funciona ✅
- [ ] Términos y condiciones cargan ✅
- [ ] Política de privacidad carga ✅
- [ ] Disclaimers visibles en 3+ pantallas ✅
- [ ] Footer visible en todas las páginas ✅
- [ ] Auditoría registra cambios ✅

---

## 🎯 RESULTADO

### Antes (❌ Sin protección)
- Sistema técnicamente correcto
- Legalmente desprotegido
- Sin términos ni privacidad
- Responsabilidades confusas
- Exposición legal alta

### Después (✅ Con protección)
- Sistema legal completo
- Términos y privacidad publicados
- Ley 18.331 Uruguay cumplida
- Responsabilidades claras
- Auditoría completa
- Disclaimers en toda la UI
- Usuarios informados

---

## 🆘 TROUBLESHOOTING

### "No puedo crear tabla auditoria"
**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep teatro-postgres

# Si no está corriendo
docker start teatro-postgres

# Ejecutar migración
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
psql $DATABASE_URL -f teatro-tickets-backend/migrations/auditoria.sql
```

### "Checkboxes no funcionan en registro"
**Verificar:**
1. El HTML tiene los `<input type="checkbox" required>`
2. El backend valida `acepta_terminos` y `acepta_privacidad`
3. Los links a `/terminos-y-condiciones.html` funcionan

### "Footer no aparece"
**Verificar:**
1. El archivo `frontend/shared/footer.html` existe
2. Agregaste el script de fetch en cada página
3. La ruta `/shared/footer.html` es correcta

### "Disclaimers no se ven bien"
**Verificar:**
1. El CSS está en `frontend/shared/styles.css`
2. Cada página incluye `<link rel="stylesheet" href="/shared/styles.css">`
3. Los estilos `.disclaimer-box` están definidos

### "Auditoría no registra cambios"
**Verificar:**
```sql
-- Ver triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'cuentas_bancarias'::regclass;

-- Debería mostrar: audit_cuentas_bancarias

-- Probar manualmente
UPDATE cuentas_bancarias SET numero = 'TEST' WHERE id = 1;
SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 1;
```

---

## 📝 NOTAS FINALES

### Lo que SÍ hace este paso
✅ Protege legalmente al creador del sistema
✅ Protege al director/grupo
✅ Cumple Ley 18.331 (Uruguay)
✅ Informa a los usuarios
✅ Registra todas las operaciones críticas
✅ Deja responsabilidades claras

### Lo que NO hace este paso
❌ No es una garantía legal absoluta (consultar abogado si hay dudas)
❌ No reemplaza obligaciones fiscales (DGI, BPS)
❌ No valida cuentas bancarias (eso lo hace el director)
❌ No procesa pagos (eso lo hace MercadoPago o transferencias)

### Consejo final
> **"Este sistema es una HERRAMIENTA de gestión.
> Director es RESPONSABLE legal.
> Sistema solo REGISTRA operaciones."**

---

**¡LISTO! 🎉**

Ahora tu sistema está legalmente protegido para Uruguay.

**Siguiente paso:**
- Leer `PASO-9-COMPLETADO.md` para ver el resumen visual
- Commit y push
- ¡A producción! 🚀
