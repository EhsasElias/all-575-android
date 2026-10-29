import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

export const SEARCH_DEBOUNCE_MS = 300;
/** The server refuses shorter searches. */
export const MIN_QUERY_LENGTH = 2;

type Timer = ReturnType<typeof setTimeout>;

/**
 * The search box and its address. What is typed shows at once; the `q` in the URL (and so the request) follows
 * 300 ms after the last keystroke, or immediately on Enter. The URL is replaced, not pushed, so Back leaves
 * the search instead of stepping through every word.
 */
export function useSearchInput() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const timer = useRef<Timer | undefined>(undefined);
  const query = (params.get('q') ?? '').trim();

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const commit = (value: string) => {
    clearTimeout(timer.current);
    const trimmed = value.trim();
    const next = new URLSearchParams(params);
    if (trimmed) next.set('q', trimmed);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  return {
    draft,
    /** The query the results belong to. */
    query,
    change: (value: string) => {
      setDraft(value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        commit(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    submit: () => {
      commit(draft);
    },
    clear: () => {
      setDraft('');
      commit('');
    },
  };
}
