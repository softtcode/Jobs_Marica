// Respostas do Nominatim SIMULADAS apenas nos testes, para validar a lógica (nunca usadas pelo app).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RateLimitedQueue } from '../src/utils/rateLimitedQueue.js';
import { FileCache } from '../src/utils/fileCache.js';
import { createNominatimProvider } from '../src/services/geocodingProviders/nominatim.js';
import { normalizeAddress } from '../src/services/geocoding.js';

const okResponse = (body, status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k) => headers[k.toLowerCase()] ?? null },
  json: async () => body,
});

const base = { baseUrl: 'https://nominatim.openstreetmap.org', contactEmail: 'teste@example.org' };

test('fila: tarefas executam em série com intervalo mínimo', async () => {
  const q = new RateLimitedQueue(120);
  const starts = [];
  await Promise.all([1, 2, 3].map(() => q.schedule(async () => { starts.push(Date.now()); })));
  assert.ok(starts[1] - starts[0] >= 115, `gap1=${starts[1] - starts[0]}`);
  assert.ok(starts[2] - starts[1] >= 115, `gap2=${starts[2] - starts[1]}`);
});

test('fila: erro de uma tarefa não trava as seguintes', async () => {
  const q = new RateLimitedQueue(1);
  await assert.rejects(q.schedule(async () => { throw new Error('x'); }));
  assert.equal(await q.schedule(async () => 42), 42);
});

test('instância pública: limite mínimo de 1100 ms mesmo se configurarem menos', async () => {
  const calls = [];
  const p = createNominatimProvider({
    ...base, minIntervalMs: 10,
    fetchImpl: async () => { calls.push(Date.now()); return okResponse([]); },
  });
  await Promise.all([p.search('a'), p.search('b')]);
  assert.ok(calls[1] - calls[0] >= 1050, `gap=${calls[1] - calls[0]}`);
});

test('provedor: resultado com número de imóvel é "exact"; só rua/cidade é "approximate"', async () => {
  const p = createNominatimProvider({
    ...base, minIntervalMs: 1, baseUrl: 'http://localhost:8080',
    fetchImpl: async (u) =>
      okResponse(
        String(u).includes('189')
          ? [{ lat: '-22.9190', lon: '-42.8180', display_name: 'X', address: { house_number: '189' } }]
          : [{ lat: '-22.9', lon: '-42.8', display_name: 'Maricá', addresstype: 'city', address: {} }],
      ),
  });
  assert.equal((await p.search('Rua A, 189')).precision, 'exact');
  assert.equal((await p.search('Maricá')).precision, 'approximate');
});

test('provedor: resposta vazia devolve null (não inventa coordenadas)', async () => {
  const p = createNominatimProvider({ ...base, minIntervalMs: 1, fetchImpl: async () => okResponse([]) });
  assert.equal(await p.search('endereço inexistente'), null);
});

test('provedor: coordenadas inválidas são descartadas', async () => {
  const p = createNominatimProvider({
    ...base, minIntervalMs: 1,
    fetchImpl: async () => okResponse([{ lat: 'abc', lon: '0', display_name: 'x' }]),
  });
  assert.equal(await p.search('x'), null);
});

test('provedor: envia User-Agent identificado e e-mail de contato', async () => {
  let seen;
  const p = createNominatimProvider({
    ...base, minIntervalMs: 1,
    fetchImpl: async (u, opts) => { seen = { u: String(u), ua: opts.headers['User-Agent'] }; return okResponse([]); },
  });
  await p.search('Maricá');
  assert.match(seen.ua, /VagasMarica.*teste@example\.org/);
  assert.match(seen.u, /email=teste%40example\.org/);
  assert.match(seen.u, /countrycodes=br/);
});

test('instância pública sem identificação: recusa consultar (CONFIG)', async () => {
  let called = false;
  const p = createNominatimProvider({
    baseUrl: base.baseUrl, minIntervalMs: 1,
    fetchImpl: async () => { called = true; return okResponse([]); },
  });
  await assert.rejects(p.search('x'), (e) => e.code === 'CONFIG');
  assert.equal(called, false);
});

test('429: erro RATE_LIMITED e pausa sem novas chamadas de rede', async () => {
  let n = 0;
  const p = createNominatimProvider({
    ...base, minIntervalMs: 1, baseUrl: 'http://localhost:8080', contactEmail: 'a@b.c',
    fetchImpl: async () => { n += 1; return okResponse({}, 429, { 'retry-after': '30' }); },
  });
  await assert.rejects(p.search('a'), (e) => e.code === 'RATE_LIMITED');
  await assert.rejects(p.search('b'), (e) => e.code === 'RATE_LIMITED');
  assert.equal(n, 1);
});

test('falha de rede: erro NETWORK', async () => {
  const p = createNominatimProvider({
    ...base, minIntervalMs: 1,
    fetchImpl: async () => { throw new Error('ECONNRESET'); },
  });
  await assert.rejects(p.search('a'), (e) => e.code === 'NETWORK');
});

test('cache em arquivo: persiste entre instâncias e respeita TTL', async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gc-')), 'c.json');
  const a = new FileCache(file, { flushDelayMs: 1 });
  a.set('k', { lat: 1, lng: 2 }, 60_000);
  a.set('nulo', null, 60_000);
  a.set('velho', 'x', -1);
  a.flush();
  const b = new FileCache(file);
  assert.deepEqual(b.get('k'), { lat: 1, lng: 2 });
  assert.equal(b.get('nulo'), null);        // "não encontrado" também fica em cache
  assert.equal(b.get('velho'), undefined);   // expirado
  assert.equal(b.get('nunca'), undefined);   // nunca consultado
});

test('cache em arquivo: arquivo corrompido não derruba o servidor', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gc-')), 'c.json');
  fs.writeFileSync(file, '{quebrado');
  const c = new FileCache(file);
  assert.equal(c.get('qualquer'), undefined);
});

test('normalização de endereço', () => {
  assert.equal(
    normalizeAddress('  Rua Clímaco Pereira,   189, Centro, Maricá - RJ, Brasil '),
    'Rua Clímaco Pereira, 189, Centro, Maricá, RJ, Brasil',
  );
});
