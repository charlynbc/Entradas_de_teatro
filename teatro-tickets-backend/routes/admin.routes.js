import express from 'express';
import { query } from '../db/postgres.js';
import { crearFuncion } from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Solo accesible por usuario SUPER
router.post('/limpiar-db', authenticate, requireRole(['SUPER']), async (req, res) => {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...');
    
    // 1. Eliminar reportes de obras (si existe)
    const reportesResult = await query('DELETE FROM reportes_obras');
    
    // 2. Eliminar ensayos generales
    const ensayosResult = await query('DELETE FROM ensayos_generales');
    
    // 3. Eliminar tickets
    const ticketsResult = await query('DELETE FROM tickets');
    
    // 4. Eliminar funciones
    const funcionesResult = await query('DELETE FROM funciones');
    
    // 5. Eliminar usuarios excepto SUPER
    const usersResult = await query(
      "DELETE FROM users WHERE role != 'SUPER' RETURNING cedula, name, role"
    );
    
    // 6. Verificar usuarios restantes
    const remainingUsers = await query('SELECT cedula, name, role FROM users');
    
    console.log('✅ Limpieza completada exitosamente');
    
    res.json({
      ok: true,
      message: 'Base de datos limpiada exitosamente',
      eliminados: {
        reportes: reportesResult.rowCount,
        ensayos: ensayosResult.rowCount,
        tickets: ticketsResult.rowCount,
        funciones: funcionesResult.rowCount,
        usuarios: usersResult.rowCount
      },
      usuariosRestantes: remainingUsers.rows.map(u => ({
        cedula: u.cedula,
        nombre: u.name,
        rol: u.role
      }))
    });
  } catch (error) {
    console.error('Error limpiando base de datos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear función (SUPER o ADMIN)
router.post('/crear-funcion', authenticate, requireRole('SUPER', 'ADMIN'), crearFuncion);

// Alias legacy: crear-show (para tests/clients antiguos)
router.post('/crear-show', authenticate, requireRole('SUPER', 'ADMIN'), async (req, res) => {
  try {
    const { obra, fecha, capacidad, base_price, precio_base, lugar } = req.body || {};
    const userCedula = req.user?.cedula;

    if (!obra || !fecha || !capacidad || !(base_price || precio_base)) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: obra, fecha, capacidad, base_price/precio_base'
      });
    }

    // 1) Asegurar grupo legacy para este usuario
    const grupoNombre = `LEGACY-${userCedula}`;
    let grupoId;
    const g0 = await query('SELECT id FROM grupos WHERE nombre = $1 LIMIT 1', [grupoNombre]);
    if (g0.rows.length > 0) {
      grupoId = g0.rows[0].id;
    } else {
      const now = new Date();
      const fin = new Date(now);
      fin.setFullYear(fin.getFullYear() + 1);
      const g1 = await query(
        `INSERT INTO grupos (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, obra_a_realizar, estado)
         VALUES ($1, $2, $3, $4, $5::time, $6::date, $7::date, $8, 'ACTIVO')
         RETURNING id`,
        [grupoNombre, 'Grupo autogenerado para compatibilidad', userCedula, 'Lunes', '19:00', now.toISOString(), fin.toISOString(), obra]
      );
      grupoId = g1.rows[0].id;
    }

    // 2) Asegurar obra dentro del grupo
    let obraId;
    const o0 = await query('SELECT id FROM obras WHERE grupo_id = $1 AND nombre = $2 LIMIT 1', [grupoId, obra]);
    if (o0.rows.length > 0) {
      obraId = o0.rows[0].id;
    } else {
      const o1 = await query(
        "INSERT INTO obras (grupo_id, nombre, descripcion, estado) VALUES ($1, $2, $3, 'LISTA') RETURNING id",
        [grupoId, obra, 'Obra autogenerada para compatibilidad']
      );
      obraId = o1.rows[0].id;
    }

    // 3) Crear función usando el controller real (mantiene lógica de tickets)
    req.body = {
      obra_id: obraId,
      fecha,
      lugar: lugar || 'Sala',
      capacidad,
      precio_base: precio_base || base_price,
      foto_url: null
    };
    return crearFuncion(req, res);
  } catch (error) {
    console.error('Error en crear-show (legacy):', error);
    res.status(500).json({ error: 'Error al crear show' });
  }
});

export default router;
