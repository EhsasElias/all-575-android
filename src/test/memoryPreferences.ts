import type { PreferenceBackend, PreferenceKey } from '@/shared/storage';

export function createMemoryPreferences(
  initial: Partial<Record<PreferenceKey, string>> = {},
): PreferenceBackend & { snapshot: () => Record<string, string> } {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    snapshot: () => Object.fromEntries(store),
  };
}
