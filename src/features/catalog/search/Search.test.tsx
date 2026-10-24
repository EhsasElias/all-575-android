import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { setPreference } from '@/shared/storage';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { biscuits, page, socks } from '../testData';

const searchQueries = (api: ReturnType<typeof installCatalogApi>) =>
  queriesOf(api, 'GET /products').map((query) => query.get('q'));

function renderSearch(route = '/search', language: 'en' | 'ar' = 'en') {
  return renderApp({ route, seenWelcome: true, language });
}

/**
 * Takes over the clock once the screen is up. The clock still follows real time a little, which the testing
 * library needs, so waits are measured with margins; the exact 300 ms is pinned in useSearchInput.test.tsx.
 */
function startTimers() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

async function pass(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

describe('Search', () => {
  it('starts with a focused search box, a hint and categories to browse', async () => {
    const api = installCatalogApi();
    await renderSearch();

    const box = screen.getByRole('searchbox', { name: 'Search products' });
    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeVisible();
    expect(box).toHaveFocus();
    expect(screen.getByText('Search for a product by name, or browse a category.')).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Food' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse all categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(searchQueries(api)).toEqual([]);
  });

  it('waits 300 ms after the last keystroke, then sends one request with the whole word', async () => {
    const api = installCatalogApi();
    await renderSearch();
    const user = startTimers();

    await user.type(screen.getByRole('searchbox'), 'bis');
    await pass(150);
    expect(searchQueries(api)).toEqual([]);

    await pass(200);
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(searchQueries(api)).toEqual(['bis']);
  });

  it('restarts the wait on every keystroke', async () => {
    const api = installCatalogApi();
    await renderSearch();
    const user = startTimers();
    const box = screen.getByRole('searchbox');

    await user.type(box, 'bi');
    await pass(200);
    await user.type(box, 'sc');
    await pass(200);
    expect(searchQueries(api)).toEqual([]);

    await pass(200);
    await screen.findByRole('link', { name: 'Biscuits' });
    expect(searchQueries(api)).toEqual(['bisc']);
  });

  it('keeps the query in the address, replacing it instead of piling up history', async () => {
    installCatalogApi();
    const { router } = await renderSearch();
    const user = startTimers();
    const entriesBefore = window.history.length;

    await user.type(screen.getByRole('searchbox'), 'milk');
    await pass(500);

    expect(router.state.location.search).toBe('?q=milk');
    expect(window.history.length).toBe(entriesBefore);
  });

  it('searches at once on Enter', async () => {
    const api = installCatalogApi();
    await renderSearch();
    const user = startTimers();

    await user.type(screen.getByRole('searchbox'), 'milk{Enter}');

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(searchQueries(api)).toEqual(['milk']);
  });

  it('opens with the query from the address, shows it in the box and sends it', async () => {
    const api = installCatalogApi({ 'GET /products': { body: page([biscuits, socks]) } });
    await renderSearch('/search?q=bis');

    expect(screen.getByRole('searchbox')).toHaveValue('bis');
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Results for “bis”' })).toBeVisible();
    expect(searchQueries(api)).toEqual(['bis']);
  });

  it('clears the box and the address with the clear button, and goes back to the start', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderSearch('/search?q=bis');
    await screen.findByRole('link', { name: 'Biscuits' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(router.state.location.search).toBe('');
    expect(screen.queryByRole('link', { name: 'Biscuits' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.getByText('Search for a product by name, or browse a category.')).toBeVisible();
  });

  it('does not ask the server for a single letter, and says why', async () => {
    const api = installCatalogApi();
    await renderSearch();
    const user = startTimers();

    await user.type(screen.getByRole('searchbox'), 'a');
    await pass(500);

    expect(screen.getByText('Type at least 2 letters to search.')).toBeVisible();
    expect(searchQueries(api)).toEqual([]);
  });

  it('sends the area the customer chose', async () => {
    const api = installCatalogApi();
    const { router } = await renderSearch('/categories');
    setPreference('deliveryZone', JSON.stringify({ id: 1, name: { ar: 'الرياض', en: 'Riyadh' } }));

    await act(async () => {
      await router.navigate('/search?q=bis');
    });
    await screen.findByRole('link', { name: 'Biscuits' });

    expect(queriesOf(api, 'GET /products')[0]?.get('zone_id')).toBe('1');
  });

  it('says nothing was found and suggests categories to browse', async () => {
    installCatalogApi({ 'GET /products': { body: page([]) } });
    await renderSearch('/search?q=zzz');

    expect(await screen.findByRole('heading', { name: 'No results for “zzz”' })).toBeVisible();
    const suggestions = screen.getByRole('list', { name: 'Browse a category' });
    expect(within(suggestions).getByRole('link', { name: 'Food' })).toHaveAttribute(
      'href',
      '/categories/food',
    );
    expect(screen.getByRole('link', { name: 'Browse all categories' })).toBeVisible();
  });

  it('shows placeholders while searching', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    await renderSearch('/search?q=bis');

    expect(within(screen.getByRole('main')).getAllByRole('status')[0]).toHaveTextContent('Loading');
  });

  it('shows an error with a retry, and recovers', async () => {
    let attempt = 0;
    installCatalogApi({
      'GET /products': () => {
        attempt += 1;
        return attempt === 1 ? { status: 400, body: { message: 'x' } } : { body: page([biscuits]) };
      },
    });
    const user = userEvent.setup();
    await renderSearch('/search?q=bis');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
  });

  it('is reachable from the home screen', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/home', seenWelcome: true });

    await user.click(screen.getByRole('link', { name: 'Search products' }));

    expect(router.state.location.pathname).toBe('/search');
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('works in Arabic, right to left, with Arabic names', async () => {
    installCatalogApi();
    await renderSearch('/search?q=بس', 'ar');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'البحث' })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: 'ابحث عن منتج' })).toHaveValue('بس');
    expect(await screen.findByRole('link', { name: 'بسكويت' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'نتائج «بس»' })).toBeVisible();
  });
});
