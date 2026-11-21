import { expect, type Page } from '@playwright/test';

/**
 * Account and dashboard screens use a dedicated navigation drawer.
 * Storefront preferences remain in the store's application menu.
 * Visit that menu through the SPA, then return without losing the signed-in session.
 */
export async function setStorefrontPreferences(
  page: Page,
  language: 'ar' | 'en' | 'fr',
  theme: 'light' | 'dark',
): Promise<void> {
  const original = new URL(page.url());
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();

  const menu = page.getByRole('dialog');
  await expect(menu).toBeVisible();
  await menu.locator(`label:has(input[type="radio"][value="${language}"])`).click();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  // Clicking the visible label triggers the theme control's React onChange.
  await menu.locator(`label:has(input[type="radio"][value="${theme}"])`).click();

  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL((url) => url.pathname === original.pathname);
}
