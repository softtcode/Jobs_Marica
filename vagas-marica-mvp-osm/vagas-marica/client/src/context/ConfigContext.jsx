import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchConfig } from '../services/api.js';

/** Configuração do backend (/api/config): ponto de referência e raios. Buscada uma vez por sessão. */
const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [state, setState] = useState({ home: null, radii: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchConfig(c.signal)
      .then((d) => setState({
        home: d.home,
        radii: d.radii,
        demoMode: Boolean(d.demoMode),
        // Bairros de referência vêm do servidor (fonte única de coordenadas).
        references: d.references || [],
        error: null,
        loading: false,
      }))
      .catch((e) => e.name !== 'AbortError' && setState({ home: null, radii: null, error: e, loading: false }));
    return () => c.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return <ConfigContext.Provider value={{ ...state, retry }}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
