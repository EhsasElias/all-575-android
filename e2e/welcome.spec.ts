import { expect, test } from '@playwright/test';

test.describe('welcome screen', () => {
  test('first launch shows one language only', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Welcome, our partner in success',
    );
    await expect(page.getByText('نرحب بكم')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  });

  test('the slideshow can be paused and played again', async ({ page }) => {
    await page.goto('/welcome');
    const firstDot = page.getByRole('button', { name: 'Slide 1 of 3' });
    await expect(firstDot).toHaveAttribute('aria-current', 'true');

    await page.getByRole('button', { name: 'Pause slideshow' }).click();
    await page.waitForTimeout(5500);

    await expect(firstDot).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Play slideshow' }).click();
    await expect(page.getByRole('button', { name: 'Slide 2 of 3' })).toHaveAttribute(
      'aria-current',
      'true',
      { timeout: 8000 },
    );
  });

  test('the language choice is remembered and flips the layout', async ({ page }) => {
    await page.goto('/welcome');

    await page.getByRole('radio', { name: /AR/ }).check({ force: true });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('نرحب بكم شريك النجاح');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('نرحب بكم شريك النجاح');
  });

  test('tapping the logo opens the shop, and the welcome is not shown again', async ({ page }) => {
    await page.goto('/welcome');

    // The header sits inside <main>, so it is not a banner landmark.
    await page.locator('header').getByRole('button', { name: 'Tap the logo to shop now' }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await page.goto('/');
    await expect(page).toHaveURL(/\/home$/);
  });
});

test.describe('keyboard', () => {
  test('the first Tab stop is a skip link that moves focus to the main content', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page.getByRole('main')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('main')).toBeFocused();
  });
});
