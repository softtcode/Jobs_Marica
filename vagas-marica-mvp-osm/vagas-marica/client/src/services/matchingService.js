/**
 * Compatibilidade currículo × vaga — sistema de regras, 100% local (sem IA externa).
 *
 * Pontuação de 0 a 100 = média ponderada de cinco critérios (cada um de 0 a 1):
 *   skills       Competências profissionais ............ 35
 *   area         Área de interesse e cargo desejado .... 25
 *   education    Formação e escolaridade ............... 15
 *   experience   Experiência profissional .............. 15
 *   preferences  Modalidade e localização .............. 10
 *
 * Regras de transparência:
 *  - Campo do currículo não preenchido NÃO gera pontos (vale 0 naquele critério).
 *  - Se a VAGA não informa dados para um critério (ex.: escolaridade), esse critério sai do
 *    cálculo e os pesos restantes são reescalados — a vaga não é punida nem premiada.
 *  - Requisitos obrigatórios não identificados no currículo são listados à parte
 *    (`unmetRequired`) e continuam visíveis mesmo com pontuação alta.
 *  - Nenhum atributo pessoal sensível (idade, gênero, raça, religião, deficiência etc.) é usado:
 *    o perfil nem armazena esses dados.
 *  - O resultado é uma ESTIMATIVA baseada em regras, não uma probabilidade de contratação.
 */
import {
  AREA_LABEL, EDUCATION_LABEL, EDUCATION_RANK, FORMATION_AREAS, ROLES, ROLE_BY_ID, SKILLS, SKILL_BY_ID,
} from '../data/skillsDictionary.js';
import { createTermExtractor, normalizeText } from '../utils/textNormalization.js';

export const MATCH_CONFIG = {
  weights: { skills: 35, area: 25, education: 15, experience: 15, preferences: 10 },
  threshold: 60, // a partir desta pontuação a vaga entra em "Para Você"
  skillWeights: { required: 1.5, hard: 1, desired: 0.5, soft: 0.5 },
};

const extractSkills = createTermExtractor(SKILLS);
const extractRoles = createTermExtractor(ROLES);
const extractFormationAreas = createTermExtractor(FORMATION_AREAS.map((f, i) => ({ id: String(i), synonyms: f.synonyms })));
export { extractSkills, extractRoles };

const MODE_TEXT = { onsite: 'presencial', hybrid: 'híbrida', remote: 'remota' };
const CURRENT_YEAR = new Date().getFullYear();

const EDUCATION_PATTERN = /\b(ensino (medio|fundamental|superior|tecnico)|graduacao|graduado|cursando|curso tecnico|tecnico em|bacharel|licenciatura|pos graduacao|superior completo)\b/;
const EXPERIENCE_PATTERN = /\bexperiencia\b/;

const nonEmpty = (v) => (Array.isArray(v) ? v.some((x) => (typeof x === 'string' ? x.trim() : x)) : Boolean(v && String(v).trim()));

/** Indica se há dados suficientes no currículo para recomendar. */
export function hasProfileData(p) {
  if (!p) return false;
  return [p.hardSkills, p.softSkills, p.areas, p.desiredRoles, p.experiences, p.formations, p.courses]
    .some((x) => Array.isArray(x) && x.length > 0) || nonEmpty(p.objective) || nonEmpty(p.educationLevel);
}

/** Pré-processa o currículo uma vez (reutilizado para todas as vagas). */
export function prepareProfile(p) {
  const experiences = (p.experiences || []).filter((e) => nonEmpty(e.role) || nonEmpty(e.description));
  const formations = (p.formations || []).filter((f) => nonEmpty(f.course));
  const courses = (p.courses || []).filter((c) => nonEmpty(c.name));
  const skills = extractSkills(
    p.hardSkills || [], p.softSkills || [],
    courses.map((c) => c.name), formations.map((f) => f.course),
    experiences.map((e) => `${e.role || ''} ${e.description || ''}`),
    (p.languages || []).map((l) => l.name),
  );
  const desiredRoles = extractRoles(p.objective || '', p.desiredRoles || []);
  const pastRoles = extractRoles(experiences.map((e) => e.role || ''));
  const formationAreas = new Set();
  extractFormationAreas(formations.map((f) => f.course), courses.map((c) => c.name))
    .forEach((i) => FORMATION_AREAS[Number(i)].areas.forEach((a) => formationAreas.add(a)));

  const expWithYears = experiences.map((e) => {
    const start = Number(e.start);
    const end = e.current || !e.end ? CURRENT_YEAR : Number(e.end);
    const years = Number.isFinite(start) && start > 1950 && end >= start ? Math.max(0.5, end - start) : null;
    return { ...e, years, roles: extractRoles(e.role || ''), skills: extractSkills(`${e.role || ''} ${e.description || ''}`) };
  });

  return {
    raw: p,
    skills,
    desiredRoles,
    pastRoles,
    areas: new Set(p.areas || []),
    formationAreas,
    educationRank: p.educationLevel ? EDUCATION_RANK[p.educationLevel] ?? null : null,
    experiences: expWithYears,
    totalYears: expWithYears.reduce((s, e) => s + (e.years || 0), 0),
    // "Ainda não tenho experiência" é uma RESPOSTA válida (primeiro emprego), não um campo vazio.
    noExperience: Boolean(p.noExperience) && expWithYears.length === 0,
    hasExperienceInfo: expWithYears.length > 0 || Boolean(p.noExperience),
    modes: new Set(p.desiredModes || []),
    contracts: new Set(p.desiredContracts || []),
    neighborhood: normalizeText(p.neighborhood || ''),
    city: normalizeText(p.city || ''),
  };
}

/** Termos e requisitos da vaga (memorizado por id). */
const jobCache = new Map();
function prepareJob(job) {
  const key = job.id;
  if (key && jobCache.has(key)) return jobCache.get(key);
  const w = MATCH_CONFIG.skillWeights;
  const weights = new Map();
  const add = (ids, weight) => ids.forEach((id) => weights.set(id, Math.max(weights.get(id) || 0, weight)));

  const structured = Array.isArray(job.hardSkills);
  const requiredItems = (job.requirementsRequired || []).map((text) => {
    const n = normalizeText(text);
    const kind = EDUCATION_PATTERN.test(n) && !extractSkills(text).size ? 'education'
      : EXPERIENCE_PATTERN.test(n) && /\d|\b(ano|anos|mes|meses)\b/.test(n) ? 'experience' : 'skill';
    return { text, kind, terms: kind === 'skill' ? extractSkills(text) : new Set() };
  });

  if (structured) {
    add(extractSkills(job.hardSkills), w.hard);
    requiredItems.forEach((r) => add(r.terms, w.required));
    add(extractSkills(job.requirementsDesired || []), w.desired);
    add([...extractSkills(job.softSkills || [])].filter((id) => !weights.has(id)), w.soft);
  } else {
    // Vagas de fontes externas (texto livre): competências encontradas no título e na descrição.
    add(extractSkills(job.title, job.description || ''), w.hard);
  }
  const prepared = {
    weights,
    requiredItems,
    desired: extractSkills(job.requirementsDesired || []),
    roles: extractRoles(job.title || ''),
    area: job.area || null,
  };
  if (key) jobCache.set(key, prepared);
  return prepared;
}

const labelSkill = (id) => SKILL_BY_ID[id]?.label || id;

/**
 * Calcula a compatibilidade. `profile` pode ser o currículo bruto ou o resultado de prepareProfile.
 * Retorna { score, breakdown, reasons, unmetRequired, toConfirm, missingDesired }.
 */
export function computeMatch(profileInput, job, config = MATCH_CONFIG) {
  const P = profileInput?.raw ? profileInput : prepareProfile(profileInput || {});
  const J = prepareJob(job);
  const reasons = [];
  const unmetRequired = [];
  const toConfirm = [];
  const parts = {};

  // ---- 1. Competências (35) ----
  if (J.weights.size) {
    let total = 0; let got = 0; const matched = [];
    J.weights.forEach((wt, id) => { total += wt; if (P.skills.has(id)) { got += wt; matched.push({ id, wt }); } });
    parts.skills = Math.min(1, (got / total) * 1.2);
    matched.sort((a, b) => b.wt - a.wt).slice(0, 3)
      .forEach(({ id }) => reasons.push({ kind: 'skill', text: SKILL_BY_ID[id]?.type === 'soft' ? `Perfil: ${labelSkill(id).toLowerCase()}` : `Conhecimento em ${labelSkill(id)}` }));
  } else parts.skills = null;

  // ---- 2. Área de interesse e cargo desejado (25) ----
  if (J.area || J.roles.size) {
    let s = 0;
    if (J.area && P.areas.has(J.area)) { s += 0.6; reasons.push({ kind: 'area', text: `Interesse em ${AREA_LABEL[J.area] || J.area}` }); }
    const exactRole = [...J.roles].find((r) => P.desiredRoles.has(r) || P.pastRoles.has(r));
    if (exactRole) {
      s += 0.6;
      // Cita o cargo como a pessoa escreveu (ex.: "Auxiliar administrativo"), não o nome do grupo.
      const pastRole = P.experiences.find((e) => e.roles.has(exactRole))?.role?.trim();
      reasons.push({ kind: 'role', text: pastRole ? `Experiência como ${pastRole}` : `Cargo desejado: ${ROLE_BY_ID[exactRole].label}` });
    } else if (J.area && [...P.desiredRoles, ...P.pastRoles].some((r) => ROLE_BY_ID[r]?.area === J.area)) {
      s += 0.3;
      reasons.push({ kind: 'role', text: `Cargos relacionados à área de ${AREA_LABEL[J.area] || J.area}` });
    }
    parts.area = Math.min(1, s);
  } else parts.area = null;

  // ---- 3. Formação e escolaridade (15) ----
  const reqRank = job.education ? EDUCATION_RANK[job.education] : null;
  if (reqRank != null) {
    let s = 0;
    if (P.educationRank == null) {
      toConfirm.push(`Escolaridade: ${EDUCATION_LABEL[job.education]}`);
    } else if (P.educationRank >= reqRank) {
      s = 0.7;
      reasons.push({ kind: 'education', text: 'Escolaridade compatível' });
    } else {
      s = P.educationRank >= reqRank - 1 ? 0.25 : 0;
      unmetRequired.push(`Escolaridade: ${EDUCATION_LABEL[job.education]}`);
    }
    const needsFormation = reqRank >= 2.5; // técnico ou superior: a área da formação importa
    if (!needsFormation) s = s > 0 ? 1 : s;
    else if (J.area && P.formationAreas.has(J.area)) { s += 0.3; reasons.push({ kind: 'education', text: 'Formação na área da vaga' }); }
    parts.education = Math.min(1, s);
  } else parts.education = null;

  // ---- 4. Experiência (15) ----
  const relevant = P.experiences
    .filter((e) => [...e.roles].some((r) => J.roles.has(r) || ROLE_BY_ID[r]?.area === J.area)
      || [...e.skills].filter((id) => J.weights.has(id)).length >= 2)
    .reduce((s, e) => s + (e.years || 0.5), 0);
  if (Number.isFinite(job.experienceYears)) {
    const req = job.experienceYears;
    if (req === 0) {
      // Vaga de entrada: quem respondeu (com ou sem experiência) atende ao requisito por completo.
      // Só fica parcial (0,6) quando a pergunta sobre experiência não foi respondida.
      parts.experience = relevant > 0 || P.hasExperienceInfo ? 1 : 0.6;
      reasons.push({ kind: 'experience', text: relevant > 0 ? 'Experiência relacionada à vaga' : P.noExperience ? 'Vaga aberta a quem busca o primeiro emprego' : 'A vaga não exige experiência' });
    } else if (relevant >= req) {
      parts.experience = 1;
      reasons.push({ kind: 'experience', text: `Experiência relacionada (${formatYears(relevant)})` });
    } else {
      parts.experience = P.totalYears >= req ? 0.5 : 0.5 * Math.min(1, relevant / req);
      if (!P.hasExperienceInfo) toConfirm.push(`Experiência: ${job.experienceText || `${req} ano(s)`}`);
      else unmetRequired.push(`Experiência: ${job.experienceText || `${req} ano(s)`}`);
    }
  } else parts.experience = null;

  // ---- 5. Modalidade e localização (10) ----
  {
    let s = 0;
    if (job.mode && P.modes.has(job.mode)) { s += 0.5; reasons.push({ kind: 'preference', text: `Modalidade ${MODE_TEXT[job.mode]} compatível` }); }
    if (job.contractType && P.contracts.has(job.contractType)) { s += 0.3; reasons.push({ kind: 'preference', text: `Contratação ${job.contractType} desejada` }); }
    if (job.mode === 'remote') {
      if (P.modes.has('remote')) s += 0.2;
    } else if (job.neighborhood && P.neighborhood && normalizeText(job.neighborhood) === P.neighborhood) {
      s += 0.2; reasons.push({ kind: 'location', text: `No seu bairro (${job.neighborhood})` });
    } else if (P.city.includes('marica') && /marica/i.test(normalizeText(job.locationText || ''))) {
      s += 0.1; reasons.push({ kind: 'location', text: 'Localização compatível (Maricá)' });
    }
    parts.preferences = Math.min(1, s);
  }

  // ---- Requisitos obrigatórios ----
  for (const r of J.requiredItems) {
    if (r.kind !== 'skill') continue; // escolaridade e experiência já foram verificadas acima
    // "Experiência com/em X": atendido pela competência X OU por experiência relacionada à vaga.
    if (EXPERIENCE_PATTERN.test(normalizeText(r.text)) && relevant > 0) continue;
    if (r.terms.size === 0) toConfirm.push(r.text);
    else if (![...r.terms].some((id) => P.skills.has(id))) unmetRequired.push(r.text);
  }
  const missingDesired = [...J.desired].filter((id) => !P.skills.has(id)).map(labelSkill);

  // ---- Pontuação final ----
  let sumW = 0; let sum = 0;
  for (const [k, w] of Object.entries(config.weights)) {
    if (parts[k] == null) continue;
    sumW += w; sum += w * parts[k];
  }
  const score = sumW ? Math.round((sum / sumW) * 100) : 0;

  return {
    score,
    breakdown: Object.fromEntries(Object.entries(config.weights).map(([k, w]) => [k, {
      weight: w, value: parts[k], points: parts[k] == null ? null : Math.round(parts[k] * w),
    }])),
    reasons: dedupeReasons(reasons),
    unmetRequired: [...new Set(unmetRequired)],
    toConfirm: [...new Set(toConfirm)],
    missingDesired,
  };
}

function dedupeReasons(list) {
  const seen = new Set();
  return list.filter((r) => (seen.has(r.text) ? false : seen.add(r.text)));
}

function formatYears(y) {
  const n = Math.round(y);
  return n <= 0 ? 'menos de 1 ano' : `${n} ${n === 1 ? 'ano' : 'anos'}`;
}

/**
 * Calcula a compatibilidade de várias vagas e separa "Para Você" (score ≥ limite) de
 * "Outras Vagas". As listas são mutuamente exclusivas; "Para Você" é ordenada pela pontuação.
 */
export function splitByMatch(jobs, profile, config = MATCH_CONFIG) {
  const P = prepareProfile(profile);
  const scored = jobs.map((job) => ({ job, match: computeMatch(P, job, config) }));
  const forYou = scored.filter((s) => s.match.score >= config.threshold).sort((a, b) => b.match.score - a.match.score);
  const others = scored.filter((s) => s.match.score < config.threshold);
  return { forYou, others, matches: new Map(scored.map((s) => [s.job.id, s.match])) };
}

export const CRITERIA_LABELS = {
  skills: 'Competências profissionais',
  area: 'Área de interesse e cargo desejado',
  education: 'Formação e escolaridade',
  experience: 'Experiência profissional',
  preferences: 'Modalidade e localização',
};
