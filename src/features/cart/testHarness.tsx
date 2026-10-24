import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { vi } from 'vitest';
import { StrictMode, type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { tokenStore } from '@/shared/api';
import { formatMoney, type Language } from '@/shared/i18n';
import { SessionProvider, useSession } from '@/shared/session';
import { ToastProvider } from '@/shared/ui';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testStore, testUser } from '@/test/fixtures';
import { createFakeCartApi, type StockAt } from './fakeCartApi';
import type { GuestLine } from './cartTypes';
import { guestCartStore } from './guestCartStore';
import type { CartLineResource } from './testData';
import { useCartItemCount } from './useCartItemCount';

type HarnessOptions = {
  signedIn?: boolean;
  language?: Language;
  /** Extra routes next to the page under test, which is served at `/page`. */
  routes?: RouteObject[];
  strictMode?: boolean;
};

/**
 * Scripts the server for a cart test: who the customer is, the store, and a working in-memory cart
 * (`serverLines` is what the signed-in cart holds at the start). `routes` override any of it.
 */
export function serveCart(
  routes: FakeRoutes = {},
  serverLines: readonly CartLineResource[] = [],
  stock?: StockAt,
) {
  const cart = createFakeCartApi(serverLines, stock);
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    'GET /store': { body: { data: testStore } },
    ...cart.routes,
    ...routes,
  });
  return { api, cart };
}

/**
 * Makes requests to `target` ("METHOD /path") wait until the returned function is called, the way a slow
 * network does. Call it after `serveCart`/`installFakeApi`, which it wraps. Never calling it simulates no answer.
 */
export function holdRequests(target: string): () => void {
  const inner = fetch;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost');
    const method = init?.method ?? 'GET';
    if (`${method} ${url.pathname.replace('/api/v1', '')}` === target) await gate;
    return inner(input, init);
  });
  return release;
}

/** Puts lines in the guest's cart while a screen is showing, the way the product page would. */
export function seedGuestCart(lines: readonly GuestLine[]): void {
  act(() => {
    guestCartStore.write(lines);
  });
}

/** Money as it reads on screen, with the no-break space turned into a plain one for text matching. */
export function money(halalas: number, language: Language = 'en'): string {
  return formatMoney(halalas, language).replace(/\s/g, ' ');
}

/** The tab badge, as text a test can read. */
export function BadgeProbe() {
  return <output aria-label="cart badge">{useCartItemCount()}</output>;
}

/** Stands in for the sign-in screen: signing in is what the merge reacts to. */
export function SignInProbe() {
  const { signIn, status } = useSession();
  return (
    <>
      <p>session: {status}</p>
      <button
        type="button"
        onClick={() => {
          void signIn('a575_signed_in_token', testUser);
        }}
      >
        Sign in now
      </button>
    </>
  );
}

/**
 * Renders a cart component inside the same providers as the real app (query cache, session, toasts) and a
 * memory router, without the rest of the shell. Script the server with `installFakeApi` first.
 */
export async function renderCartPart(page: ReactNode, options: HarnessOptions = {}) {
  const { signedIn = false, language = 'en', routes = [], strictMode = false } = options;
  if (signedIn) await tokenStore.set('a575_test_token');
  else await tokenStore.clear();
  await i18next.changeLanguage(language);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [{ path: '/page', element: <div data-testid="page">{page}</div> }, ...routes],
    { initialEntries: ['/page'] },
  );
  const tree = (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
  const result = render(strictMode ? <StrictMode>{tree}</StrictMode> : tree);
  await screen.findByTestId('page');
  return { ...result, router, queryClient };
}
