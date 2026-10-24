import { routePaths } from './routes';

/**
 * Where to go after signing in. Only a path inside this app is allowed: anything else (another site, a
 * protocol-relative `//host`, a backslash trick) falls back to the home screen, so a crafted link cannot
 * bounce a customer to a phishing page after they sign in.
 */
export function safeNextPath(raw: string | null): string {
  if (raw === null || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return routePaths.home;
  }
  return raw;
}
