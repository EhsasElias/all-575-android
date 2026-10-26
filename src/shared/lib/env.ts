import { readSavedServer } from './testServer';

/** The API address set in `public/config.js` after the build, if any. */
function configuredApiBaseUrl(): string | null {
  const value: unknown = window.ALL575_CONFIG?.apiBaseUrl;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export const env = {
  // A tester's saved address wins (test builds only), then config.js, then the address built in.
  apiBaseUrl:
    readSavedServer() ?? configuredApiBaseUrl() ?? import.meta.env.VITE_API_BASE_URL ?? '',
} as const;
