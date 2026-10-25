/** The API address set in `public/config.js` after the build, if any. */
function configuredApiBaseUrl(): string | null {
  const value: unknown = window.ALL575_CONFIG?.apiBaseUrl;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export const env = {
  apiBaseUrl: configuredApiBaseUrl() ?? import.meta.env.VITE_API_BASE_URL ?? '',
} as const;
