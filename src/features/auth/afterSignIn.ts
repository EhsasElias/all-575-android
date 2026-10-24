import { routePaths, safeNextPath } from '@/shared/lib';

/**
 * Where to go once signed in: the page the customer was heading to, or home. A `next` that points back at
 * the sign-in screen would bounce forever, so it also falls back to home.
 */
export function afterSignInPath(next: string | null): string {
  const path = safeNextPath(next);
  const pathname = path.split(/[?#]/)[0];
  return pathname === routePaths.signIn ? routePaths.home : path;
}
