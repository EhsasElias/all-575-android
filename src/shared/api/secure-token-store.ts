import type { TokenStore } from './token-store';

const TOKEN_KEY = 'access-token';

export type SecureKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

// Imported on demand so the web bundle never loads this plugin: on the web it
// would fall back to unencrypted localStorage.
export async function loadNativeStorage(): Promise<SecureKeyValueStorage> {
  const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
  return SecureStorage;
}

/** Native: AES-GCM with a key held in the Android Keystore. */
export function createSecureTokenStore(
  loadStorage: () => Promise<SecureKeyValueStorage> = loadNativeStorage,
): TokenStore {
  return {
    get: async () => (await loadStorage()).getItem(TOKEN_KEY),
    set: async (token) => {
      await (await loadStorage()).setItem(TOKEN_KEY, token);
    },
    clear: async () => {
      await (await loadStorage()).removeItem(TOKEN_KEY);
    },
  };
}
