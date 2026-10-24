import { useCallback, useSyncExternalStore } from 'react';

/** The current time, rounded down to `intervalMs` and refreshed on that beat while `active`. */
export function useNow(intervalMs: number, active = true): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!active) return () => undefined;
      const timer = setInterval(onChange, intervalMs);
      return () => {
        clearInterval(timer);
      };
    },
    [intervalMs, active],
  );
  return useSyncExternalStore(subscribe, () => Math.floor(Date.now() / intervalMs) * intervalMs);
}
