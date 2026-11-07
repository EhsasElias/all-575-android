import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

/**
 * Regression guard: the entire page must fit the phone viewport.
 * Inner scrollers (tabs and large tables) are intentionally not forbidden.
 */
const routes = ['/home', '/categories', '/cart', '/orders', '/account', '/legal/terms'];

for (const width of [320, 360, 393]) {
  test(`main screens fit a ${width}px phone without horizontal page scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const data = path.endsWith('/store')
        ? {
            currency: 'SAR',
            price: { gross: 575, net: 500, vat: 75 },
            vat_rate_basis_points: 1500,
            terms_version: '2026-10-01',
            privacy_version: '2026-10-01',
          }
        : [];
      await route.fulfill({ json: { data } });
    });
    await openApp(page, routes[0]!);
    for (const path of routes) {
      await page.evaluate((nextPath) => {
        window.history.pushState({}, '', nextPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);
      await page.locator('main').waitFor({ state: 'visible' });
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      expect(metrics.scrollWidth, `Horizontal document overflow on ${path} at ${width}px`).toBeLessThanOrEqual(
        metrics.viewport + 1,
      );
    }
  });
}
