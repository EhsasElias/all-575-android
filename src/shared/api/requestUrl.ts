import { ApiError } from './api-error';

type Query = Record<string, string | number | boolean | undefined> | undefined;

function unsafeAddress(): never {
  // Never include an address or customer-supplied segment in a diagnostic.
  throw new ApiError({ kind: 'unexpected', message: 'The API address is not safe to use' });
}

/** Keep every bearer request inside the configured API prefix, including downloads. */
export function buildRequestUrl(baseUrl: string, path: string, query: Query): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return unsafeAddress();
  }
  if (
    /[\\\s?#]/.test(path) ||
    /[\\\p{Cc}]/u.test(decoded) ||
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    path.startsWith('//') ||
    decoded.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    return unsafeAddress();
  }

  const base = baseUrl.replace(/\/+$/, '');
  const relative = base === '' || (base.startsWith('/') && !base.startsWith('//'));
  let parsedBase: URL;
  try {
    parsedBase = new URL(base || '/', window.location.href);
  } catch {
    return unsafeAddress();
  }
  const insecureAllowed = import.meta.env.DEV || import.meta.env.VITE_TEST_PANEL === 'true';
  if (
    !['https:', ...(insecureAllowed ? ['http:'] : [])].includes(parsedBase.protocol) ||
    parsedBase.username !== '' ||
    parsedBase.password !== '' ||
    parsedBase.search !== '' ||
    parsedBase.hash !== '' ||
    base.startsWith('//') ||
    (!relative && !/^https?:\/\//i.test(base)) ||
    /[\\\s]/.test(base)
  ) {
    return unsafeAddress();
  }
  const joined = `${base}/${path.replace(/^\/+/, '')}`;
  const url = new URL(joined, window.location.href);
  const prefix = parsedBase.pathname.replace(/\/+$/, '') + '/';
  if (url.origin !== parsedBase.origin || !url.pathname.startsWith(prefix)) {
    return unsafeAddress();
  }
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return relative ? `${url.pathname}${url.search}` : url.href;
}
