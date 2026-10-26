import { useState } from 'react';
import { describeCause, tokenStore } from '@/shared/api';

const GIVE_UP_MS = 8_000;

export type StorageCheck =
  | { state: 'idle' | 'checking' }
  | { state: 'answered'; ms: number; hasToken: boolean }
  | { state: 'failed'; ms: number; reason: string }
  | { state: 'silent' };

/** Asks secure storage for the sign-in once, and says how long it took, what it answered, or that it never did. */
export function useStorageCheck() {
  const [result, setResult] = useState<StorageCheck>({ state: 'idle' });

  async function run(): Promise<void> {
    setResult({ state: 'checking' });
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const silent = new Promise<StorageCheck>((resolve) => {
      timer = setTimeout(() => {
        resolve({ state: 'silent' });
      }, GIVE_UP_MS);
    });
    const answer = tokenStore.get().then(
      (token): StorageCheck => ({
        state: 'answered',
        ms: Date.now() - started,
        hasToken: token !== null,
      }),
      (error: unknown): StorageCheck => ({
        state: 'failed',
        ms: Date.now() - started,
        reason: describeCause(error) || String(error),
      }),
    );
    setResult(await Promise.race([answer, silent]));
    clearTimeout(timer);
  }

  return { result, run };
}

export const STORAGE_CHECK_GIVE_UP_MS = GIVE_UP_MS;
