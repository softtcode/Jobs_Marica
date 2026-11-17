// Testes do algoritmo de recomendação (node --test). Sem dependências externas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, significantTokens, dedupeLabels } from '../src/utils/textNormalization.js';
import { computeMatch, hasProfileData, MATCH_CONFIG, splitByMatch, extractSkills, extractRoles } from '../src/services/matchingService.js';
import { AREAS, EDUCATION_LEVELS } from '../src/data/skillsDictionary.js';
import { DEMO_JOBS, AREA_LABELS, EDUCATION_LABELS } from '../../server/src/data/demoJobs.js';

const byTitle = (t) => DEMO_JOBS.find((j) => j.title === t);

const ADMIN = {
  name: 'Pessoa Exemplo',
  objective: 'Atuar como assistente administrativo',
  city: 'Maricá', neighborhood: 'Centro',
  educationLevel: 'medio',
  experiences: [{ role: 'Auxiliar administrativo', company: 'Loja X', start: '2021', end: '2024', description: 'Controle de contas a pagar e planilhas' }],
  hardSkills: ['Planilhas', 'Pacote Office', 'Atendimento ao público'],
  softSkills: ['Organização', 'Comunicação'],
  areas: ['administracao'],
  desiredModes: ['onsite'], desiredContracts: ['CLT'],
};

test('normalização: minúsculas, sem acentos, sem "(a)" e sem pontuação', () => {
  assert.equal(normalizeText('Técnico(a) de Enfermagem!'), 'tecnico de enfermagem');
  assert.equal(normalizeText('  NR-10 / Node.js  '), 'nr 10 node js');
  assert.equal(normalizeText('Ação Coração'), 'acao coracao');
});

test('palavras irrelevantes e genéricas são removidas', () => {
  assert.deepEqual(significantTokens('Responsável pelo trabalho na empresa de vendas'), ['vendas']);
  assert.equal(extractSkills('Responsável pelo trabalho na empresa').size, 0);
});

test('sinônimos: "Planilhas" e "Microsoft Excel" viram a mesma competência', () => {
  assert.ok(extractSkills('Planilhas').has('excel'));
  assert.ok(extractSkills('Microsoft Excel').has('excel'));
  assert.ok(extractSkills('tabela dinâmica e PROCV').has('excel')); // excel avançado implica excel
  assert.ok(extractSkills('Suporte ao consumidor').has('atendimento'));
  assert.ok(extractSkills('Atendimento ao cliente').has('atendimento'));
});

test('cargos relacionados: desenvolvedor, programador e software developer', () => {
  for (const t of ['Desenvolvedor', 'Programadora', 'Software Developer', 'Desenvolvedor(a) Full Stack']) {
    assert.ok(extractRoles(t).has('desenvolvedor'), t);
  }
});

test('expressões compostas respeitam limites de palavra', () => {
  assert.ok(!extractSkills('redes sociais').has('redes'));
  assert.ok(extractSkills('redes de computadores').has('redes'));
  assert.ok(!extractSkills('javascript').has('java'));
});

test('deduplicação ignora acentos e maiúsculas', () => {
  assert.deepEqual(dedupeLabels(['Excel', 'excel', 'Comunicação', 'comunicacao']), ['Excel', 'Comunicação']);
});

test('acentos: currículo sem acento casa com vaga acentuada', () => {
  const profile = { ...ADMIN, hardSkills: ['tecnico de enfermagem', 'curativos', 'sinais vitais'], areas: ['saude'], objective: 'tecnico de enfermagem', educationLevel: 'tecnico' };
  const m = computeMatch(profile, byTitle('Técnico(a) de enfermagem'));
  assert.ok(m.reasons.some((r) => r.text.includes('Enfermagem')));
});

test('pesos somam 100 e pontuação fica entre 0 e 100', () => {
  assert.equal(Object.values(MATCH_CONFIG.weights).reduce((a, b) => a + b, 0), 100);
  for (const job of DEMO_JOBS) {
    const { score } = computeMatch(ADMIN, job);
    assert.ok(score >= 0 && score <= 100, `${job.title}: ${score}`);
  }
});

test('campos não preenchidos não geram pontos', () => {
  const empty = { name: 'Só o nome' };
  assert.equal(hasProfileData(empty), false);
  const job = byTitle('Assistente administrativo');
  const m = computeMatch(empty, job);
  assert.equal(m.breakdown.skills.points, 0);
  assert.equal(m.breakdown.area.points, 0);
  assert.equal(m.breakdown.education.points, 0);
  assert.equal(m.breakdown.preferences.points, 0);
  assert.ok(m.score < MATCH_CONFIG.threshold);
  assert.ok(m.toConfirm.length > 0); // escolaridade/experiência ficam "a confirmar", não "compatíveis"
});

test('perfil administrativo: vaga compatível tem pontuação alta e motivos explicados', () => {
  const m = computeMatch(ADMIN, byTitle('Assistente administrativo'));
  assert.ok(m.score >= MATCH_CONFIG.threshold, String(m.score));
  const texts = m.reasons.map((r) => r.text);
  assert.ok(texts.includes('Conhecimento em Excel'));
  assert.ok(texts.some((t) => t.startsWith('Interesse em Administração')));
  assert.ok(texts.includes('Escolaridade compatível'));
});

test('requisito obrigatório ausente é destacado mesmo com pontuação alta', () => {
  const driver = {
    objective: 'motorista de caminhão', areas: ['transporte-logistica'], educationLevel: 'medio',
    hardSkills: ['Direção defensiva', 'Roteirização', 'Direção de veículos pesados'], softSkills: ['Pontualidade', 'Responsabilidade', 'Cordialidade'],
    experiences: [{ role: 'Motorista', start: '2018', end: '2024' }], desiredModes: ['onsite'], desiredContracts: ['CLT'],
    city: 'Maricá', neighborhood: 'São José do Imbassaí',
  };
  const m = computeMatch(driver, byTitle('Motorista de caminhão (CNH D)'));
  assert.ok(m.score >= 60, String(m.score));
  assert.ok(m.unmetRequired.includes('CNH categoria D'), JSON.stringify(m.unmetRequired));
  assert.ok(m.unmetRequired.includes('Curso MOPP em dia'));
  const ok = computeMatch({ ...driver, hardSkills: [...driver.hardSkills, 'CNH D', 'MOPP'] }, byTitle('Motorista de caminhão (CNH D)'));
  assert.equal(ok.unmetRequired.length, 0);
  assert.ok(ok.score > m.score);
});

test('escolaridade abaixo da exigida vira requisito não atendido', () => {
  const m = computeMatch({ ...ADMIN, educationLevel: 'fundamental' }, byTitle('Analista financeiro'));
  assert.ok(m.unmetRequired.some((t) => t.startsWith('Escolaridade')));
});

test('ordenação: perfil administrativo prioriza vagas administrativas', () => {
  const { forYou, others, matches } = splitByMatch(DEMO_JOBS, ADMIN);
  assert.equal(forYou.length + others.length, DEMO_JOBS.length);
  const idsA = new Set(forYou.map((s) => s.job.id));
  assert.ok(others.every((s) => !idsA.has(s.job.id))); // abas mutuamente exclusivas
  for (let i = 1; i < forYou.length; i++) assert.ok(forYou[i - 1].match.score >= forYou[i].match.score);
  assert.ok(forYou.every((s) => s.match.score >= MATCH_CONFIG.threshold));
  assert.ok(others.every((s) => s.match.score < MATCH_CONFIG.threshold));
  const adm = matches.get(byTitle('Assistente administrativo').id).score;
  const eng = matches.get(byTitle('Engenheiro(a) civil').id).score;
  const dev = matches.get(byTitle('Desenvolvedor(a) Full Stack').id).score;
  assert.ok(adm > eng && adm > dev, `${adm} ${eng} ${dev}`);
  assert.ok(forYou.some((s) => s.job.title === 'Assistente administrativo'));
});

test('perfil de tecnologia: Full Stack aparece em Para Você e acima de vagas de outras áreas', () => {
  const dev = {
    objective: 'Desenvolvedor full stack', areas: ['desenvolvimento', 'ti'], educationLevel: 'superior',
    formations: [{ course: 'Análise e Desenvolvimento de Sistemas', status: 'concluido' }],
    hardSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'Docker'],
    softSkills: ['Autonomia', 'Comunicação'],
    experiences: [{ role: 'Programador', start: '2020', end: '', current: true, description: 'APIs REST em Node e front-end em React' }],
    desiredModes: ['remote'], desiredContracts: ['PJ'],
  };
  const { forYou, matches } = splitByMatch(DEMO_JOBS, dev);
  assert.equal(forYou[0].job.title, 'Desenvolvedor(a) Full Stack');
  assert.ok(matches.get(byTitle('Desenvolvedor(a) Full Stack').id).score > matches.get(byTitle('Cozinheiro(a)').id).score);
});

test('vaga sem dados de um critério não pune nem premia (reescala pesos)', () => {
  const external = { id: 'ext-1', title: 'Assistente administrativo', description: 'Rotinas de escritório e Excel', mode: null };
  const m = computeMatch(ADMIN, external);
  assert.equal(m.breakdown.education.value, null);
  assert.equal(m.breakdown.experience.value, null);
  assert.ok(m.score > 0 && m.score <= 100);
});

test('primeiro emprego: "sem experiência" é resposta válida e não penaliza vagas de entrada', () => {
  const base = { areas: ['atendimento-comercio'], desiredRoles: ['Operador de caixa'], educationLevel: 'medio', hardSkills: ['Atendimento ao cliente'] };
  const entrada = byTitle('Operador(a) de caixa'); // experienceYears = 0
  const semResposta = computeMatch(base, entrada);
  const primeiroEmprego = computeMatch({ ...base, noExperience: true }, entrada);
  assert.equal(primeiroEmprego.breakdown.experience.value, 1);
  assert.ok(primeiroEmprego.score > semResposta.score);
  assert.ok(primeiroEmprego.reasons.some((r) => r.text.includes('primeiro emprego')));
  // Vaga que EXIGE experiência continua apontando o requisito não atendido
  const exige = computeMatch({ ...base, noExperience: true }, byTitle('Recepcionista de clínica'));
  assert.ok(exige.unmetRequired.some((t) => t.startsWith('Experiência')));
});

test('dicionário do cliente cobre as mesmas áreas e escolaridades da base do servidor', () => {
  assert.deepEqual(AREAS.map((a) => a.id).sort(), Object.keys(AREA_LABELS).sort());
  assert.deepEqual(EDUCATION_LEVELS.map((e) => e.id).sort(), Object.keys(EDUCATION_LABELS).sort());
});

test('todas as 60 vagas têm cargo reconhecido pelo dicionário', () => {
  const missing = DEMO_JOBS.filter((j) => extractRoles(j.title).size === 0).map((j) => j.title);
  assert.deepEqual(missing, []);
});
