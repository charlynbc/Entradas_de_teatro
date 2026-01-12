import './env.js';

let registered = false;

export function registerTeardown() {
  if (registered) return;
  registered = true;
  process.once('beforeExit', async () => {
    try {
      const { closeTestDatabase } = await import('./db.js');
      await closeTestDatabase();
    } catch (err) {
      console.error('Error cerrando DB de test:', err.message);
    }

    try {
      const { default: appPool } = await import('../../db/postgres.js');
      await appPool.end();
    } catch (err) {
      console.error('Error cerrando pool principal:', err.message);
    }
  });
}

registerTeardown();
