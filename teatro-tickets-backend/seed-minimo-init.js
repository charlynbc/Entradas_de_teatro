import { query } from './db/postgres.js';

export async function seedMinimo() {
  try {
    // Crear función mínima si no existe ninguna
    const funciones = await query('SELECT COUNT(*)::int AS c FROM funciones');
    if (funciones.rows[0].c === 0) {
      const funcionResult = await query(
        `INSERT INTO funciones (obra_id, fecha, lugar, capacidad, precio_base, estado)
         VALUES (NULL, NOW() + INTERVAL '7 days', $1, $2, $3, 'PROGRAMADA')
         RETURNING id`,
        ['Teatro Principal', 10, 500]
      );
      const funcionId = funcionResult.rows[0].id;
      
      // Crear un ticket de prueba
      await query(
        `INSERT INTO tickets (code, funcion_id, estado, precio)
         VALUES ($1, $2, 'DISPONIBLE', $3)`,
        ['T-TEST-0001', funcionId, 500]
      );
      console.log('✅ Seed: función mínima creada con ticket T-TEST-0001');
    } else {
      console.log('ℹ️ Seed: ya hay funciones, no se crea otra');
    }
  } catch (error) {
    console.error('❌ Error en seed mínimo:', error.message);
    throw error;
  }
}
