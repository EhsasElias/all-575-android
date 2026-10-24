import { useEffect, useState } from 'react';

/** The current time in milliseconds, refreshed every `everyMs`, so countdowns stay honest without a manual refresh. */
export function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, everyMs);
    return () => {
      clearInterval(timer);
    };
  }, [everyMs]);

  return now;
}
