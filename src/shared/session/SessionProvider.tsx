import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  authEvents,
  http as defaultHttp,
  isApiError,
  tokenStore as defaultTokenStore,
  type Data,
  type HttpClient,
  type TokenStore,
} from '@/shared/api';
import { RESTORE_RETRY_DELAYS_MS, waitBeforeRetry } from './restoreRetry';
import {
  SessionContext,
  type Session,
  type SessionStatus,
  type SessionUser,
} from './sessionContext';

type SessionProviderProps = {
  children: ReactNode;
  /** Replaceable for tests. */
  client?: HttpClient;
  store?: TokenStore;
};

/**
 * Knows who is signed in. On start it looks for a stored token and asks the server who it belongs to. A token
 * the server rejects (expired, revoked from another device) signs the customer out wherever they are in the app.
 */
export function SessionProvider({
  children,
  client = defaultHttp,
  store = defaultTokenStore,
}: SessionProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);

  const becomeGuest = useCallback(() => {
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    const controller = new AbortController();

    // Storage that cannot be read (a locked or damaged keystore) is treated like no token: the customer can still sign in.
    async function hasStoredToken(): Promise<boolean> {
      try {
        return (await store.get()) !== null;
      } catch {
        return false;
      }
    }

    async function restore() {
      if (!(await hasStoredToken())) {
        setStatus('guest');
        return;
      }
      for (let attempt = 0; ; attempt++) {
        try {
          const { data } = await client.get<Data<SessionUser>>('/me', {
            signal: controller.signal,
          });
          setUser(data);
          setStatus('signed-in');
          return;
        } catch (error) {
          if (controller.signal.aborted) return;
          // Meanwhile the customer can browse as a guest. A 401 has already made the client drop the token, so
          // that is final; anything else (offline, a timeout, a server error) leaves the token and asks again.
          setStatus('guest');
          const delay = RESTORE_RETRY_DELAYS_MS[attempt];
          if ((isApiError(error) && error.kind === 'unauthenticated') || delay === undefined)
            return;
          if (!(await waitBeforeRetry(delay, controller.signal))) return;
        }
      }
    }

    void restore();
    return () => {
      controller.abort();
    };
  }, [client, store]);

  useEffect(() => authEvents.onUnauthorized(becomeGuest), [becomeGuest]);

  const signIn = useCallback(
    async (token: string, signedInUser: SessionUser) => {
      await store.set(token);
      setUser(signedInUser);
      setStatus('signed-in');
    },
    [store],
  );

  const signOut = useCallback(async () => {
    try {
      await client.delete('/auth/session');
    } catch {
      // Offline or already expired: the device forgets the token either way.
    }
    await store.clear();
    becomeGuest();
  }, [client, store, becomeGuest]);

  const session = useMemo<Session>(
    () => ({ status, user, signIn, signOut, setUser }),
    [status, user, signIn, signOut],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
