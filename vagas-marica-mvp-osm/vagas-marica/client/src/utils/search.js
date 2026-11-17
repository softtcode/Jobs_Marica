/**
 * Estado de busca <-> parâmetros da URL, filtros, ordenação e montagem das listas.
 * Funções puras (testadas com node --test) compartilhadas por /vagas e /mapa, para que
 * lista e mapa mostrem SEMPRE o mesmo subconjunto de vagas.
 *
 *   /vagas?q=vendedor&bairro=itaipuacu&raio=10&tipo=emprego&modalidade=presencial&contratacao=clt
 *          &area=vendas&empresa=<id>&salario=2000&semSalario=0&ordem=recentes&aba=para-voce&vaga=<id>
 */
import { AREAS, CONTRACT_TYPES } from '../data/skillsDictionary.js';
import { normalizeText } from './textNormalization.js';

export const RADII = [1, 5, 10, 15, 25, 50, 100]; // mesmo conjunto aceito pelo backend (/api/jobs)
export const DEFAULT_REFERENCE = 'centro';

// 25 km cobre todo o município de Maricá a partir do Centro.
export const DEFAULT_FILTERS = {
  q: '', ref: DEFAULT_REFERENCE, radiusKm: 25, type: 'all', mode: 'all', contract: 'all', area: 'all',
  company: '', salaryMin: '', includeNoSalary: true, sort: '',
};

export const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'job', label: 'Emprego' },
  { value: 'freelance', label: 'Freelance' },
];

export const MODE_OPTIONS = [
  { value: 'all', label: 'Qualquer' },
  { value: 'onsite', label: 'Presencial' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'remote', label: 'Remoto' },
];

export const CONTRACT_OPTIONS = [{ value: 'all', label: 'Todas' }, ...CONTRACT_TYPES.map((c) => ({ value: c, label: c }))];
export const AREA_OPTIONS = [{ value: 'all', label: 'Todas as áreas' }, ...AREAS.map((a) => ({ value: a.id, label: a.label }))];

export const TABS = { forYou: 'para-voce', others: 'outras' };

export const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância', needs: 'query' },
  { value: 'compatibilidade', label: 'Maior compatibilidade', needs: 'resume' },
  { value: 'distancia', label: 'Menor distância' },
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'salario', label: 'Maior salário inicial' },
];

const slug = (s) => normalizeText(s).replace(/ /g, '-');
const TYPE_TO_URL = { job: 'emprego', freelance: 'freelance' };
const MODE_TO_URL = { onsite: 'presencial', hybrid: 'hibrido', remote: 'remoto' };
const CONTRACT_TO_URL = Object.fromEntries(CONTRACT_TYPES.map((c) => [c, slug(c)]));
const invert = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const TYPE_FROM_URL = invert(TYPE_TO_URL);
const MODE_FROM_URL = invert(MODE_TO_URL);
const CONTRACT_FROM_URL = invert(CONTRACT_TO_URL);
const AREA_IDS = new Set(AREAS.map((a) => a.id));
const SORT_IDS = new Set(SORT_OPTIONS.map((s) => s.value));
const ID_PATTERN = /^[a-z0-9-]{1,60}$/; // o backend valida o bairro contra a lista permitida

export function parseFilters(params) {
  const radius = Number(params.get('raio'));
  const salary = params.get('salario');
  const ref = params.get('bairro');
  const company = params.get('empresa');
  return {
    q: (params.get('q') || '').slice(0, 100),
    ref: ref && ID_PATTERN.test(ref) ? ref : DEFAULT_REFERENCE,
    radiusKm: RADII.includes(radius) ? radius : DEFAULT_FILTERS.radiusKm,
    type: TYPE_FROM_URL[params.get('tipo')] || 'all',
    mode: MODE_FROM_URL[params.get('modalidade')] || 'all',
    contract: CONTRACT_FROM_URL[params.get('contratacao')] || 'all',
    area: AREA_IDS.has(params.get('area')) ? params.get('area') : 'all',
    company: company && ID_PATTERN.test(company) ? company : '',
    salaryMin: salary && /^\d+$/.test(salary) ? salary : '',
    includeNoSalary: params.get('semSalario') !== '0',
    sort: SORT_IDS.has(params.get('ordem')) ? params.get('ordem') : '',
  };
}

export const parseTab = (params) => (params.get('aba') === TABS.others ? 'others' : 'forYou');

/** Gera os parâmetros omitindo valores padrão (URLs curtas). */
export function filtersToParams(f, extra = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.ref && f.ref !== DEFAULT_REFERENCE) p.set('bairro', f.ref);
  if (f.radiusKm !== DEFAULT_FILTERS.radiusKm) p.set('raio', String(f.radiusKm));
  if (f.type && f.type !== 'all') p.set('tipo', TYPE_TO_URL[f.type]);
  if (f.mode && f.mode !== 'all') p.set('modalidade', MODE_TO_URL[f.mode]);
  if (f.contract && f.contract !== 'all') p.set('contratacao', CONTRACT_TO_URL[f.contract]);
  if (f.area && f.area !== 'all') p.set('area', f.area);
  if (f.company) p.set('empresa', f.company);
  if (f.salaryMin !== '' && f.salaryMin != null) {
    p.set('salario', String(f.salaryMin));
    if (!f.includeNoSalary) p.set('semSalario', '0');
  }
  if (f.sort) p.set('ordem', f.sort);
  Object.entries(extra).forEach(([k, v]) => v != null && v !== '' && p.set(k, v));
  return p;
}

export const searchHref = (path, filters, extra) => {
  const qs = filtersToParams({ ...DEFAULT_FILTERS, ...filters }, extra).toString();
  return qs ? `${path}?${qs}` : path;
};

/** Quantos filtros (além da palavra-chave e da ordenação) diferem do padrão. */
export function activeFilterCount(f) {
  return [
    f.ref !== DEFAULT_REFERENCE,
    f.radiusKm !== DEFAULT_FILTERS.radiusKm,
    f.type !== 'all',
    f.mode !== 'all',
    f.contract !== 'all',
    f.area !== 'all',
    Boolean(f.company),
    f.salaryMin !== '',
  ].filter(Boolean).length;
}

/**
 * Salário inicial de uma vaga: o LIMITE INFERIOR da faixa (salário fixo = min = max).
 * Vagas sem salário ou só com teto ("até R$ X") não têm salário inicial conhecido → null.
 * Nunca inventamos um valor.
 */
export const startingSalary = (job) => (job.salary && job.salary.min ? job.salary.min : null);

/** Filtros aplicados no navegador sobre o resultado já distribuído por distância. */
export function applyClientFilters(list, f) {
  const min = f.salaryMin === '' ? null : Number(f.salaryMin);
  return list.filter((j) => {
    if (f.type !== 'all' && j.type !== f.type) return false;
    if (f.mode !== 'all' && j.mode !== f.mode) return false;
    if (f.contract !== 'all' && j.contractType !== f.contract) return false;
    if (f.area !== 'all' && j.area !== f.area) return false;
    if (f.company && j.companyId !== f.company) return false;
    if (min != null) {
      const value = startingSalary(j);
      if (value == null) return f.includeNoSalary;
      if (value < min) return false;
    }
    return true;
  });
}

/** Ordenações disponíveis: só aparecem as que os dados suportam. */
export function availableSorts({ hasQuery, hasResume }) {
  return SORT_OPTIONS.filter((o) => (o.needs === 'query' ? hasQuery : o.needs === 'resume' ? hasResume : true));
}

/**
 * Ordenação efetiva: a escolhida (se disponível) ou o padrão do contexto —
 * aba "Para Você" → compatibilidade; com busca → relevância; senão → menor distância.
 */
export function effectiveSort(sort, { tab, tabsActive, hasQuery, hasResume }) {
  const available = new Set(availableSorts({ hasQuery, hasResume }).map((o) => o.value));
  if (sort && available.has(sort)) return sort;
  if (tabsActive && tab === 'forYou') return 'compatibilidade';
  return hasQuery ? 'relevancia' : 'distancia';
}

const last = (v) => (v == null ? Infinity : v);
const COMPARATORS = {
  relevancia: (a, b) => last(a.matchTier) - last(b.matchTier) || last(a.distanceKm) - last(b.distanceKm),
  distancia: (a, b) => last(a.distanceKm) - last(b.distanceKm),
  recentes: (a, b) => (Date.parse(b.postedAt) || -Infinity) - (Date.parse(a.postedAt) || -Infinity),
  salario: (a, b) => (startingSalary(b) ?? -1) - (startingSalary(a) ?? -1)
    || (b.salary?.max ?? -1) - (a.salary?.max ?? -1),
};

/** Ordena sem alterar a lista original (ordenação estável). */
export function sortJobs(list, sort, matches) {
  const cmp = sort === 'compatibilidade'
    ? (a, b) => (matches?.get(b.id)?.score ?? -1) - (matches?.get(a.id)?.score ?? -1) || COMPARATORS.distancia(a, b)
    : COMPARATORS[sort] || COMPARATORS.distancia;
  return [...list].sort(cmp);
}

/**
 * Monta o que a lista e o mapa exibem, na ordem: filtros → compatibilidade (aba) → grupo do
 * marcador → ordenação → seções. `jobs` (com coordenadas) alimenta o mapa; a lista usa `sections`.
 * Com busca e ordenação por relevância, separa "correspondências" de "relacionadas".
 */
export function computeVisible({ data, filters, matching = null, tab = 'forYou', tabsActive = false, sort, focusGroup = null }) {
  if (!data) return { jobs: [], unlocated: [], total: 0, sections: [], exactCount: 0, titleCount: 0 };
  let jobs = applyClientFilters(data.jobs, filters);
  let unlocated = applyClientFilters(data.unlocated, filters);
  if (tabsActive && matching) {
    const ids = new Set((tab === 'forYou' ? matching.forYou : matching.others).map((s) => s.job.id));
    jobs = jobs.filter((j) => ids.has(j.id));
    unlocated = unlocated.filter((j) => ids.has(j.id));
  }
  if (focusGroup) { jobs = jobs.filter((j) => focusGroup.includes(j.id)); unlocated = []; }
  const matches = matching?.matches;
  jobs = sortJobs(jobs, sort, matches);
  unlocated = sortJobs(unlocated, sort, matches);

  const all = [...jobs, ...unlocated];
  const exactCount = all.filter((j) => j.matchTier != null && j.matchTier <= 2).length; // título ou cargo equivalente
  const titleCount = all.filter((j) => j.matchTier === 1).length;                      // título exato
  let sections;
  if (sort === 'relevancia' && filters.q) {
    const ordered = sortJobs(all, 'relevancia');
    sections = [
      { key: 'match', title: null, jobs: ordered.filter((j) => j.matchTier == null || j.matchTier <= 2) },
      { key: 'related', title: 'Oportunidades relacionadas', note: 'Cargos relacionados ou que pedem competências parecidas com a sua busca.', jobs: ordered.filter((j) => j.matchTier > 2) },
    ];
  } else {
    sections = [
      { key: 'located', title: null, jobs },
      { key: 'unlocated', title: 'Sem localização no mapa', note: 'Vagas remotas ou sem localização conhecida: não aparecem no mapa nem têm distância calculada.', jobs: unlocated },
    ];
  }
  return { jobs, unlocated, total: all.length, sections: sections.filter((s) => s.jobs.length), exactCount, titleCount };
}

export const nextRadius = (km) => RADII.find((r) => r > km) ?? null;
