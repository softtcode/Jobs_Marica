import 'dotenv/config';

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v != null ? n : fallback;
};
const optionalFloat = (v) => {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const ALLOWED_RADII_KM = [1, 5, 10, 15, 25, 50, 100];

export const config = {
  port: num(process.env.PORT, 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  cacheTtlMs: num(process.env.CACHE_TTL_MINUTES, 15) * 60 * 1000,

  // Geocodificação via Nominatim (OpenStreetMap). Troque NOMINATIM_BASE_URL para usar
  // uma instância própria ou de terceiros se o volume ultrapassar a política da pública.
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    contactEmail: process.env.NOMINATIM_CONTACT_EMAIL || '',
    userAgent: process.env.NOMINATIM_USER_AGENT || '',
    minIntervalMs: num(process.env.NOMINATIM_MIN_INTERVAL_MS, 1100),
    // Máximo de consultas NOVAS (fora do cache) por busca de vagas: evita geocodificação em massa.
    maxNewLookupsPerSearch: num(process.env.NOMINATIM_MAX_LOOKUPS_PER_SEARCH, 5),
    cacheFile: process.env.GEOCODE_CACHE_FILE || 'data/geocode-cache.json',
  },

  // Ponto de referência. As coordenadas NUNCA ficam fixas no código:
  // vêm do .env (HOME_LAT/HOME_LNG) ou são obtidas uma única vez pelo Nominatim (e guardadas em cache).
  home: {
    name: 'Casa do Trabalhador de Maricá',
    address:
      process.env.HOME_ADDRESS ||
      'Rua Clímaco Pereira, 189, Centro, Maricá - RJ, Brasil',
    lat: optionalFloat(process.env.HOME_LAT),
    lng: optionalFloat(process.env.HOME_LNG),
  },

  adzuna: {
    appId: process.env.ADZUNA_APP_ID || '',
    appKey: process.env.ADZUNA_APP_KEY || '',
    country: (process.env.ADZUNA_COUNTRY || 'br').toLowerCase(),
    pages: Math.min(num(process.env.ADZUNA_PAGES, 2), 5),
    maxDaysOld: num(process.env.ADZUNA_MAX_DAYS_OLD, 60),
  },

  // Modo demonstração: inclui a base local de 60 vagas FICTÍCIAS (server/src/data/demoJobs.js).
  // Ligado por padrão para o protótipo funcionar sem credenciais. Use DEMO_MODE=false para desligar.
  demoMode: !['false', '0', 'off', 'nao', 'não'].includes(String(process.env.DEMO_MODE ?? 'true').trim().toLowerCase()),

  greenhouse: {
    boards: (process.env.GREENHOUSE_BOARD_TOKENS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
};
