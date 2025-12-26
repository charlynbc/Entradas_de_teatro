import { query } from './db/postgres.js';

export async function seedMinimo() {
  try {
    // Crear show mínimo si no existe ninguno
    const shows = await query('SELECT COUNT(*)::int AS c FROM shows');
    if (shows.rows[0].c === 0) {
      const showResult = await query(
        `INSERT INTO shows (obra, fecha, lugar, capacidad, base_price)
         VALUES ($1, NOW() + INTERVAL '7 days', $2, $3, $4)
         RETURNING id`,
        ['Función de prueba', 'Teatro Principal', 10, 500]
      );
      const showId = showResult.rows[0].id;
      
      // Crear un ticket de prueba
      await query(
        `INSERT INTO tickets (code, show_id, estado, precio)
         VALUES ($1, $2, 'DISPONIBLE', $3)`,
        ['T-TEST-0001', showId, 500]
      );
      console.log('✅ Seed: show mínimo creado con ticket T-TEST-0001');
    } else {
      console.log('ℹ️ Seed: ya hay shows, no se crea otro');
    }
  } catch (error) {
    console.error('❌ Error en seed mínimo:', error.message);
    throw error;
  }
}
