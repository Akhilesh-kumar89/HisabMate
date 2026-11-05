import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api.js';

// Loads `url` (with params) and re-loads when they change or when reload() is called.
export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
