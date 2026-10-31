import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  authEvents,
  http as defaultHttp,
  isApiError,
  readToken,
  tokenStore as defaultTokenStore,
  type Data,
  type HttpClient,
  type TokenStore,
} from '@/shared/api';
import { RESTORE_RETRY_DELAYS_MS, waitBeforeRetry } from './restoreRetry';
import { useBiometricAppLock } from './useBiometricAppLock';
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
  const revision = useRef(0);

  const becomeGuest = useCallback(() => {
    revision.current++;
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  useBiometricAppLock(becomeGuest);

  useEffect(() => {
    const controller = new AbortController();
    const current = revision.current;

    // Storage that cannot be read, or does not answer (a locked or damaged keystore), is treated like no token: the
    // customer can still sign in.
    async function hasStoredToken(): Promise<boolean> {
      return (await readToken(store)) !== null;
    }

    async function restore() {
      if (!(await hasStoredToken())) {
        if (!controller.signal.aborted && current === revision.current) setStatus('guest');
        return;
      }
      for (let attempt = 0; ; attempt++) {
        try {
          const { data } = await client.get<Data<SessionUser>>('/me', {
            signal: controller.signal,
          });
          if (controller.signal.aborted || current !== revision.current) return;
          setUser(data);
          setStatus('signed-in');
          return;
        } catch (error) {
          if (controller.signal.aborted || current !== revision.current) return;
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
      const current = ++revision.current;
      await store.set(token);
      if (current !== revision.current) throw new Error('Session changed');
      setUser(signedInUser);
      setStatus('signed-in');
    },
    [store],
  );

  const signOut = useCallback(async () => {
    revision.current++;
    try {
      await client.delete('/auth/session');
    } catch {
      // Offline or already expired: the device forgets the token either way.
    }
    await store.clear();
    // An app logout also ends the Firebase web session if that login method was used.
    if (import.meta.env.VITE_FIREBASE_AUTH_ENABLED === 'true') {
      try {
        const [{ getFirebaseAuth }, { signOut: firebaseSignOut }] = await Promise.all([
          import('@/shared/firebase/firebase'),
          import('firebase/auth'),
        ]);
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        // A stale or unavailable Firebase session must not prevent local logout.
      }
    }
    becomeGuest();
  }, [client, store, becomeGuest]);

  const restoreSession = useCallback(async () => {
    const current = revision.current;
    if ((await readToken(store)) === null) throw new Error('Session unavailable');
    const { data } = await client.get<Data<SessionUser>>('/me');
    if (current !== revision.current) throw new Error('Session changed');
    setUser(data);
    setStatus('signed-in');
  }, [client, store]);

  const session = useMemo<Session>(
    () => ({ status, user, signIn, signOut, restoreSession, setUser }),
    [status, user, signIn, signOut, restoreSession],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
