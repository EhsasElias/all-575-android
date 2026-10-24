import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { commonLocales, initI18n } from '@/shared/i18n';
import { fakeApi } from '@/test/fakeApi';
import { RequireAuth } from './RequireAuth';
import { SessionProvider } from './SessionProvider';

function SignInStub() {
  const location = useLocation();
  return <p>{`sign-in${location.search}`}</p>;
}

async function mountAt(path: string, api: ReturnType<typeof fakeApi>) {
  await initI18n({
    resources: { en: { common: commonLocales.en }, ar: { common: commonLocales.ar } },
    language: 'en',
  });
  const router = createMemoryRouter(
    [
      { path: '/sign-in', element: <SignInStub /> },
      { element: <RequireAuth />, children: [{ path: '/orders', element: <p>my orders</p> }] },
    ],
    { initialEntries: [path] },
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionProvider client={api.client} store={api.store}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return router;
}

describe('RequireAuth', () => {
  it('sends a guest to sign in and remembers where they were going', async () => {
    const router = await mountAt('/orders?tab=open', fakeApi());

    expect(await screen.findByText('sign-in?next=%2Forders%3Ftab%3Dopen')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/sign-in');
  });

  it('lets a signed-in customer through', async () => {
    const api = fakeApi({ 'GET /me': { body: { data: { id: 1, name: 'Sara' } } } });
    await api.store.set('good-token');

    await mountAt('/orders', api);

    expect(await screen.findByText('my orders')).toBeInTheDocument();
  });
});
