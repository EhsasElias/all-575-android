import { expect, test } from '@playwright/test';

test.describe('welcome screen', () => {
  test('first launch shows one language only', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }),
    ).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }).click();

    await expect(page).toHaveURL(/\/welcome$/);
    // The welcome greeting is on the logo screen; the slider deliberately has no heading.
    await expect(page.getByText('Up to 5.75 SAR')).toBeVisible();
    await expect(page.getByText('نرحب بكم')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  });

  test('slides advance automatically and still support manual selection without playback controls', async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }).click();
    await expect(page).toHaveURL(/\/welcome$/);

    const firstDot = page.getByRole('button', { name: 'Slide 1 of 3' });
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('button', { name: /slideshow/ })).toHaveCount(0);

    await page.clock.fastForward(4000);
    await expect(page.getByRole('button', { name: 'Slide 2 of 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await page.clock.fastForward(4000);
    const thirdDot = page.getByRole('button', { name: 'Slide 3 of 3' });
    await expect(thirdDot).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('img', { name: 'Clothing', exact: true })).toBeVisible();
    await page.clock.fastForward(4000);
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
    await thirdDot.click();
    await expect(thirdDot).toHaveAttribute('aria-current', 'true');
    await firstDot.click();
    await expect(firstDot).toHaveAttribute('aria-current', 'true');
  });

  test('the language choice is remembered and flips the layout', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }).click();
    await expect(page).toHaveURL(/\/welcome$/);

    await page.getByRole('radio', { name: /AR/ }).check({ force: true });

    await expect(page.getByRole('link', { name: 'تخطي', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole('link', { name: 'تخطي', exact: true })).toBeVisible();
  });

  test('first launch shows logo and slider, but a browser reload stays on the current page', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
    await page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await page.getByRole('link', { name: 'Skip', exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await expect(page).toHaveURL(/\/categories$/);

    // Tab-scoped startup is not replayed by a normal web refresh.
    await page.reload();
    await expect(page).toHaveURL(/\/categories$/);
    // Explicitly opening the app at its root starts the introduction again.
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome\/logo$/);
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
