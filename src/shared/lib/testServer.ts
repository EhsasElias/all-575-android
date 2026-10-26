const STORAGE_KEY = 'all575.testServer';
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Only a test build (`VITE_TEST_PANEL=true`) lets the server address be typed inside the app. A production build
 * ignores a saved address, never shows the screen for it and cannot be pointed at another server by a link.
 */
export function isTestServerEnabled(): boolean {
  return import.meta.env.VITE_TEST_PANEL === 'true';
}

/**
 * Turns what a tester typed ("192.168.1.23:8000", "https://x.trycloudflare.com/") into the API address, or null
 * when it is not the address of a web server. A password, a query or a fragment is refused.
 */
export function normalizeServerAddress(input: string): string | null {
  const typed = input.trim();
  if (typed === '') return null;

  let url: URL;
  try {
    url = new URL(SCHEME.test(typed) ? typed : `http://${typed}`);
  } catch {
    return null;
  }

  const isWeb = url.protocol === 'http:' || url.protocol === 'https:';
  const hasExtras =
    url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '';
  if (!isWeb || url.hostname === '' || hasExtras) return null;

  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path === '' ? '/api/v1' : path}`;
}

/** The address saved by the test screen, or null (always null outside a test build). */
export function readSavedServer(): string | null {
  if (!isTestServerEnabled()) return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === null ? null : normalizeServerAddress(saved);
  } catch {
    // Blocked storage: the built-in address applies.
    return null;
  }
}

/** Returns false when the browser would not keep it. */
export function saveServer(address: string): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, address);
    return true;
  } catch {
    return false;
  }
}

export function clearSavedServer(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing was saved if storage is blocked.
  }
}
