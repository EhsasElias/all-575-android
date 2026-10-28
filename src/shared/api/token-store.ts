import { Capacitor } from '@capacitor/core';
import { sessionVault } from '../security/sessionVault';

/**
 * Where the access token lives. It must never be written to localStorage,
 * sessionStorage or cookies: any injected script could read it there.
 */
export type TokenStore = {
  get: () => Promise<string | null>;
  set: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

/** Web: the token lives only in memory, so a page reload signs the user out. */
export function createMemoryTokenStore(): TokenStore {
  let token: string | null = null;
  return {
    get: () => Promise.resolve(token),
    set: (value) => {
      token = value;
      return Promise.resolve();
    },
    clear: () => {
      token = null;
      return Promise.resolve();
    },
  };
}

export function createTokenStore(): TokenStore {
  return Capacitor.isNativePlatform() ? sessionVault.store : createMemoryTokenStore();
}

export const TOKEN_READ_TIMEOUT_MS = 3_000;
const TIMED_OUT = Symbol('timed out');

export type TokenReadProblem = 'unreadable' | 'timeout';

/**
 * Reads the stored token without ever waiting for ever. Storage that fails, or does not answer within a few seconds,
 * counts as "no token": the app stays usable as a guest instead of freezing on every request.
 */
export async function readToken(
  store: TokenStore,
  onProblem?: (problem: TokenReadProblem) => void,
): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => {
      resolve(TIMED_OUT);
    }, TOKEN_READ_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([store.get(), timeout]);
    if (result === TIMED_OUT) {
      onProblem?.('timeout');
      return null;
    }
    return result;
  } catch {
    onProblem?.('unreadable');
    return null;
  } finally {
    clearTimeout(timer);
  }
}
