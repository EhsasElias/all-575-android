import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authEvents } from '@/shared/api';
import { fakeApi } from '@/test/fakeApi';
import { SessionProvider } from './SessionProvider';
import { useSession, type Session, type SessionUser } from './sessionContext';

const user: SessionUser = {
  id: 7,
  name: 'Sara',
  phone: '+966512345678',
  email: null,
  locale: 'ar',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-01',
    privacy_version: '2026-10-01',
    marketing: false,
    needs_update: false,
  },
};

type Api = ReturnType<typeof fakeApi>;

function Probe({ onReady }: { onReady: (session: Session) => void }) {
  const session = useSession();
  onReady(session);
  return <p>{`${session.status}:${session.user?.name ?? 'nobody'}`}</p>;
}

function mount(api: Api) {
  const queryClient = new QueryClient();
  const handle: { session: Session | null } = { session: null };
  render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider client={api.client} store={api.store}>
        <Probe
          onReady={(session) => {
            handle.session = session;
          }}
        />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return { queryClient, handle };
}

function currentSession(handle: { session: Session | null }): Session {
  if (handle.session === null) throw new Error('The session is not available yet');
  return handle.session;
}

describe('SessionProvider', () => {
  it('is a guest without a token and never calls the server', async () => {
    const api = fakeApi();
    mount(api);

    expect(await screen.findByText('guest:nobody')).toBeInTheDocument();
    expect(api.requests()).toEqual([]);
  });

  it('is signed in when the stored token is accepted', async () => {
    const api = fakeApi({ 'GET /me': { body: { data: user } } });
    await api.store.set('good-token');
    mount(api);

    expect(await screen.findByText('signed-in:Sara')).toBeInTheDocument();
  });

  it('is a guest, with the token dropped, when the server rejects the stored token', async () => {
    const api = fakeApi({ 'GET /me': { status: 401, body: { message: 'Unauthenticated.' } } });
    await api.store.set('stale-token');
    mount(api);

    await waitFor(() => {
      expect(screen.getByText('guest:nobody')).toBeInTheDocument();
    });
    await expect(api.store.get()).resolves.toBeNull();
  });

  it('keeps the token and shows a guest when the server cannot be reached', async () => {
    const api = fakeApi({ 'GET /me': 'offline' });
    await api.store.set('good-token');
    mount(api);

    expect(await screen.findByText('guest:nobody')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBe('good-token');
  });

  it('signs in: stores the token and exposes the customer', async () => {
    const api = fakeApi();
    const { handle } = mount(api);
    await screen.findByText('guest:nobody');

    await act(async () => {
      await currentSession(handle).signIn('a575_new-token', user);
    });

    expect(screen.getByText('signed-in:Sara')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBe('a575_new-token');
  });

  it('signs out: tells the server, forgets the token and clears cached data', async () => {
    const api = fakeApi({
      'GET /me': { body: { data: user } },
      'DELETE /auth/session': { status: 204 },
    });
    await api.store.set('good-token');
    const { queryClient, handle } = mount(api);
    await screen.findByText('signed-in:Sara');
    queryClient.setQueryData(['orders'], [{ id: 'private' }]);

    await act(async () => {
      await currentSession(handle).signOut();
    });

    expect(api.requests()).toContain('DELETE /auth/session');
    expect(screen.getByText('guest:nobody')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBeNull();
    expect(queryClient.getQueryData(['orders'])).toBeUndefined();
  });

  it('signs out locally even when the server cannot be told', async () => {
    const api = fakeApi({ 'GET /me': { body: { data: user } }, 'DELETE /auth/session': 'offline' });
    await api.store.set('good-token');
    const { handle } = mount(api);
    await screen.findByText('signed-in:Sara');

    await act(async () => {
      await currentSession(handle).signOut();
    });

    expect(screen.getByText('guest:nobody')).toBeInTheDocument();
    await expect(api.store.get()).resolves.toBeNull();
  });

  it('becomes a guest when any request reports the token was rejected', async () => {
    const api = fakeApi({ 'GET /me': { body: { data: user } } });
    await api.store.set('good-token');
    mount(api);
    await screen.findByText('signed-in:Sara');

    act(() => {
      authEvents.emitUnauthorized();
    });

    expect(screen.getByText('guest:nobody')).toBeInTheDocument();
  });
});
