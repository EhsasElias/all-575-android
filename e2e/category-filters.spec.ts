import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

const words = {
  en: {
    categorySearch: 'Search categories by name',
    title: 'Filter and sort',
    minimumPrice: 'Minimum unit price',
    price: 'Maximum unit price',
    sort: 'Sort by',
    clear: 'Clear filters',
  },
  ar: {
    categorySearch: 'ابحث باسم الفئة',
    title: 'التصفية والترتيب',
    minimumPrice: 'أقل سعر للوحدة',
    price: 'أعلى سعر للوحدة',
    sort: 'ترتيب حسب',
    clear: 'مسح الفلاتر',
  },
  fr: {
    categorySearch: 'Rechercher une catégorie par nom',
    title: 'Filtrer et trier',
    minimumPrice: 'Prix unitaire minimum',
    price: 'Prix unitaire maximum',
    sort: 'Trier par',
    clear: 'Effacer les filtres',
  },
};

const categories = [
  { id: 1, slug: 'food', name: { en: 'Food', ar: 'أطعمة' }, image_url: null, children: [] },
  { id: 2, slug: 'toys', name: { en: 'Toys', ar: 'ألعاب' }, image_url: null, children: [] },
];
const products = [100, 250, 575].map((price, index) => ({
  id: index + 1,
  slug: `test-product-${index}`,
  name: { en: `Item ${index + 1}`, ar: `منتج ${index + 1}` },
  image_url: null,
  category: { slug: 'food', name: { en: 'Food', ar: 'أطعمة' } },
  seller: { slug: 'test-store', name: { en: 'Test Store', ar: 'متجر تجريبي' }, logo_url: null },
  price: { gross: price, net: price, vat: 0, currency: 'SAR' },
  rating: { average: 0, count: 0 },
  availability: 'unknown',
}));

for (const language of ['ar', 'en', 'fr'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`category discovery and price range: ${language}, ${theme}`, async ({
      page,
    }, testInfo) => {
      let query = new URLSearchParams();
      await page.route(
        /\/(?:api\/v1\/)?(?:store|categories|products|sellers|cart)(?:\?.*)?$/,
        async (route) => {
          if (route.request().resourceType() === 'document') {
            await route.fallback();
            return;
          }
          const url = new URL(route.request().url());
          let data: unknown = [];
          if (url.pathname.endsWith('/store'))
            data = {
              currency: 'SAR',
              price: { gross: 575, net: 500, vat: 75 },
              vat_rate_basis_points: 1500,
              terms_version: '2026-10-01',
              privacy_version: '2026-10-01',
            };
          if (url.pathname.endsWith('/categories')) data = categories;
          if (url.pathname.endsWith('/products')) {
            query = url.searchParams;
            const filtered = products.filter(
              (product) =>
                product.price.gross >= Number(query.get('min_price') ?? 100) &&
                product.price.gross <= Number(query.get('max_price') ?? 575) &&
                (!query.get('category') || product.category.slug === query.get('category')),
            );
            await route.fulfill({
              json: { data: filtered, links: { next: null, prev: null }, meta: {} },
            });
            return;
          }
          await route.fulfill({ json: { data } });
        },
      );
      await openApp(page, '/categories');
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const menu = page.getByRole('dialog');
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${language}"]`) })
        .click();
      await menu
        .locator('label')
        .filter({ has: page.locator(`input[value="${theme}"]`) })
        .click();
      await page.keyboard.press('Escape');
      const text = { filters: words[language] };
      const search = page.getByRole('searchbox', { name: text.filters.categorySearch });
      await search.fill('food');
      await expect(
        page
          .locator('main')
          .getByRole('link', { name: language === 'ar' ? 'أطعمة' : 'Food', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .locator('main')
          .getByRole('link', { name: language === 'ar' ? 'ألعاب' : 'Toys', exact: true }),
      ).toHaveCount(0);
      await page.getByText(text.filters.title, { exact: true }).click();
      await page
        .getByRole('combobox', { name: text.filters.minimumPrice, exact: true })
        .selectOption('100');
      await page
        .getByRole('combobox', { name: text.filters.price, exact: true })
        .selectOption('300');
      await page
        .getByRole('combobox', { name: text.filters.sort, exact: true })
        .selectOption('price_asc');
      await expect(page.locator('main article')).toHaveCount(2);
      await expect.poll(() => query.get('min_price')).toBe('100');
      await expect.poll(() => query.get('max_price')).toBe('300');
      await page
        .getByRole('combobox', { name: text.filters.sort, exact: true })
        .selectOption('best_selling');
      await expect.poll(() => query.get('sort')).toBe('best_selling');
      expect(
        await page
          .getByRole('combobox', { name: text.filters.price, exact: true })
          .locator('option[value="600"]')
          .count(),
      ).toBe(0);
      expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`filters-${language}-${theme}.png`),
        fullPage: true,
      });
      await page.getByRole('button', { name: text.filters.clear, exact: true }).click();
      await expect(search).toBeVisible();
      await search.clear();
      await expect(
        page
          .locator('main')
          .getByRole('link', { name: language === 'ar' ? 'ألعاب' : 'Toys', exact: true }),
      ).toBeVisible();
    });
  }
}
