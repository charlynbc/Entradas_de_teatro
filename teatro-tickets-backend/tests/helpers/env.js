export const DEFAULT_TEST_DB_URL = 'postgres://postgres:postgres@localhost:5432/teatro_test';

export function ensureTestEnv() {
  process.env.NODE_ENV = 'test';
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-secret';
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DEFAULT_TEST_DB_URL;
  }
  return process.env.DATABASE_URL;
}

// Ejecutar por defecto al importar
ensureTestEnv();
