import { useCallback, useSyncExternalStore } from 'react';

const TICK_MS = 1000;

export function secondsUntil(target: number, now: number): number {
  return Math.max(0, Math.ceil((target - now) / 1000));
}

/**
 * Whole seconds left until `resendAt` (a timestamp in milliseconds); 0 once a new code may be requested.
 * The value is read from the clock on every render, so a new `resendAt` shows the right number at once.
 */
export function useResendCountdown(resendAt: number): number {
  const subscribe = useCallback((onTick: () => void) => {
    const timer = setInterval(onTick, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return useSyncExternalStore(subscribe, () => secondsUntil(resendAt, Date.now()));
}
