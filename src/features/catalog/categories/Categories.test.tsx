import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { setPreference } from '@/shared/storage';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { biscuits, categories, page } from '../testData';

function renderRoute(route: string, language: 'en' | 'ar' = 'en') {
  return renderApp({ route, seenWelcome: true, language });
}

describe('Categories', () => {
  it('lists every category with its sub-categories', async () => {
    installCatalogApi();
    await renderRoute('/categories');

    expect(screen.getByRole('heading', { level: 1, name: 'Categories' })).toBeVisible();
    const food = (await screen.findByRole('link', { name: 'Food' })).closest('li');
    expect(food).not.toBeNull();
    if (food === null) return;
    const subcategories = within(food).getByRole('list', { name: 'Subcategories of Food' });
    expect(within(subcategories).getByRole('link', { name: 'Snacks' })).toHaveAttribute(
      'href',
      '/categories/snacks',
    );
    expect(within(subcategories).getByRole('link', { name: 'Drinks' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Toys' })).toHaveAttribute('href', '/categories/toys');
    expect(screen.queryByRole('list', { name: /Subcategories of Toys/ })).not.toBeInTheDocument();
  });

  it('opens a category from the list', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderRoute('/categories');

    await user.click(await screen.findByRole('link', { name: 'Food' }));

    expect(router.state.location.pathname).toBe('/categories/food');
  });

  it('shows placeholders while loading', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => undefined));
    await renderRoute('/categories');

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getByRole('heading', { level: 1, name: 'Categories' })).toBeVisible();
  });

  it('says there is nothing yet and leads back home', async () => {
    installCatalogApi({ 'GET /categories': { body: { data: [] } } });
    await renderRoute('/categories');

    expect(await screen.findByRole('heading', { name: 'No categories to show yet' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/home');
  });

  it('shows an error with a retry, and recovers', async () => {
    let attempt = 0;
    installCatalogApi({
      'GET /categories': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 400, body: { message: 'x' } }
          : { body: { data: categories } };
      },
    });
    const user = userEvent.setup();
    await renderRoute('/categories');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Food' })).toBeVisible();
  });

  it('shows the Arabic names, right to left', async () => {
    installCatalogApi();
    await renderRoute('/categories', 'ar');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'الفئات' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'أطعمة' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'الفئات الفرعية في أطعمة' })).toBeVisible();
    expect(screen.queryByText('Food')).not.toBeInTheDocument();
  });

  it('shows a category that has no picture with a placeholder, not a broken image', async () => {
    installCatalogApi();
    await renderRoute('/categories');

    const toys = (await screen.findByRole('link', { name: 'Toys' })).closest('li');
    expect(toys?.querySelector('img')).toBeNull();
  });
});

describe('Products of a category', () => {
  it('shows the category name and asks the API for its products', async () => {
    const api = installCatalogApi();
    await renderRoute('/categories/food');

    expect(await screen.findByRole('heading', { level: 1, name: 'Food' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
    expect(queriesOf(api, 'GET /products')).toHaveLength(1);
    expect(queriesOf(api, 'GET /products')[0]?.get('category')).toBe('food');
  });

  it('offers the sub-categories, and a way back from one', async () => {
    installCatalogApi();
    await renderRoute('/categories/food');

    const subcategories = await screen.findByRole('list', { name: 'Subcategories' });
    expect(within(subcategories).getByRole('link', { name: 'Snacks' })).toBeVisible();
  });

  it('names a sub-category and links back to its parent', async () => {
    const api = installCatalogApi();
    await renderRoute('/categories/snacks');

    expect(await screen.findByRole('heading', { level: 1, name: 'Snacks' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Food' })).toHaveAttribute(
      'href',
      '/categories/food',
    );
    expect(queriesOf(api, 'GET /products')[0]?.get('category')).toBe('snacks');
  });

  it('sends the chosen area as zone_id', async () => {
    const api = installCatalogApi();
    const { router } = await renderRoute('/categories');
    setPreference('deliveryZone', JSON.stringify({ id: 1, name: { ar: 'الرياض', en: 'Riyadh' } }));
    await router.navigate('/categories/food');

    await screen.findByRole('link', { name: 'Biscuits' });
    expect(queriesOf(api, 'GET /products')[0]?.get('zone_id')).toBe('1');
  });

  it('shows a page of its own for a category that does not exist, not an empty list', async () => {
    installCatalogApi();
    await renderRoute('/categories/nope');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'We could not find this category' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/categories',
    );
    expect(screen.queryByText('No products in this category yet')).not.toBeInTheDocument();
  });

  it('says the category is empty and offers other categories', async () => {
    installCatalogApi({ 'GET /products': { body: page([]) } });
    await renderRoute('/categories/food');

    expect(
      await screen.findByRole('heading', { name: 'No products in this category yet' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toBeVisible();
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
    await renderRoute('/categories/food');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Biscuits' })).toBeVisible();
  });

  it('shows the Arabic name and products, right to left', async () => {
    installCatalogApi();
    await renderRoute('/categories/food', 'ar');

    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(await screen.findByRole('heading', { level: 1, name: 'أطعمة' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'بسكويت' })).toBeVisible();
  });
});
