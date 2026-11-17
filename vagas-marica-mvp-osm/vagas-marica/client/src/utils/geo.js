/** Agrupa vagas que compartilham exatamente a mesma coordenada (sem deslocar pontos). */
export function groupByCoordinate(jobs) {
  const groups = new Map();
  for (const j of jobs) {
    if (j.lat == null || j.lng == null) continue;
    const key = `${j.lat.toFixed(5)},${j.lng.toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, { key, lat: j.lat, lng: j.lng, jobs: [] });
    groups.get(key).jobs.push(j);
  }
  return [...groups.values()];
}

/** Um grupo só é "preciso" se TODAS as vagas nele tiverem localização precisa. */
export const groupIsExact = (group) => group.jobs.every((j) => j.precision === 'exact');
