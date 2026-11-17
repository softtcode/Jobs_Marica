/**
 * Interpreta o TEXTO de um currículo (já extraído de PDF/DOCX) e sugere campos do perfil.
 * Regras simples e locais (sem IA externa). O resultado é apenas uma SUGESTÃO: a pessoa
 * revisa e corrige tudo antes de salvar.
 *
 * Privacidade: e-mail, telefone, CPF, RG, data de nascimento, estado civil e similares são
 * IGNORADOS de propósito — não são necessários para recomendar vagas.
 */
import {
  CONTRACT_TYPES, FORMATION_AREAS, LANGUAGES, LANGUAGE_LEVELS, MARICA_NEIGHBORHOODS, ROLE_BY_ID, SKILL_BY_ID,
} from '../data/skillsDictionary.js';
import { createTermExtractor, dedupeLabels, normalizeText } from '../utils/textNormalization.js';
import { extractRoles, extractSkills } from './matchingService.js';

const SECTIONS = {
  objective: ['objetivo', 'objetivo profissional', 'objetivos', 'resumo profissional', 'perfil profissional', 'resumo', 'sobre mim', 'perfil'],
  experience: ['experiencia', 'experiencias', 'experiencia profissional', 'experiencias profissionais', 'historico profissional'],
  education: ['formacao', 'formacao academica', 'escolaridade', 'educacao', 'formacao escolar'],
  courses: ['cursos', 'cursos complementares', 'cursos e certificacoes', 'certificacoes', 'qualificacoes', 'capacitacoes', 'cursos livres'],
  skills: ['competencias', 'habilidades', 'conhecimentos', 'competencias tecnicas', 'habilidades tecnicas', 'conhecimentos tecnicos', 'competencias comportamentais', 'habilidades comportamentais', 'soft skills', 'informatica'],
  languages: ['idiomas', 'linguas', 'idioma'],
  other: ['informacoes adicionais', 'dados pessoais', 'contato', 'contatos', 'referencias', 'disponibilidade', 'outras informacoes'],
};
const HEADING = new Map(Object.entries(SECTIONS).flatMap(([k, list]) => list.map((h) => [h, k])));

const SENSITIVE = /\b(cpf|rg|identidade|data de nascimento|nascimento|nascid[oa]|estado civil|idade|naturalidade|nacionalidade|sexo|genero|religiao|e mail|email|telefone|celular|whatsapp|linkedin)\b/;
const YEARS = /((?:19|20)\d{2})\s*(?:-|–|—|a|ate|até|\/)\s*((?:19|20)\d{2}|atual|atualmente|o momento|presente|hoje|cursando)/i;
const SPLIT = /\s+[-–—|@•]\s+|\s*\|\s*/;

const extractFormation = createTermExtractor(FORMATION_AREAS.map((f, i) => ({ id: String(i), synonyms: f.synonyms })));

export class ResumeTextError extends Error {}

function sectionOf(line) {
  const n = normalizeText(line);
  if (!n || n.split(' ').length > 5) return null;
  return HEADING.get(n) || null;
}

function titleCase(s) {
  const small = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return s.toLowerCase().split(/\s+/).map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

function detectName(lines) {
  for (const line of lines.slice(0, 6)) {
    if (sectionOf(line) || SENSITIVE.test(normalizeText(line))) continue;
    if (/[\d@:/]/.test(line) || /curr[ií]culo/i.test(line)) continue;
    const words = line.trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 6 && /^[A-Za-zÀ-ÿ' ]+$/.test(line.trim())) return titleCase(line.trim());
  }
  return '';
}

function detectEducation(text) {
  let best = null; let bestRank = 0;
  const consider = (id, rank) => { if (rank > bestRank) { best = id; bestRank = rank; } };
  for (const raw of text.split('\n')) {
    const n = normalizeText(raw);
    if (!n) continue;
    const ongoing = /\b(cursando|em andamento|incompleto|previsao|periodo|em curso)\b/.test(n);
    if (/\b(pos graduacao|especializacao|mba|mestrado|doutorado)\b/.test(n)) consider('pos', 5);
    if (/\b(graduacao|bacharelado|bacharel|licenciatura|tecnologo|ensino superior|faculdade|universidade)\b/.test(n)) consider(ongoing ? 'superior-cursando' : 'superior', ongoing ? 3 : 4);
    if (/\b(curso tecnico|tecnico em|ensino tecnico)\b/.test(n)) consider(ongoing ? 'tecnico-cursando' : 'tecnico', ongoing ? 2.5 : 3);
    if (/\bensino medio\b|\b2o grau\b|\bsegundo grau\b/.test(n)) consider(ongoing ? 'medio-cursando' : 'medio', ongoing ? 1.5 : 2);
    if (/\bensino fundamental\b|\b1o grau\b/.test(n)) consider('fundamental', 1);
  }
  return best;
}

function splitEntry(line) {
  const clean = line.replace(YEARS, '').replace(/\b(19|20)\d{2}\b/g, '').replace(/\b(cursando|em andamento|concluído|concluido)\b/gi, '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim().replace(/[-–—,|]\s*$/, '').trim();
  const parts = clean.split(SPLIT).map((s) => s.trim()).filter(Boolean);
  return parts;
}

function yearsOf(line) {
  const m = line.match(YEARS);
  if (!m) return null;
  const endRaw = normalizeText(m[2]);
  const current = !/^\d{4}$/.test(endRaw);
  return { start: m[1], end: current ? '' : m[2], current };
}

function parseExperiences(lines) {
  const out = [];
  let cur = null;
  for (const line of lines) {
    if (SENSITIVE.test(normalizeText(line))) continue;
    const yrs = yearsOf(line);
    const roles = extractRoles(line);
    const bullet = /^[•\-*–]\s*/.test(line);
    const startsEntry = !bullet && (roles.size > 0 || (yrs && (!cur || cur.start)));
    if (startsEntry) {
      const parts = splitEntry(line);
      const roleIdx = Math.max(0, parts.findIndex((p) => extractRoles(p).size > 0));
      cur = {
        role: parts[roleIdx] || '',
        company: parts.find((_, i) => i !== roleIdx) || '',
        start: yrs?.start || '', end: yrs?.end || '', current: Boolean(yrs?.current),
        description: '',
      };
      out.push(cur);
    } else if (cur && yrs && !cur.start) {
      Object.assign(cur, { start: yrs.start, end: yrs.end, current: yrs.current });
    } else if (cur) {
      const text = line.replace(/^[•\-*–]\s*/, '');
      if ((cur.description + text).length < 400) cur.description = cur.description ? `${cur.description}; ${text}` : text;
    }
  }
  return out.slice(0, 8);
}

function parseFormations(lines) {
  return lines
    .filter((l) => /gradua|bachar|licencia|tecn[oó]logo|t[eé]cnico|ensino|p[oó]s|mba|especializa|faculdade|universidade|curso superior/i.test(l))
    .map((l) => {
      const parts = splitEntry(l);
      const n = normalizeText(l);
      return {
        course: parts[0] || l.trim(),
        institution: parts[1] || '',
        status: /\b(cursando|em andamento|previsao|incompleto|periodo)\b/.test(n) ? 'cursando' : 'concluido',
      };
    })
    .slice(0, 6);
}

function parseCourses(lines) {
  return lines
    .filter((l) => normalizeText(l).length > 2 && !sectionOf(l))
    .map((l) => {
      const hours = l.match(/(\d{1,4})\s*(h|horas)\b/i);
      const parts = splitEntry(l.replace(/^[•\-*–]\s*/, '').replace(/\(?\d{1,4}\s*(h|horas)\)?/i, ''));
      return { name: parts[0] || l.trim(), institution: parts[1] || '', hours: hours ? hours[1] : '' };
    })
    .filter((c) => c.name.length > 2)
    .slice(0, 10);
}

function parseLanguages(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const n = normalizeText(raw);
    for (const lang of LANGUAGES) {
      if (out.some((l) => l.name === lang)) continue;
      if (!new RegExp(`\\b${normalizeText(lang)}\\b`).test(n)) continue;
      const level = LANGUAGE_LEVELS.find((lv) => n.includes(normalizeText(lv))) || (/\bnativo\b/.test(n) ? 'Fluente' : '');
      out.push({ name: lang, level });
    }
  }
  return out.filter((l) => l.name !== 'Português');
}

/** Converte o texto do currículo em sugestões de preenchimento. */
export function parseResumeText(text) {
  const clean = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  if (clean.replace(/\s/g, '').length < 40) {
    throw new ResumeTextError('Não encontramos texto suficiente no arquivo. Ele pode ser uma imagem escaneada — a leitura de imagens (OCR) não está disponível nesta versão.');
  }
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = { header: [] };
  let current = 'header';
  for (const line of lines) {
    const s = sectionOf(line.replace(/:$/, ''));
    if (s) { current = s; sections[s] = sections[s] || []; continue; }
    (sections[current] = sections[current] || []).push(line);
  }
  const safeText = lines.filter((l) => !SENSITIVE.test(normalizeText(l))).join('\n');

  const objective = (sections.objective || []).filter((l) => !SENSITIVE.test(normalizeText(l))).join(' ').slice(0, 400);
  const desiredRoleIds = extractRoles(objective);
  const experiences = parseExperiences(sections.experience || lines.filter((l) => YEARS.test(l) && extractRoles(l).size));
  const formations = parseFormations(sections.education || []);
  const courses = parseCourses(sections.courses || []);

  const skillIds = extractSkills(safeText);
  const LANGUAGE_SKILLS = new Set(['ingles', 'espanhol']); // vão para a seção Idiomas, não para competências
  const hardSkills = [...skillIds].filter((id) => SKILL_BY_ID[id].type === 'hard' && !LANGUAGE_SKILLS.has(id)).map((id) => SKILL_BY_ID[id].label);
  const softSkills = [...skillIds].filter((id) => SKILL_BY_ID[id].type === 'soft').map((id) => SKILL_BY_ID[id].label);

  const areas = new Set();
  [...desiredRoleIds, ...extractRoles(experiences.map((e) => e.role))].forEach((r) => areas.add(ROLE_BY_ID[r].area));
  extractFormation(formations.map((f) => f.course), courses.map((c) => c.name))
    .forEach((i) => FORMATION_AREAS[Number(i)].areas.forEach((a) => areas.add(a)));

  const norm = normalizeText(safeText);
  const neighborhood = MARICA_NEIGHBORHOODS.find((b) => norm.includes(normalizeText(b))) || '';
  const city = /\bmarica\b/.test(norm) || neighborhood ? 'Maricá'
    : ['Niterói', 'São Gonçalo', 'Itaboraí', 'Rio de Janeiro', 'Saquarema'].find((c) => norm.includes(normalizeText(c))) || '';

  const objNorm = normalizeText(objective);
  const desiredContracts = CONTRACT_TYPES.filter((c) => new RegExp(`\\b${normalizeText(c)}\\b`).test(objNorm));
  const desiredModes = [
    /\b(remoto|home office|teletrabalho)\b/.test(norm) && 'remote',
    /\bhibrid[oa]s?\b/.test(norm) && 'hybrid',
    /\bpresenc(ial|iais)\b/.test(norm) && 'onsite',
  ].filter(Boolean);

  const draft = {
    name: detectName(lines),
    objective,
    desiredRoles: [...desiredRoleIds].map((r) => ROLE_BY_ID[r].label),
    city, neighborhood,
    educationLevel: detectEducation((sections.education || lines).join('\n')) || '',
    formations, courses, experiences,
    hardSkills: dedupeLabels(hardSkills), softSkills: dedupeLabels(softSkills),
    languages: parseLanguages(safeText),
    desiredContracts, desiredModes,
    areas: [...areas].slice(0, 5),
  };

  const found = Object.entries(draft)
    .filter(([, v]) => (Array.isArray(v) ? v.length : Boolean(v)))
    .map(([k]) => k);
  return { draft, found, ignoredSensitive: lines.length - safeText.split('\n').length };
}
