# 🚀 QUICK START PASO 10: PRODUCCIÓN + LEGAL

## ⏱️ Tiempo estimado: 45 minutos

**Objetivo**: Transformar el sistema en producto deployable con protección legal real

---

## 📋 Prerequisitos

- [x] PASO 9 completado (docs legales en MD)
- [x] Docker instalado y corriendo
- [x] Node.js 18+ con npm
- [x] Backend en `teatro-tickets-backend/`
- [x] Schema v3 disponible

---

## 🎯 Checklist ejecutivo (copiar/pegar en terminal)

### 1️⃣ Preparar entorno (5 min)

```bash
# Desde root del proyecto
cd /workspaces/Entradas_de_teatro

# Asegurar que no hay contenedores previos
docker rm -f teatro-postgres || true

# Levantar Postgres limpio
docker run -d --name teatro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=teatro \
  -p 5432:5432 postgres:15

# Esperar a que Postgres inicie
sleep 5

# Aplicar schema v3
cd teatro-tickets-backend
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
npm run db:migrate-phone-fk
```

**Verificar**:
```bash
docker exec teatro-postgres psql -U postgres -d teatro -c '\dt'
# Debe listar: funciones, grupos, obras, tickets, users
```

---

### 2️⃣ Crear archivos HTML legales (10 min)

**Archivo 1**: `teatro-tickets-backend/public/terminos-y-condiciones.html`

<details>
<summary>Ver contenido completo (click para expandir)</summary>

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
</details>

**Archivo 2**: `teatro-tickets-backend/public/politica-privacidad.html`

<details>
<summary>Ver contenido completo (click para expandir)</summary>

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
</details>

**Crear directorio shared**:
```bash
mkdir -p teatro-tickets-backend/public/shared
```

**Archivo 3**: `teatro-tickets-backend/public/shared/footer.html`

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

**Archivo 4**: `teatro-tickets-backend/public/shared/styles.css`

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

**Archivo 5**: `teatro-tickets-backend/public/shared/disclaimers.js`

```javascript
// Módulo de disclaimers reutilizables

const DISCLAIMERS = {
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

function mostrarDisclaimer(tipo, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !DISCLAIMERS[tipo]) return;
  
  const div = document.createElement('div');
  div.className = 'disclaimer';
  div.innerHTML = DISCLAIMERS[tipo];
  container.appendChild(div);
}

// Exportar para navegadores
if (typeof window !== 'undefined') {
  window.DISCLAIMERS = DISCLAIMERS;
  window.mostrarDisclaimer = mostrarDisclaimer;
}
```

---

### 3️⃣ Crear migración de auditoría (5 min)

```bash
mkdir -p teatro-tickets-backend/migrations
```

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

**Aplicar migración**:
```bash
docker cp teatro-tickets-backend/migrations/auditoria.sql teatro-postgres:/tmp/auditoria.sql
docker exec teatro-postgres psql -U postgres -d teatro -f /tmp/auditoria.sql
```

**Verificar**:
```bash
docker exec teatro-postgres psql -U postgres -d teatro -c '\dt auditoria'
# Debe listar la tabla auditoria
```

---

### 4️⃣ Integrar footer/disclaimers en páginas (10 min)

**Páginas a modificar**:
1. `public/index.html`
2. `public/funciones-hoy.html`
3. `public/pages/roles/super.html`
4. `public/pages/roles/director.html`
5. `public/pages/roles/actor.html`

**En cada archivo**:

1. Agregar en `<head>`:
```html
<link rel="stylesheet" href="/shared/styles.css">
```

2. Agregar antes de `</body>`:
```html
<!-- Disclaimer legal + Footer compartido -->
<div id="legalDisclaimer"></div>
<div id="footerContainer"></div>
<script src="/shared/disclaimers.js"></script>
<script>
  try {
    // Para index/funciones: 'GENERAL'
    // Para dashboards: 'USUARIO_REGISTRADO'
    mostrarDisclaimer('GENERAL', 'legalDisclaimer');
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

---

### 5️⃣ Iniciar backend y verificar (10 min)

```bash
cd teatro-tickets-backend

# Iniciar backend en background
PORT=4000 \
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro \
JWT_SECRET=supersecret \
FRONTEND_URL=http://localhost:3000 \
NODE_ENV=development \
node index-v3-postgres.js &

# Esperar inicio
sleep 5

# Verificar health
curl http://localhost:4000/health
```

**Esperado**:
```json
{"status":"ok","storage":"postgresql","database":"connected","totals":{"users":3,"funciones":0,...}}
```

**Verificar auditoría capturó usuarios**:
```bash
docker exec teatro-postgres psql -U postgres -d teatro -c \
  "SELECT id, tabla, accion, registro_id FROM auditoria ORDER BY id DESC LIMIT 5;"
```

**Esperado**:
```
 id | tabla | accion | registro_id 
----+-------+--------+-------------
  3 | users | INSERT | N/A
  2 | users | INSERT | N/A
  1 | users | INSERT | N/A
```

---

### 6️⃣ Testing browser (5 min)

1. Abrir http://localhost:4000
2. ✅ Ver disclaimer en la parte superior
3. ✅ Ver footer legal al final con 3 links
4. Hacer click en "Términos y Condiciones"
5. ✅ Ver página legal completa con footer
6. Volver y hacer click en "Política de Privacidad"
7. ✅ Ver contenido de Ley 18.331
8. Login como SUPER (cédula `48376669` / password `Teamomama91`)
9. ✅ Ver disclaimer "Usuario registrado" en dashboard
10. ✅ Ver footer al final

---

### 7️⃣ Git commit (2 min)

```bash
cd /workspaces/Entradas_de_teatro

git add teatro-tickets-backend/public/terminos-y-condiciones.html
git add teatro-tickets-backend/public/politica-privacidad.html
git add teatro-tickets-backend/public/shared/
git add teatro-tickets-backend/migrations/auditoria.sql
git add teatro-tickets-backend/public/index.html
git add teatro-tickets-backend/public/funciones-hoy.html
git add teatro-tickets-backend/public/pages/roles/*.html

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

## ✅ Checklist final de validación

- [ ] `curl http://localhost:4000/terminos-y-condiciones.html` → HTML válido
- [ ] `curl http://localhost:4000/politica-privacidad.html` → HTML válido
- [ ] `curl http://localhost:4000/shared/footer.html` → HTML válido
- [ ] `docker exec teatro-postgres psql -U postgres -d teatro -c 'SELECT COUNT(*) FROM auditoria;'` → > 0
- [ ] Browser en `http://localhost:4000` → disclaimer visible arriba + footer abajo
- [ ] Browser login SUPER → dashboard muestra "Usuario registrado" disclaimer
- [ ] Footer tiene 3 links: Términos, Privacidad, Contacto
- [ ] Click en cada link legal funciona
- [ ] `git log --oneline -1` → muestra commit PASO 10

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar variables de entorno
echo $DATABASE_URL
# Si está vacío, exportar:
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/teatro
```

### Trigger falla con "cannot cast type users to json"
**Solución**: Asegurar que `auditoria.sql` usa `to_jsonb(NEW)` y NO `NEW.*::json`

### Footer no renderiza
1. Verificar que `public/shared/footer.html` existe
2. Abrir DevTools → Console → ver errores de fetch
3. Verificar que backend sirve static files desde `/public/`

### Auditoría vacía
```bash
# Verificar que triggers existen
docker exec teatro-postgres psql -U postgres -d teatro -c "\dy"
# Debe listar: audit_users, audit_grupos, etc.
```

---

## 📊 Resultado esperado

Al finalizar este quick start:

1. ✅ 2 páginas HTML legales públicas
2. ✅ Footer compartido en 5+ páginas
3. ✅ Disclaimers visibles en index y dashboards
4. ✅ Tabla `auditoria` con 3+ registros
5. ✅ Backend funcionando con health OK
6. ✅ Commit pusheado a `main`

**Estado**: Sistema production-ready con protección legal y auditoría operativa

---

## 🔗 Siguientes pasos

- [ ] Deploy a Render.com (ver `DEPLOYMENT_GUIDE.md`)
- [ ] Configurar dominio custom con SSL
- [ ] Agregar modal de aceptación de términos
- [ ] Dashboard de auditoría para SUPER
- [ ] Exportar logs a CSV
