import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { homeStore } from '../testData';

describe('Category discovery and product filters', () => {
  it('finds categories by English, Arabic and subcategory names and clears an empty search', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    await renderApp({ route: '/categories', seenWelcome: true });
    const search = screen.getByRole('searchbox', { name: 'Search categories by name' });
    await user.type(search, 'snacks');
    expect(await screen.findByRole('link', { name: 'Food' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Toys' })).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'أطعمة');
    expect(screen.getByRole('link', { name: 'Food' })).toBeVisible();
    await user.clear(search);
    await user.type(search, 'missing');
    expect(screen.getByRole('heading', { name: 'No matching categories' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear category search' }));
    expect(screen.getByRole('link', { name: 'Toys' })).toBeVisible();
  });

  it('combines category, minimum/maximum price and best sellers; clears back to category browsing', async () => {
    const api = installCatalogApi({ 'GET /sellers': { body: { data: [homeStore] } } });
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/categories', seenWelcome: true });
    await user.click(screen.getByText('Filter and sort'));
    await user.selectOptions(await screen.findByLabelText('Category and subcategory'), 'food');
    await user.selectOptions(screen.getByLabelText('Minimum unit price'), '100');
    await user.selectOptions(screen.getByLabelText('Maximum unit price'), '300');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'best_selling');
    await waitFor(() => {
      const query = queriesOf(api, 'GET /products').at(-1);
      expect(query?.get('category')).toBe('food');
      expect(query?.get('min_price')).toBe('100');
      expect(query?.get('max_price')).toBe('300');
      expect(query?.get('sort')).toBe('best_selling');
    });
    expect(
      screen.queryByRole('searchbox', { name: 'Search categories by name' }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Minimum unit price'), '500');
    expect(router.state.location.search).not.toContain('max_price');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'price_desc');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(
      await screen.findByRole('searchbox', { name: 'Search categories by name' }),
    ).toBeVisible();
    expect(router.state.location.search).toBe('');
  });
});
