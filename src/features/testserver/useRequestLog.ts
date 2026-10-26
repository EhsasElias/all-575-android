import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getTraceSnapshot, subscribeToTrace, type TraceEntry } from '@/shared/api';
import { useSession } from '@/shared/session';

/** The clock, ticking once a second while something is still waiting, so "waiting 12 s" counts up. */
function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1_000);
    return () => {
      clearInterval(timer);
    };
  }, [running]);
  return now;
}

export function useRequestLog() {
  const entries = useSyncExternalStore(subscribeToTrace, getTraceSnapshot);
  const { status } = useSession();
  const waiting = entries.some((entry: TraceEntry) => entry.endedAt === null);
  const now = useNow(waiting);

  return {
    // Newest first, so the request that is stuck right now is at the top.
    entries: [...entries].reverse(),
    now,
    session: status,
    browserOnline: navigator.onLine,
    queriesOnline: onlineManager.isOnline(),
  };
}
