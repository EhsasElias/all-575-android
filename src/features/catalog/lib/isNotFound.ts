import { isApiError } from '@/shared/api';

/** True for the server's "no such product / seller", as opposed to a connection or server failure. */
export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.kind === 'not-found';
}
