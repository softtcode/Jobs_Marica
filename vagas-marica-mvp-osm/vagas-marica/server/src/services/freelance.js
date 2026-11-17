/**
 * Oportunidades freelance.
 *
 * Resultado da verificação de viabilidade: não há, hoje, uma API pública,
 * gratuita e geolocalizada de projetos freelance para o Brasil que dispense
 * aprovação. Workana e 99Freelas não oferecem API pública de consulta; a
 * API do Freelancer.com exige OAuth/aprovação e quase não traz localização;
 * Upwork exige aprovação de acesso.
 *
 * Por isso NENHUMA oportunidade freelance é gerada. Para adicionar uma fonte
 * real no futuro, implemente `fetchFreelanceJobs` devolvendo vagas no formato
 * de `normalizeAdzuna` com `type: 'freelance'` e troque `FREELANCE_STATUS`.
 */
export const FREELANCE_STATUS = {
  available: false,
  message:
    'Ainda não há uma fonte pública e gratuita de projetos freelance com localização conectada. ' +
    'Nenhuma oportunidade freelance foi inventada para preencher o mapa.',
};

export async function fetchFreelanceJobs() {
  return [];
}
