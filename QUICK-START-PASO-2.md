# ⚡ QUICK START: PASO 2 - Sistema de Grupos Teatrales

**Objetivo**: Implementar gestión de grupos en 1 hora  
**Complejidad**: ⭐⭐⭐⭐ Media-Alta  
**Prerequisitos**: PASO 1 completado (backend + auth + PostgreSQL corriendo)

---

## 🎯 Lo que vas a construir

- ✅ Tabla de grupos con directores
- ✅ Relación N-N con miembros
- ✅ API CRUD completa
- ✅ Control de permisos por grupo

---

## ⏱️ Timeline (60 minutos)

| Tiempo | Actividad | Checkpoint |
|--------|-----------|------------|
| 0-15 min | Schema + triggers | Tablas creadas ✅ |
| 15-35 min | Servicios | Lógica funcionando ✅ |
| 35-50 min | Controladores + rutas | API endpoints activos ✅ |
| 50-60 min | Testing | Todo verificado ✅ |

---

## 📋 PASO A PASO

### 🔹 Minuto 0-15: Base de datos

#### 1. Crear migración SQL

```bash
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend
mkdir -p migrations
cat > migrations/002-grupos.sql << 'EOF'
-- Tabla grupos
CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT,
  director_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE RESTRICT,
  obra_a_realizar VARCHAR(200),
  dia_semana VARCHAR(20),
  hora_inicio TIME,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ARCHIVADO', 'FINALIZADO')),
  foto_url TEXT DEFAULT '/assets/grupo-default.png',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grupos_director ON grupos(director_cedula);
CREATE INDEX idx_grupos_estado ON grupos(estado);

-- Tabla grupo_miembros
CREATE TABLE IF NOT EXISTS grupo_miembros (
  id SERIAL PRIMARY KEY,
  grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  miembro_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  rol_en_grupo VARCHAR(20) NOT NULL CHECK (rol_en_grupo IN ('DIRECTOR', 'ACTOR')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  UNIQUE(grupo_id, miembro_cedula)
);

CREATE INDEX idx_grupo_miembros_grupo ON grupo_miembros(grupo_id);
CREATE INDEX idx_grupo_miembros_miembro ON grupo_miembros(miembro_cedula);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_grupos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grupos_updated_at
BEFORE UPDATE ON grupos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_grupos();

-- Trigger auto-agregar director
CREATE OR REPLACE FUNCTION auto_agregar_director()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
  VALUES (NEW.id, NEW.director_cedula, 'DIRECTOR', TRUE)
  ON CONFLICT (grupo_id, miembro_cedula) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_agregar_director
AFTER INSERT ON grupos
FOR EACH ROW
EXECUTE FUNCTION auto_agregar_director();
EOF
```

#### 2. Aplicar migración

```bash
docker exec -i teatro-postgres psql -U postgres -d teatro < migrations/002-grupos.sql
```

#### 3. Verificar

```bash
docker exec teatro-postgres psql -U postgres -d teatro -c "\dt"
```

**✅ Checkpoint**: Ver `grupos` y `grupo_miembros`.

---

### 🔹 Minuto 15-35: Servicios

#### 4. Crear `services/grupos.service.js`

```bash
mkdir -p services
cat > services/grupos.service.js << 'EOF'
const pool = require('../db');

/**
 * Crear grupo
 */
exports.createGrupo = async function({
  nombre, descripcion, director_cedula, obra_a_realizar,
  dia_semana, hora_inicio, fecha_inicio, fecha_fin
}) {
  // Validar director
  const dirCheck = await pool.query(
    'SELECT role FROM users WHERE cedula = $1 AND active = TRUE',
    [director_cedula]
  );

  if (dirCheck.rows.length === 0) {
    throw new Error('Director no encontrado');
  }

  if (!['ADMIN', 'SUPER'].includes(dirCheck.rows[0].role)) {
    throw new Error('Director debe ser ADMIN o SUPER');
  }

  // Insertar
  const result = await pool.query(
    `INSERT INTO grupos 
      (nombre, descripcion, director_cedula, obra_a_realizar, dia_semana, hora_inicio, fecha_inicio, fecha_fin)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [nombre, descripcion, director_cedula, obra_a_realizar, dia_semana, hora_inicio, fecha_inicio, fecha_fin]
  );

  return result.rows[0];
};

/**
 * Listar grupos según rol
 */
exports.listGrupos = async function(userCedula, userRole) {
  let query, params;

  if (userRole === 'SUPER') {
    query = 'SELECT * FROM grupos ORDER BY created_at DESC';
    params = [];
  } else if (userRole === 'ADMIN') {
    query = `
      SELECT DISTINCT g.* FROM grupos g
      LEFT JOIN grupo_miembros gm ON g.id = gm.grupo_id
      WHERE g.director_cedula = $1 
         OR (gm.miembro_cedula = $1 AND gm.rol_en_grupo = 'DIRECTOR' AND gm.activo = TRUE)
      ORDER BY g.created_at DESC
    `;
    params = [userCedula];
  } else {
    query = `
      SELECT g.* FROM grupos g
      JOIN grupo_miembros gm ON g.id = gm.grupo_id
      WHERE gm.miembro_cedula = $1 AND gm.activo = TRUE
      ORDER BY g.created_at DESC
    `;
    params = [userCedula];
  }

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtener grupo con miembros
 */
exports.getGrupoById = async function(grupoId, userCedula, userRole) {
  const grupoResult = await pool.query('SELECT * FROM grupos WHERE id = $1', [grupoId]);
  
  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  // Verificar permisos
  if (userRole !== 'SUPER') {
    const permCheck = await pool.query(
      `SELECT 1 FROM grupo_miembros 
       WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE`,
      [grupoId, userCedula]
    );

    if (permCheck.rows.length === 0 && grupo.director_cedula !== userCedula) {
      throw new Error('Sin permisos');
    }
  }

  // Obtener miembros
  const miembrosResult = await pool.query(
    `SELECT gm.*, u.name, u.role FROM grupo_miembros gm
     JOIN users u ON gm.miembro_cedula = u.cedula
     WHERE gm.grupo_id = $1
     ORDER BY gm.rol_en_grupo DESC, gm.joined_at ASC`,
    [grupoId]
  );

  return { ...grupo, miembros: miembrosResult.rows };
};

/**
 * Actualizar grupo
 */
exports.updateGrupo = async function(grupoId, userCedula, userRole, updates) {
  const grupoCheck = await pool.query(
    'SELECT director_cedula FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Sin permisos');
  }

  const allowed = ['nombre', 'descripcion', 'obra_a_realizar', 'fecha_fin', 'estado'];
  const setClause = [];
  const values = [];
  let i = 1;

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = $${i}`);
      values.push(updates[field]);
      i++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  values.push(grupoId);

  const result = await pool.query(
    `UPDATE grupos SET ${setClause.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Agregar miembro
 */
exports.addMiembro = async function(grupoId, miembroCedula, rolEnGrupo, userCedula, userRole) {
  const grupoCheck = await pool.query(
    'SELECT director_cedula, estado FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Sin permisos');
  }

  if (grupoCheck.rows[0].estado !== 'ACTIVO') {
    throw new Error('Grupo no activo');
  }

  const result = await pool.query(
    `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
    VALUES ($1, $2, $3, TRUE)
    ON CONFLICT (grupo_id, miembro_cedula)
    DO UPDATE SET activo = TRUE, rol_en_grupo = EXCLUDED.rol_en_grupo
    RETURNING *`,
    [grupoId, miembroCedula, rolEnGrupo]
  );

  return result.rows[0];
};

/**
 * Quitar miembro
 */
exports.removeMiembro = async function(grupoId, miembroCedula, userCedula, userRole) {
  const grupoCheck = await pool.query(
    'SELECT director_cedula FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Sin permisos');
  }

  if (grupoCheck.rows[0].director_cedula === miembroCedula) {
    throw new Error('No se puede quitar al director principal');
  }

  const result = await pool.query(
    `UPDATE grupo_miembros 
    SET activo = FALSE, fecha_salida = CURRENT_TIMESTAMP 
    WHERE grupo_id = $1 AND miembro_cedula = $2
    RETURNING *`,
    [grupoId, miembroCedula]
  );

  if (result.rows.length === 0) {
    throw new Error('Miembro no encontrado');
  }

  return result.rows[0];
};
EOF
```

**✅ Checkpoint**: Archivo creado con 6 funciones.

---

### 🔹 Minuto 35-50: API

#### 5. Crear `controllers/grupos.controller.js`

```bash
mkdir -p controllers
cat > controllers/grupos.controller.js << 'EOF'
const gruposService = require('../services/grupos.service');

exports.crearGrupo = async (req, res) => {
  try {
    const grupo = await gruposService.createGrupo(req.body);
    res.status(201).json(grupo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.listarGrupos = async (req, res) => {
  try {
    const grupos = await gruposService.listGrupos(req.user.cedula, req.user.role);
    res.json(grupos);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
};

exports.obtenerGrupo = async (req, res) => {
  try {
    const grupo = await gruposService.getGrupoById(req.params.id, req.user.cedula, req.user.role);
    res.json(grupo);
  } catch (error) {
    console.error('Error:', error);
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (error.message.includes('Sin permisos')) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
};

exports.actualizarGrupo = async (req, res) => {
  try {
    const grupo = await gruposService.updateGrupo(
      req.params.id,
      req.user.cedula,
      req.user.role,
      req.body
    );
    res.json(grupo);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.agregarMiembro = async (req, res) => {
  try {
    const { miembro_cedula, rol_en_grupo } = req.body;
    const miembro = await gruposService.addMiembro(
      req.params.id,
      miembro_cedula,
      rol_en_grupo,
      req.user.cedula,
      req.user.role
    );
    res.status(201).json(miembro);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.quitarMiembro = async (req, res) => {
  try {
    await gruposService.removeMiembro(
      req.params.id,
      req.params.cedula,
      req.user.cedula,
      req.user.role
    );
    res.json({ message: 'Miembro quitado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
EOF
```

#### 6. Crear `routes/grupos.js`

```bash
mkdir -p routes
cat > routes/grupos.js << 'EOF'
const express = require('express');
const { verifyToken, requireRole } = require('../auth/middleware');
const controller = require('../controllers/grupos.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/', requireRole('SUPER', 'ADMIN'), controller.crearGrupo);
router.get('/', controller.listarGrupos);
router.get('/:id', controller.obtenerGrupo);
router.put('/:id', requireRole('SUPER', 'ADMIN'), controller.actualizarGrupo);
router.post('/:id/miembros', requireRole('SUPER', 'ADMIN'), controller.agregarMiembro);
router.delete('/:id/miembros/:cedula', requireRole('SUPER', 'ADMIN'), controller.quitarMiembro);

module.exports = router;
EOF
```

#### 7. Registrar en `index.js`

```bash
# Agregar línea después de otras rutas
sed -i "/app.use('\/api\/users', usersRoutes);/a\const gruposRoutes = require('./routes/grupos');\napp.use('/api/grupos', gruposRoutes);" index.js
```

O editar manualmente `index.js`:

```javascript
// ... imports existentes
const gruposRoutes = require('./routes/grupos');

// ... rutas existentes
app.use('/api/grupos', gruposRoutes); // ← AGREGAR
```

#### 8. Reiniciar backend

```bash
npm run dev
```

**✅ Checkpoint**: Backend corriendo sin errores.

---

### 🔹 Minuto 50-60: Testing

#### 9. Obtener token

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"48376669","password":"Teamomama91"}' | jq -r '.token')

echo "Token: $TOKEN"
```

#### 10. Crear grupo

```bash
curl -X POST http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Baco Teatro",
    "director_cedula": "48376669",
    "obra_a_realizar": "Hamlet",
    "fecha_inicio": "2025-01-15"
  }'
```

**Esperado**: Status 201 + JSON del grupo.

#### 11. Listar grupos

```bash
curl http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Array con 1 grupo.

#### 12. Obtener grupo

```bash
curl http://localhost:4000/api/grupos/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Grupo con array `miembros` (1 director).

#### 13. Agregar actor

```bash
curl -X POST http://localhost:4000/api/grupos/1/miembros \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "miembro_cedula": "48376667",
    "rol_en_grupo": "ACTOR"
  }'
```

**Esperado**: Status 201.

#### 14. Verificar miembros

```bash
curl http://localhost:4000/api/grupos/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: 2 miembros (1 DIRECTOR + 1 ACTOR).

---

## ✅ CHECKLIST FINAL

- [ ] Tablas `grupos` y `grupo_miembros` creadas
- [ ] Triggers funcionando
- [ ] Servicios implementados
- [ ] Controladores implementados
- [ ] Rutas configuradas
- [ ] POST /api/grupos funciona
- [ ] GET /api/grupos funciona
- [ ] GET /api/grupos/:id funciona
- [ ] POST /api/grupos/:id/miembros funciona
- [ ] Director auto-agregado a miembros

---

## 🐛 TROUBLESHOOTING

### Error: "Grupo no encontrado" al listar

**Causa**: No hay grupos creados.

**Solución**: Crear grupo con curl (paso 10).

### Error: "Sin permisos"

**Causa**: Token de usuario ACTOR intentando crear grupo.

**Solución**: Usar token de SUPER o ADMIN.

### Error: "relation grupos does not exist"

**Causa**: Migración no aplicada.

**Solución**: Ejecutar paso 2.

---

## 🎉 ¡COMPLETADO!

✅ Sistema de grupos funcional  
✅ API CRUD completa  
✅ Permisos por grupo  
✅ Relación N-N con miembros  

**Próximo paso**: PASO 3 - Obras y funciones

---

**Tiempo total**: ~60 minutos  
**Complejidad**: ⭐⭐⭐⭐ Media-Alta  
**Estado**: ✅ COMPLETADO
