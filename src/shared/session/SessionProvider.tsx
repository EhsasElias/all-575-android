import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  authEvents,
  http as defaultHttp,
  tokenStore as defaultTokenStore,
  type Data,
  type HttpClient,
  type TokenStore,
} from '@/shared/api';
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

    async function restore() {
      if ((await store.get()) === null) {
        setStatus('guest');
        return;
      }
      try {
        const { data } = await client.get<Data<SessionUser>>('/me', { signal: controller.signal });
        setUser(data);
        setStatus('signed-in');
      } catch {
        if (controller.signal.aborted) return;
        // A 401 has already made the client drop the token; an offline failure leaves it for the next start.
        setStatus('guest');
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
