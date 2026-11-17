import { config } from '../config.js';
import { DEMO_JOBS } from '../data/demoJobs.js';
import { searchJobsByQuery } from '../../../shared/jobSearch.js';

/**
 * Fonte "Base demonstrativa": 60 vagas FICTÍCIAS locais, usadas quando o modo
 * demonstração está ligado (DEMO_MODE, padrão ligado). Não depende de rede nem de credenciais.
 * As vagas saem no mesmo formato das fontes reais, com campos extras (isDemo, requisitos etc.).
 */
export const DEMO_SOURCE = { id: 'demo', name: 'Base demonstrativa' };

export const isDemoEnabled = () => config.demoMode;

/** Converte a vaga demonstrativa para o formato interno usado por /api/jobs. */
export function toInternalJob(d) {
  return {
    ...d,
    source: DEMO_SOURCE.id,
    sourceName: DEMO_SOURCE.name,
    type: d.contractType === 'Freelancer' ? 'freelance' : 'job',
    precision: d.lat != null ? 'approximate' : 'none',
    contractTime: null,
    category: d.areaLabel,
    descriptionIsPartial: false,
    requirements: d.requirementsRequired.join('; '),
    benefits: d.benefits.length ? d.benefits.join(', ') : null,
    url: null, // vagas fictícias não têm página de candidatura
  };
}

const INTERNAL = DEMO_JOBS.map(toInternalJob);

/**
 * Busca local tolerante (sinônimos de cargo, plural/gênero, abreviações, erros de digitação),
 * implementada em /shared/jobSearch.js. Cada vaga volta com `matchTier` (1 = título … 4 = competências).
 */
export function searchDemoJobs({ q = '' } = {}) {
  return searchJobsByQuery(q, INTERNAL);
}

/** Vagas de uma empresa pelo IDENTIFICADOR (nunca por semelhança de nome). */
export const getDemoJobsByCompany = (companyId) => INTERNAL.filter((j) => j.companyId === companyId);
