/**
 * Normalização de texto para comparação (currículo × vagas). Puro JavaScript, sem dependências,
 * para poder ser testado com `node --test`.
 */

/** Palavras sem valor para identificar compatibilidade (inclui termos genéricos de anúncios). */
export const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'com', 'sem', 'sob', 'e', 'ou', 'que', 'se', 'ao', 'aos', 'à', 'as', 'como', 'mais', 'muito',
  'ser', 'ter', 'estar', 'sua', 'seu', 'suas', 'seus', 'minha', 'meu', 'eu', 'ele', 'ela', 'nao', 'sim',
  // genéricos de vagas/currículos: aparecem em quase tudo e não indicam competência
  'trabalho', 'trabalhar', 'empresa', 'empresas', 'responsavel', 'responsaveis', 'atividades', 'atividade',
  'funcao', 'funcoes', 'cargo', 'vaga', 'vagas', 'area', 'areas', 'conhecimento', 'conhecimentos', 'nocoes',
  'experiencia', 'experiencias', 'profissional', 'profissionais', 'bom', 'boa', 'otimo', 'otima', 'ano', 'anos',
  'mes', 'meses', 'atual', 'atualmente', 'etc', 'diversas', 'diversos', 'geral', 'gerais',
]);

/**
 * Minúsculas, sem acentos, sem marcadores de gênero "(a)", pontuação vira espaço.
 * Mantém + e # (C++, C#). Ex.: "Técnico(a) de Enfermagem!" → "tecnico de enfermagem".
 */
export function normalizeText(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\((a|o|as|os|es)\)/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Tokens significativos (sem palavras irrelevantes, sem duplicatas). */
export function significantTokens(s = '') {
  return [...new Set(normalizeText(s).split(' ').filter((t) => t.length > 1 && !STOPWORDS.has(t)))];
}

/**
 * Cria um extrator de termos a partir de um dicionário [{ id, synonyms[] }].
 * Reconhece expressões compostas (ex.: "atendimento ao cliente") respeitando limites de palavra,
 * mapeia sinônimos para o mesmo `id` e deduplica o resultado.
 */
export function createTermExtractor(entries) {
  const phrases = [];
  for (const e of entries) {
    for (const syn of [e.label, ...(e.synonyms || [])]) {
      const p = normalizeText(syn);
      if (p) phrases.push({ id: e.id, phrase: ` ${p} ` });
    }
  }
  phrases.sort((a, b) => b.phrase.length - a.phrase.length);
  const implies = new Map(entries.filter((e) => e.implies).map((e) => [e.id, e.implies]));

  return function extract(...texts) {
    const hay = ` ${normalizeText(texts.flat().filter(Boolean).join(' . '))} `;
    const found = new Set();
    for (const { id, phrase } of phrases) if (!found.has(id) && hay.includes(phrase)) found.add(id);
    for (const id of [...found]) (implies.get(id) || []).forEach((x) => found.add(x));
    return found;
  };
}

/** Remove duplicatas ignorando maiúsculas e acentos, preservando a primeira grafia. */
export function dedupeLabels(list = []) {
  const seen = new Set();
  return list.map((s) => String(s).trim()).filter((s) => {
    const k = normalizeText(s);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
