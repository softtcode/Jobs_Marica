import { useCallback, useEffect, useState } from 'react';

/** Executa `fn(signal)` quando `key` muda; cancela a requisição anterior. */
export function useAsync(fn, key, { delay = 0 } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    const timer = setTimeout(() => {
      fn(controller.signal)
        .then((data) => setState({ data, loading: false, error: null }))
        .catch((error) => error.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error })));
    }, delay);
    return () => { clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, retry };
}
