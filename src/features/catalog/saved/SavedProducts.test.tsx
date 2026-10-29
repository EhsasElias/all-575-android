import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installFakeApi } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { testUser } from '@/test/fixtures';
import { biscuits, categories, homeStore, makeProductDetail, page } from '../testData';

describe('Saved products and shopping filters', () => {
  it('saves and removes the product through the customer endpoint', async () => {
    const product = makeProductDetail();
    const path = `/me/saved-products/${product.slug}`;
    const api = installFakeApi({
      'GET /me': { body: { data: testUser } },
      [`GET /products/${product.slug}`]: { body: { data: product } },
      [`GET ${path}`]: { body: { data: { saved: false } } },
      [`PUT ${path}`]: { body: { data: { saved: true } } },
      [`DELETE ${path}`]: { body: { data: { saved: false } } },
      [`GET /products/${product.slug}/reviews`]: { body: page([]) },
    });
    const user = userEvent.setup();
    await renderApp({
      route: `/products/${product.slug}`,
      signedIn: true,
      language: 'en',
      seenWelcome: true,
    });
    await user.click(await screen.findByRole('button', { name: 'Save product' }));
    await user.click(await screen.findByRole('button', { name: 'Remove from saved' }));
    await screen.findByRole('button', { name: 'Save product' });
    expect(api.requests()).toContain(`PUT ${path}`);
    expect(api.requests()).toContain(`DELETE ${path}`);
  });

  it('invites a guest to sign in without requesting private saved data', async () => {
    const api = installFakeApi();
    await renderApp({ route: '/account/saved', language: 'en', seenWelcome: true });
    expect(
      await screen.findByText('Sign in to keep your saved products on your account.'),
    ).toBeVisible();
    expect(api.requests().some((p) => p.includes('/me/saved-products'))).toBe(false);
  });

  it('combines category, seller and budget filters and keeps them when searching', async () => {
    const api = installFakeApi({
      'GET /categories': { body: { data: categories } },
      'GET /sellers': { body: { data: [homeStore] } },
      'GET /products': { body: page([biscuits]) },
    });
    const user = userEvent.setup();
    await renderApp({ route: '/search?q=tea', language: 'en', seenWelcome: true });
    await user.click(await screen.findByText('Filter and sort'));
    await user.selectOptions(await screen.findByLabelText('Category and subcategory'), 'food');
    await user.selectOptions(screen.getByLabelText('Company / seller'), homeStore.slug);
    await user.selectOptions(screen.getByLabelText('Maximum unit price'), '500');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'rating');
    const box = screen.getByRole('searchbox', { name: 'Search products' });
    await user.clear(box);
    await user.type(box, 'towels{Enter}');
    await waitFor(() => {
      const call = api
        .calls()
        .filter((c) => c.path === '/products')
        .at(-1);
      expect(call?.query.get('q')).toBe('towels');
      expect(call?.query.get('category')).toBe('food');
      expect(call?.query.get('seller')).toBe(homeStore.slug);
      expect(call?.query.get('max_price')).toBe('500');
      expect(call?.query.get('sort')).toBe('rating');
    });
    expect(screen.getByLabelText('Available in my delivery area')).toBeDisabled();
  });
});
