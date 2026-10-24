import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { setPreference } from '@/shared/storage';
import { renderApp } from '@/test/render';
import { installProductApi, queriesOf } from '../testApi';
import { makeProductDetail, makeVariant, sizedProduct } from '../testData';

// The shared test setup has already loaded the app, so the cart module is cached; clear the cache for this file.
vi.hoisted(() => {
  vi.resetModules();
});

vi.mock('@/features/cart', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  AddToCart: (await import('../testCartMock')).FakeAddToCart,
}));

function renderProduct(language: 'en' | 'ar' = 'en', slug = 'demo-food-1') {
  return renderApp({ route: `/products/${slug}`, seenWelcome: true, language });
}

const addToCart = () => screen.getByTestId('add-to-cart');

describe('Product page', () => {
  it('shows the name, seller, category, price with the VAT hint and the description', async () => {
    installProductApi();
    await renderProduct();

    expect(await screen.findByRole('heading', { level: 1, name: 'Biscuits' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Home Store' })).toHaveAttribute(
      'href',
      '/sellers/home-store',
    );
    expect(screen.getByRole('link', { name: 'Food' })).toHaveAttribute('href', '/categories/food');
    expect(screen.getByText(/^5\.75\s+SAR$/)).toBeVisible();
    expect(screen.getByText('VAT included')).toBeVisible();
    expect(screen.getByText('Demo product for previewing the store.')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Biscuits' })).toHaveAttribute(
      'src',
      'http://api.test/images/biscuits.png',
    );
  });

  it('has no price filter and no price sort anywhere on the screen', async () => {
    installProductApi();
    await renderProduct();
    await screen.findByRole('heading', { level: 1, name: 'Biscuits' });

    expect(screen.queryByText(/sort|filter/i)).not.toBeInTheDocument();
  });

  it('says so when a product carries no VAT', async () => {
    installProductApi(
      makeProductDetail({
        vat_class: 'zero',
        price: { gross: 575, net: 575, vat: 0, currency: 'SAR' },
        variants: [makeVariant({ price: { gross: 575, net: 575, vat: 0, currency: 'SAR' } })],
      }),
    );
    await renderProduct();

    expect(await screen.findByText('No VAT on this item')).toBeVisible();
    expect(screen.queryByText('VAT included')).not.toBeInTheDocument();
  });

  it('asks for the product and its reviews at once, for the chosen area', async () => {
    const api = installProductApi();
    const { router } = await renderApp({ route: '/categories', seenWelcome: true });
    setPreference('deliveryZone', JSON.stringify({ id: 1, name: { ar: 'الرياض', en: 'Riyadh' } }));
    await router.navigate('/products/demo-food-1');

    await screen.findByRole('heading', { level: 1, name: 'Biscuits' });
    expect(queriesOf(api, 'GET /products/demo-food-1')[0]?.get('zone_id')).toBe('1');
    expect(api.requests()).toContain('GET /products/demo-food-1/reviews');
  });

  it('shows a placeholder, not a broken image, when the product has no picture', async () => {
    installProductApi(makeProductDetail({ image_url: null }));
    await renderProduct();

    await screen.findByRole('heading', { level: 1, name: 'Biscuits' });
    expect(screen.queryByRole('img', { name: 'Biscuits' })).not.toBeInTheDocument();
  });

  it('shows the description as plain text, never as markup', async () => {
    installProductApi(
      makeProductDetail({
        description: { ar: null, en: '<img src=x onerror=alert(1)><b>Bold</b>\nSecond line' },
      }),
    );
    await renderProduct();

    const text = await screen.findByText(/<b>Bold<\/b>/);
    expect(text.tagName).toBe('P');
    expect(text.querySelector('b')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
  });

  it('hides the description section when there is none in either language', async () => {
    installProductApi(makeProductDetail({ description: { ar: null, en: null } }));
    await renderProduct();

    await screen.findByRole('heading', { level: 1, name: 'Biscuits' });
    expect(screen.queryByRole('heading', { name: 'About this product' })).not.toBeInTheDocument();
  });

  it('hands the cart the product and its only variant, and shows no picker', async () => {
    installProductApi();
    await renderProduct();

    await screen.findByRole('heading', { level: 1, name: 'Biscuits' });
    expect(addToCart()).toHaveAttribute('data-variant-id', '1');
    expect(screen.queryByRole('group', { name: 'Choose an option' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('shows the rating summary with a text alternative', async () => {
    installProductApi(makeProductDetail({ rating: { average: 4.5, count: 12 } }));
    await renderProduct();

    expect(await screen.findByRole('img', { name: 'Rated 4.5 out of 5' })).toBeVisible();
    expect(screen.getByText('Number of ratings: 12')).toBeInTheDocument();
  });

  it('says there are no ratings yet', async () => {
    installProductApi();
    await renderProduct();

    expect(await screen.findByText('No ratings yet')).toBeVisible();
  });
});

describe('When the product cannot be shown', () => {
  it('has a page of its own for a product that does not exist', async () => {
    installProductApi(undefined, {
      'GET /products/:slug': { status: 404, body: { message: 'No query results' } },
    });
    await renderProduct('en', 'gone');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'We could not find this product' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.queryByText('No query results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-to-cart')).not.toBeInTheDocument();
  });

  it('says it in Arabic too', async () => {
    installProductApi(undefined, {
      'GET /products/:slug': { status: 404, body: { message: 'x' } },
    });
    await renderProduct('ar', 'gone');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'لم نجد هذا المنتج' }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('shows an error with a retry for anything else, and recovers', async () => {
    let attempt = 0;
    installProductApi(undefined, {
      'GET /products/:slug': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 400, body: { message: 'Server says no' } }
          : { body: { data: makeProductDetail() } };
      },
    });
    const user = userEvent.setup();
    await renderProduct();

    expect(await screen.findByRole('alert')).not.toHaveTextContent('Server says no');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Biscuits' })).toBeVisible();
  });

  it('shows placeholders while the product loads', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    await renderProduct();

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Loading');
  });
});

describe('Languages', () => {
  it('shows the Arabic name, description and price, right to left', async () => {
    installProductApi(sizedProduct);
    await renderProduct('ar');

    expect(await screen.findByRole('heading', { level: 1, name: 'بسكويت' })).toBeVisible();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('منتج تجريبي لعرض المتجر.')).toBeVisible();
    expect(screen.getByText(/^5\.75\s+ر\.س$/)).toBeVisible();
    expect(screen.getByText('شامل الضريبة')).toBeVisible();
    expect(screen.getByRole('group', { name: 'اختر الخيار' })).toBeVisible();
    expect(screen.getByRole('radio', { name: /وسط/ })).toBeChecked();
    expect(screen.queryByText('Biscuits')).not.toBeInTheDocument();
  });

  it('falls back to the other language only for text that is empty', async () => {
    installProductApi(
      makeProductDetail({
        description: { ar: '', en: 'English only description' },
      }),
    );
    await renderProduct('ar');

    expect(await screen.findByText('English only description')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'بسكويت' })).toBeVisible();
  });
});
