import express from 'express';
import { query } from '../db/postgres.js';
import { crearFuncion } from '../controllers/funciones.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Solo accesible por usuario SUPER
router.post('/limpiar-db', authenticate, requireRole(['SUPER']), async (req, res) => {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...');
    
    // 1. Eliminar reportes de obras
    const reportesResult = await query('DELETE FROM reportes_obras');
    
    // 2. Eliminar ensayos generales
    const ensayosResult = await query('DELETE FROM ensayos_generales');
    
    // 3. Eliminar tickets
    const ticketsResult = await query('DELETE FROM tickets');
    
    // 4. Eliminar funciones
    const funcionesResult = await query('DELETE FROM funciones');
    
    // 5. Eliminar usuarios excepto SUPER
    const usersResult = await query(
      "DELETE FROM users WHERE rol != 'supremo' RETURNING nombre, rol"
    );
    
    // 6. Verificar usuarios restantes
    const remainingUsers = await query('SELECT cedula, nombre, rol FROM users');
    
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
        nombre: u.nombre,
        rol: u.rol
      }))
    });
  } catch (error) {
    console.error('Error limpiando base de datos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crear función (SUPER o ADMIN)
router.post('/crear-funcion', authenticate, requireRole('SUPER', 'ADMIN'), crearFuncion);

export default router;
