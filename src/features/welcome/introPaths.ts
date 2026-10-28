import { routePaths, safeNextPath } from '@/shared/lib';

export function afterIntroPath(raw: string | null): string {
  const next = safeNextPath(raw);
  const pathname = next.split(/[?#]/)[0];
  return [routePaths.root, routePaths.welcome, routePaths.logoIntro].some(
    (path) => path === pathname,
  )
    ? routePaths.home
    : next;
}

function introPath(base: string, destination: string | null): string {
  const next = afterIntroPath(destination);
  return next === routePaths.home ? base : `${base}?next=${encodeURIComponent(next)}`;
}

export const welcomePath = (destination: string | null) =>
  introPath(routePaths.welcome, destination);
export const logoIntroPath = (destination: string | null) =>
  introPath(routePaths.logoIntro, destination);

/** A reload on a shopping/deep-link URL must start the intro too, without losing its destination. */
export function initialWelcomePath(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
): string | null {
  if (location.pathname === routePaths.welcome || location.pathname === routePaths.root)
    return null;
  const destination =
    location.pathname === routePaths.logoIntro
      ? new URLSearchParams(location.search).get('next')
      : `${location.pathname}${location.search}${location.hash}`;
  return welcomePath(destination);
}
