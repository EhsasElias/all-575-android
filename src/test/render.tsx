import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { expect } from 'vitest';
import { App } from '@/app/App';
import { appRoutes } from '@/app/router';
import { initI18n, type Language } from '@/shared/i18n';
import { appResources } from '@/app/i18n-resources';
import { tokenStore } from '@/shared/api';
import { loadPreferences } from '@/shared/storage';
import { createMemoryPreferences } from './memoryPreferences';

type RenderAppOptions = {
  route?: string;
  seenWelcome?: boolean;
  language?: Language;
  /** Starts with a stored token, as for a returning customer. Script `GET /me` with `installFakeApi` too. */
  signedIn?: boolean;
};

/** Renders the whole app on an in-memory router, as it would start on a fresh install. */
export async function renderApp({
  route = '/',
  seenWelcome = false,
  language = 'en',
  signedIn = false,
}: RenderAppOptions = {}) {
  if (signedIn) await tokenStore.set('a575_test_token');
  else await tokenStore.clear();
  await loadPreferences(createMemoryPreferences(seenWelcome ? { welcomeSeen: 'true' } : {}));
  await initI18n({ resources: appResources, language });
  const router = createMemoryRouter(appRoutes, { initialEntries: [route] });
  const result = render(<App router={router} />);
  // Route loaders, like the first-launch redirect, finish asynchronously.
  await waitFor(() => {
    expect(router.state.initialized && router.state.navigation.state === 'idle').toBe(true);
  });
  // Every screen has a main landmark; once it shows, the route has rendered.
  await screen.findByRole('main');
  return { router, ...result };
}
