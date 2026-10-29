import { expect, test } from '@playwright/test';
import { openApp } from './openApp';

const buyer = {
  id: 1,
  name: 'Sara',
  phone: '+966512345678',
  email: null,
  locale: 'en',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-01',
    privacy_version: '2026-10-01',
    marketing: false,
    needs_update: false,
  },
};

test('company buyer, quotation request and real payment artwork', async ({ page }, testInfo) => {
  let billing: unknown = {
    buyer_type: 'individual',
    company_name: null,
    registration_number: null,
    vat_number: null,
    billing_address: null,
  };
  let request: unknown;
  await page.route(
    /\/(?:api\/v1\/)?(?:auth\/otp\/(?:request|verify)|me(?:\/[^?#]*)?|store|cart|categories|addresses)(?:\?.*)?$/,
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      const method = route.request().method();
      let data: unknown = [];
      if (path.endsWith('/store'))
        data = {
          currency: 'SAR',
          price: { gross: 575, net: 500, vat: 75 },
          vat_rate_basis_points: 1500,
          terms_version: '2026-10-01',
          privacy_version: '2026-10-01',
        };
      if (path.endsWith('/me')) data = buyer;
      if (path.endsWith('/auth/otp/request'))
        data = {
          challenge_id: '11111111-1111-4111-8111-111111111111',
          resend_after: 60,
          expires_in: 300,
        };
      if (path.endsWith('/auth/otp/verify'))
        data = { token: 'browser-test-session', user: buyer, is_new_user: false };
      if (path.endsWith('/cart'))
        data = { lines: [], items_count: 0, subtotal: 0, currency: 'SAR' };
      if (path.endsWith('/me/billing-profile')) {
        if (method === 'PUT') billing = route.request().postDataJSON();
        data = billing;
      }
      if (path.endsWith('/me/requests')) {
        if (method === 'POST') {
          request = route.request().postDataJSON();
          data = request;
        } else {
          await route.fulfill({ json: { data: [], links: { next: null, prev: null }, meta: {} } });
          return;
        }
      }
      await route.fulfill({ json: { data } });
    },
  );
  await openApp(page, '/sign-in?next=%2Faccount');
  await page.getByLabel('Mobile number', { exact: true }).fill('0512345678');
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('6-digit code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByRole('link', { name: 'Buyer and billing details', exact: true }).click();
  await page.getByLabel('I am shopping as').selectOption('business');
  await page.getByLabel('Legal company name').fill('Riyadh Supplies');
  await page.getByLabel('Company billing address').fill('Riyadh, Building 1234, Al Olaya, 12211');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByText('Details saved')).toBeVisible();
  expect(billing).toMatchObject({ buyer_type: 'business', company_name: 'Riyadh Supplies' });
  await page.screenshot({ path: testInfo.outputPath('company-buyer.png'), fullPage: true });
  await page.getByRole('link', { name: 'Account', exact: true }).click();
  await page.getByRole('link', { name: 'Quotes and account requests', exact: true }).click();
  await page.getByLabel('Subject', { exact: true }).fill('100 towels for Riyadh');
  await page
    .getByLabel('Details', { exact: true })
    .fill('100 white cotton towels, Riyadh delivery in November.');
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Request received')).toBeVisible();
  expect(request).toMatchObject({ kind: 'bulk_quote', subject: '100 towels for Riyadh' });
  await page.getByRole('link', { name: 'Cart', exact: true }).click();
  // Navigate within this document so the verified in-memory browser session remains active.
  await page.evaluate(
    "window.history.pushState({}, '', '/checkout'); window.dispatchEvent(new PopStateEvent('popstate'));",
  );
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  const payment = page.getByRole('region', { name: 'Payment method' });
  for (const name of ['mada', 'Visa', 'Mastercard', 'Apple Pay']) {
    await expect(payment.getByRole('img', { name, exact: true })).toBeVisible();
  }
  for (const img of await payment.locator('img').all()) {
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();
    expect((await page.request.get(src ?? '')).ok()).toBe(true);
  }
  await page.getByRole('radio', { name: 'Cash on delivery', exact: true }).check();
  await payment.screenshot({ path: testInfo.outputPath('payment-methods.png') });
  expect(await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')).toBe(
    true,
  );
});
