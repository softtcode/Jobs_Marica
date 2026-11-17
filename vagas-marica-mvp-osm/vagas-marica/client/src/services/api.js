const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, params, signal) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== '' && v != null) url.searchParams.set(k, v);
  });
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Erro ${res.status} ao consultar o servidor.`);
  return body;
}

export const fetchConfig = (signal) => request('/api/config', {}, signal);
export const fetchCompanies = ({ q, sector, sort }, signal) => request('/api/companies', { q, sector, sort }, signal);
export const fetchCompany = (id, signal) => request(`/api/companies/${encodeURIComponent(id)}`, {}, signal);
// `ref`: identificador do bairro de referência (validado no servidor); "centro" é o padrão e é omitido.
export const fetchJobs = ({ q, radiusKm, type, ref, refresh }, signal) =>
  request('/api/jobs', { q, radiusKm, type, ref: ref && ref !== 'centro' ? ref : '', refresh: refresh ? '1' : '' }, signal);
