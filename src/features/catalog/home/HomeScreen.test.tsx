import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Language } from '@/shared/i18n';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { biscuits, makeProduct, page } from '../testData';

function renderHome(language: Language = 'en') {
  return renderApp({ route: '/home', seenWelcome: true, language });
}

describe('Home', () => {
  it('shows the heading, the one price, categories and the popular products', async () => {
    installCatalogApi();
    await renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: 'What do you need today?' }),
    ).toBeVisible();
    expect(await screen.findByText(/Every item is 5\.75\s+SAR, VAT included/)).toBeVisible();

    const categories = screen.getByRole('region', { name: 'Categories' });
    expect(await within(categories).findByRole('link', { name: 'Food' })).toHaveAttribute(
      'href',
      '/categories/food',
    );
    expect(within(categories).getByRole('link', { name: 'See all' })).toHaveAttribute(
      'href',
      '/categories',
    );

    const popular = screen.getByRole('region', { name: 'Popular' });
    expect(await within(popular).findByRole('link', { name: 'Biscuits' })).toHaveAttribute(
      'href',
      '/products/demo-food-1',
    );
    expect(within(popular).getByRole('link', { name: 'Socks' })).toBeVisible();
    expect(within(popular).getAllByText(/5\.75\s+SAR/)).toHaveLength(3);
  });

  it('asks for categories and products at the same time, and for a first page only', async () => {
    const api = installCatalogApi();
    await renderHome();
    await screen.findByRole('link', { name: 'Biscuits' });

    expect(api.requests()).toEqual(
      expect.arrayContaining(['GET /categories', 'GET /products', 'GET /store']),
    );
    expect(queriesOf(api, 'GET /products')).toHaveLength(1);
    expect(queriesOf(api, 'GET /products')[0]?.get('per_page')).toBe('12');
    expect(queriesOf(api, 'GET /products')[0]?.has('zone_id')).toBe(false);
  });

  it('links the search entry to /search', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderHome();

    await user.click(screen.getByRole('link', { name: 'Search products' }));

    expect(router.state.location.pathname).toBe('/search');
  });

  it('loads the first row of pictures eagerly and the rest lazily, all with a size', async () => {
    const products = [1, 2, 3, 4, 5].map((id) =>
      makeProduct({ id, slug: `p-${id}`, name: { ar: `م${id}`, en: `Item ${id}` } }),
    );
    installCatalogApi({ 'GET /products': { body: page(products) } });
    await renderHome();
    await screen.findByRole('link', { name: 'Item 1' });

    const popular = screen.getByRole('region', { name: 'Popular' });
    const images = within(popular).getAllByRole('presentation');
    expect(images.map((image) => image.getAttribute('loading'))).toEqual([
      'eager',
      'eager',
      'eager',
      'lazy',
      'lazy',
    ]);
    for (const image of images) {
      expect(image).toHaveAttribute('width');
      expect(image).toHaveAttribute('height');
    }
  });

  it('shows loading placeholders while the data is on its way', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    await renderHome();

    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Loading').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
  });

  it('says there are no products yet, and offers the categories', async () => {
    installCatalogApi({ 'GET /products': { body: page([]) } });
    await renderHome();

    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
  });

  it('shows an error with a retry for the products, and recovers', async () => {
    let attempt = 0;
    installCatalogApi({
      'GET /products': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 400, body: { message: 'Nope' } }
          : { body: page([biscuits]) };
      },
    });
    const user = userEvent.setup();
    await renderHome();

    const popular = screen.getByRole('region', { name: 'Popular' });
    expect(await within(popular).findByRole('alert')).toHaveTextContent(
      'We could not load the products',
    );
    expect(popular).not.toHaveTextContent('Nope');
    expect(screen.getByRole('link', { name: 'Food' })).toBeVisible();

    await user.click(within(popular).getByRole('button', { name: 'Try again' }));

    expect(await within(popular).findByRole('link', { name: 'Biscuits' })).toBeVisible();
  });

  it('shows an error with a retry for the categories while the products still show', async () => {
    installCatalogApi({ 'GET /categories': { status: 400, body: { message: 'Nope' } } });
    await renderHome();

    const categories = screen.getByRole('region', { name: 'Categories' });
    expect(await within(categories).findByRole('button', { name: 'Try again' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
  });

  it('copes with a failing connection by showing the error state after the retries', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    installCatalogApi({ 'GET /products': 'offline' });
    await renderHome();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    const popular = screen.getByRole('region', { name: 'Popular' });
    await waitFor(() => {
      expect(within(popular).getByRole('alert')).toBeVisible();
    });
  });

  it('speaks Arabic, right to left, with the names and the price from the API', async () => {
    installCatalogApi();
    await renderHome('ar');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'ماذا تحتاج اليوم؟' })).toBeVisible();
    expect(await screen.findByText(/كل منتج بسعر 5\.75\s+ر\.س شامل الضريبة/)).toBeVisible();
    expect(await screen.findByRole('link', { name: 'بسكويت' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'أطعمة' })).toBeVisible();
    expect(screen.getAllByText(/5\.75\s+ر\.س/).length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText('Biscuits')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /اختر منطقة التوصيل/ })).toBeVisible();
  });

  it('shows English from the same data, left to right', async () => {
    installCatalogApi();
    await renderHome('en');

    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(screen.queryByText('بسكويت')).not.toBeInTheDocument();
  });

  it('does not show availability on the cards until an area is chosen', async () => {
    installCatalogApi();
    await renderHome();
    await screen.findByRole('link', { name: 'Biscuits' });

    expect(screen.queryByText('Availability unknown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose your delivery area' })).toBeVisible();
  });
});

describe('Home in French', () => {
  it('shows French texts, prices with a comma, and falls back to English product names', async () => {
    installCatalogApi();
    await renderHome('fr');

    expect(
      screen.getByRole('heading', { level: 1, name: /^De quoi avez-vous besoin aujourd'hui\s\?$/ }),
    ).toBeVisible();
    expect(await screen.findByText(/Chaque article coûte 5,75\s+SAR, TVA comprise/)).toBeVisible();

    const categories = screen.getByRole('region', { name: 'Catégories' });
    expect(await within(categories).findByRole('link', { name: 'Food' })).toBeVisible();
    expect(within(categories).getByRole('link', { name: 'Tout voir' })).toBeVisible();

    const popular = screen.getByRole('region', { name: 'Populaires' });
    expect(await within(popular).findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(within(popular).getAllByText(/5,75\s+SAR/)).toHaveLength(3);
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
