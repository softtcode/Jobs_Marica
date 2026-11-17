// Perfil Rápido, preservação de dados existentes e indicadores de preenchimento.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeQuickProfile, resumeProgress } from '../src/utils/resumeProgress.js';
import { hasProfileData, splitByMatch } from '../src/services/matchingService.js';
import { DEMO_JOBS } from '../../server/src/data/demoJobs.js';

const QUICK = {
  areas: ['atendimento-comercio'], desiredRoles: ['Atendente'], educationLevel: 'medio',
  hardSkills: ['Atendimento ao cliente', 'Operação de caixa'], neighborhood: 'Itaipuaçu', city: 'Maricá',
  desiredContracts: ['CLT', 'Jovem Aprendiz'], desiredModes: ['onsite'], noExperience: true,
};

test('Perfil Rápido sozinho já gera recomendações', () => {
  assert.ok(hasProfileData(QUICK));
  const { forYou } = splitByMatch(DEMO_JOBS, QUICK);
  assert.ok(forYou.length > 0);
  assert.ok(forYou.slice(0, 3).some((s) => /caixa|atendimento/i.test(s.job.title)), forYou.slice(0, 3).map((s) => s.job.title).join());
});

test('Perfil Rápido não apaga o currículo completo (mesma estrutura, mesclagem)', () => {
  const existing = {
    name: 'Pessoa Exemplo', objective: 'Trabalhar com atendimento', courses: [{ name: 'Excel' }],
    experiences: [{ role: 'Atendente de loja', company: 'Loja X', start: '2022', end: '2024' }],
    languages: [{ name: 'Inglês', level: 'Básico' }], hardSkills: ['Excel'], noExperience: false,
  };
  const merged = mergeQuickProfile(existing, QUICK);
  assert.equal(merged.name, 'Pessoa Exemplo');
  assert.deepEqual(merged.courses, existing.courses);
  assert.deepEqual(merged.languages, existing.languages);
  assert.deepEqual(merged.experiences, existing.experiences);
  assert.deepEqual(merged.hardSkills, QUICK.hardSkills); // campos do perfil rápido são atualizados
  assert.equal(merged.noExperience, false);              // já há experiência cadastrada: não pode ficar "sem experiência"
});

test('indicador: "ainda não tenho experiência" conta como resposta (não penaliza primeiro emprego)', () => {
  const p = resumeProgress(QUICK);
  assert.equal(p.doneCount, p.total);
  assert.ok(p.ready);
  const semResponder = resumeProgress({ ...QUICK, noExperience: false });
  assert.equal(semResponder.steps.find((s) => s.id === 'experience').done, false);
  const vazio = resumeProgress({});
  assert.equal(vazio.doneCount, 0);
  assert.equal(vazio.ready, false);
});
