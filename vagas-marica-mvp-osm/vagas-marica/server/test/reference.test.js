// Local de referência (bairro): lista permitida, cálculo de distância e isolamento entre bairros.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NEIGHBORHOODS, referenceList, resolveReference } from '../src/data/neighborhoods.js';
import { searchJobs } from '../src/services/jobsService.js';
import { haversineKm } from '../src/utils/geo.js';

const home = { lat: -22.9203, lng: -42.8149, verified: true, name: 'Casa do Trabalhador de Maricá' };
const centerOf = (id) => { const r = resolveReference(id, home); return { lat: r.lat, lng: r.lng, id: r.id, name: r.name }; };

test('lista de referência: Centro (Casa do Trabalhador) primeiro + 13 bairros com ids únicos', () => {
  const list = referenceList(home);
  assert.equal(list[0].id, 'centro');
  assert.equal(list[0].lat, home.lat); // comportamento original preservado como padrão
  assert.equal(list.length, Object.keys(NEIGHBORHOODS).length);
  assert.equal(new Set(list.map((r) => r.id)).size, list.length);
  for (const id of ['itaipuacu', 'inoa', 'sao-jose-do-imbassai', 'ponta-negra', 'cordeirinho', 'barra-de-marica', 'jacone']) {
    assert.ok(list.some((r) => r.id === id), id);
  }
});

test('referência: só aceita ids da lista (sem coordenadas livres)', () => {
  assert.equal(resolveReference(undefined, home).id, 'centro');
  assert.equal(resolveReference('', home).id, 'centro');
  assert.equal(resolveReference('ITAIPUACU', home).id, 'itaipuacu');
  assert.equal(resolveReference('-22.9,-42.8', home), null);
  assert.equal(resolveReference('../etc', home), null);
  assert.equal(resolveReference('bairro-inexistente', home), null);
});

test('distâncias são calculadas a partir do bairro escolhido (Itaipuaçu, 5 km)', async () => {
  const center = centerOf('itaipuacu');
  const r = await searchJobs({ q: '', radiusKm: 5, type: 'all', center, force: false });
  assert.ok(r.jobs.length > 0);
  assert.equal(r.center.id, 'itaipuacu');
  for (const j of r.jobs) {
    assert.ok(j.distanceKm <= 5, `${j.title}: ${j.distanceKm}`);
    const d = Math.round(haversineKm(center.lat, center.lng, j.lat, j.lng) * 10) / 10;
    assert.equal(j.distanceKm, d);
  }
  assert.ok(r.jobs.every((j) => ['Itaipuaçu', 'Inoã'].includes(j.neighborhood)), r.jobs.map((j) => j.neighborhood).join());
  // Vagas remotas continuam disponíveis, separadas e sem distância inventada.
  assert.ok(r.unlocated.length > 0 && r.unlocated.every((j) => j.distanceKm === null && j.lat === null));
});

test('mudar o bairro muda o resultado (sem reaproveitar distâncias de outra pesquisa)', async () => {
  const a = await searchJobs({ q: '', radiusKm: 5, type: 'all', center: centerOf('itaipuacu'), force: false });
  const b = await searchJobs({ q: '', radiusKm: 5, type: 'all', center: centerOf('ponta-negra'), force: false });
  const c = await searchJobs({ q: '', radiusKm: 5, type: 'all', center: centerOf('centro'), force: false });
  const ids = (r) => r.jobs.map((j) => j.id).sort().join();
  assert.notEqual(ids(a), ids(b));
  assert.notEqual(ids(a), ids(c));
  assert.ok(b.jobs.every((j) => ['Ponta Negra'].includes(j.neighborhood) || j.distanceKm <= 5));
  const same = a.jobs.find((j) => j.neighborhood === 'Itaipuaçu');
  const inC = c.jobs.find((j) => j.id === same?.id);
  assert.equal(inC, undefined); // Itaipuaçu fica a mais de 5 km do Centro
});

test('busca no servidor marca o nível de relevância e prioriza o título', async () => {
  const r = await searchJobs({ q: 'auxiliar administrativo', radiusKm: 25, type: 'all', center: centerOf('centro'), force: false });
  const all = [...r.jobs, ...r.unlocated];
  const assistente = all.find((j) => j.title === 'Assistente administrativo');
  assert.equal(assistente.matchTier, 2);
  assert.ok(all.every((j) => j.matchTier >= 1 && j.matchTier <= 4));
});
