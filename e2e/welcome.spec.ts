import { expect, test } from '@playwright/test';

test.describe('welcome screen', () => {
  test('first launch shows one language only', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await expect(page.getByRole('main').getByRole('status')).toContainText('Loading');

    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Welcome, our partner in success',
    );
    await expect(page.getByText('نرحب بكم')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  });

  test('slides change on request without playback controls or automatic movement', async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await expect(page.getByRole('main').getByRole('status')).toContainText('Loading');
    await page.clock.fastForward(1200);
    await expect(page).toHaveURL(/\/welcome$/);
    const firstDot = page.getByRole('button', { name: 'Slide 1 of 3' });
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('button', { name: /slideshow/ })).toHaveCount(0);

    const thirdDot = page.getByRole('button', { name: 'Slide 3 of 3' });
    await thirdDot.click();
    await page.clock.fastForward(60_000);

    await expect(thirdDot).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('img', { name: 'Clothing', exact: true })).toBeVisible();
    await firstDot.click();
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
  });

  test('the language choice is remembered and flips the layout', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome$/);

    await page.getByRole('radio', { name: /AR/ }).check({ force: true });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('نرحب بكم شريك النجاح');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('نرحب بكم شريك النجاح');
  });

  test('reloads on a shopping page repeat logo and slider, while tab navigation stays direct', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await expect(page).toHaveURL(/\/welcome$/);
    await page.locator('header').getByRole('button', { name: 'Tap the logo to shop now' }).click();
    await expect(page).toHaveURL(/\/home$/);
    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await expect(page).toHaveURL(/\/categories$/);
    await page.reload();
    await expect(page).toHaveURL(/\/welcome\/logo\?next=/);
    await expect(page).toHaveURL(/\/welcome\?next=/);
    await page.getByRole('link', { name: 'Skip', exact: true }).click();
    await expect(page).toHaveURL(/\/categories$/);
  });
});

test.describe('keyboard', () => {
  test('the first Tab stop is a skip link that moves focus to the main content', async ({
    page,
  }) => {
    await page.goto('/welcome');
    await expect(page.getByRole('main')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('main')).toBeFocused();
  });
});
