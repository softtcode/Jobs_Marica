import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { FileCache } from '../utils/fileCache.js';
import { isValidCoord } from '../utils/geo.js';
import { normalizeKey } from '../utils/text.js';
import { createNominatimProvider } from './geocodingProviders/nominatim.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DAY = 24 * 60 * 60 * 1000;
const FOUND_TTL = 90 * DAY; // endereços quase nunca mudam
const NOT_FOUND_TTL = 7 * DAY;

const cache = new FileCache(path.resolve(serverRoot, config.nominatim.cacheFile));
const provider = createNominatimProvider(config.nominatim);

/** Normaliza o texto antes da consulta (espaços, hífens de UF, duplicidades). */
export function normalizeAddress(address = '') {
  return String(address)
    .replace(/\s+/g, ' ')
    .replace(/\s+[-–—]\s+/g, ', ')
    .replace(/,\s*,+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '');
}

const cacheKey = (address) => `nominatim:${normalizeKey(normalizeAddress(address))}`;

/** Lê apenas do cache. undefined = nunca consultado; null = consultado e não encontrado. */
export function peekGeocode(address) {
  return cache.get(cacheKey(address));
}

/**
 * Geocodifica um endereço. Consulta o cache persistente primeiro; só chama o Nominatim
 * (pela fila global de 1 req/s) quando o endereço nunca foi consultado.
 * Retorna { lat, lng, displayName, precision } ou null se não encontrado.
 * Erros transitórios (rede, limite de uso) são lançados e NÃO ficam em cache.
 */
export async function geocode(address) {
  const norm = normalizeAddress(address);
  if (!norm) return null;
  const key = cacheKey(norm);

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const result = await provider.search(norm);
  cache.set(key, result, result ? FOUND_TTL : NOT_FOUND_TTL);
  return result;
}

/**
 * Geocodifica vários textos distintos com orçamento de consultas novas.
 * O que estiver em cache é sempre usado; o que exceder o orçamento fica de fora agora
 * e é resolvido em buscas futuras (o cache vai se completando aos poucos).
 */
export async function geocodeMany(addresses, { maxNew = config.nominatim.maxNewLookupsPerSearch } = {}) {
  const out = new Map();
  let budget = maxNew;
  for (const address of new Set(addresses.filter(Boolean))) {
    const cached = peekGeocode(address);
    if (cached !== undefined) {
      out.set(address, cached);
      continue;
    }
    if (budget <= 0) continue;
    budget -= 1;
    try {
      out.set(address, await geocode(address));
    } catch (err) {
      if (err.code === 'RATE_LIMITED' || err.code === 'CONFIG') break; // não insistir
    }
  }
  return out;
}

/** Remove o número do imóvel: "Rua X, 189, Centro" -> "Rua X, Centro". */
const withoutHouseNumber = (a) => a.replace(/,\s*\d+[A-Za-z]?(?=\s*,)/, '');

/**
 * Resolve o ponto de referência (Casa do Trabalhador) sem inventar coordenadas:
 *  1) HOME_LAT/HOME_LNG do .env (recomendado, após conferir no openstreetmap.org);
 *  2) Nominatim, uma única vez — depois fica no cache em disco.
 */
let homePromise = null;
export function resolveHome() {
  if (homePromise) return homePromise;
  homePromise = (async () => {
    const { name, address, lat, lng } = config.home;

    if (isValidCoord(lat, lng)) {
      return { name, address, lat, lng, source: 'env', verified: true };
    }

    try {
      const full = normalizeAddress(address);
      let hit = await geocode(full);
      let precision = hit?.precision;
      if (!hit) {
        const street = withoutHouseNumber(full);
        if (street !== full) {
          hit = await geocode(street);
          precision = 'approximate'; // só a rua: não sabemos o número
        }
      }
      if (!hit) {
        return {
          error:
            `O OpenStreetMap não encontrou o endereço "${address}". ` +
            'Confira o endereço em openstreetmap.org e informe HOME_LAT e HOME_LNG no servidor.',
        };
      }
      return {
        name,
        address: hit.displayName || address,
        lat: hit.lat,
        lng: hit.lng,
        source: 'nominatim',
        verified: precision === 'exact',
      };
    } catch (err) {
      homePromise = null; // permite nova tentativa na próxima requisição
      return {
        error:
          `Não foi possível localizar a Casa do Trabalhador: ${err.message} ` +
          'Alternativa: informe HOME_LAT e HOME_LNG no servidor.',
      };
    }
  })();
  return homePromise;
}
