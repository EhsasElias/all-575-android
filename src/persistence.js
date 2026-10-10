import { initialStore } from './data';

const STORE_KEY = 'all575-full-system-v1';
const PREF_KEY = 'all575-preferences-v1';

export function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...initialStore, ...saved } : structuredClone(initialStore);
  } catch {
    return structuredClone(initialStore);
  }
}

export function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function loadPreferences() {
  try {
    return { lang: 'ar', theme: 'light', favorites: [], cart: {}, user: null, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') };
  } catch {
    return { lang: 'ar', theme: 'light', favorites: [], cart: {}, user: null };
  }
}

export function savePreferences(prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

export function resetDemoData() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(PREF_KEY);
}
