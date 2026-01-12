import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import './helpers/env.js';
import './helpers/teardown.js';
import { setupApp, loginAsSuper, loginAsAdmin, createGrupoObraFuncion } from './helpers/app.js';
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

test('SUPER puede crear grupo', async () => {
  const res = await request(app)
    .post('/api/grupos')
    .set('Authorization', `Bearer ${superToken}`)
    .send({
      nombre: 'Grupo Integración',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-12-31',
      dia_semana: 'Martes',
      hora_inicio: '09:00'
    });

  assert.equal(res.statusCode, 201);
  assert.ok(res.body?.grupo?.id);
});

test('ADMIN puede listar sus grupos', async () => {
  // Crear grupo como ADMIN (queda asignado como director)
  await request(app)
    .post('/api/grupos')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Grupo Director',
      fecha_inicio: '2026-01-02',
      fecha_fin: '2026-06-30',
      dia_semana: 'Miércoles',
      hora_inicio: '18:00'
    });

  const res = await request(app)
    .get('/api/grupos')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);
});

test('crear obra y función devuelve tickets y metadatos', async () => {
  const { funcionId } = await createGrupoObraFuncion(app, superToken);

  const res = await request(app)
    .get(`/api/funciones/${funcionId}`)
    .set('Authorization', `Bearer ${superToken}`);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.id, funcionId);
  assert.ok(Array.isArray(res.body?.tickets));
  assert.ok(res.body.tickets.length > 0);
});

test('funciones públicas muestran la función programada', async () => {
  const { funcionId } = await createGrupoObraFuncion(app, superToken);

  const resPublic = await request(app).get('/api/funciones/publicas');
  assert.equal(resPublic.statusCode, 200);
  assert.ok(Array.isArray(resPublic.body));
  assert.ok(resPublic.body.length >= 1);

  const resPublicAlt = await request(app).get('/api/public/funciones');
  assert.equal(resPublicAlt.statusCode, 200);
  assert.ok(resPublicAlt.body.find((f) => f.id === funcionId));

  const resDetalle = await request(app).get(`/api/public/funciones/${funcionId}`);
  assert.equal(resDetalle.statusCode, 200);
  assert.equal(resDetalle.body?.id, funcionId);
});

test('ADMIN puede crear y listar ensayos de su obra', async () => {
  const { obraId } = await createGrupoObraFuncion(app, adminToken);

  const crearRes = await request(app)
    .post('/api/ensayos')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      obra_id: obraId,
      titulo: 'Ensayo General',
      fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      lugar: 'Sala B'
    });

  assert.equal(crearRes.statusCode, 200);
  assert.ok(crearRes.body?.id);

  const listarRes = await request(app)
    .get('/api/ensayos')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(listarRes.statusCode, 200);
  assert.ok(Array.isArray(listarRes.body));
  assert.ok(listarRes.body.length >= 1);
});
