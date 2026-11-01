import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly-changing value (e.g. search input).
 * @param {*} value
 * @param {number} delay ms
 */
export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
