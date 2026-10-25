/**
 * When the check at start-up fails for a reason other than "the server rejected the token" (no signal, a timeout, a
 * server error), the token is kept and asked about again, so a bad connection never signs a customer out for good.
 */
export const RESTORE_RETRY_DELAYS_MS: readonly number[] = [3_000, 10_000, 30_000];

/**
 * Resolves after `ms`, sooner when the device comes back online, and at once when `signal` aborts.
 * The answer says whether to go on (true) or stop because the caller went away (false).
 */
export function waitBeforeRetry(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      window.removeEventListener('online', finish);
      signal.removeEventListener('abort', finish);
      resolve(!signal.aborted);
    };
    const timer = setTimeout(finish, ms);
    window.addEventListener('online', finish, { once: true });
    signal.addEventListener('abort', finish, { once: true });
  });
}
