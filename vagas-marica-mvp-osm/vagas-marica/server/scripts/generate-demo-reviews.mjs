/**
 * Gera server/src/data/demoReviews.json — avaliações SIMULADAS, sem texto e sem autores.
 * Cada registro tem apenas notas de 1 a 5 em cinco critérios. As médias exibidas no site são
 * CALCULADAS a partir destes registros (services/companiesService.js), nunca fixadas na interface.
 *
 * Determinístico (semente fixa): rodar de novo produz o mesmo arquivo.
 *   node server/scripts/generate-demo-reviews.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../src/data');
const { companies } = JSON.parse(fs.readFileSync(path.join(dataDir, 'demoCompanies.json'), 'utf8'));

export const CRITERIA = ['ambiente', 'remuneracao', 'crescimento', 'gestao', 'equilibrio'];

// PRNG com semente (mulberry32) para resultados reproduzíveis.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261116);
const between = (a, b) => a + rand() * (b - a);
const clamp = (v) => Math.min(5, Math.max(1, Math.round(v)));

const reviews = [];
const start = new Date('2026-01-01T12:00:00Z').getTime();
const span = 300 * 86_400_000;

for (const company of companies) {
  // Quantidade e tendência sorteadas: não refletem nenhuma reputação real.
  const count = Math.round(between(4, 64));
  // Tendência geral sorteada + variação por critério (sem isso, as médias ficariam todas iguais).
  // Marcas reais ficam numa faixa neutra (3,2–4,0): uma nota inventada nunca deve sugerir que uma empresa
  // real é muito boa ou muito ruim. As fictícias usam a escala toda para demonstrar o ranking.
  const overall = company.isReal ? between(3.2, 4.0) : between(2.3, 4.7);
  const bias = Object.fromEntries(CRITERIA.map((c) => [c, overall + between(-0.6, 0.6)]));
  for (let i = 0; i < count; i++) {
    const mood = between(-0.9, 0.9); // variação geral de cada registro
    const ratings = Object.fromEntries(CRITERIA.map((c) => [c, clamp(bias[c] + mood + between(-0.8, 0.8))]));
    reviews.push({
      id: `${company.id}-${String(i + 1).padStart(3, '0')}`,
      companyId: company.id,
      ratings,
      createdAt: new Date(start + rand() * span).toISOString().slice(0, 10),
      simulated: true,
    });
  }
}

const out = {
  _aviso: 'Avaliações SIMULADAS para demonstração. Não representam opiniões de funcionários reais nem a reputação verdadeira de nenhuma empresa.',
  criteria: CRITERIA,
  reviews,
};
fs.writeFileSync(path.join(dataDir, 'demoReviews.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${reviews.length} avaliações simuladas geradas para ${companies.length} empresas.`);
