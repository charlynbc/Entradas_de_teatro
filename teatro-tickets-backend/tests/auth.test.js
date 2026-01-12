import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import './helpers/env.js';
import './helpers/teardown.js';
import { setupApp, loginAsSuper, loginAsAdmin } from './helpers/app.js';
import { resetDatabase, getTestPool } from './helpers/db.js';

let app;
let superToken;
let adminToken;

before(async () => {
  app = await setupApp();
});

beforeEach(async () => {
  await resetDatabase();
  superToken = await loginAsSuper(app);
  adminToken = await loginAsAdmin(app);
});

test('login SUPREMO con teléfono y password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ phone: '48376669', password: 'Teamomama91' });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.token);
  assert.equal(res.body?.user?.role, 'SUPER');
});

test('login ADMIN con password correcto', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ phone: '48376668', password: 'admin123' });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.token);
  assert.equal(res.body?.user?.role, 'ADMIN');
});

test('login falla con password incorrecto', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ phone: '48376669', password: 'wrong' });

  assert.equal(res.statusCode, 401);
  assert.match(res.body?.error || '', /Contraseña incorrecta/i);
});

test('login falla cuando faltan campos', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ password: 'algo' });

  assert.equal(res.statusCode, 400);
});

test('completar registro crea password y devuelve token', async () => {
  const client = getTestPool();
  await client.query(
    `INSERT INTO users (cedula, name, role, phone, created_at)
     VALUES ('999000', 'SinPassword', 'ACTOR', '999000', NOW())`
  );

  const res = await request(app)
    .post('/api/auth/completar-registro')
    .send({ phone: '999000', nombre: 'Nuevo Actor', password: 'Secret123!' });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body?.token);
  assert.equal(res.body?.user?.role, 'ACTOR');
});

test('verificar token devuelve usuario', async () => {
  const res = await request(app)
    .get('/api/auth/verificar')
    .set('Authorization', `Bearer ${superToken}`);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.user?.role, 'SUPER');
});

test('verificar sin token retorna 401', async () => {
  const res = await request(app).get('/api/auth/verificar');
  assert.equal(res.statusCode, 401);
});

test('perfil retorna datos del usuario autenticado', async () => {
  const res = await request(app)
    .get('/api/auth/perfil')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.cedula, '48376668');
});
