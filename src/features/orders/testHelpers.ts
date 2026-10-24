import { screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import type { OrderDetail } from './types';

/** `GET /me` and the order, the two things every signed-in order screen asks for. */
export function orderRoutes(order: OrderDetail) {
  return { 'GET /orders/:id': { body: { data: order } } };
}

/**
 * Holds back requests whose path contains `fragment` until `release()`, so a loading state can be seen.
 * Call it after `installFakeApi`, which supplies the `fetch` it wraps.
 */
export function holdRequests(fragment: string) {
  const realFetch = globalThis.fetch;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes(fragment)) await gate;
    return realFetch(input, init);
  });
  return {
    release: () => {
      release();
    },
  };
}

/** Queries limited to one labelled region of the page, e.g. `region('Summary')`. */
export function region(name: string) {
  return within(screen.getByRole('region', { name }));
}
