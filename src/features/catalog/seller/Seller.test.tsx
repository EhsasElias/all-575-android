import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FakeRoutes } from '@/test/fakeApi';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { biscuits, homeStore, page, socks } from '../testData';

function installSeller(routes: FakeRoutes = {}) {
  return installCatalogApi({
    'GET /sellers/:slug': { body: { data: homeStore } },
    'GET /products': { body: page([biscuits, socks]) },
    ...routes,
  });
}

function renderSeller(language: 'en' | 'ar' = 'en', slug = 'home-store') {
  return renderApp({ route: `/sellers/${slug}`, seenWelcome: true, language });
}

describe('Seller page', () => {
  it('shows the seller and asks for their products only', async () => {
    const api = installSeller();
    await renderSeller();

    expect(await screen.findByRole('heading', { level: 1, name: 'Home Store' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Socks' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Products' })).toBeVisible();
    expect(queriesOf(api, 'GET /products')[0]?.get('seller')).toBe('home-store');
    expect(api.requests()).toContain('GET /sellers/home-store');
  });

  it('opens from the seller link on a product', async () => {
    installSeller({
      'GET /products/:slug': {
        body: {
          data: {
            ...biscuits,
            description: { ar: null, en: null },
            vat_class: 'standard',
            variants: [],
          },
        },
      },
      'GET /products/:slug/reviews': { body: page([]) },
    });
    const user = userEvent.setup();
    const { router } = await renderApp({ route: '/products/demo-food-1', seenWelcome: true });

    await user.click(await screen.findByRole('link', { name: 'Home Store' }));

    expect(router.state.location.pathname).toBe('/sellers/home-store');
    expect(await screen.findByRole('heading', { level: 1, name: 'Home Store' })).toBeVisible();
  });

  it('has a page of its own for a seller that does not exist', async () => {
    installSeller({ 'GET /sellers/:slug': { status: 404, body: { message: 'No query results' } } });
    await renderSeller('en', 'nobody');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'We could not find this seller' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.queryByText('No query results')).not.toBeInTheDocument();
  });

  it('says a seller with no products has none yet', async () => {
    installSeller({ 'GET /products': { body: page([]) } });
    await renderSeller();

    expect(
      await screen.findByRole('heading', { name: 'No products from this seller yet' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toBeVisible();
  });

  it('shows an error with a retry when the seller cannot be loaded, and recovers', async () => {
    let attempt = 0;
    installSeller({
      'GET /sellers/:slug': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 400, body: { message: 'x' } }
          : { body: { data: homeStore } };
      },
    });
    const user = userEvent.setup();
    await renderSeller();

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Home Store' })).toBeVisible();
  });

  it('shows an error with a retry when the products cannot be loaded', async () => {
    installSeller({ 'GET /products': { status: 400, body: { message: 'x' } } });
    await renderSeller();

    const products = await screen.findByRole('region', { name: 'Products' });
    expect(await within(products).findByRole('button', { name: 'Try again' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Home Store' })).toBeVisible();
  });

  it('shows placeholders while loading', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    await renderSeller();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('status')[0]).toHaveTextContent('Loading');
  });

  it('shows the Arabic name and products, right to left', async () => {
    installSeller();
    await renderSeller('ar');

    expect(await screen.findByRole('heading', { level: 1, name: 'متجر البيت' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'بسكويت' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'المنتجات' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });
});
