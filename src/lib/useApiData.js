import { useEffect, useMemo, useState } from 'react';

// Last request wins; a retry clears the error without discarding previously loaded data.
export function createRequestLoader(fetcher, onState) {
  let generation = 0;
  let data = null;
  const load = async () => {
    const id = ++generation;
    onState({ data, error: false, loading: true });
    try {
      const next = await fetcher();
      if (id !== generation) return;
      data = next;
      onState({ data, error: false, loading: false });
    } catch {
      if (id === generation) onState({ data, error: true, loading: false });
    }
  };
  load.cancel = () => { generation++; };
  return load;
}

export function useApiData(fetcher) {
  const [state, setState] = useState({ data: null, error: false, loading: true });
  const retry = useMemo(() => createRequestLoader(fetcher, setState), [fetcher]);
  useEffect(() => { retry(); return retry.cancel; }, [retry]);
  return { ...state, retry };
}
