/**
 * What the app has just asked the server, kept in memory in a test build so a tester can see why a screen does not
 * load (stuck on secure storage, waiting for the server, refused). Only the method and the path are kept, never a
 * body, a header or a token.
 */
export type TraceStage = 'preparing' | 'sending' | 'done' | 'failed';

export type TraceEntry = {
  id: number;
  method: string;
  path: string;
  stage: TraceStage;
  /** The status once done, the reason once failed, or what went wrong while getting ready. */
  detail: string;
  startedAt: number;
  endedAt: number | null;
};

export type RequestTrace = {
  /** Getting ready is over (the token was read) and the request goes out. `note` says if that had a problem. */
  sending: (note?: string) => void;
  done: (status: number) => void;
  failed: (reason: string) => void;
};

export type RequestTracer = { begin: (method: string, path: string) => RequestTrace };

const MAX_ENTRIES = 20;

let entries: readonly TraceEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: readonly TraceEntry[]): void {
  entries = next;
  for (const listener of listeners) listener();
}

function update(id: number, change: Partial<TraceEntry>): void {
  publish(entries.map((entry) => (entry.id === id ? { ...entry, ...change } : entry)));
}

export const requestTracer: RequestTracer = {
  begin: (method, path) => {
    const id = nextId++;
    publish([
      ...entries.slice(-(MAX_ENTRIES - 1)),
      { id, method, path, stage: 'preparing', detail: '', startedAt: Date.now(), endedAt: null },
    ]);
    return {
      sending: (note = '') => {
        update(id, { stage: 'sending', detail: note });
      },
      done: (status) => {
        update(id, { stage: 'done', detail: String(status), endedAt: Date.now() });
      },
      failed: (reason) => {
        update(id, { stage: 'failed', detail: reason, endedAt: Date.now() });
      },
    };
  },
};

export function subscribeToTrace(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTraceSnapshot(): readonly TraceEntry[] {
  return entries;
}

/** For tests. */
export function clearTrace(): void {
  publish([]);
}
