import { config } from '../config.js';
import { TtlCache } from '../utils/cache.js';
import { haversineKm, isValidCoord } from '../utils/geo.js';
import { normalizeKey } from '../utils/text.js';
import { ADZUNA_SOURCE, fetchAdzunaJobs } from './adzuna.js';
import { GREENHOUSE_SOURCE, fetchGreenhouseJobs } from './greenhouse.js';
import { FREELANCE_STATUS, fetchFreelanceJobs } from './freelance.js';
import { DEMO_SOURCE, isDemoEnabled, searchDemoJobs } from './demoJobs.js';
import { matchTier, prepareQuery, TIER } from '../../../shared/jobSearch.js';

const cache = new TtlCache(config.cacheTtlMs);
const MAX_UNLOCATED = 60;

/** Executa uma fonte e devolve { jobs, status } sem nunca lançar exceção. */
async function runSource(meta, fn, cacheKey, force) {
  try {
    const { jobs, cachedAt } = await cache.wrap(
      cacheKey,
      async () => ({ jobs: await fn(), cachedAt: new Date().toISOString() }),
      { force },
    );
    return {
      jobs,
      status: { id: meta.id, name: meta.name, status: 'ok', count: jobs.length, fetchedAt: cachedAt },
    };
  } catch (err) {
    const disabled = err.code === 'DISABLED';
    return {
      jobs: [],
      status: {
        id: meta.id,
        name: meta.name,
        status: disabled ? 'disabled' : 'error',
        count: 0,
        message: err.message,
      },
    };
  }
}

/** Remove duplicatas por URL e por título + empresa + local. */
export function dedupe(jobs) {
  const seenUrl = new Set();
  const seenKey = new Set();
  const out = [];
  for (const j of jobs) {
    const urlKey = (j.url || '').split('?')[0];
    const k = `${normalizeKey(j.title)}|${normalizeKey(j.company || '')}|${normalizeKey(j.locationText || '')}`;
    if (urlKey && seenUrl.has(urlKey)) continue;
    if (seenKey.has(k)) continue;
    if (urlKey) seenUrl.add(urlKey);
    seenKey.add(k);
    out.push(j);
  }
  return out;
}

/**
 * Posiciona as vagas em relação ao centro:
 *  - com coordenadas: calcula distância (Haversine) e mantém só as dentro do raio;
 *  - sem coordenadas: vai para `unlocated`, sem posição artificial.
 */
export function partitionByDistance(jobs, center, radiusKm) {
  const located = [];
  const unlocated = [];
  for (const j of jobs) {
    if (isValidCoord(j.lat, j.lng)) {
      const d = haversineKm(center.lat, center.lng, j.lat, j.lng);
      if (d <= radiusKm) located.push({ ...j, distanceKm: Math.round(d * 10) / 10 });
    } else {
      unlocated.push({
        ...j,
        lat: null,
        lng: null,
        precision: 'none',
        distanceKm: null,
        unlocatedReason: j.mode === 'remote' ? 'remote' : 'no-coordinates',
      });
    }
  }
  located.sort((a, b) => a.distanceKm - b.distanceKm);
  return { located, unlocated };
}

export async function searchJobs({ q, radiusKm, type, center, force }) {
  const key = (src) => `${src}:${normalizeKey(q)}:${radiusKm}`;

  const wantFreelance = type === 'freelance';
  const wantJobs = type !== 'freelance';

  const [adzuna, greenhouse] = wantJobs
    ? await Promise.all([
        runSource(ADZUNA_SOURCE, () => fetchAdzunaJobs({ q, radiusKm }), key('adzuna'), force),
        runSource(GREENHOUSE_SOURCE, () => fetchGreenhouseJobs({ q }), key('greenhouse'), force),
      ])
    : [
        { jobs: [], status: { id: 'adzuna', name: 'Adzuna', status: 'skipped', count: 0 } },
        { jobs: [], status: { id: 'greenhouse', name: 'Greenhouse', status: 'skipped', count: 0 } },
      ];

  const freelanceJobs = wantFreelance ? await fetchFreelanceJobs({ q, radiusKm }) : [];

  // Modo demonstração: vagas fictícias locais, filtradas pela palavra-chave e pelo tipo.
  const demo = isDemoEnabled();
  const demoJobs = demo
    ? searchDemoJobs({ q }).filter((j) => type === 'all' || j.type === type)
    : [];

  // Vagas externas já vêm filtradas pela própria fonte; aqui só recebem o nível de relevância
  // (sem correspondência local, ficam no nível mais baixo em vez de serem descartadas).
  const query = prepareQuery(q);
  const external = [...adzuna.jobs, ...greenhouse.jobs, ...freelanceJobs]
    .map((j) => ({ ...j, matchTier: query ? matchTier(query, j) || TIER.SKILLS : null }));

  const merged = dedupe([...demoJobs, ...external]);
  const { located, unlocated } = partitionByDistance(merged, center, radiusKm);

  const sources = [adzuna.status, greenhouse.status];
  if (demo) sources.unshift({ id: DEMO_SOURCE.id, name: DEMO_SOURCE.name, status: 'ok', count: demoJobs.length });

  return {
    center,
    radiusKm,
    jobs: located,
    unlocated: unlocated.slice(0, MAX_UNLOCATED),
    unlocatedTotal: unlocated.length,
    sources,
    freelance: FREELANCE_STATUS,
    demo, // campo adicional: true quando há vagas fictícias no resultado
    fetchedAt: new Date().toISOString(),
  };
}
