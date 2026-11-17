import { RateLimitedQueue } from '../../utils/rateLimitedQueue.js';
import { isValidCoord } from '../../utils/geo.js';

const PUBLIC_HOST = 'nominatim.openstreetmap.org';

export class GeocodingError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code; // 'CONFIG' | 'RATE_LIMITED' | 'NETWORK' | 'HTTP'
  }
}

/**
 * Provedor Nominatim (OpenStreetMap). Para trocar de provedor no futuro, crie outro
 * arquivo com a mesma interface — `search(query) -> { lat, lng, displayName, precision } | null` —
 * e use-o em services/geocoding.js. Para uma instância própria ou de terceiros, basta
 * definir NOMINATIM_BASE_URL.
 *
 * Política da instância pública: máx. 1 req/s, User-Agent identificando o app,
 * sem geocodificação em massa, e resultados devem ser guardados em cache.
 */
export function createNominatimProvider({
  baseUrl,
  userAgent,
  contactEmail,
  minIntervalMs = 1100,
  fetchImpl = (...args) => fetch(...args),
  queue,
} = {}) {
  const url = new URL(baseUrl);
  const isPublic = url.hostname === PUBLIC_HOST;
  const q = queue || new RateLimitedQueue(isPublic ? Math.max(minIntervalMs, 1100) : minIntervalMs);
  let blockedUntil = 0;

  function identification() {
    if (userAgent) return userAgent;
    if (contactEmail) return `VagasMarica/1.0 (projeto de extensao universitaria; contato: ${contactEmail})`;
    return null;
  }

  async function request(query) {
    const ua = identification();
    if (isPublic && !ua) {
      throw new GeocodingError(
        'A instância pública do Nominatim exige identificação do app. Defina NOMINATIM_CONTACT_EMAIL ' +
          '(ou NOMINATIM_USER_AGENT) no servidor.',
        'CONFIG',
      );
    }
    if (Date.now() < blockedUntil) {
      throw new GeocodingError('Geocodificação em pausa após limite de uso do Nominatim.', 'RATE_LIMITED');
    }

    const endpoint = new URL('/search', url);
    endpoint.searchParams.set('q', query);
    endpoint.searchParams.set('format', 'jsonv2');
    endpoint.searchParams.set('limit', '1');
    endpoint.searchParams.set('addressdetails', '1');
    endpoint.searchParams.set('countrycodes', 'br');
    endpoint.searchParams.set('accept-language', 'pt-BR');
    if (contactEmail) endpoint.searchParams.set('email', contactEmail);

    let res;
    try {
      res = await fetchImpl(endpoint, {
        headers: { 'User-Agent': ua || 'VagasMarica/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      throw new GeocodingError(`Falha de rede no Nominatim: ${err.message}`, 'NETWORK');
    }

    if (res.status === 429 || res.status === 403) {
      const retry = Number(res.headers.get('retry-after'));
      blockedUntil = Date.now() + (Number.isFinite(retry) && retry > 0 ? retry * 1000 : 60_000);
      throw new GeocodingError('Limite de uso do Nominatim atingido. Tente novamente mais tarde.', 'RATE_LIMITED');
    }
    if (!res.ok) throw new GeocodingError(`Nominatim respondeu HTTP ${res.status}.`, 'HTTP');
    return res.json();
  }

  return {
    name: 'nominatim',
    /** Devolve o melhor resultado ou null (nunca inventa coordenadas). */
    async search(query) {
      const results = await q.schedule(() => request(query));
      const best = Array.isArray(results) ? results[0] : null;
      if (!best) return null;

      const lat = Number(best.lat);
      const lng = Number(best.lon);
      if (!isValidCoord(lat, lng)) return null;

      // Preciso somente quando o OSM encontrou o número do imóvel/edificação.
      const exact = Boolean(best.address?.house_number) || ['house', 'building'].includes(best.addresstype);
      return {
        lat,
        lng,
        displayName: best.display_name,
        osmType: `${best.category || ''}/${best.type || ''}`,
        precision: exact ? 'exact' : 'approximate',
      };
    },
  };
}
