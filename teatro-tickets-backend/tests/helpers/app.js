import request from 'supertest';
import app, { startServer } from '../../index-v3-postgres.js';
import { ensureTestEnv } from './env.js';
import { ensureTestDatabase, resetDatabase } from './db.js';

ensureTestEnv();

let initialized = false;

export async function setupApp() {
  await ensureTestDatabase();
  await resetDatabase();
  if (!initialized) {
    await startServer({ listen: false });
    initialized = true;
  }
  return app;
}

export async function loginAsSuper(serverApp = app) {
  const res = await request(serverApp)
    .post('/api/auth/login')
    .send({ phone: '48376669', password: 'Teamomama91' });

  if (res.statusCode !== 200 || !res.body?.token) {
    throw new Error(`No se pudo loguear como SUPER: ${res.statusCode} ${res.text}`);
  }
  return res.body.token;
}

export async function loginAsAdmin(serverApp = app) {
  const res = await request(serverApp)
    .post('/api/auth/login')
    .send({ phone: '48376668', password: 'admin123' });

  if (res.statusCode !== 200 || !res.body?.token) {
    throw new Error(`No se pudo loguear como ADMIN: ${res.statusCode} ${res.text}`);
  }
  return res.body.token;
}

export async function createGrupoObraFuncion(serverApp, token, opts = {}) {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const grupoRes = await request(serverApp)
    .post('/api/grupos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nombre: opts.nombreGrupo || 'Grupo Test',
      fecha_inicio: start,
      fecha_fin: end,
      dia_semana: 'Lunes',
      hora_inicio: '10:00',
      obra_a_realizar: opts.obraNombre || 'Obra Test'
    });

  if (grupoRes.statusCode >= 300) {
    throw new Error(`Crear grupo falló: ${grupoRes.statusCode} ${grupoRes.text}`);
  }

  const grupoId = grupoRes.body?.grupo?.id || grupoRes.body?.grupo?.grupo?.id || grupoRes.body?.grupo?.grupoId || grupoRes.body?.grupo?.id || grupoRes.body?.id;

  const obraRes = await request(serverApp)
    .post('/api/obras')
    .set('Authorization', `Bearer ${token}`)
    .send({
      grupo_id: grupoId,
      nombre: opts.obraNombre || 'Obra Test',
      descripcion: 'Obra generada en test'
    });

  if (obraRes.statusCode >= 300) {
    throw new Error(`Crear obra falló: ${obraRes.statusCode} ${obraRes.text}`);
  }

  const obraId = obraRes.body?.id || obraRes.body?.obra?.id || obraRes.body?.obra_id;

  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const funcionRes = await request(serverApp)
    .post('/api/funciones')
    .set('Authorization', `Bearer ${token}`)
    .send({
      obra_id: obraId,
      fecha: opts.fecha || futureDate,
      lugar: 'Sala Principal',
      capacidad: 10,
      precio_base: 1000
    });

  if (funcionRes.statusCode >= 300) {
    throw new Error(`Crear función falló: ${funcionRes.statusCode} ${funcionRes.text}`);
  }

  const funcionId = funcionRes.body?.id || funcionRes.body?.funcion?.id;

  return { grupoId, obraId, funcionId };
}
