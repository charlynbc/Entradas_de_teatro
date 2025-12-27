import { query } from './db/postgres.js';

export async function seedMinimo() {
  try {
    // No crear funciones automáticamente ya que requieren obra_id
    // Las funciones se crearán desde el dashboard cuando haya grupos y obras
    console.log('ℹ️  Seed: No se crean funciones automáticamente (requieren grupo→obra)');
    console.log('💡 Crea grupos y obras desde el dashboard, luego asocia funciones');
  } catch (error) {
    console.error('❌ Error en seed mínimo:', error.message);
    throw error;
  }
}
