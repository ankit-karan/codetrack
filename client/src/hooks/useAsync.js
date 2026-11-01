import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../utils/formatters';

/**
 * Minimal async data-fetching hook with loading/error/refresh semantics.
 *
 * Design notes (React Compiler lint compliant):
 * - `loading` is *derived*: a request is considered in-flight while the last
 *   resolved key differs from the current key. No setState runs inside the
 *   effect body — state only updates in async callbacks.
 * - `key` must encode every input the fetcher depends on (page, filters…)
 *   so a new key triggers a refetch. A changing key immediately reads as
 *   `loading` without clearing the previous data (no flicker on refetch).
 *
 * @param {Function} fetcher async function returning data
 * @param {string} key cache/refetch key describing the inputs
 * @param {{ enabled?: boolean }} options
 *
 * returns { data, loading, error, refresh, setData }
 */
export default function useAsync(fetcher, key = '', { enabled = true } = {}) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [result, setResult] = useState({ data: null, resolvedKey: null, error: null });

  // Keep the latest fetcher without making it a fetch dependency.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const requestKey = `${enabled ? 1 : 0}|${key}|${refreshCount}`;

  useEffect(() => {
    if (!enabled) return undefined;

    const ticket = { cancelled: false };
    (async () => {
      try {
        const data = await fetcherRef.current();
        if (!ticket.cancelled) setResult({ data, resolvedKey: requestKey, error: null });
      } catch (error) {
        if (!ticket.cancelled) {
          setResult({ data: null, resolvedKey: requestKey, error: getApiErrorMessage(error) });
        }
      }
    })();

    return () => {
      ticket.cancelled = true;
    };
  }, [enabled, requestKey]);

  /** Force a refetch of the current key (call from event handlers). */
  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  /** Optimistic local update of `data` (call from event handlers). */
  const setData = useCallback((updater) => {
    setResult((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  }, []);

  const loading = enabled && result.resolvedKey !== requestKey;
  const error = result.resolvedKey === requestKey ? result.error : null;

  return { data: result.data, loading, error, refresh, setData };
}
