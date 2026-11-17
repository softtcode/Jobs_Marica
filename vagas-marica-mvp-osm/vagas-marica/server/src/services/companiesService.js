import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeKey } from '../utils/text.js';
import { getDemoJobsByCompany } from './demoJobs.js';

/**
 * Avaliações de empresas (DEMONSTRATIVAS).
 * Todas as médias e posições são calculadas a partir dos registros de demoReviews.json.
 *
 *  - "Mais bem avaliadas": maior média geral, somente entre empresas com pelo menos
 *    MIN_REVIEWS_FOR_RANKING avaliações (poucas avaliações não entram no ranking de nota).
 *  - "Mais populares": maior quantidade de avaliações (não diz nada sobre a qualidade).
 */
export const MIN_REVIEWS_FOR_RANKING = 10;

export const CRITERIA_LABELS = {
  ambiente: 'Ambiente de trabalho',
  remuneracao: 'Remuneração e benefícios',
  crescimento: 'Oportunidades de crescimento',
  gestao: 'Gestão e liderança',
  equilibrio: 'Equilíbrio entre vida pessoal e profissional',
};

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../data');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));

const round1 = (n) => Math.round(n * 10) / 10;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Agrega os registros de uma empresa. Exportada para os testes. */
export function aggregate(reviews) {
  const criteria = Object.keys(CRITERIA_LABELS);
  const overallPerReview = reviews.map((r) => mean(criteria.map((c) => r.ratings[c])));
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  overallPerReview.forEach((v) => { distribution[Math.min(5, Math.max(1, Math.round(v)))] += 1; });
  return {
    reviewCount: reviews.length,
    average: reviews.length ? round1(mean(overallPerReview)) : null,
    averageExact: reviews.length ? mean(overallPerReview) : null,
    criteria: Object.fromEntries(criteria.map((c) => [c, reviews.length ? round1(mean(reviews.map((r) => r.ratings[c]))) : null])),
    distribution,
    lastReviewAt: reviews.reduce((acc, r) => (r.createdAt > acc ? r.createdAt : acc), '') || null,
  };
}

/** Aplica as regras de ranking e devolve as posições calculadas. Exportada para os testes. */
export function rankCompanies(list, minReviews = MIN_REVIEWS_FOR_RANKING) {
  const eligible = list
    .filter((c) => c.reviewCount >= minReviews)
    .sort((a, b) => b.averageExact - a.averageExact || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name, 'pt-BR'));
  const ratingRank = new Map(eligible.map((c, i) => [c.id, i + 1]));
  const popular = [...list].sort((a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name, 'pt-BR'));
  const popularityRank = new Map(popular.map((c, i) => [c.id, i + 1]));
  return list.map((c) => ({
    ...c,
    rankingEligible: c.reviewCount >= minReviews,
    ratingRank: ratingRank.get(c.id) ?? null,
    popularityRank: popularityRank.get(c.id),
  }));
}

let cached = null;
function load() {
  if (cached) return cached;
  const { companies } = readJson('demoCompanies.json');
  const { reviews } = readJson('demoReviews.json');
  const byCompany = new Map(companies.map((c) => [c.id, []]));
  for (const r of reviews) byCompany.get(r.companyId)?.push(r);
  const withStats = companies.map((c) => ({ ...c, simulated: true, ...aggregate(byCompany.get(c.id)) }));
  cached = { list: rankCompanies(withStats), byCompany };
  return cached;
}

const strip = ({ averageExact, ...rest }) => rest;

export function listCompanies({ q = '', sector = '', sort = 'rating' } = {}) {
  const { list } = load();
  const nq = normalizeKey(q);
  let out = list.filter((c) => (!nq || normalizeKey(`${c.name} ${c.sector}`).includes(nq)) && (!sector || c.sector === sector));
  if (sort === 'popular') out = out.sort((a, b) => a.popularityRank - b.popularityRank);
  else if (sort === 'name') out = out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  else {
    // Elegíveis primeiro, por posição de nota; as demais depois, por quantidade de avaliações.
    out = out.sort((a, b) => (a.ratingRank ?? Infinity) - (b.ratingRank ?? Infinity) || b.reviewCount - a.reviewCount);
  }
  return {
    companies: out.map(strip),
    sectors: [...new Set(list.map((c) => c.sector))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    criteria: CRITERIA_LABELS,
    minReviewsForRanking: MIN_REVIEWS_FOR_RANKING,
    simulated: true,
  };
}

export function getCompany(id) {
  const { list, byCompany } = load();
  const company = list.find((c) => c.id === id);
  if (!company) return null;
  const recent = [...byCompany.get(id)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map((r) => ({ id: r.id, createdAt: r.createdAt, ratings: r.ratings }));
  return {
    company: strip(company),
    criteria: CRITERIA_LABELS,
    recentReviews: recent,
    // Vagas demonstrativas só existem para as empresas fictícias.
    jobs: company.isReal ? [] : getDemoJobsByCompany(company.id).map((j) => ({
      id: j.id, title: j.title, contractType: j.contractType, mode: j.mode, neighborhood: j.neighborhood,
    })),
    totalCompanies: list.length,
    minReviewsForRanking: MIN_REVIEWS_FOR_RANKING,
    simulated: true,
  };
}
