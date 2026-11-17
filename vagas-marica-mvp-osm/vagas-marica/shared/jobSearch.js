/**
 * Busca de vagas por palavra-chave, tolerante à forma como as pessoas escrevem.
 * Usada pelo backend (vagas demonstrativas e classificação das vagas de fontes externas)
 * e pelos testes. Sem dependências externas.
 *
 * Trata: acentos, maiúsculas, singular/plural, masculino/feminino, abreviações ("aux adm"),
 * pequenos erros de digitação ("motorsta"), expressões compostas e início de palavra ("recep").
 *
 * Níveis de relevância (quanto menor, mais relevante):
 *   1 TITLE       — o título da vaga contém todos os termos pesquisados
 *   2 EQUIVALENT  — cargo equivalente (mesmo grupo de cargos; ex.: auxiliar ⇄ assistente administrativo)
 *   3 RELATED     — cargo relacionado (relação explícita ou mesma área; programas como estágio/aprendiz)
 *   4 SKILLS      — a busca aparece nas competências, requisitos ou descrição (todos os termos)
 * Cargos relacionados NÃO são tratados como idênticos: aparecem depois, como sugestões.
 */
import { ABBREVIATIONS, ROLES, ROLE_BY_ID, ROLE_RELATIONS, ROLE_SKILLS, SKILLS } from './professionalTerms.js';
import { normalizeText, STOPWORDS } from './textNormalization.js';

export const TIER = { TITLE: 1, EQUIVALENT: 2, RELATED: 3, SKILLS: 4 };
export const TIER_LABEL = {
  1: 'Cargo pesquisado',
  2: 'Cargo equivalente',
  3: 'Cargo relacionado',
  4: 'Competências relacionadas',
};

/** Radical simples: unifica plural e gênero ("vendedoras" → "vendedor", "técnica" → "tecnic"). */
export function stem(token) {
  let t = token;
  if (t.length > 4) {
    if (t.endsWith('oes') || t.endsWith('aes')) t = `${t.slice(0, -3)}ao`;
    else if (t.endsWith('ais')) t = `${t.slice(0, -3)}al`;
    else if (t.endsWith('eis')) t = `${t.slice(0, -3)}el`;
    else if (/(r|z|l)es$/.test(t)) t = t.slice(0, -2);
    else if (t.endsWith('s')) t = t.slice(0, -1);
  }
  if (t.length > 4 && /[aeo]$/.test(t)) t = t.slice(0, -1);
  return t;
}

/** Tokens comparáveis: normalizados, sem palavras irrelevantes, abreviações expandidas, com radical. */
export function searchTokens(text) {
  const out = [];
  for (const raw of normalizeText(text).split(' ')) {
    if (!raw || STOPWORDS.has(raw)) continue;
    const expanded = ABBREVIATIONS[raw] ? normalizeText(ABBREVIATIONS[raw]).split(' ') : [raw];
    for (const t of expanded) if (t && !STOPWORDS.has(t)) out.push(stem(t));
  }
  return out;
}

/** Distância de edição (Levenshtein) com limite — interrompe cedo quando passa do máximo. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Um termo da busca corresponde a uma palavra do texto se for igual, tiver um pequeno erro de
 * digitação (1 letra em palavras de 6+ letras; 2 em palavras de 11+) ou for o início dela (4+ letras).
 */
export function tokenMatches(q, t) {
  if (q === t) return true;
  const len = Math.min(q.length, t.length);
  const max = len >= 11 ? 2 : 1;
  if (len >= 6 && editDistance(q, t, max) <= max) return true;
  return q.length >= 4 && t.startsWith(q);
}

const allIn = (queryTokens, textTokens) => queryTokens.every((q) => textTokens.some((t) => tokenMatches(q, t)));

function phraseIn(phrase, tokens) {
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (!tokenMatches(phrase[j], tokens[i + j])) continue outer;
    return true;
  }
  return false;
}

// Sinônimos de cargo pré-processados. "Programas" (estágio, aprendiz, trainee) não tornam
// dois cargos equivalentes: a vaga "Estágio em administração" é relacionada, não idêntica.
const PROGRAM = /^(estagi|jovem|traine)/;
// Uma expressão que perde palavras de conteúdo ao remover termos genéricos (ex.: "experiência do
// cliente" → "cliente") ficaria ampla demais; só preposições e artigos podem ser descartados.
const PREPOSITIONS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'ao', 'aos', 'com', 'para', 'por']);
function phraseTokens(s) {
  const tokens = searchTokens(s);
  const content = normalizeText(s).split(' ').filter((w) => w && !PREPOSITIONS.has(w)).length;
  return tokens.length >= content ? tokens : [];
}
const ROLE_PHRASES = ROLES.flatMap((r) => [r.label, ...r.synonyms].map((s) => {
  const tokens = phraseTokens(s);
  return { id: r.id, tokens, program: PROGRAM.test(tokens[0] || '') };
})).filter((p) => p.tokens.length);
const SKILL_PHRASES = SKILLS.flatMap((s) => [s.label, ...s.synonyms].map((x) => ({ id: s.id, tokens: phraseTokens(x) })))
  .filter((p) => p.tokens.length && p.tokens.join('').length >= 3);

/** Cargos reconhecidos num texto: `core` (cargo em si) e `program` (estágio/aprendiz/trainee em X). */
export function detectRoles(text) {
  const tokens = searchTokens(text);
  const core = new Set();
  const program = new Set();
  for (const p of ROLE_PHRASES) {
    if (phraseIn(p.tokens, tokens)) (p.program ? program : core).add(p.id);
  }
  return { core, program, all: new Set([...core, ...program]) };
}

function detectSkills(tokens) {
  const found = new Set();
  for (const p of SKILL_PHRASES) if (phraseIn(p.tokens, tokens)) found.add(p.id);
  return found;
}

// Só relações explícitas: "mesma área" seria amplo demais (recepcionista ≠ repositor).
function relatedRoles(roleIds) {
  const out = new Set();
  for (const id of roleIds) {
    (ROLE_RELATIONS[id] || []).forEach((r) => out.add(r));
    for (const [k, list] of Object.entries(ROLE_RELATIONS)) if (list.includes(id)) out.add(k);
  }
  roleIds.forEach((id) => out.delete(id));
  return out;
}

/** Prepara a consulta uma única vez (reutilizada para todas as vagas). */
export function prepareQuery(q) {
  const tokens = searchTokens(q);
  if (!tokens.length) return null;
  const roles = detectRoles(q).all;
  const skills = detectSkills(tokens); // competências digitadas pela pessoa
  const roleSkills = new Set();        // competências típicas do cargo pesquisado
  roles.forEach((r) => (ROLE_SKILLS[r] || []).forEach((s) => roleSkills.add(s)));
  return { q, tokens, roles, related: relatedRoles(roles), skills, roleSkills };
}

const jobCache = new WeakMap();
function prepareJob(job) {
  if (jobCache.has(job)) return jobCache.get(job);
  const skillText = [
    ...(job.hardSkills || []), ...(job.softSkills || []), ...(job.keywords || []),
    ...(job.requirementsRequired || []), ...(job.requirementsDesired || []),
  ].join(' . ');
  const restText = [
    job.description, job.requirements, job.category, job.areaLabel, job.company,
    job.neighborhood, job.locationText, job.contractType, ...(job.responsibilities || []),
  ].filter(Boolean).join(' . ');
  const skillTokens = searchTokens(skillText);
  const prepared = {
    titleTokens: searchTokens(job.title || ''),
    roles: detectRoles(job.title || ''),
    skills: detectSkills(skillTokens),
    // Competências técnicas/obrigatórias apenas (sem as comportamentais, que são genéricas).
    coreSkills: detectSkills(searchTokens([...(job.hardSkills || []), ...(job.requirementsRequired || [])].join(' . '))),
    textTokens: [...skillTokens, ...searchTokens(restText)],
  };
  jobCache.set(job, prepared);
  return prepared;
}

/** Nível de relevância de uma vaga para a busca (0 = não corresponde). */
export function matchTier(query, job) {
  const Q = typeof query === 'string' ? prepareQuery(query) : query;
  if (!Q) return null;
  const J = prepareJob(job);
  if (allIn(Q.tokens, J.titleTokens)) return TIER.TITLE;
  if ([...Q.roles].some((r) => J.roles.core.has(r))) return TIER.EQUIVALENT;
  if ([...Q.roles].some((r) => J.roles.program.has(r)) || [...Q.related].some((r) => J.roles.all.has(r))) return TIER.RELATED;
  if ([...Q.skills].some((s) => J.skills.has(s)) || [...Q.roleSkills].some((s) => J.coreSkills.has(s))
    || allIn(Q.tokens, J.textTokens)) return TIER.SKILLS;
  return 0;
}

/**
 * Filtra e classifica vagas pela busca. Sem termos relevantes, devolve todas sem nível.
 * Cada vaga recebe `matchTier` (1 a 4). A ordem original é mantida dentro de cada nível.
 */
export function searchJobsByQuery(q, jobs) {
  const Q = prepareQuery(q);
  if (!Q) return jobs.map((j) => ({ ...j, matchTier: null }));
  return jobs
    .map((j) => ({ ...j, matchTier: matchTier(Q, j) }))
    .filter((j) => j.matchTier > 0);
}
