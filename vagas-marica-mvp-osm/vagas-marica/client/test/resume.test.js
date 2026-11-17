// Importação de currículo: extração real dos arquivos de exemplo (PDF e DOCX) + interpretação do texto.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseResumeText, ResumeTextError } from '../src/services/resumeParser.js';
import { computeMatch } from '../src/services/matchingService.js';
import { DEMO_JOBS } from '../../server/src/data/demoJobs.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/exemplos');

async function pdfText(file) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(file)), isEvalSupported: false, useSystemFonts: false, disableFontFace: true }).promise;
  const lines = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const { items } = await (await doc.getPage(i)).getTextContent();
    let line = ''; let lastY = null;
    for (const it of items) {
      const y = it.transform[5];
      if (lastY != null && Math.abs(y - lastY) > 2 && line) { lines.push(line); line = ''; }
      line += it.str; lastY = y;
      if (it.hasEOL) { lines.push(line); line = ''; lastY = null; }
    }
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

function checkDraft(draft) {
  assert.equal(draft.name, 'Marina Exemplo dos Santos');
  assert.equal(draft.city, 'Maricá');
  assert.equal(draft.neighborhood, 'Itaipuaçu');
  assert.match(draft.objective, /assistente administrativo/i);
  assert.ok(draft.desiredRoles.includes('Assistente administrativo'));
  assert.equal(draft.educationLevel, 'tecnico-cursando');
  assert.equal(draft.experiences.length, 2);
  assert.equal(draft.experiences[0].role, 'Auxiliar administrativo');
  assert.equal(draft.experiences[0].company, 'Comércio Fictício Ltda');
  assert.equal(draft.experiences[0].start, '2021');
  assert.equal(draft.experiences[0].end, '2024');
  assert.match(draft.experiences[0].description, /contas a pagar/);
  assert.ok(draft.formations.some((f) => /Técnico em Administração/.test(f.course) && f.status === 'cursando'));
  assert.ok(draft.courses.some((c) => /Excel/.test(c.name) && c.hours === '40'));
  for (const s of ['Excel', 'Pacote Office', 'Rotinas administrativas', 'Atendimento ao cliente']) assert.ok(draft.hardSkills.includes(s), s);
  for (const s of ['Organização', 'Comunicação', 'Trabalho em equipe', 'Proatividade']) assert.ok(draft.softSkills.includes(s), s);
  assert.ok(!draft.hardSkills.includes('Inglês') && !draft.hardSkills.includes('Espanhol')); // idiomas ficam só em Idiomas
  assert.deepEqual(draft.languages, [{ name: 'Inglês', level: 'Básico' }, { name: 'Espanhol', level: 'Intermediário' }]);
  assert.ok(draft.areas.includes('administracao'));
  assert.deepEqual(draft.desiredContracts, ['CLT']);
  assert.deepEqual(draft.desiredModes.sort(), ['hybrid', 'onsite']);
  // Privacidade: identificadores e contatos não entram no rascunho.
  const json = JSON.stringify(draft);
  assert.ok(!json.includes('000.000.000') && !json.includes('@') && !json.includes('90000'));
}

test('DOCX de exemplo: texto extraído e campos sugeridos', async () => {
  const { value } = await mammoth.extractRawText({ path: path.join(dir, 'curriculo-exemplo.docx') });
  checkDraft(parseResumeText(value).draft);
});

test('PDF de exemplo: texto extraído e campos sugeridos', async () => {
  const text = await pdfText(path.join(dir, 'curriculo-exemplo.pdf'));
  checkDraft(parseResumeText(text).draft);
});

test('currículo importado gera recomendação coerente', async () => {
  const { value } = await mammoth.extractRawText({ path: path.join(dir, 'curriculo-exemplo.docx') });
  const { draft } = parseResumeText(value);
  const job = DEMO_JOBS.find((j) => j.title === 'Assistente administrativo');
  assert.ok(computeMatch(draft, job).score >= 60);
});

test('arquivo sem texto extraível gera erro explicativo (sem OCR)', () => {
  assert.throws(() => parseResumeText('   \n  '), ResumeTextError);
});
