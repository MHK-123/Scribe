import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Prevents rapid-fire state updates from triggering excessive re-renders 
 * or API calls. Essential for search bars and auto-save features.
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
