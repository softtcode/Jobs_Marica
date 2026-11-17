const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
};

export function decodeEntities(s = '') {
  return s
    .replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** Converte HTML em texto simples, preservando quebras de linha e itens de lista. */
export function htmlToText(html = '') {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<\s*br\s*\/?>/gi, '\n');
  s = s.replace(/<\/\s*(p|div|h[1-6]|ul|ol)\s*>/gi, '\n\n');
  s = s.replace(/<\s*li[^>]*>/gi, '• ');
  s = s.replace(/<\/\s*li\s*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Greenhouse devolve o HTML escapado (&lt;p&gt;...). Decodifica e converte. */
export function greenhouseContentToText(content = '') {
  return htmlToText(decodeEntities(content));
}

export function normalizeKey(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Só devolve modalidade se o texto da própria vaga a mencionar. */
export function detectMode(...texts) {
  const t = texts.filter(Boolean).join(' ').toLowerCase();
  if (/h[ií]brid/.test(t)) return 'hybrid';
  if (/\b(home ?office|remoto|remote|trabalho remoto|100% remot)/.test(t)) return 'remote';
  if (/\bpresencial\b/.test(t)) return 'onsite';
  return null;
}
