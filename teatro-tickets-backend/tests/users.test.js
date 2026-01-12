import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import './helpers/env.js';
import './helpers/teardown.js';
import { setupApp, loginAsSuper, loginAsAdmin } from './helpers/app.js';
import { resetDatabase } from './helpers/db.js';

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

test('ADMIN puede crear actor/vendedor', async () => {
  const res = await request(app)
    .post('/api/users/actores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ cedula: '7001001', nombre: 'Actor Uno', phone: '7001001', password: 'Clave123' });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body?.user?.role, 'ACTOR');
});

test('ADMIN no puede crear director', async () => {
  const res = await request(app)
    .post('/api/users/directores')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ cedula: '8002002', nombre: 'Director Bloqueado', phone: '8002002', password: 'Clave123' });

  assert.equal(res.statusCode, 403);
});

test('SUPER lista usuarios e incluye ADMIN', async () => {
  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${superToken}`);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  const admin = res.body.find((u) => u.cedula === '48376668');
  assert.ok(admin);
});

test('GET /api/users/me devuelve perfil', async () => {
  const res = await request(app)
    .get('/api/users/me')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.cedula, '48376668');
});

test('PUT /api/users/me actualiza nombre', async () => {
  const res = await request(app)
    .put('/api/users/me')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Admin Editado', telefono: '48376668' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.name || res.body?.nombre, 'Admin Editado');
});

test('GET /api/users sin token retorna 401', async () => {
  const res = await request(app).get('/api/users');
  assert.equal(res.statusCode, 401);
});
