import { query } from './db/postgres.js';

export async function seedMinimo() {
  try {
    // Verificar si existe el usuario supremo
    const supremo = await query('SELECT cedula FROM users WHERE cedula = $1', ['48376669']);
    if (supremo.rows.length === 0) {
      console.log('⚠️ Seed: usuario supremo no existe, no se puede crear grupo/obra de prueba');
      return;
    }

    // Crear grupo de prueba si no existe ninguno
    const grupos = await query('SELECT COUNT(*)::int AS c FROM grupos');
    let grupoId;
    
    if (grupos.rows[0].c === 0) {
      const grupoResult = await query(
        `INSERT INTO grupos (nombre, descripcion, director_cedula, dia_semana, hora_inicio, fecha_inicio, fecha_fin, estado)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', $6)
         RETURNING id`,
        ['Grupo de Prueba', 'Grupo creado para testing', '48376669', 'Lunes', '19:00', 'ACTIVO']
      );
      grupoId = grupoResult.rows[0].id;
      console.log('✅ Seed: grupo de prueba creado');
    } else {
      // Usar el primer grupo existente
      const firstGrupo = await query('SELECT id FROM grupos LIMIT 1');
      grupoId = firstGrupo.rows[0].id;
    }

    // Crear obra de prueba si no existe ninguna
    const obras = await query('SELECT COUNT(*)::int AS c FROM obras');
    let obraId;
    
    if (obras.rows[0].c === 0) {
      const obraResult = await query(
        `INSERT INTO obras (grupo_id, nombre, descripcion, autor, genero, duracion_aprox, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [grupoId, 'Baco', 'Obra por defecto del sistema - Editable por el director', 'Autor por definir', 'Drama', 120, 'LISTA']
      );
      obraId = obraResult.rows[0].id;
      console.log('✅ Seed: obra "Baco" creada por defecto');
    } else {
      // Usar la primera obra existente
      const firstObra = await query('SELECT id FROM obras LIMIT 1');
      obraId = firstObra.rows[0].id;
    }

    // Crear show mínimo si no existe ninguno
    const shows = await query('SELECT COUNT(*)::int AS c FROM shows');
    if (shows.rows[0].c === 0) {
      const showResult = await query(
        `INSERT INTO shows (obra_id, nombre, fecha_hora, lugar, precio, cupos_totales, cupos_disponibles)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, $5, $6)
         RETURNING id`,
        [obraId, 'Función de Prueba', 'Teatro Principal', 500, 10, 10]
      );
      const showId = showResult.rows[0].id;
      
      // Crear un ticket de prueba
      await query(
        `INSERT INTO tickets (show_id, cedula_invitado, nombre_invitado, whatsapp_invitado, vendedor_phone, monto_recaudado, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [showId, '99999999', 'Invitado de Prueba', '099999999', '099111111', 500, 'reservado']
      );
      console.log('✅ Seed: show mínimo creado con ticket de prueba');
    } else {
      console.log('ℹ️ Seed: ya hay shows, no se crea otro');
    }
  } catch (error) {
    console.error('❌ Error en seed mínimo:', error.message);
    throw error;
  }
}
