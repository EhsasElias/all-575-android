import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Language } from '@/shared/i18n';
import { renderApp } from '@/test/render';
import { installCatalogApi, queriesOf } from '../testApi';
import { page } from '../testData';

function renderHome(language: Language = 'en') {
  return renderApp({ route: '/home', seenWelcome: true, language });
}

describe('Home - reference shopping layout', () => {
  it('shows exactly the four requested shelves after the hero, with no old categories or filters', async () => {
    installCatalogApi();
    await renderHome();

    expect(screen.getByRole('heading', { level: 1, name: 'What do you need today?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'What would you like to shop today?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Explore our collections' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Grocery & fresh' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Picked For You' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Categories' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'All products' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Category' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Sort by' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'In stock only' })).not.toBeInTheDocument();
    expect(screen.queryByText('20 mins')).not.toBeInTheDocument();
    expect(screen.queryByText(/% off/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All categories' })).toHaveAttribute('href', '/categories');
  });

  it('shows the nine supplied category photos with the matching individual names', async () => {
    installCatalogApi();
    await renderHome();

    const shelf = screen.getByRole('region', { name: 'What would you like to shop today?' });
    const pairs = [
      ['Personal care', 'personal-care'],
      ['Makeup', 'makeup'],
      ['Perfumes', 'perfumes'],
      ['Stationery', 'stationery'],
      ['School supplies', 'school-supplies'],
      ['Cleaning products', 'cleaning-products'],
      ['Cleaning tools', 'cleaning-tools'],
      ['Kitchenware', 'kitchenware'],
      ['Groceries & fresh produce', 'groceries-fresh'],
    ] as const;
    for (const [name, image] of pairs) {
      const card = within(shelf).getByRole('link', { name: `Explore ${name}` });
      expect(card).toBeVisible();
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        `/images/categories/${image}.webp`,
      );
    }
  });

  it('uses existing catalogue products in Picked For You without the old product grid', async () => {
    installCatalogApi();
    await renderHome();

    const picks = screen.getByRole('region', { name: 'Picked For You' });
    const biscuitLink = await within(picks).findByRole('link', { name: /Biscuits/ });
    expect(biscuitLink).toHaveAttribute('href', '/products/demo-food-1');
    expect(within(picks).getByRole('link', { name: /Socks/ })).toBeVisible();
  });

  it('requests real categories and only available products without invented promotional prices', async () => {
    const api = installCatalogApi();
    await renderHome();
    await within(screen.getByRole('region', { name: 'Picked For You' })).findByRole('link', {
      name: /Biscuits/,
    });

    expect(api.requests()).toEqual(
      expect.arrayContaining(['GET /categories', 'GET /products', 'GET /store']),
    );
    for (const request of queriesOf(api, 'GET /products')) {
      expect(request.get('sort')).toBe('newest');
      expect(request.has('before_id')).toBe(false);
      expect(request.get('in_stock')).toBe('1');
    }
  });

  it('links the search bar to the real search screen', async () => {
    installCatalogApi();
    const user = userEvent.setup();
    const { router } = await renderHome();
    await user.click(screen.getByRole('link', { name: 'Search products' }));
    expect(router.state.location.pathname).toBe('/search');
  });

  it('does not display unrelated items in Grocery & fresh when no grocery category exists', async () => {
    installCatalogApi();
    await renderHome();
    const groceries = screen.getByRole('region', { name: 'Grocery & fresh' });
    expect(within(groceries).queryByRole('link', { name: /Biscuits/ })).not.toBeInTheDocument();
    expect(within(groceries).queryByRole('link', { name: /Socks/ })).not.toBeInTheDocument();
  });

  it('keeps the four blocks visible when no products are available', async () => {
    installCatalogApi({ 'GET /products': { body: page([]) } });
    await renderHome();
    expect(screen.getByRole('heading', { name: 'What would you like to shop today?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Explore our collections' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Grocery & fresh' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Picked For You' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'All products' })).not.toBeInTheDocument();
  });

  it('supports Arabic RTL and the same four shelves', async () => {
    installCatalogApi();
    await renderHome('ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { name: 'ماذا تحب أن تتسوق اليوم؟' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'اكتشف مجموعاتنا' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'البقالة والخضار والفواكه' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'اخترنا لك' })).toBeVisible();
    expect(await within(screen.getByRole('region', { name: 'اخترنا لك' })).findByRole('link', { name: /بسكويت/ })).toBeVisible();
  });

  it('supports French LTR and the same four shelves', async () => {
    installCatalogApi();
    await renderHome('fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('heading', { name: 'Que souhaitez-vous acheter aujourd’hui ?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Découvrez nos collections' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Épicerie et produits frais' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Sélection pour vous' })).toBeVisible();
    expect(await within(screen.getByRole('region', { name: 'Sélection pour vous' })).findByRole('link', { name: /Biscuits/ })).toBeVisible();
  });
});
