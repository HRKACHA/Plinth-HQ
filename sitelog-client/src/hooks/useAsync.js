import { useState, useEffect, useCallback } from 'react';

export function useAsync(fetchFn, deps = []) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, reload: refresh, refresh };
}
