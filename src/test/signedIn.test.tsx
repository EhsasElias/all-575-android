import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeApi, installFakeApi } from './fakeApi';
import { testStore, testUser } from './fixtures';
import { renderApp } from './render';

describe('test helpers', () => {
  it('matches :param segments and lets a handler read the request', async () => {
    const api = fakeApi({
      'GET /orders/:id': ({ params, query }) => ({
        body: { id: params.id, tab: query.get('tab') },
      }),
    });

    await expect(api.client.get('/orders/42', { query: { tab: 'open' } })).resolves.toEqual({
      id: '42',
      tab: 'open',
    });
  });

  it('starts the app signed in when asked', async () => {
    installFakeApi({
      'GET /me': { body: { data: testUser } },
      'GET /store': { body: { data: testStore } },
    });

    await renderApp({ route: '/account', signedIn: true, seenWelcome: true });

    expect(await screen.findByRole('main')).toBeInTheDocument();
  });

  it('starts as a guest by default', async () => {
    const api = installFakeApi();

    await renderApp({ route: '/account', seenWelcome: true });

    expect(api.requests()).not.toContain('GET /me');
  });
});
