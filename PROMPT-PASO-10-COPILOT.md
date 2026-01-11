# 🤖 PROMPT PASO 10: PRODUCTO EN PRODUCCIÓN

## 📋 Contexto para Copilot

**Usuario dice**: "Paso 10 = cerrar esto como PRODUCTO REAL deployable, presentable, defendible"

**Tu rol**: Arquitecto de sistemas con expertise en compliance legal y producción web

---

## 🎯 Objetivo del PASO 10

Transformar el sistema de gestión teatral BACO en un **producto production-ready** con:

1. **Protección legal**: términos, privacidad, disclaimers
2. **Auditoría automática**: tracking de cambios en DB
3. **Demo funcional**: seed rápido para presentaciones
4. **Frontend defensible**: avisos legales en UI críticas
5. **README como pitch**: documentación de producto

---

## 📁 Archivos de entrada (PASO 9 previo)

El usuario ya creó en PASO 9:
- `DIAGNOSTICO-PASO-9.md`: análisis de riesgos legales
- `PROMPT-PASO-9-COPILOT.md`: especificación de protección legal
- `QUICK-START-PASO-9.md`: guía de implementación
- `PASO-9-COMPLETADO.md`: checklist y estado

**Estos docs tienen el diseño legal pero NO la implementación real**

---

## 🛠️ Tareas a ejecutar (orden estricto)

### 1️⃣ Analizar documentación existente

**Lee estos archivos primero**:
- `DIAGNOSTICO-PASO-9.md`: entender qué legal protección se necesita
- `QUICK-START-PASO-9.md`: ver especificación de HTML legales
- `teatro-tickets-backend/index-v3-postgres.js`: estructura del servidor
- `teatro-tickets-backend/db/postgres.js`: helpers de DB

### 2️⃣ Crear páginas HTML legales

**Archivo 1**: `teatro-tickets-backend/public/terminos-y-condiciones.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Términos y Condiciones - Baco Teatro</title>
  <link rel="stylesheet" href="/shared/styles.css">
</head>
<body>
  <div class="legal-container">
    <h1>Términos y Condiciones</h1>
    <section>
      <h2>1. Naturaleza del servicio</h2>
      <p>Este sistema es un <strong>registro interno</strong> de actividades artísticas. No vende entradas ni gestiona transacciones comerciales públicas.</p>
    </section>
    
    <section>
      <h2>2. Responsabilidades</h2>
      <p>Los usuarios son responsables de sus acciones en el sistema. Cada operación queda registrada con fines administrativos internos.</p>
    </section>
    
    <section>
      <h2>3. Limitación de responsabilidad</h2>
      <p>El sistema se proporciona "tal cual" para gestión interna. No garantizamos disponibilidad 24/7 ni respaldo de datos en tiempo real.</p>
    </section>
    
    <section>
      <h2>4. Privacidad</h2>
      <p>Ver nuestra <a href="/politica-privacidad.html">Política de Privacidad</a> para información sobre tratamiento de datos personales.</p>
    </section>
  </div>
  
  <div id="footerContainer"></div>
  <script>
    fetch('/shared/footer.html').then(r => r.text()).then(html => {
      document.getElementById('footerContainer').innerHTML = html;
    });
  </script>
</body>
</html>
```

**Archivo 2**: `teatro-tickets-backend/public/politica-privacidad.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Política de Privacidad - Baco Teatro</title>
  <link rel="stylesheet" href="/shared/styles.css">
</head>
<body>
  <div class="legal-container">
    <h1>Política de Privacidad</h1>
    
    <section>
      <h2>Declaración de cumplimiento</h2>
      <p>Este sistema cumple con la <strong>Ley 18.331</strong> de Protección de Datos Personales de Uruguay.</p>
    </section>
    
    <section>
      <h2>Responsable</h2>
      <p><strong>Baco Teatro Uruguay</strong><br>
      Email: bacoteatro@montevideo.com.uy<br>
      Tel: +598 99 893 748</p>
    </section>
    
    <section>
      <h2>Datos recopilados</h2>
      <ul>
        <li>Nombre, apellido, cédula (identificación)</li>
        <li>Fecha de nacimiento (gestión interna)</li>
        <li>Celular, email (comunicación)</li>
        <li>Rol en la organización (permisos)</li>
      </ul>
    </section>
    
    <section>
      <h2>Bases legales</h2>
      <p>Los datos se procesan bajo consentimiento informado al registrarse en el sistema y por interés legítimo de gestión artística interna.</p>
    </section>
    
    <section>
      <h2>Uso de los datos</h2>
      <ul>
        <li>Administración de grupos y funciones</li>
        <li>Registro de actividades internas</li>
        <li>Comunicaciones relacionadas con la organización</li>
      </ul>
    </section>
    
    <section>
      <h2>Compartir datos</h2>
      <p>No compartimos datos con terceros. Todo el procesamiento es interno.</p>
    </section>
    
    <section>
      <h2>Seguridad</h2>
      <ul>
        <li>Contraseñas hasheadas con bcrypt</li>
        <li>Base de datos con acceso restringido</li>
        <li>Conexiones HTTPS en producción</li>
        <li>Auditoría de cambios automática</li>
      </ul>
    </section>
    
    <section>
      <h2>Derechos del usuario</h2>
      <p>Según Ley 18.331, tienes derecho a:</p>
      <ul>
        <li>Acceder a tus datos</li>
        <li>Rectificar información incorrecta</li>
        <li>Solicitar eliminación (derecho al olvido)</li>
        <li>Oponerte al procesamiento</li>
      </ul>
      <p>Contacta a <strong>bacoteatro@montevideo.com.uy</strong> para ejercer estos derechos.</p>
    </section>
    
    <section>
      <h2>Cookies</h2>
      <p>Usamos localStorage para mantener sesión JWT. No usamos cookies de terceros ni tracking.</p>
    </section>
    
    <section>
      <h2>Cambios a esta política</h2>
      <p>Nos reservamos el derecho de actualizar esta política. Notificaremos cambios significativos por email.</p>
    </section>
  </div>
  
  <div id="footerContainer"></div>
  <script>
    fetch('/shared/footer.html').then(r => r.text()).then(html => {
      document.getElementById('footerContainer').innerHTML = html;
    });
  </script>
</body>
</html>
```

### 3️⃣ Crear componentes compartidos

**Directorio**: `teatro-tickets-backend/public/shared/`

**Archivo 1**: `footer.html`

```html
<footer class="legal-footer">
  <div class="footer-links">
    <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>
    <a href="/politica-privacidad.html">Política de Privacidad</a>
    <a href="mailto:bacoteatro@montevideo.com.uy">Contacto</a>
  </div>
  <p class="footer-disclaimer">
    Este sistema es un registro interno de actividades artísticas. 
    No gestiona ventas públicas ni transacciones comerciales.
  </p>
  <p class="footer-copyright">
    &copy; 2026 Baco Teatro Uruguay. Cumplimiento Ley 18.331.
  </p>
</footer>
```

**Archivo 2**: `styles.css`

```css
/* Estilos para páginas legales y footer compartido */
.legal-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: white;
}

.legal-container h1 {
  color: var(--secondary, #f48c06);
  font-size: 2.5rem;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--secondary, #f48c06);
  padding-bottom: 10px;
}

.legal-container h2 {
  color: var(--secondary, #f48c06);
  font-size: 1.8rem;
  margin-top: 30px;
  margin-bottom: 15px;
}

.legal-container p, .legal-container ul {
  line-height: 1.8;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.legal-container a {
  color: var(--secondary, #f48c06);
  text-decoration: underline;
}

.legal-container ul {
  list-style-type: disc;
  margin-left: 30px;
}

/* Disclaimers */
.disclaimer {
  background: rgba(244, 140, 6, 0.15);
  border-left: 4px solid var(--secondary, #f48c06);
  padding: 15px;
  margin: 20px 0;
  border-radius: 6px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.disclaimer strong {
  color: var(--secondary, #f48c06);
}

/* Footer compartido */
.legal-footer {
  background: rgba(18, 9, 13, 0.8);
  border-top: 2px solid var(--secondary, #f48c06);
  padding: 30px 20px;
  margin-top: 50px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.footer-links a {
  color: var(--secondary, #f48c06);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.footer-links a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.footer-disclaimer {
  font-size: 0.9rem;
  font-style: italic;
  margin: 10px 0;
  opacity: 0.7;
}

.footer-copyright {
  font-size: 0.85rem;
  margin-top: 10px;
  opacity: 0.6;
}
```

**Archivo 3**: `disclaimers.js`

```javascript
// Módulo de disclaimers reutilizables

export const DISCLAIMERS = {
  GENERAL: `
    <strong>Aviso importante:</strong> Este sistema es un registro interno de actividades 
    artísticas de Baco Teatro Uruguay. No gestiona ventas públicas ni transacciones comerciales. 
    Todos los datos son tratados conforme a la Ley 18.331 de Protección de Datos Personales.
  `,
  
  USUARIO_REGISTRADO: `
    <strong>Usuario registrado:</strong> Tienes acceso a funcionalidades internas según tu rol. 
    Todas tus acciones quedan registradas para auditoría administrativa. 
    Ver <a href="/politica-privacidad.html">Política de Privacidad</a> para más información.
  `,
  
  PAGOS: `
    <strong>Registro de cuotas:</strong> Este módulo registra aportes internos de miembros. 
    No procesa pagos online ni emite facturas. Los comprobantes físicos deben guardarse 
    según normativa contable uruguaya (Decreto 220/998).
  `
};

export function mostrarDisclaimer(tipo, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !DISCLAIMERS[tipo]) return;
  
  const div = document.createElement('div');
  div.className = 'disclaimer';
  div.innerHTML = DISCLAIMERS[tipo];
  container.appendChild(div);
}

// Para uso en HTML tradicional (no módulos ES6)
if (typeof window !== 'undefined') {
  window.DISCLAIMERS = DISCLAIMERS;
  window.mostrarDisclaimer = mostrarDisclaimer;
}
```

### 4️⃣ Integrar footer y disclaimers en páginas existentes

**Modificar estos archivos** (agregar antes de `</body>`):

1. `teatro-tickets-backend/public/index.html`
2. `teatro-tickets-backend/public/funciones-hoy.html`
3. `teatro-tickets-backend/public/pages/roles/super.html`
4. `teatro-tickets-backend/public/pages/roles/director.html`
5. `teatro-tickets-backend/public/pages/roles/actor.html`

**Snippet a agregar**:

```html
<!-- Disclaimer legal + Footer compartido -->
<div id="legalDisclaimer"></div>
<div id="footerContainer"></div>
<script src="/shared/disclaimers.js"></script>
<script>
  try {
    // Para páginas públicas
    mostrarDisclaimer('GENERAL', 'legalDisclaimer');
    // Para dashboards de usuarios, usar 'USUARIO_REGISTRADO'
  } catch (e) { /* noop */ }
  
  (async () => {
    try {
      const res = await fetch('/shared/footer.html');
      const html = await res.text();
      const container = document.getElementById('footerContainer') || (() => { 
        const d = document.createElement('div'); 
        d.id = 'footerContainer'; 
        document.body.appendChild(d); 
        return d; 
      })();
      container.innerHTML = html;
    } catch (e) { 
      console.warn('No se pudo cargar el footer compartido', e); 
    }
  })();
</script>
```

**Y agregar en `<head>`**:

```html
<link rel="stylesheet" href="/shared/styles.css">
```

### 5️⃣ Crear migración de auditoría SQL

**Archivo**: `teatro-tickets-backend/migrations/auditoria.sql`

```sql
-- Auditoría genérica v1 (tablas existentes en v3)

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(100) NOT NULL,
  registro_id TEXT,
  accion VARCHAR(10) NOT NULL, -- INSERT/UPDATE/DELETE
  usuario_ref TEXT,
  ip_address VARCHAR(45),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_nuevos)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', 'N/A'), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores, datos_nuevos)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', 'N/A'), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria (tabla, registro_id, accion, datos_anteriores)
    VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(OLD)->>'id', 'N/A'), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tablas principales
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_users ON users';
    EXECUTE 'CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='grupos') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_grupos ON grupos';
    EXECUTE 'CREATE TRIGGER audit_grupos AFTER INSERT OR UPDATE OR DELETE ON grupos FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='obras') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_obras ON obras';
    EXECUTE 'CREATE TRIGGER audit_obras AFTER INSERT OR UPDATE OR DELETE ON obras FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='funciones') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_funciones ON funciones';
    EXECUTE 'CREATE TRIGGER audit_funciones AFTER INSERT OR UPDATE OR DELETE ON funciones FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tickets') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_tickets ON tickets';
    EXECUTE 'CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets FOR EACH ROW EXECUTE FUNCTION registrar_auditoria()';
  END IF;
END $$;
```

**⚠️ IMPORTANTE**: Usa `to_jsonb(NEW)` en lugar de `NEW.*::json` (Postgres moderno no soporta el cast `.*::json`)

### 6️⃣ Aplicar migración de auditoría

**Comando en terminal**:

```bash
docker cp teatro-tickets-backend/migrations/auditoria.sql teatro-postgres:/tmp/auditoria.sql
docker exec teatro-postgres psql -U postgres -d teatro -f /tmp/auditoria.sql
```

**Verificar**:

```bash
docker exec teatro-postgres psql -U postgres -d teatro -c '\dt auditoria'
docker exec teatro-postgres psql -U postgres -d teatro -c 'SELECT * FROM auditoria LIMIT 5;'
```

### 7️⃣ Corregir seed de demo (si está roto)

**Archivo**: `scripts/seed-minimo.js`

**Buscar**: líneas que usen `shows` (tabla no existe en v3)

**Reemplazar** con lógica correcta:

```javascript
// 1. Crear grupo
const grupoRes = await query(
  'INSERT INTO grupos (nombre, director_cedula, horario_fijo, activo) VALUES ($1, $2, $3, TRUE) RETURNING id',
  ['Demo Grupo', '48376669', 'Miércoles 19:00']
);
const grupoId = grupoRes.rows[0].id;

// 2. Crear obra
const obraRes = await query(
  'INSERT INTO obras (nombre, grupo_id, descripcion) VALUES ($1, $2, $3) RETURNING id',
  ['Demo Obra', grupoId, 'Obra de demostración']
);
const obraId = obraRes.rows[0].id;

// 3. Crear función
const funcionRes = await query(
  `INSERT INTO funciones (obra_id, fecha, hora, direccion, precio, cupos, vendidas, activa)
   VALUES ($1, CURRENT_DATE + 7, '20:00', 'Teatro Municipal', 500, 50, 0, TRUE) RETURNING id`,
  [obraId]
);
const funcionId = funcionRes.rows[0].id;

// 4. Crear ticket demo
await query(
  `INSERT INTO tickets (funcion_id, nombre_completo, cedula, celular, vendedor_phone, valor, estado)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [funcionId, 'Demo Usuario', '12345678', '099123456', '48376669', 500, 'pagado']
);
```

### 8️⃣ Actualizar README con pitch de producto

**Archivo**: `README.md`

**Agregar sección al inicio** (después del título):

```markdown
## 🎭 Sobre Baco Teatro

Sistema de gestión interna para actividades artísticas. Registro de grupos, obras, funciones y participantes.

### ⚖️ Protección legal

- ✅ [Términos y Condiciones](/teatro-tickets-backend/public/terminos-y-condiciones.html)
- ✅ [Política de Privacidad](/teatro-tickets-backend/public/politica-privacidad.html) (Ley 18.331 Uruguay)
- ✅ Auditoría automática de cambios
- ✅ Disclaimers en UI críticas

### 🚀 Demo rápido

```bash
# 1. Iniciar DB
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 postgres:15

# 2. Aplicar schema + auditoría
cd teatro-tickets-backend
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
npm run db:migrate-phone-fk
docker cp migrations/auditoria.sql teatro-postgres:/tmp/auditoria.sql
docker exec teatro-postgres psql -U postgres -d teatro -f /tmp/auditoria.sql

# 3. Iniciar backend
npm start

# 4. Seed demo
node scripts/seed-minimo.js
```

**Accesos**:
- Landing: http://localhost:4000
- Health: http://localhost:4000/health
- API: http://localhost:4000/api
- Super usuario: cédula `48376669` / password `Teamomama91`
```

### 9️⃣ Testing completo

**Ejecutar**:

1. ✅ Iniciar DB con `docker run postgres:15`
2. ✅ Aplicar migración de auditoría
3. ✅ Iniciar backend con todas las env vars
4. ✅ Verificar health endpoint
5. ✅ Ejecutar seed demo
6. ✅ Verificar tabla `auditoria` tiene registros
7. ✅ Abrir browser en `http://localhost:4000`
8. ✅ Verificar footer compartido renderiza
9. ✅ Verificar disclaimers visibles
10. ✅ Login como SUPER y verificar dashboard

### 🔟 Git commit final

```bash
git add teatro-tickets-backend/public/terminos-y-condiciones.html
git add teatro-tickets-backend/public/politica-privacidad.html
git add teatro-tickets-backend/public/shared/
git add teatro-tickets-backend/migrations/auditoria.sql
git add teatro-tickets-backend/public/index.html
git add teatro-tickets-backend/public/funciones-hoy.html
git add teatro-tickets-backend/public/pages/roles/*.html
git add scripts/seed-minimo.js
git add README.md

git commit -m "✅ PASO 10: capa legal completa + auditoría en producción

- HTML: términos y condiciones, política privacidad (Ley 18.331 Uruguay)
- Footer compartido + estilos legales unificados
- Disclaimers reutilizables (GENERAL, USUARIO_REGISTRADO, PAGOS)
- Auditoría SQL (fixed cast JSONB): trigger en users, grupos, obras, funciones, tickets
- Integración: index, funciones, dashboards super/director/actor
- DB + Backend test: 3 usuarios SUPER/ADMIN/ACTOR auditados OK"

git push origin main
```

---

## 🎓 Notas importantes para Copilot

### ⚠️ Errores comunes a evitar

1. **NO usar `NEW.*::json`** en triggers Postgres → usar `to_jsonb(NEW)`
2. **NO hardcodear paths absolutos** → usar paths relativos desde `/public/`
3. **NO olvidar `<link rel="stylesheet" href="/shared/styles.css">`** en todos los HTML
4. **NO usar `row_to_json()`** → deprecado, usar `to_jsonb()`

### 🔍 Validaciones críticas

Antes de dar por completo el PASO 10:

- [ ] `curl http://localhost:4000/terminos-y-condiciones.html` → HTML válido
- [ ] `curl http://localhost:4000/politica-privacidad.html` → HTML válido
- [ ] `curl http://localhost:4000/shared/footer.html` → HTML válido
- [ ] `docker exec teatro-postgres psql -U postgres -d teatro -c 'SELECT COUNT(*) FROM auditoria;'` → > 0
- [ ] `docker exec teatro-postgres psql -U postgres -d teatro -c '\d auditoria'` → tabla existe
- [ ] Browser en `http://localhost:4000` → footer visible al final
- [ ] Browser en cualquier dashboard → disclaimer visible

### 🧪 Comandos de debugging

```bash
# Ver logs del backend
tail -f /tmp/teatro-backend.log

# Ver triggers en Postgres
docker exec teatro-postgres psql -U postgres -d teatro -c "\dy"

# Ver últimas auditorías
docker exec teatro-postgres psql -U postgres -d teatro -c "SELECT id, tabla, accion, fecha FROM auditoria ORDER BY id DESC LIMIT 10;"

# Test de health
curl http://localhost:4000/health | jq

# Ver usuarios creados
docker exec teatro-postgres psql -U postgres -d teatro -c "SELECT cedula, name, role FROM users;"
```

---

## 📊 Criterios de éxito

El PASO 10 está completo cuando:

1. ✅ 2 HTML legales públicos accesibles vía browser
2. ✅ Footer compartido renderiza en al menos 5 páginas
3. ✅ Disclaimers visibles en index y dashboards
4. ✅ Tabla `auditoria` creada con triggers en 5 tablas
5. ✅ Al menos 3 registros en `auditoria` (usuarios SUPER/ADMIN/ACTOR)
6. ✅ Seed demo ejecuta sin errores
7. ✅ Backend responde health OK
8. ✅ README actualizado con sección legal + demo
9. ✅ Commit pusheado a `main`

---

## 🔗 Referencias

- Ley 18.331 Uruguay: https://www.impo.com.uy/bases/leyes/18331-2008
- URCDP: https://www.gub.uy/unidad-reguladora-control-datos-personales/
- Postgres JSONB: https://www.postgresql.org/docs/current/datatype-json.html
- Triggers Postgres: https://www.postgresql.org/docs/current/plpgsql-trigger.html

---

**Meta-instrucción**: Si el usuario dice "ejecuta todo lo que hablamos", seguir este prompt paso a paso sin saltar etapas. Crear todos los archivos indicados, aplicar todas las integraciones, y verificar cada validación crítica antes de commitear.
