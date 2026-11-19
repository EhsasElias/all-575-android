import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

const languages = ['ar', 'en', 'fr'] as const;
const widths = [320, 390, 768, 1024, 1440] as const;
const publicRoutes = [
  '/home',
  '/categories',
  '/search',
  '/cart',
  '/orders',
  '/account',
  '/legal/terms',
  '/legal/privacy',
  '/sign-in',
  '/create-account',
] as const;

/**
 * Cross-device localization smoke test. Never contacts a live API:
 * every API request is fulfilled from a synthetic storefront fixture.
 * A passing route proves only render, reading direction, and document width.
 */
for (const language of languages) {
  test(`public route layouts fit phone, tablet and desktop in ${language}`, async ({ page }) => {
    test.setTimeout(120_000);

    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const store = {
        currency: 'SAR',
        price: { gross: 575, net: 500, vat: 75 },
        vat_rate_basis_points: 1500,
        terms_version: '2026-10-29',
        privacy_version: '2026-10-29',
      };
      await route.fulfill({ json: { data: path.endsWith('/store') ? store : [] } });
    });

    await openApp(page, '/home');
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await menu.locator(`label:has(input[type="radio"][value="${language}"])`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.keyboard.press('Escape');

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 500 ? 760 : 900 });
      for (const path of publicRoutes) {
        await page.evaluate(
          "(nextPath) => { window.history.pushState({}, '', nextPath); window.dispatchEvent(new PopStateEvent('popstate')); }",
          path,
        );
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute(
          'dir',
          language === 'ar' ? 'rtl' : 'ltr',
        );
        const pageWidth: number = await page.evaluate('document.documentElement.scrollWidth');
        const viewportWidth: number = await page.evaluate('window.innerWidth');
        expect(
          pageWidth,
          `${language} ${path} at ${width}px overflows document`,
        ).toBeLessThanOrEqual(viewportWidth + 1);
      }
    }
  });
}
