import { config } from '../config.js';
import { isValidCoord } from '../utils/geo.js';
import { htmlToText, detectMode } from '../utils/text.js';

export const ADZUNA_SOURCE = { id: 'adzuna', name: 'Adzuna', url: 'https://www.adzuna.com.br' };

const CONTRACT_TIME = { full_time: 'Tempo integral', part_time: 'Meio período' };
const CONTRACT_TYPE = { permanent: 'Permanente', contract: 'Contrato' };

export function isAdzunaConfigured() {
  return Boolean(config.adzuna.appId && config.adzuna.appKey);
}

/** Áreas de busca. A filtragem final por distância é sempre feita com Haversine. */
function searchAreas(radiusKm) {
  const areas = ['Maricá'];
  if (radiusKm >= 25) areas.push('Niterói');
  if (radiusKm >= 50) areas.push('Rio de Janeiro');
  return areas;
}

async function fetchPage({ what, where, distance, page }) {
  const { appId, appKey, country, maxDaysOld } = config.adzuna;
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '50');
  url.searchParams.set('where', where);
  url.searchParams.set('distance', String(distance));
  url.searchParams.set('max_days_old', String(maxDaysOld));
  url.searchParams.set('sort_by', 'date');
  if (what) url.searchParams.set('what', what);

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error('Credenciais da Adzuna recusadas (confira ADZUNA_APP_ID e ADZUNA_APP_KEY).');
  }
  if (res.status === 429) throw new Error('Limite de requisições da Adzuna atingido. Tente mais tarde.');
  if (!res.ok) throw new Error(`Adzuna respondeu HTTP ${res.status}.`);
  return res.json();
}

/** Converte um resultado bruto da Adzuna para o formato interno. */
export function normalizeAdzuna(raw) {
  const lat = Number(raw.latitude);
  const lng = Number(raw.longitude);
  const hasCoords = isValidCoord(lat, lng);

  // A Adzuna marca salários estimados por ela (salary_is_predicted = "1").
  // Estimativa não é salário divulgado pela empresa: não exibimos.
  const predicted = String(raw.salary_is_predicted) === '1';
  const min = !predicted && raw.salary_min ? Number(raw.salary_min) : null;
  const max = !predicted && raw.salary_max ? Number(raw.salary_max) : null;

  const title = htmlToText(raw.title || '');
  const description = htmlToText(raw.description || '');
  const locationText = raw.location?.display_name || null;

  return {
    id: `adzuna:${raw.id}`,
    source: ADZUNA_SOURCE.id,
    sourceName: ADZUNA_SOURCE.name,
    title,
    company: raw.company?.display_name || null,
    locationText,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
    // A API não informa a precisão das coordenadas nem o endereço da vaga:
    // tratamos sempre como aproximada (cidade/bairro).
    precision: hasCoords ? 'approximate' : 'none',
    type: 'job',
    contractTime: CONTRACT_TIME[raw.contract_time] || null,
    contractType: CONTRACT_TYPE[raw.contract_type] || null,
    mode: detectMode(title, locationText, description),
    salary: min || max ? { min, max, currency: 'BRL' } : null,
    description,
    descriptionIsPartial: true, // a Adzuna devolve apenas um trecho
    requirements: null,
    benefits: null,
    category: raw.category?.label || null,
    postedAt: raw.created || null,
    url: raw.redirect_url,
  };
}

export async function fetchAdzunaJobs({ q, radiusKm }) {
  if (!isAdzunaConfigured()) {
    const e = new Error('Adzuna não configurada (defina ADZUNA_APP_ID e ADZUNA_APP_KEY).');
    e.code = 'DISABLED';
    throw e;
  }
  const distance = Math.min(radiusKm, 100);
  const tasks = [];
  for (const where of searchAreas(radiusKm)) {
    for (let page = 1; page <= config.adzuna.pages; page++) {
      tasks.push(fetchPage({ what: q, where, distance, page }));
    }
  }
  const settled = await Promise.allSettled(tasks);
  const ok = settled.filter((s) => s.status === 'fulfilled');
  if (ok.length === 0) {
    throw settled.find((s) => s.status === 'rejected').reason;
  }
  const raws = ok.flatMap((s) => s.value.results || []);
  return raws.filter((r) => r.redirect_url && r.title).map(normalizeAdzuna);
}
