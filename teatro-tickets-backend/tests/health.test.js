import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import './helpers/env.js';
import './helpers/teardown.js';
import { setupApp } from './helpers/app.js';
import { resetDatabase } from './helpers/db.js';

let app;

before(async () => {
  app = await setupApp();
});

beforeEach(async () => {
  await resetDatabase();
});

test('healthcheck responde ok y con BD', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.status, 'ok');
  assert.equal(res.body?.database?.connected, true);
});

test('endpoint raíz de API responde ok', async () => {
  const res = await request(app).get('/api');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.ok, true);
});
