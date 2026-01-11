# 🤖 PROMPT PASO 2: SISTEMA DE GRUPOS TEATRALES

**Para**: GitHub Copilot  
**Objetivo**: Implementar gestión de grupos teatrales con directores y miembros  
**Tiempo estimado**: 2-3 horas  
**Complejidad**: ⭐⭐⭐⭐ (Media-Alta)  
**Prerequisitos**: PASO 1 completado (backend + autenticación)

---

## 📋 CONTEXTO

Tenemos un sistema con autenticación y roles (SUPER/ADMIN/ACTOR). Necesitamos organizar usuarios en grupos teatrales (compañías) donde:
- Cada grupo tiene un director principal (rol ADMIN)
- Puede tener co-directores adicionales
- Tiene actores/actrices como miembros (rol ACTOR)
- Trabaja en una obra específica
- Tiene horarios de ensayo definidos

---

## 🎯 OBJETIVO

Implementar sistema completo de gestión de grupos con:
- ✅ CRUD de grupos teatrales
- ✅ Asignación de directores y actores
- ✅ Control de permisos por grupo
- ✅ Historial de miembros
- ✅ API REST completa

---

## 🗄️ SCHEMA DE BASE DE DATOS

### 1. Tabla `grupos`

```sql
CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT,
  director_cedula VARCHAR(20) NOT NULL REFERENCES users(cedula) ON DELETE RESTRICT,
  obra_a_realizar VARCHAR(200),
  dia_semana VARCHAR(20) CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  hora_inicio TIME,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ARCHIVADO', 'FINALIZADO')),
  foto_url TEXT DEFAULT '/assets/grupo-default.png',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fecha_fin_despues_inicio CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_grupos_director ON grupos(director_cedula);
CREATE INDEX idx_grupos_estado ON grupos(estado);
CREATE INDEX idx_grupos_nombre ON grupos(nombre);
```

### 2. Tabla `grupo_miembros` (relación N-N)

```sql
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
CREATE INDEX idx_grupo_miembros_activo ON grupo_miembros(activo);
```

### 3. Trigger para `updated_at`

```sql
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
```

### 4. Trigger para auto-agregar director a miembros

```sql
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
```

---

## 💻 IMPLEMENTACIÓN BACKEND

### 1. Servicio: `services/grupos.service.js`

```javascript
import pool from '../db.js';

/**
 * Crear nuevo grupo
 */
export async function createGrupo({
  nombre,
  descripcion,
  director_cedula,
  obra_a_realizar,
  dia_semana,
  hora_inicio,
  fecha_inicio,
  fecha_fin
}) {
  // Validar que director existe y es ADMIN o SUPER
  const directorCheck = await pool.query(
    'SELECT role FROM users WHERE cedula = $1 AND active = TRUE',
    [director_cedula]
  );

  if (directorCheck.rows.length === 0) {
    throw new Error('Director no encontrado o inactivo');
  }

  if (!['ADMIN', 'SUPER'].includes(directorCheck.rows[0].role)) {
    throw new Error('El director debe tener rol ADMIN o SUPER');
  }

  // Insertar grupo
  const result = await pool.query(
    `INSERT INTO grupos 
      (nombre, descripcion, director_cedula, obra_a_realizar, dia_semana, hora_inicio, fecha_inicio, fecha_fin, estado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO')
    RETURNING *`,
    [nombre, descripcion, director_cedula, obra_a_realizar, dia_semana, hora_inicio, fecha_inicio, fecha_fin]
  );

  return result.rows[0];
}

/**
 * Listar grupos según rol del usuario
 */
export async function listGrupos(userCedula, userRole) {
  let query, params;

  if (userRole === 'SUPER') {
    // SUPER ve todos los grupos
    query = 'SELECT * FROM grupos ORDER BY created_at DESC';
    params = [];
  } else if (userRole === 'ADMIN') {
    // ADMIN ve grupos que dirige
    query = `
      SELECT g.* FROM grupos g
      LEFT JOIN grupo_miembros gm ON g.id = gm.grupo_id
      WHERE g.director_cedula = $1 OR (gm.miembro_cedula = $1 AND gm.rol_en_grupo = 'DIRECTOR' AND gm.activo = TRUE)
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;
    params = [userCedula];
  } else {
    // ACTOR ve grupos donde es miembro activo
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
}

/**
 * Obtener grupo por ID con miembros
 */
export async function getGrupoById(grupoId, userCedula, userRole) {
  // Obtener grupo
  const grupoResult = await pool.query('SELECT * FROM grupos WHERE id = $1', [grupoId]);
  
  if (grupoResult.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  const grupo = grupoResult.rows[0];

  // Verificar permisos
  if (userRole !== 'SUPER') {
    const permissionCheck = await pool.query(
      `SELECT 1 FROM grupo_miembros 
       WHERE grupo_id = $1 AND miembro_cedula = $2 AND activo = TRUE`,
      [grupoId, userCedula]
    );

    if (permissionCheck.rows.length === 0 && grupo.director_cedula !== userCedula) {
      throw new Error('Sin permisos para ver este grupo');
    }
  }

  // Obtener miembros
  const miembrosResult = await pool.query(
    `SELECT 
      gm.id, gm.rol_en_grupo, gm.joined_at, gm.activo,
      u.cedula, u.name, u.role, u.email, u.active
    FROM grupo_miembros gm
    JOIN users u ON gm.miembro_cedula = u.cedula
    WHERE gm.grupo_id = $1
    ORDER BY gm.rol_en_grupo DESC, gm.joined_at ASC`,
    [grupoId]
  );

  return {
    ...grupo,
    miembros: miembrosResult.rows
  };
}

/**
 * Actualizar grupo (solo director o SUPER)
 */
export async function updateGrupo(grupoId, userCedula, userRole, updates) {
  // Verificar permisos
  const grupoCheck = await pool.query(
    'SELECT director_cedula FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director o SUPER pueden modificar el grupo');
  }

  // Construir query dinámico
  const allowedFields = ['nombre', 'descripcion', 'obra_a_realizar', 'fecha_fin', 'estado'];
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClause.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  values.push(grupoId);

  const result = await pool.query(
    `UPDATE grupos SET ${setClause.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Agregar miembro al grupo
 */
export async function addMiembroToGrupo(grupoId, miembroCedula, rolEnGrupo, userCedula, userRole) {
  // Verificar permisos
  const grupoCheck = await pool.query(
    'SELECT director_cedula, estado FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director o SUPER pueden agregar miembros');
  }

  if (grupoCheck.rows[0].estado !== 'ACTIVO') {
    throw new Error('No se pueden agregar miembros a un grupo no activo');
  }

  // Verificar que el miembro existe
  const miembroCheck = await pool.query(
    'SELECT role FROM users WHERE cedula = $1 AND active = TRUE',
    [miembroCedula]
  );

  if (miembroCheck.rows.length === 0) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  // Validar rol
  if (rolEnGrupo === 'DIRECTOR' && miembroCheck.rows[0].role !== 'ADMIN') {
    throw new Error('Solo usuarios con rol ADMIN pueden ser directores');
  }

  // Insertar o reactivar miembro
  const result = await pool.query(
    `INSERT INTO grupo_miembros (grupo_id, miembro_cedula, rol_en_grupo, activo)
    VALUES ($1, $2, $3, TRUE)
    ON CONFLICT (grupo_id, miembro_cedula)
    DO UPDATE SET activo = TRUE, rol_en_grupo = EXCLUDED.rol_en_grupo, joined_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [grupoId, miembroCedula, rolEnGrupo]
  );

  return result.rows[0];
}

/**
 * Quitar miembro del grupo
 */
export async function removeMiembroFromGrupo(grupoId, miembroCedula, userCedula, userRole) {
  // Verificar permisos
  const grupoCheck = await pool.query(
    'SELECT director_cedula FROM grupos WHERE id = $1',
    [grupoId]
  );

  if (grupoCheck.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  if (userRole !== 'SUPER' && grupoCheck.rows[0].director_cedula !== userCedula) {
    throw new Error('Solo el director o SUPER pueden quitar miembros');
  }

  // No permitir quitar al director principal
  if (grupoCheck.rows[0].director_cedula === miembroCedula) {
    throw new Error('No se puede quitar al director principal del grupo');
  }

  // Marcar como inactivo (soft delete)
  const result = await pool.query(
    `UPDATE grupo_miembros 
    SET activo = FALSE, fecha_salida = CURRENT_TIMESTAMP 
    WHERE grupo_id = $1 AND miembro_cedula = $2
    RETURNING *`,
    [grupoId, miembroCedula]
  );

  if (result.rows.length === 0) {
    throw new Error('Miembro no encontrado en el grupo');
  }

  return result.rows[0];
}

/**
 * Eliminar grupo (solo SUPER)
 */
export async function deleteGrupo(grupoId) {
  const result = await pool.query(
    'DELETE FROM grupos WHERE id = $1 RETURNING *',
    [grupoId]
  );

  if (result.rows.length === 0) {
    throw new Error('Grupo no encontrado');
  }

  return result.rows[0];
}
```

---

### 2. Controlador: `controllers/grupos.controller.js`

```javascript
import * as gruposService from '../services/grupos.service.js';

/**
 * POST /api/grupos
 */
export async function crearGrupo(req, res) {
  try {
    const {
      nombre,
      descripcion,
      director_cedula,
      obra_a_realizar,
      dia_semana,
      hora_inicio,
      fecha_inicio,
      fecha_fin
    } = req.body;

    // Validaciones
    if (!nombre || !director_cedula || !fecha_inicio) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, director_cedula, fecha_inicio' });
    }

    const grupo = await gruposService.createGrupo({
      nombre,
      descripcion,
      director_cedula,
      obra_a_realizar,
      dia_semana,
      hora_inicio,
      fecha_inicio,
      fecha_fin
    });

    res.status(201).json(grupo);

  } catch (error) {
    console.error('Error al crear grupo:', error);
    if (error.message.includes('ya existe')) {
      return res.status(409).json({ error: 'Ya existe un grupo con ese nombre' });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/grupos
 */
export async function listarGrupos(req, res) {
  try {
    const userCedula = req.user.cedula;
    const userRole = req.user.role;

    const grupos = await gruposService.listGrupos(userCedula, userRole);
    res.json(grupos);

  } catch (error) {
    console.error('Error al listar grupos:', error);
    res.status(500).json({ error: 'Error al listar grupos' });
  }
}

/**
 * GET /api/grupos/:id
 */
export async function obtenerGrupo(req, res) {
  try {
    const { id } = req.params;
    const userCedula = req.user.cedula;
    const userRole = req.user.role;

    const grupo = await gruposService.getGrupoById(id, userCedula, userRole);
    res.json(grupo);

  } catch (error) {
    console.error('Error al obtener grupo:', error);
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (error.message.includes('Sin permisos')) {
      return res.status(403).json({ error: 'Sin permisos para ver este grupo' });
    }
    res.status(500).json({ error: 'Error al obtener grupo' });
  }
}

/**
 * PUT /api/grupos/:id
 */
export async function actualizarGrupo(req, res) {
  try {
    const { id } = req.params;
    const userCedula = req.user.cedula;
    const userRole = req.user.role;
    const updates = req.body;

    const grupo = await gruposService.updateGrupo(id, userCedula, userRole, updates);
    res.json(grupo);

  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (error.message.includes('Solo el director')) {
      return res.status(403).json({ error: 'Sin permisos para modificar este grupo' });
    }
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
}

/**
 * POST /api/grupos/:id/miembros
 */
export async function agregarMiembro(req, res) {
  try {
    const { id } = req.params;
    const { miembro_cedula, rol_en_grupo } = req.body;
    const userCedula = req.user.cedula;
    const userRole = req.user.role;

    if (!miembro_cedula || !rol_en_grupo) {
      return res.status(400).json({ error: 'Campos requeridos: miembro_cedula, rol_en_grupo' });
    }

    const miembro = await gruposService.addMiembroToGrupo(
      id,
      miembro_cedula,
      rol_en_grupo,
      userCedula,
      userRole
    );

    res.status(201).json(miembro);

  } catch (error) {
    console.error('Error al agregar miembro:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/grupos/:id/miembros/:cedula
 */
export async function quitarMiembro(req, res) {
  try {
    const { id, cedula } = req.params;
    const userCedula = req.user.cedula;
    const userRole = req.user.role;

    await gruposService.removeMiembroFromGrupo(id, cedula, userCedula, userRole);
    res.json({ message: 'Miembro quitado exitosamente' });

  } catch (error) {
    console.error('Error al quitar miembro:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/grupos/:id
 */
export async function eliminarGrupo(req, res) {
  try {
    const { id } = req.params;

    await gruposService.deleteGrupo(id);
    res.json({ message: 'Grupo eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
}
```

---

### 3. Rutas: `routes/grupos.routes.js`

```javascript
import express from 'express';
import { verifyToken, requireRole } from '../auth/middleware.js';
import * as gruposController from '../controllers/grupos.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

/**
 * POST /api/grupos - Crear grupo (SUPER, ADMIN)
 */
router.post('/', requireRole('SUPER', 'ADMIN'), gruposController.crearGrupo);

/**
 * GET /api/grupos - Listar grupos (todos)
 */
router.get('/', gruposController.listarGrupos);

/**
 * GET /api/grupos/:id - Obtener grupo (todos, con validación de permisos)
 */
router.get('/:id', gruposController.obtenerGrupo);

/**
 * PUT /api/grupos/:id - Actualizar grupo (SUPER, ADMIN director del grupo)
 */
router.put('/:id', requireRole('SUPER', 'ADMIN'), gruposController.actualizarGrupo);

/**
 * POST /api/grupos/:id/miembros - Agregar miembro (SUPER, ADMIN director del grupo)
 */
router.post('/:id/miembros', requireRole('SUPER', 'ADMIN'), gruposController.agregarMiembro);

/**
 * DELETE /api/grupos/:id/miembros/:cedula - Quitar miembro (SUPER, ADMIN director del grupo)
 */
router.delete('/:id/miembros/:cedula', requireRole('SUPER', 'ADMIN'), gruposController.quitarMiembro);

/**
 * DELETE /api/grupos/:id - Eliminar grupo (solo SUPER)
 */
router.delete('/:id', requireRole('SUPER'), gruposController.eliminarGrupo);

export default router;
```

---

### 4. Registrar rutas en `index.js`

```javascript
// ... imports existentes
import gruposRoutes from './routes/grupos.routes.js';

// ... middlewares existentes

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/grupos', gruposRoutes); // ← AGREGAR ESTA LÍNEA

// ... resto del código
```

---

## 🧪 TESTING Y VALIDACIÓN

### 1. Aplicar migración de schema

```bash
# Crear archivo de migración
cat > teatro-tickets-backend/migrations/002-grupos.sql << 'EOF'
-- (copiar todo el código SQL de arriba)
EOF

# Aplicar migración
docker exec -i teatro-postgres psql -U postgres -d teatro < teatro-tickets-backend/migrations/002-grupos.sql
```

### 2. Verificar tablas creadas

```bash
docker exec teatro-postgres psql -U postgres -d teatro -c "\dt"
```

**Esperado**: Ver `grupos` y `grupo_miembros`.

### 3. Test: Crear grupo

```bash
TOKEN="<tu token de SUPER o ADMIN>"

curl -X POST http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Baco Teatro",
    "descripcion": "Grupo principal de teatro experimental",
    "director_cedula": "48376669",
    "obra_a_realizar": "Hamlet",
    "dia_semana": "Martes",
    "hora_inicio": "19:00",
    "fecha_inicio": "2025-01-15"
  }'
```

**Esperado**: Status 201 + JSON del grupo creado.

### 4. Test: Listar grupos

```bash
curl http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Array con el grupo creado.

### 5. Test: Obtener grupo con miembros

```bash
curl http://localhost:4000/api/grupos/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: JSON del grupo con array `miembros` que incluye al director.

### 6. Test: Agregar actor al grupo

```bash
curl -X POST http://localhost:4000/api/grupos/1/miembros \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "miembro_cedula": "48376667",
    "rol_en_grupo": "ACTOR"
  }'
```

**Esperado**: Status 201 + JSON del miembro agregado.

### 7. Test: Actualizar grupo

```bash
curl -X PUT http://localhost:4000/api/grupos/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Grupo actualizado con nueva descripción"
  }'
```

**Esperado**: Status 200 + JSON del grupo actualizado.

### 8. Test: Quitar miembro

```bash
curl -X DELETE http://localhost:4000/api/grupos/1/miembros/48376667 \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: Status 200 + mensaje de éxito.

### 9. Test de permisos: ACTOR intenta crear grupo

```bash
TOKEN_ACTOR="<token de usuario con rol ACTOR>"

curl -X POST http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN_ACTOR" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Grupo No Autorizado",
    "director_cedula": "48376667",
    "fecha_inicio": "2025-01-15"
  }'
```

**Esperado**: Status 403 Forbidden.

---

## ✅ CRITERIOS DE ACEPTACIÓN

Marcar al completar:

- [ ] Tablas `grupos` y `grupo_miembros` creadas
- [ ] Índices y constraints funcionando
- [ ] Triggers funcionando (updated_at, auto-agregar director)
- [ ] Servicio `grupos.service.js` implementado (7 funciones)
- [ ] Controlador `grupos.controller.js` implementado (7 handlers)
- [ ] Rutas `grupos.routes.js` configuradas
- [ ] Rutas registradas en `index.js`
- [ ] Endpoint POST /api/grupos funcional
- [ ] Endpoint GET /api/grupos funcional con filtrado por rol
- [ ] Endpoint GET /api/grupos/:id funcional con miembros
- [ ] Endpoint PUT /api/grupos/:id funcional
- [ ] Endpoint POST /api/grupos/:id/miembros funcional
- [ ] Endpoint DELETE /api/grupos/:id/miembros/:cedula funcional
- [ ] Endpoint DELETE /api/grupos/:id funcional (solo SUPER)
- [ ] Validación de permisos por grupo funciona
- [ ] Tests manuales ejecutados exitosamente

---

## 🚀 COMANDOS RÁPIDOS

### Setup completo

```bash
# 1. Aplicar migración
docker exec -i teatro-postgres psql -U postgres -d teatro < teatro-tickets-backend/migrations/002-grupos.sql

# 2. Reiniciar backend
cd teatro-tickets-backend
npm run dev

# 3. Crear grupo de prueba (con token válido)
curl -X POST http://localhost:4000/api/grupos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Baco Teatro",
    "director_cedula": "48376669",
    "fecha_inicio": "2025-01-15"
  }'
```

---

## 📝 NOTAS FINALES

### Seguridad implementada
✅ Solo SUPER y ADMIN pueden crear grupos  
✅ Solo director o SUPER pueden modificar grupo  
✅ Solo director o SUPER pueden agregar/quitar miembros  
✅ Director principal no puede ser quitado del grupo  
✅ Grupos no activos no aceptan nuevos miembros  

### Performance
✅ Índices en campos de búsqueda frecuente  
✅ Queries optimizadas con JOINs eficientes  
✅ Soft delete mantiene historial sin afectar performance  

### Listo para siguiente paso
Con PASO 2 completado, puedes proceder a:
- PASO 3: Sistema de obras y funciones
- PASO 4: Venta de entradas
- PASO 5: Sistema de cuotas

---

**Autor**: Sistema Baco Teatro  
**Fecha**: Diciembre 2025  
**Versión**: 1.0
