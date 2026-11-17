// Busca inteligente (módulo compartilhado /shared/jobSearch.js) sobre as 60 vagas demonstrativas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchTier, searchJobsByQuery, stem, TIER, tokenMatches } from '../../shared/jobSearch.js';
import { DEMO_JOBS } from '../../server/src/data/demoJobs.js';

const run = (q) => searchJobsByQuery(q, DEMO_JOBS).sort((a, b) => a.matchTier - b.matchTier);
const titles = (r, tier) => r.filter((j) => (tier ? j.matchTier === tier : true)).map((j) => j.title);
const byTitle = (t) => DEMO_JOBS.find((j) => j.title === t);

test('OBRIGATÓRIO: "Auxiliar administrativo" encontra "Assistente administrativo" como cargo equivalente', () => {
  const r = run('Auxiliar administrativo');
  assert.ok(r.length > 0, 'não pode retornar zero resultados');
  assert.equal(r[0].title, 'Assistente administrativo');
  assert.equal(r[0].matchTier, TIER.EQUIVALENT);
  // E o inverso também:
  assert.equal(matchTier('assistente administrativo', byTitle('Assistente administrativo')), TIER.TITLE);
});

test('pesquisa exata pelo título vem em primeiro (nível 1)', () => {
  const r = run('operador de caixa');
  assert.equal(r[0].title, 'Operador(a) de caixa');
  assert.equal(r[0].matchTier, TIER.TITLE);
});

test('cargos equivalentes: programador → desenvolvedor; consultor de vendas → vendedor; técnico de TI → técnico de informática', () => {
  assert.ok(titles(run('programador'), TIER.EQUIVALENT).includes('Desenvolvedor(a) Full Stack'));
  assert.ok(titles(run('consultor de vendas'), TIER.EQUIVALENT).includes('Vendedor(a) externo(a)'));
  assert.ok(titles(run('técnico de TI'), TIER.EQUIVALENT).includes('Técnico(a) de informática'));
  assert.ok(titles(run('caixa de supermercado'), TIER.EQUIVALENT).includes('Operador(a) de caixa'));
});

test('cargos relacionados aparecem depois (nível 3), nunca como idênticos', () => {
  const r = run('auxiliar administrativo');
  assert.ok(titles(r, TIER.RELATED).includes('Estágio em administração'));
  assert.ok(titles(r, TIER.RELATED).includes('Jovem aprendiz administrativo'));
  assert.ok(!titles(r, TIER.TITLE).includes('Estágio em administração'));
  const rec = run('recepcionista');
  assert.ok(rec.slice(0, 2).every((j) => j.title.startsWith('Recepcionista')));
});

test('atendente ⇄ atendimento ao cliente: competências relacionadas entram como nível 4', () => {
  const r = run('atendimento ao cliente');
  assert.ok(r.length > 0);
  assert.ok(titles(r).includes('Operador(a) de caixa'));
  assert.ok(r.every((j) => j.matchTier === TIER.SKILLS || j.matchTier <= 3));
});

test('com e sem acento, maiúsculas, plural e feminino', () => {
  for (const q of ['tecnico de enfermagem', 'TÉCNICA DE ENFERMAGEM', 'técnicos de enfermagem']) {
    assert.equal(run(q)[0].title, 'Técnico(a) de enfermagem', q);
  }
  assert.equal(run('vendedora')[0].title, 'Vendedor(a) externo(a)');
  assert.equal(run('estágios').filter((j) => j.matchTier === 1).length, 8);
  assert.equal(stem('vendedoras'), stem('vendedor'));
  assert.equal(stem('técnica'.normalize('NFD').replace(/[̀-ͯ]/g, '')), stem('tecnico'));
});

test('pequenos erros de digitação e abreviações', () => {
  assert.equal(run('motorsta')[0].title, 'Motorista de caminhão (CNH D)');
  assert.equal(run('eletrecista')[0].title, 'Eletricista predial');
  assert.equal(run('auxiliar administrstivo')[0].title, 'Assistente administrativo');
  assert.equal(run('aux adm')[0].title, 'Assistente administrativo');
  assert.ok(tokenMatches('recep', 'recepcionist')); // início de palavra
  assert.ok(!tokenMatches('caixa', 'baixa'));       // palavras curtas não aceitam erro
});

test('prevenção de resultados genéricos', () => {
  // "auxiliar" sozinho não transforma "auxiliar de limpeza" em equivalente de auxiliar administrativo
  const adm = run('auxiliar administrativo');
  assert.ok(!titles(adm).includes('Auxiliar de limpeza'));
  assert.ok(!titles(adm).includes('Auxiliar de estoque'));
  // soft skills genéricas ("negociação") não puxam engenharia para uma busca de vendas
  assert.ok(!titles(run('vendedora')).includes('Engenheiro(a) civil'));
  // "experiência do cliente" não vira um sinônimo amplo de "cliente"
  assert.ok(!titles(run('atendimento ao cliente')).includes('Arquiteto(a)'));
  // "agendamento" ≠ "atendimento" (2 letras de diferença não bastam em palavras médias)
  assert.ok(!tokenMatches('atendiment', 'agendament'));
});

test('consultas sem resultado e consultas vazias', () => {
  assert.equal(run('astronauta').length, 0);
  assert.equal(run('xyzabc').length, 0);
  assert.equal(searchJobsByQuery('', DEMO_JOBS).length, 60);
  assert.equal(searchJobsByQuery('vaga de trabalho', DEMO_JOBS).length, 60); // só palavras genéricas
});

test('ordenação por relevância: níveis em ordem crescente', () => {
  const r = run('atendente');
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].matchTier <= r[i].matchTier);
  assert.equal(r[0].matchTier, TIER.TITLE);
});
