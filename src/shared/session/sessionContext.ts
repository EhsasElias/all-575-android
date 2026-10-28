import { createContext, useContext } from 'react';
import type { Schemas } from '@/shared/api';

export type SessionUser = Schemas['UserResource'];

export type SessionStatus = 'loading' | 'guest' | 'signed-in';

export type Session = {
  status: SessionStatus;
  user: SessionUser | null;
  /** Call after a code was verified: keeps the token and marks the customer as signed in. */
  signIn: (token: string, user: SessionUser) => Promise<void>;
  /** Ends this device's session on the server (best effort), forgets the token and clears cached data. */
  signOut: () => Promise<void>;
  /** Revalidate an unlocked native session with the server; biometrics never mint a token. */
  restoreSession: () => Promise<void>;
  /** Replaces the cached customer, e.g. after a profile or consent change. */
  setUser: (user: SessionUser) => void;
};

export const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (session === null) throw new Error('useSession must be used inside <SessionProvider>');
  return session;
}
