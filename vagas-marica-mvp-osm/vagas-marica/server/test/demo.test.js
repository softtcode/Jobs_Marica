// Validação da base demonstrativa e das regras de ranking de empresas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_JOBS, AREA_LABELS, EDUCATION_LABELS } from '../src/data/demoJobs.js';
import { MARICA_BOUNDS, NEIGHBORHOODS } from '../src/data/neighborhoods.js';
import { searchDemoJobs, toInternalJob } from '../src/services/demoJobs.js';
import { searchJobs } from '../src/services/jobsService.js';
import { aggregate, getCompany, listCompanies, rankCompanies, MIN_REVIEWS_FOR_RANKING } from '../src/services/companiesService.js';

const EXPECTED = {
  CLT: 20, 'Estágio': 8, 'Jovem Aprendiz': 6, PJ: 7, 'Autônomo': 5,
  'Temporário': 5, Trainee: 4, Cooperado: 3, Freelancer: 2,
};

test('base demo: exatamente 60 vagas com IDs únicos', () => {
  assert.equal(DEMO_JOBS.length, 60);
  assert.equal(new Set(DEMO_JOBS.map((j) => j.id)).size, 60);
});

test('base demo: distribuição por modalidade de contratação', () => {
  const count = {};
  DEMO_JOBS.forEach((j) => { count[j.contractType] = (count[j.contractType] || 0) + 1; });
  assert.deepEqual(count, EXPECTED);
});

test('base demo: todos os campos obrigatórios preenchidos e marcados como demo', () => {
  const textFields = ['title', 'company', 'area', 'contractType', 'mode', 'locationText', 'description', 'education', 'experienceText', 'status'];
  const listFields = ['responsibilities', 'requirementsRequired', 'requirementsDesired', 'hardSkills', 'softSkills', 'keywords'];
  for (const j of DEMO_JOBS) {
    assert.equal(j.isDemo, true, j.id);
    textFields.forEach((f) => assert.ok(typeof j[f] === 'string' && j[f].length > 0, `${j.id}.${f}`));
    listFields.forEach((f) => assert.ok(Array.isArray(j[f]) && j[f].length > 0, `${j.id}.${f}`));
    assert.ok(Array.isArray(j.benefits), `${j.id}.benefits`);
    assert.ok(AREA_LABELS[j.area], `${j.id} área desconhecida: ${j.area}`);
    assert.ok(EDUCATION_LABELS[j.education], `${j.id} escolaridade desconhecida`);
    assert.ok(['onsite', 'hybrid', 'remote'].includes(j.mode));
    assert.ok(Number.isInteger(j.experienceYears) && j.experienceYears >= 0);
    assert.ok(!Number.isNaN(Date.parse(j.postedAt)));
    assert.ok(j.salary || j.salaryNote, `${j.id} sem salário nem observação`);
    if (j.salary) assert.ok(j.salary.min > 0 && j.salary.max >= j.salary.min, `${j.id} salário`);
  }
});

test('base demo: todas as 22 áreas profissionais são cobertas', () => {
  const used = new Set(DEMO_JOBS.map((j) => j.area));
  assert.deepEqual([...used].sort(), Object.keys(AREA_LABELS).sort());
});

test('base demo: descrições variadas (sem textos repetidos)', () => {
  assert.equal(new Set(DEMO_JOBS.map((j) => j.description)).size, 60);
  assert.equal(new Set(DEMO_JOBS.map((j) => j.title)).size, 60);
});

test('base demo: coordenadas válidas dentro de Maricá; remotas sem coordenadas', () => {
  for (const j of DEMO_JOBS) {
    if (j.mode === 'remote') {
      assert.equal(j.lat, null, j.id);
      continue;
    }
    assert.ok(NEIGHBORHOODS[j.neighborhood], `${j.id} bairro`);
    assert.ok(j.lat >= MARICA_BOUNDS.minLat && j.lat <= MARICA_BOUNDS.maxLat, `${j.id} lat`);
    assert.ok(j.lng >= MARICA_BOUNDS.minLng && j.lng <= MARICA_BOUNDS.maxLng, `${j.id} lng`);
  }
});

test('vaga demo não tem link de candidatura e é "freelance" só para Freelancer', () => {
  const internal = DEMO_JOBS.map(toInternalJob);
  assert.ok(internal.every((j) => j.url === null));
  assert.equal(internal.filter((j) => j.type === 'freelance').length, 2);
});

test('busca local: ignora acentos e exige todos os termos', () => {
  const a = searchDemoJobs({ q: 'tecnico enfermagem' }).map((j) => j.title);
  assert.ok(a.includes('Técnico(a) de enfermagem'));
  assert.ok(searchDemoJobs({ q: 'ESTÁGIO' }).length >= 8);
  assert.equal(searchDemoJobs({ q: 'astronauta' }).length, 0);
  assert.equal(searchDemoJobs({ q: '' }).length, 60);
});

test('searchJobs: modo demo funciona sem credenciais e respeita tipo e raio', async () => {
  const center = { lat: -22.9203, lng: -42.8149 };
  const all = await searchJobs({ q: '', radiusKm: 25, type: 'all', center, force: false });
  assert.equal(all.demo, true);
  assert.equal(all.jobs.length + all.unlocated.length, 60);
  assert.equal(all.sources[0].id, 'demo');
  const free = await searchJobs({ q: '', radiusKm: 25, type: 'freelance', center, force: false });
  assert.equal(free.jobs.length + free.unlocated.length, 2);
  const near = await searchJobs({ q: '', radiusKm: 5, type: 'all', center, force: false });
  assert.ok(near.jobs.length < all.jobs.length);
  assert.ok(near.jobs.every((j) => j.distanceKm <= 5));
});

test('avaliações: média calculada a partir dos registros', () => {
  const r = (n) => ({ ratings: { ambiente: n, remuneracao: n, crescimento: n, gestao: n, equilibrio: n }, createdAt: '2026-01-01' });
  const agg = aggregate([r(5), r(3), r(4)]);
  assert.equal(agg.average, 4);
  assert.equal(agg.reviewCount, 3);
  assert.deepEqual(agg.distribution, { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
});

test('ranking: nota exige mínimo de avaliações; popularidade é só quantidade', () => {
  const list = [
    { id: 'a', name: 'A', reviewCount: 3, averageExact: 5 },
    { id: 'b', name: 'B', reviewCount: 40, averageExact: 3.2 },
    { id: 'c', name: 'C', reviewCount: 12, averageExact: 4.1 },
  ];
  const ranked = Object.fromEntries(rankCompanies(list, 10).map((c) => [c.id, c]));
  assert.equal(ranked.a.ratingRank, null); // 5 estrelas com 3 avaliações não entra no ranking de nota
  assert.equal(ranked.a.rankingEligible, false);
  assert.equal(ranked.c.ratingRank, 1);
  assert.equal(ranked.b.ratingRank, 2);
  assert.equal(ranked.b.popularityRank, 1);
  assert.equal(ranked.a.popularityRank, 3);
});

test('empresas: 15 a 20 empresas, ordenações e filtro por setor', () => {
  const { companies, sectors } = listCompanies();
  assert.ok(companies.length >= 15 && companies.length <= 20);
  assert.ok(companies.every((c) => c.simulated && c.reviewCount > 0));
  const eligible = companies.filter((c) => c.rankingEligible);
  for (let i = 1; i < eligible.length; i++) assert.ok(eligible[i - 1].average >= eligible[i].average);
  const pop = listCompanies({ sort: 'popular' }).companies;
  for (let i = 1; i < pop.length; i++) assert.ok(pop[i - 1].reviewCount >= pop[i].reviewCount);
  const sector = sectors[0];
  assert.ok(listCompanies({ sector }).companies.every((c) => c.sector === sector));
  assert.ok(MIN_REVIEWS_FOR_RANKING > 1);
});

test('marcas reais: nota simulada fica em faixa neutra (nunca nos extremos)', () => {
  const real = listCompanies().companies.filter((c) => c.isReal);
  assert.ok(real.length > 0);
  for (const c of real) assert.ok(c.average >= 3 && c.average <= 4.5, `${c.name}: ${c.average}`);
});

test('empresa: detalhes e vagas demo apenas das fictícias', () => {
  const fic = getCompany('nova-marica-engenharia');
  assert.ok(fic.jobs.length > 0);
  assert.equal(getCompany('mcdonalds').jobs.length, 0);
  assert.equal(getCompany('nao-existe'), null);
});
