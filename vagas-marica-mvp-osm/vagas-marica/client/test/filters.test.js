// Filtros, salário, ordenação, URL e consistência lista × mapa (funções puras de utils/search.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyClientFilters, availableSorts, computeVisible, DEFAULT_FILTERS, effectiveSort, filtersToParams,
  parseFilters, sortJobs, startingSalary,
} from '../src/utils/search.js';
import { splitByMatch } from '../src/services/matchingService.js';
import { searchJobsByQuery } from '../../shared/jobSearch.js';
import { DEMO_JOBS } from '../../server/src/data/demoJobs.js';
import { toInternalJob } from '../../server/src/services/demoJobs.js';
import { partitionByDistance } from '../../server/src/services/jobsService.js';

const CENTER = { lat: -22.9203, lng: -42.8149 };
function data(q = '') {
  const jobs = searchJobsByQuery(q, DEMO_JOBS.map(toInternalJob));
  const { located, unlocated } = partitionByDistance(jobs, CENTER, 25);
  return { jobs: located, unlocated, sources: [{ id: 'demo', status: 'ok' }], demo: true };
}
const F = (patch = {}) => ({ ...DEFAULT_FILTERS, ...patch });
const job = (salary, extra = {}) => ({ id: Math.random().toString(36), salary, ...extra });

test('salário: compara com o INÍCIO da faixa (R$ 1.800–3.000 não conta como R$ 2.500)', () => {
  const faixa = job({ min: 1800, max: 3000 });
  const fixo = job({ min: 2500, max: 2500 });
  const so_teto = job({ min: null, max: 4000 });
  const sem = job(null);
  const r = applyClientFilters([faixa, fixo, so_teto, sem], F({ salaryMin: '2500', includeNoSalary: false }));
  assert.deepEqual(r, [fixo]);
  const r2 = applyClientFilters([faixa, fixo, so_teto, sem], F({ salaryMin: '2500', includeNoSalary: true }));
  assert.deepEqual(r2, [fixo, so_teto, sem]); // sem salário inicial conhecido → opção "incluir"
  assert.equal(startingSalary(faixa), 1800);
  assert.equal(startingSalary(so_teto), null); // nunca inventamos um salário
});

test('filtros por contratação, modalidade, área, empresa e combinações', () => {
  const d = data();
  const all = [...d.jobs, ...d.unlocated];
  assert.equal(applyClientFilters(all, F({ contract: 'Estágio' })).length, 8);
  assert.ok(applyClientFilters(all, F({ mode: 'remote' })).every((j) => j.mode === 'remote'));
  assert.ok(applyClientFilters(all, F({ area: 'saude' })).every((j) => j.area === 'saude'));
  const combo = applyClientFilters(all, F({ contract: 'CLT', mode: 'onsite', area: 'saude' }));
  assert.ok(combo.length > 0 && combo.every((j) => j.contractType === 'CLT' && j.mode === 'onsite' && j.area === 'saude'));
  const empresa = applyClientFilters(all, F({ company: 'nova-marica-engenharia' }));
  assert.ok(empresa.length > 0 && empresa.every((j) => j.company === 'Nova Maricá Engenharia'));
});

test('URL: ida e volta preserva todos os filtros, bairro, ordenação e omite os padrões', () => {
  const f = F({ q: 'vendedor', ref: 'itaipuacu', radiusKm: 5, contract: 'Jovem Aprendiz', mode: 'hybrid', area: 'vendas', company: 'oceano-azul-comercio', salaryMin: '2000', includeNoSalary: false, sort: 'recentes' });
  const p = filtersToParams(f);
  assert.equal(p.get('bairro'), 'itaipuacu');
  assert.equal(p.get('contratacao'), 'jovem-aprendiz');
  assert.deepEqual(parseFilters(p), f);
  assert.equal(filtersToParams(DEFAULT_FILTERS).toString(), '');
  // valores inválidos na URL voltam ao padrão em vez de quebrar
  assert.deepEqual(parseFilters(new URLSearchParams('raio=7&ordem=xyz&area=foo&bairro=../x')), DEFAULT_FILTERS);
});

test('limpar filtros = voltar aos padrões (mantendo a busca)', () => {
  const p = filtersToParams({ ...DEFAULT_FILTERS, q: 'motorista' });
  assert.equal(p.toString(), 'q=motorista');
});

test('ordenação: recentes, menor distância (sem distância por último) e maior salário inicial', () => {
  const list = [
    job({ min: 1500, max: 1500 }, { distanceKm: 3, postedAt: '2026-01-02' }),
    job(null, { distanceKm: null, postedAt: '2026-01-05' }),
    job({ min: 3000, max: 3500 }, { distanceKm: 1, postedAt: '2026-01-01' }),
    job({ min: 3000, max: 4000 }, { distanceKm: 8, postedAt: null }),
  ];
  assert.deepEqual(sortJobs(list, 'distancia').map((j) => j.distanceKm), [1, 3, 8, null]);
  assert.deepEqual(sortJobs(list, 'recentes').map((j) => j.postedAt), ['2026-01-05', '2026-01-02', '2026-01-01', null]);
  assert.deepEqual(sortJobs(list, 'salario').map((j) => j.salary?.max ?? null), [4000, 3500, 1500, null]);
});

test('ordenações oferecidas dependem dos dados; "Para Você" ordena por compatibilidade', () => {
  assert.deepEqual(availableSorts({ hasQuery: false, hasResume: false }).map((o) => o.value), ['distancia', 'recentes', 'salario']);
  assert.ok(availableSorts({ hasQuery: true, hasResume: true }).some((o) => o.value === 'relevancia'));
  assert.equal(effectiveSort('', { tab: 'forYou', tabsActive: true, hasQuery: true, hasResume: true }), 'compatibilidade');
  assert.equal(effectiveSort('', { tab: 'others', tabsActive: true, hasQuery: true, hasResume: true }), 'relevancia');
  assert.equal(effectiveSort('', { tabsActive: false, hasQuery: false, hasResume: false }), 'distancia');
  assert.equal(effectiveSort('compatibilidade', { tabsActive: false, hasQuery: false, hasResume: false }), 'distancia'); // indisponível
  assert.equal(effectiveSort('salario', { tab: 'forYou', tabsActive: true, hasQuery: false, hasResume: true }), 'salario');
});

test('relevância: separa correspondências de "Oportunidades relacionadas"', () => {
  const v = computeVisible({ data: data('auxiliar administrativo'), filters: F({ q: 'auxiliar administrativo' }), sort: 'relevancia' });
  assert.equal(v.sections[0].key, 'match');
  assert.equal(v.sections[0].jobs[0].title, 'Assistente administrativo');
  assert.equal(v.sections[1].key, 'related');
  assert.ok(v.sections[1].jobs.every((j) => j.matchTier >= 3));
  assert.equal(v.exactCount, 1);
});

test('sem localização: vagas remotas ficam numa seção separada e fora do mapa', () => {
  const v = computeVisible({ data: data(), filters: F(), sort: 'distancia' });
  assert.ok(v.unlocated.length > 0);
  assert.ok(v.jobs.every((j) => j.lat != null));
  assert.equal(v.sections.at(-1).key, 'unlocated');
});

const PROFILE = {
  objective: 'Atuar como assistente administrativo', areas: ['administracao'], educationLevel: 'medio',
  hardSkills: ['Planilhas', 'Atendimento ao público', 'Pacote Office'], desiredModes: ['onsite'], desiredContracts: ['CLT'],
  experiences: [{ role: 'Auxiliar administrativo', start: '2021', end: '2024', description: 'Contas a pagar e planilhas' }],
};

test('lista e mapa mostram o MESMO subconjunto em cada aba (Para Você / Outras Vagas)', () => {
  const d = data();
  const filters = F({ mode: 'onsite' });
  const base = computeVisible({ data: d, filters, sort: 'distancia' });
  const matching = splitByMatch([...base.jobs, ...base.unlocated], PROFILE);
  const forYou = computeVisible({ data: d, filters, matching, tab: 'forYou', tabsActive: true, sort: 'compatibilidade' });
  const others = computeVisible({ data: d, filters, matching, tab: 'others', tabsActive: true, sort: 'distancia' });
  const listIds = (v) => new Set(v.sections.flatMap((s) => s.jobs).map((j) => j.id));
  for (const v of [forYou, others]) {
    const list = listIds(v);
    // o mapa (v.jobs) é exatamente a parte com coordenadas da lista
    assert.deepEqual(new Set(v.jobs.map((j) => j.id)), new Set([...list].filter((id) => v.jobs.some((j) => j.id === id))));
    assert.ok(v.jobs.every((j) => list.has(j.id)));
  }
  const a = listIds(forYou); const b = listIds(others);
  assert.ok(a.size > 0 && b.size > 0, `abas: ${a.size}/${b.size}`);
  assert.ok([...a].every((id) => !b.has(id)));                 // exclusivas
  assert.equal(a.size + b.size, base.total);                    // juntas = resultado filtrado
  const scores = forYou.sections[0].jobs.map((j) => matching.matches.get(j.id).score);
  for (let i = 1; i < scores.length; i++) assert.ok(scores[i - 1] >= scores[i]); // ordenada por compatibilidade
});

test('sem currículo, todas as vagas continuam disponíveis', () => {
  const v = computeVisible({ data: data(), filters: F(), matching: null, tab: 'forYou', tabsActive: false, sort: 'distancia' });
  assert.equal(v.total, 60);
});
