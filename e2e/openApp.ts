import { expect, type Page } from '@playwright/test';

/** Exercise the real startup flow before testing a destination page. */
export async function finishIntro(page: Page, target: string) {
  await expect(page).toHaveURL(/\/welcome(?:\?|$)/);
  await page.locator('header a[href^="/welcome/logo"]').click();
  const destination = new URL(target, 'http://localhost');
  await page.waitForURL((url) => url.pathname === destination.pathname);
}

export async function openApp(page: Page, target: string) {
  await page.goto(target);
  await finishIntro(page, target);
}
