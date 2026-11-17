/**
 * Extração de TEXTO de currículos em PDF ou DOCX, inteiramente no navegador.
 * O arquivo não é enviado a nenhum servidor e não é guardado: só o texto é lido em memória.
 *
 * Segurança:
 *  - aceita apenas .pdf e .docx (o .docm, com macros, e o .doc antigo são recusados);
 *  - confere a assinatura binária do arquivo (não confia só na extensão);
 *  - PDF: pdf.js com `isEvalSupported: false` e sem scripts, formulários XFA ou recursos externos;
 *  - DOCX: mammoth lê apenas o texto; macros e conteúdo ativo não são executados.
 * As bibliotecas são carregadas sob demanda (não pesam no carregamento inicial do site).
 */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_PAGES = 15;

export class ResumeFileError extends Error {}

function kindOf(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.doc') || name.endsWith('.docm')) {
    throw new ResumeFileError('Arquivos .doc e .docm não são aceitos. Salve o currículo como .docx (sem macros) ou PDF e tente de novo.');
  }
  throw new ResumeFileError('Formato não suportado. Envie um arquivo PDF ou DOCX.');
}

/** Valida formato, tamanho e assinatura. Lança ResumeFileError com mensagem amigável. */
export async function validateResumeFile(file) {
  if (!file) throw new ResumeFileError('Nenhum arquivo selecionado.');
  const kind = kindOf(file);
  if (file.size === 0) throw new ResumeFileError('O arquivo está vazio.');
  if (file.size > MAX_FILE_BYTES) throw new ResumeFileError('O arquivo tem mais de 5 MB. Envie uma versão menor.');
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
  const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04; // PK..
  if (kind === 'pdf' && !isPdf) throw new ResumeFileError('O arquivo não parece ser um PDF válido.');
  if (kind === 'docx' && !isZip) throw new ResumeFileError('O arquivo não parece ser um DOCX válido.');
  return kind;
}

async function pdfToText(buffer) {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      enableXfa: false,
      disableFontFace: true,
      useSystemFonts: false,
      stopAtErrors: false,
    }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new ResumeFileError('O PDF está protegido por senha. Remova a proteção e tente de novo.');
    throw new ResumeFileError('Não foi possível ler o PDF. O arquivo pode estar corrompido.');
  }
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const out = [];
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = '';
    let lastY = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform?.[5];
      if (lastY != null && y != null && Math.abs(y - lastY) > 2 && line) { out.push(line); line = ''; }
      line += item.str;
      lastY = y;
      if (item.hasEOL) { out.push(line); line = ''; lastY = null; }
    }
    if (line) out.push(line);
    out.push('');
  }
  await doc.destroy();
  return out.join('\n');
}

async function docxToText(buffer) {
  const mod = await import('mammoth');
  const mammoth = mod.default || mod;
  try {
    const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
    return value;
  } catch {
    throw new ResumeFileError('Não foi possível ler o DOCX. O arquivo pode estar corrompido.');
  }
}

/** Valida e extrai o texto do arquivo. */
export async function extractResumeText(file) {
  const kind = await validateResumeFile(file);
  const buffer = await file.arrayBuffer();
  return kind === 'pdf' ? pdfToText(buffer) : docxToText(buffer);
}
