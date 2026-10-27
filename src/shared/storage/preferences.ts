import { Preferences } from '@capacitor/preferences';

export type PreferenceKey = 'language' | 'welcomeSeen' | 'guestCart' | 'deliveryZone' | 'theme';

export type PreferenceBackend = {
  get: (key: PreferenceKey) => Promise<string | null>;
  set: (key: PreferenceKey, value: string) => Promise<void>;
};

const KEYS: readonly PreferenceKey[] = [
  'language',
  'welcomeSeen',
  'guestCart',
  'deliveryZone',
  'theme',
];

// Preferences are non-sensitive (language, onboarding flags, the guest's cart lines and chosen delivery area). Never store tokens here.
const capacitorBackend: PreferenceBackend = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
};

const cache = new Map<PreferenceKey, string>();
let backend: PreferenceBackend = capacitorBackend;

/** Reads every preference once at startup so the rest of the app can read synchronously. */
export async function loadPreferences(source: PreferenceBackend = capacitorBackend): Promise<void> {
  backend = source;
  cache.clear();
  await Promise.all(
    KEYS.map(async (key) => {
      try {
        const value = await source.get(key);
        if (value !== null) cache.set(key, value);
      } catch {
        // Unreadable storage must not block startup; the defaults apply.
      }
    }),
  );
}

export function getPreference(key: PreferenceKey): string | null {
  return cache.get(key) ?? null;
}

export function setPreference(key: PreferenceKey, value: string): void {
  cache.set(key, value);
  backend.set(key, value).catch(() => {
    // Best effort: the cached value still applies for this session.
  });
}
