/**
 * Indicadores de preenchimento do perfil. Medem quanto das PERGUNTAS foi respondido — não quanto
 * a pessoa "tem". "Ainda não tenho experiência profissional" conta como resposta completa.
 */
const has = (v) => (Array.isArray(v) ? v.some((x) => (typeof x === 'string' ? x.trim() : x)) : Boolean(v && String(v).trim()));

export function resumeProgress(r = {}) {
  const steps = [
    { id: 'interest', label: 'Área ou cargo de interesse', done: has(r.areas) || has(r.desiredRoles) || has(r.objective) },
    { id: 'education', label: 'Escolaridade', done: has(r.educationLevel) },
    { id: 'skills', label: 'Competências', done: has(r.hardSkills) || has(r.softSkills) },
    { id: 'experience', label: 'Experiência profissional', done: Boolean(r.noExperience) || (r.experiences || []).some((e) => has(e.role) || has(e.company)) },
    { id: 'preferences', label: 'Preferências de trabalho', done: has(r.desiredModes) || has(r.desiredContracts) },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  // Pronto para recomendar: sabemos o que a pessoa procura e algo sobre o que ela sabe fazer.
  const ready = steps[0].done && (steps[1].done || steps[2].done);
  return { steps, doneCount, total: steps.length, ready };
}

/**
 * Mescla as respostas do Perfil Rápido no currículo existente SEM apagar o resto
 * (experiências, cursos, idiomas etc. continuam como estavam).
 */
export const QUICK_FIELDS = ['areas', 'desiredRoles', 'educationLevel', 'hardSkills', 'neighborhood', 'city', 'desiredContracts', 'desiredModes', 'noExperience'];
export function mergeQuickProfile(existing, quick) {
  const merged = { ...existing };
  for (const k of QUICK_FIELDS) if (k in quick) merged[k] = quick[k];
  if ((merged.experiences || []).some((e) => has(e.role) || has(e.company))) merged.noExperience = false;
  return merged;
}
