import { expect, test } from '@playwright/test';
import { openApp } from './openApp';
import { setStorefrontPreferences } from './storefrontPreferences';

const customer = {
  id: 1,
  name: 'QA Customer',
  phone: '+966500000000',
  email: null,
  locale: 'en',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-29',
    privacy_version: '2026-10-29',
    marketing: false,
    needs_update: false,
  },
};

const paths = [
  '/account',
  '/account/profile',
  '/account/addresses',
  '/account/billing',
  '/account/sessions',
  '/account/notifications',
  '/account/saved',
  '/account/requests',
  '/account/support',
  '/account/dashboard',
  '/orders',
  '/account/spending',
] as const;

async function fakeCustomerApi(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const store = {
      currency: 'SAR',
      price: { gross: 575, net: 500, vat: 75 },
      vat_rate_basis_points: 1500,
      terms_version: '2026-10-29',
      privacy_version: '2026-10-29',
    };
    if (pathname.endsWith('/auth/otp/request')) {
      await route.fulfill({
        json: { data: { challenge_id: 'test-challenge', resend_after: 60, expires_in: 300 } },
      });
      return;
    }
    if (pathname.endsWith('/auth/otp/verify')) {
      await route.fulfill({
        json: { data: { token: 'qa-session', user: customer, is_new_user: false } },
      });
      return;
    }
    if (pathname.endsWith('/me')) {
      await route.fulfill({ json: { data: customer } });
      return;
    }
    if (pathname.endsWith('/me/dashboard')) {
      await route.fulfill({
        json: {
          data: {
            orders_total: 0,
            orders_active: 0,
            orders_awaiting_payment: 0,
            orders_completed: 0,
            paid_total: 0,
            refunded_total: 0,
            net_spent: 0,
            currency: 'SAR',
            generated_at: '2026-10-29T10:00:00Z',
            saved_products: 0,
            addresses: 0,
            open_support: 0,
            open_requests: 0,
            recent_orders: [],
          },
        },
      });
      return;
    }
    if (pathname.endsWith('/me/requests') || pathname.endsWith('/orders')) {
      await route.fulfill({
        json: { data: [], links: { next: null, prev: null }, meta: { next_cursor: null } },
      });
      return;
    }
    const body = pathname.endsWith('/store')
      ? { data: store }
      : pathname.endsWith('/products')
        ? { data: [], links: { next: null }, meta: { next_cursor: null } }
        : { data: [] };
    await route.fulfill({ json: body });
  });
}

for (const language of ['ar', 'en', 'fr'] as const) {
  test(`signed-in customer page widths and direction in ${language}`, async ({ page }) => {
    test.setTimeout(180_000);
    await fakeCustomerApi(page);
    await openApp(page, '/sign-in?next=%2Faccount');
    await page.getByRole('button', { name: 'Use one-time code (OTP)' }).click();
    await page.getByRole('button', { name: 'Use mobile number instead' }).click();
    await page.getByLabel('Mobile number', { exact: true }).fill('0500000000');
    await page.getByRole('button', { name: 'Send code' }).click();
    await page.getByLabel('6-digit code', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await setStorefrontPreferences(page, language, 'light');

    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: width === 320 ? 740 : 900 });
      for (const path of paths) {
        await page.evaluate(
          "(p) => { window.history.pushState({}, '', p); window.dispatchEvent(new PopStateEvent('popstate')); }",
          path,
        );
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute(
          'dir',
          language === 'ar' ? 'rtl' : 'ltr',
        );
        const scroll: number = await page.evaluate('document.documentElement.scrollWidth');
        const viewport: number = await page.evaluate('window.innerWidth');
        expect(scroll, `${language} ${path} horizontal overflow at ${width}px`).toBeLessThanOrEqual(
          viewport + 1,
        );
      }
    }
  });
}
