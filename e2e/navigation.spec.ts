import { expect, test } from '@playwright/test';
import { finishIntro, openApp } from './openApp';

const LANGUAGES = ['ar', 'en', 'fr'] as const;
const THEMES = ['light', 'dark'] as const;

for (const language of LANGUAGES) {
  for (const theme of THEMES) {
    test(`side menu: ${language}, ${theme}`, async ({ page }, testInfo) => {
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
      await openApp(page, '/account');
      await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.locator(`input[value="${language}"]`).check({ force: true });
      await dialog.locator(`input[value="${theme}"]`).check({ force: true });
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('html')).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const bounds = await dialog.boundingBox();
      if (bounds === null) throw new Error('Menu is not visible');
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
      const image = testInfo.outputPath(`menu-${language}-${theme}.png`);
      await page.screenshot({ path: image, fullPage: true });
      await testInfo.attach('Menu preview', { path: image, contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole('banner').locator('svg > g > path').first()).toHaveCSS(
        'fill',
        theme === 'dark' ? 'rgba(0, 0, 0, 0)' : 'rgb(255, 255, 255)',
      );
      await page.reload();
      await finishIntro(page, '/account');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
    });
  }
}

test('the loading logo leads to the slider before shopping', async ({ page }) => {
  await page.goto('/welcome');
  await expect(page).toHaveURL(/\/welcome\/logo$/);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page).toHaveURL(/\/welcome$/);
  await page.locator('header').getByRole('button', { name: 'Tap the logo to shop now' }).click();
  await expect(page).toHaveURL(/\/home$/);
});
