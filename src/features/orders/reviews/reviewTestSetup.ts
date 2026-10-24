import { screen } from '@testing-library/react';
import { installFakeApi, type FakeRoutes } from '@/test/fakeApi';
import { testUser } from '@/test/fixtures';
import { renderApp } from '@/test/render';
import { ORDER_ID, buildReview } from '../testData';
import { deliveredOrder } from '../testScenarios';

const DAY_MS = 86_400_000;

/** A delivered order on screen, with the given extra replies scripted. */
export function openDelivered(routes: FakeRoutes = {}, language: 'en' | 'ar' = 'en') {
  const api = installFakeApi({
    'GET /me': { body: { data: testUser } },
    'GET /orders/:id': { body: { data: deliveredOrder() } },
    ...routes,
  });
  return renderApp({
    route: `/orders/${ORDER_ID}`,
    signedIn: true,
    seenWelcome: true,
    language,
  }).then(() => api);
}

/** What the API answers when a review is saved: editable for three more days. */
export const createdReview = (overrides = {}) =>
  buildReview({
    editable_until: new Date(Date.now() + 3 * DAY_MS + 3_600_000).toISOString(),
    ...overrides,
  });

export function rate(stars: number) {
  return screen.findByRole('radio', { name: `Rate ${String(stars)} out of 5` });
}
