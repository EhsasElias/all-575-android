import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fakeApi } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { SessionProvider } from './SessionProvider';
import { useSession } from './sessionContext';

function Probe() {
  const session = useSession();
  return (
    <>
      <p>{`${session.status}:${session.user?.name ?? 'nobody'}`}</p>
      <button
        onClick={() => {
          void session.restoreSession().catch(() => undefined);
        }}
      >
        Restore
      </button>
      <button
        onClick={() => {
          void session.signOut();
        }}
      >
        Sign out
      </button>
    </>
  );
}

async function mount(api: ReturnType<typeof fakeApi>) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider client={api.client} store={api.store}>
        <Probe />
      </SessionProvider>
    </QueryClientProvider>,
  );
  await screen.findByText('guest:nobody');
}

describe('revalidating an unlocked session', () => {
  it('asks the server who owns the token before showing the account', async () => {
    const api = fakeApi({ 'GET /me': { body: { data: testUser } } });
    await mount(api);
    const user = userEvent.setup();
    await api.store.set('unlocked-token');
    await user.click(screen.getByText('Restore'));
    expect(await screen.findByText('signed-in:Sara')).toBeVisible();
    expect(api.calls()[0]?.headers.get('Authorization')).toBe('Bearer unlocked-token');
  });

  it('rejects an expired token rather than treating biometric success as a server login', async () => {
    const api = fakeApi({ 'GET /me': { status: 401, body: { message: 'Expired' } } });
    await mount(api);
    await api.store.set('expired-token');
    await userEvent.setup().click(screen.getByText('Restore'));
    expect(screen.getByText('guest:nobody')).toBeVisible();
    await expect(api.store.get()).resolves.toBeNull();
  });

  it('does not restore an in-flight account response after sign-out', async () => {
    const api = fakeApi({ 'DELETE /auth/session': { status: 204 } });
    await mount(api);
    await api.store.set('unlocked-token');
    let finish = () => {
      throw new Error('Request not started');
    };
    api.fetchFn.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = () => {
            resolve(
              new Response(JSON.stringify({ data: testUser }), {
                headers: { 'Content-Type': 'application/json' },
              }),
            );
          };
        }),
    );
    const user = userEvent.setup();
    await user.click(screen.getByText('Restore'));
    await user.click(screen.getByText('Sign out'));
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    expect(screen.getByText('guest:nobody')).toBeVisible();
    expect(screen.queryByText('signed-in:Sara')).not.toBeInTheDocument();
  });
});
