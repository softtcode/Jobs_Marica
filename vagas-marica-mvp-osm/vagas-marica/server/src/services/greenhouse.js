import { config } from '../config.js';
import { geocodeMany } from './geocoding.js';
import { greenhouseContentToText, detectMode, normalizeKey } from '../utils/text.js';

export const GREENHOUSE_SOURCE = { id: 'greenhouse', name: 'Greenhouse', url: 'https://www.greenhouse.com' };

// Só geocodificamos localizações com indício de estarem na região (evita consultas à toa).
const REGION_HINT =
  /brasil|brazil|\bbr\b|rio de janeiro|niter[oó]i|maric[aá]|itabora[ií]|saquarema|, rj\b|itaipua[cç]u|ino[aã]/i;

export function isGreenhouseConfigured() {
  return config.greenhouse.boards.length > 0;
}

async function fetchBoard(token) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) throw new Error(`Quadro "${token}" não encontrado.`);
  if (!res.ok) throw new Error(`Greenhouse respondeu HTTP ${res.status} para "${token}".`);
  const data = await res.json();
  return (data.jobs || []).map((j) => ({ ...j, _board: token }));
}

/** Filtra por região e termo de busca. Devolve null se a vaga não interessa. */
function prepareGreenhouse(raw, { q }) {
  const locationText = raw.location?.name || null;
  const isRemoteText = locationText && /remot|remote/i.test(locationText);
  const inRegion = locationText && REGION_HINT.test(locationText);
  if (!inRegion && !isRemoteText) return null;

  const title = raw.title || '';
  const description = greenhouseContentToText(raw.content || '');
  if (q) {
    const hay = normalizeKey(`${title} ${description}`);
    const terms = normalizeKey(q).split(' ').filter(Boolean);
    if (!terms.every((t) => hay.includes(t))) return null;
  }
  return { raw, locationText, isRemoteText, inRegion, title, description };
}

function normalizeGreenhouse({ raw, locationText, isRemoteText, inRegion, title, description }, geo) {
  let lat = null, lng = null, precision = 'none';
  if (inRegion && !isRemoteText) {
    const g = geo.get(locationText); // null/undefined = sem localização confiável
    if (g) { lat = g.lat; lng = g.lng; precision = g.precision; }
  }

  return {
    id: `greenhouse:${raw._board}:${raw.id}`,
    source: GREENHOUSE_SOURCE.id,
    sourceName: `Greenhouse (${raw._board})`,
    title,
    company: raw.company_name || raw._board,
    locationText,
    lat, lng, precision,
    type: 'job',
    contractTime: null,
    contractType: null,
    mode: detectMode(locationText, title),
    salary: null, // o quadro público não traz salário estruturado
    description,
    descriptionIsPartial: false,
    requirements: null,
    benefits: null,
    category: raw.departments?.[0]?.name || null,
    postedAt: raw.first_published || raw.updated_at || null,
    url: raw.absolute_url,
  };
}

export async function fetchGreenhouseJobs({ q }) {
  if (!isGreenhouseConfigured()) {
    const e = new Error('Greenhouse sem quadros configurados (GREENHOUSE_BOARD_TOKENS).');
    e.code = 'DISABLED';
    throw e;
  }
  const boards = await Promise.allSettled(config.greenhouse.boards.map(fetchBoard));
  const okBoards = boards.filter((b) => b.status === 'fulfilled');
  if (okBoards.length === 0) throw boards[0].reason;

  const prepared = okBoards
    .flatMap((b) => b.value)
    .map((raw) => prepareGreenhouse(raw, { q }))
    .filter(Boolean);

  // Geocodifica só localizações distintas, com cache persistente e orçamento por busca.
  const geo = await geocodeMany(
    prepared.filter((p) => p.inRegion && !p.isRemoteText).map((p) => p.locationText),
  );

  return prepared.map((p) => normalizeGreenhouse(p, geo)).filter((j) => j.url);
}
