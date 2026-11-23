import { expect, type Page } from '@playwright/test';

/** Reproduce the real startup flow: the large logo is an explicit user action, not a timer. */
export async function finishIntro(page: Page, target: string) {
  await expect(page).toHaveURL(/\/welcome\/logo(?:\?|$)/);
  await page.getByRole('main').getByRole('button', { name: 'Tap the logo to shop now' }).click();
  await expect(page).toHaveURL(/\/welcome(?:\?|$)/);
  // Skip takes the customer to the requested destination, including protected deep links.
  await page.getByRole('link', { name: 'Skip', exact: true }).click();
  const destination = new URL(target, 'http://localhost');
  await expect(page).toHaveURL((url) => url.pathname === destination.pathname);
}

export async function openApp(page: Page, target: string) {
  // Keep JavaScript exceptions visible in CI when the app enters the route error boundary.
  page.on('pageerror', (error) => {
    console.error('[Browser page error]', error.stack ?? error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('[Browser console]', message.text());
  });
  await page.goto(target);
  await finishIntro(page, target);
}
