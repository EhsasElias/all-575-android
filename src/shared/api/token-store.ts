import { Capacitor } from '@capacitor/core';
import { createSecureTokenStore } from './secure-token-store';

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
  return Capacitor.isNativePlatform() ? createSecureTokenStore() : createMemoryTokenStore();
}
