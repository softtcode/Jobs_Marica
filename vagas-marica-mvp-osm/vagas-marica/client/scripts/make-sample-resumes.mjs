/**
 * Gera os currículos de EXEMPLO (pessoa fictícia) usados para testar e demonstrar a importação:
 *   client/public/exemplos/curriculo-exemplo.pdf
 *   client/public/exemplos/curriculo-exemplo.docx
 * Os dados são inventados; CPF, telefone e e-mail são marcadores falsos (para mostrar que são ignorados).
 *   node client/scripts/make-sample-resumes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/exemplos');
fs.mkdirSync(outDir, { recursive: true });

const LINES = [
  ['h1', 'MARINA EXEMPLO DOS SANTOS'],
  ['p', 'Maricá - RJ · Itaipuaçu'],
  ['p', 'Telefone: (21) 90000-0000 | E-mail: marina@exemplo.com'],
  ['p', 'CPF: 000.000.000-00'],
  ['h2', 'OBJETIVO'],
  ['p', 'Atuar como assistente administrativo, com interesse em vagas CLT presenciais ou híbridas.'],
  ['h2', 'EXPERIÊNCIA PROFISSIONAL'],
  ['p', 'Auxiliar administrativo - Comércio Fictício Ltda (2021 - 2024)'],
  ['li', 'Controle de contas a pagar e lançamento de notas fiscais'],
  ['li', 'Organização de documentos e atendimento a fornecedores'],
  ['p', 'Atendente de loja - Loja Exemplo (2019 - 2021)'],
  ['li', 'Atendimento ao cliente e operação de caixa'],
  ['h2', 'FORMAÇÃO'],
  ['p', 'Ensino médio completo - Colégio Estadual Exemplo (2018)'],
  ['p', 'Técnico em Administração - Escola Técnica Exemplo (cursando)'],
  ['h2', 'CURSOS COMPLEMENTARES'],
  ['p', 'Excel intermediário - Instituto Exemplo (40h)'],
  ['p', 'Atendimento ao cliente - Curso online (20h)'],
  ['h2', 'COMPETÊNCIAS'],
  ['p', 'Excel, Pacote Office, rotinas administrativas, atendimento ao público'],
  ['p', 'Organização, comunicação, trabalho em equipe, proatividade'],
  ['h2', 'IDIOMAS'],
  ['p', 'Inglês - Básico'],
  ['p', 'Espanhol - Intermediário'],
  ['p', ''],
  ['p', 'Documento fictício criado para demonstrar o Jobs Maricá.'],
];

// ---------------- PDF (texto real, fonte Helvetica, WinAnsiEncoding) ----------------
function pdf() {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let y = 790;
  const ops = ['BT'];
  for (const [kind, text] of LINES) {
    const size = kind === 'h1' ? 18 : kind === 'h2' ? 12 : 10.5;
    y -= kind === 'h2' ? 22 : kind === 'h1' ? 4 : 15;
    const t = kind === 'li' ? `• ${text}` : text;
    ops.push(`/F${kind.startsWith('h') ? 2 : 1} ${size} Tf 1 0 0 1 ${kind === 'li' ? 62 : 50} ${y} Tm (${esc(t)}) Tj`);
    if (kind === 'h1') y -= 10;
  }
  ops.push('ET');
  const stream = Buffer.from(ops.join('\n').replace(/•/g, '\x95'), 'latin1');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    null, // stream
  ];
  const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = [];
  let pos = parts[0].length;
  objs.forEach((o, i) => {
    offsets.push(pos);
    const body = o === null
      ? Buffer.concat([Buffer.from(`${i + 1} 0 obj\n<< /Length ${stream.length} >>\nstream\n`, 'latin1'), stream, Buffer.from('\nendstream\nendobj\n', 'latin1')])
      : Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, 'latin1');
    parts.push(body);
    pos += body.length;
  });
  const xref = [`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`, ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)].join('');
  parts.push(Buffer.from(`${xref}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`, 'latin1'));
  return Buffer.concat(parts);
}

// ---------------- DOCX (OOXML mínimo, sem macros) ----------------
async function docx() {
  const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const para = ([kind, text]) => {
    const rPr = kind.startsWith('h') ? `<w:rPr><w:b/><w:sz w:val="${kind === 'h1' ? 36 : 24}"/></w:rPr>` : '';
    const t = kind === 'li' ? `• ${text}` : text;
    return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r></w:p>`;
  };
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${LINES.map(para).join('')}</w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

fs.writeFileSync(path.join(outDir, 'curriculo-exemplo.pdf'), pdf());
fs.writeFileSync(path.join(outDir, 'curriculo-exemplo.docx'), await docx());
console.log('Currículos de exemplo gerados em', outDir);
