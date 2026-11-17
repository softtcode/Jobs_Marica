import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobs } from '../services/api.js';

// Cache por sessão do navegador: ao alternar entre /vagas e /mapa (ou voltar da
// página inicial) a mesma busca aparece na hora, sem esqueleto, e só é refeita
// se estiver "velha". O servidor também mantém seu próprio cache.
const cache = new Map();
const FRESH_MS = 2 * 60 * 1000;

/**
 * Busca vagas no backend. Refaz a busca quando `q`, `radiusKm` ou `type` mudam
 * (com pequeno atraso para o slider) e quando `refresh()` é chamado.
 */
export function useJobs({ q, radiusKm, type, refId = 'centro', enabled }) {
  // O bairro de referência faz parte da chave: distâncias de outro bairro nunca são reaproveitadas.
  const key = `${q}|${radiusKm}|${type}|${refId}`;
  const [state, setState] = useState(() => ({ data: cache.get(key)?.data ?? null, loading: false, error: null }));
  const forceRef = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const force = forceRef.current;
    const cached = cache.get(key);
    if (cached && !force) {
      setState({ data: cached.data, loading: false, error: null });
      if (Date.now() - cached.at < FRESH_MS) return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchJobs({ q, radiusKm, type, ref: refId, refresh: force }, controller.signal);
        forceRef.current = false;
        cache.set(key, { data, at: Date.now() });
        setState({ data, loading: false, error: null });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setState((s) => ({ ...s, loading: false, error }));
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, q, radiusKm, type, refId, enabled, tick]);

  const refresh = useCallback(() => { forceRef.current = true; setTick((t) => t + 1); }, []);
  return { ...state, refresh };
}
