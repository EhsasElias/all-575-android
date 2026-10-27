import { useSyncExternalStore } from 'react';
import { getPreference, setPreference } from '@/shared/storage';

export type ThemeChoice = 'light' | 'dark' | 'system';

const listeners = new Set<() => void>();

export function readTheme(): ThemeChoice {
  const saved = getPreference('theme');
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setTheme(choice: ThemeChoice) {
  setPreference('theme', choice);
  listeners.forEach((listener) => {
    listener();
  });
}

export function applyTheme(choice: ThemeChoice): void {
  if (choice === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = choice;
}

/** Preference storage is already loaded before the first app render. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, readTheme, readTheme);
  return { choice, setTheme };
}
