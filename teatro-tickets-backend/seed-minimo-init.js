import { query } from './db/postgres.js';

export async function seedMinimo() {
  try {
    // Crear show mínimo si no existe ninguno
    const shows = await query('SELECT COUNT(*)::int AS c FROM shows');
    if (shows.rows[0].c === 0) {
      const id = `show_${Date.now()}`;
      await query(
        `INSERT INTO shows (id, nombre, fecha, precio, total_tickets, created_at, updated_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4, NOW(), NOW())`,
        [id, 'Función de prueba', 500, 0]
      );
      console.log('✅ Seed: show mínimo creado');
    } else {
      console.log('ℹ️ Seed: ya hay shows, no se crea otro');
    }
  } catch (error) {
    console.error('❌ Error en seed mínimo:', error.message);
    throw error;
  }
}
