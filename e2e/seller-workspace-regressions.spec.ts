import { expect, test } from '@playwright/test';
import { openApp } from './openApp';
import { setStorefrontPreferences } from './storefrontPreferences';

const verifiedSeller = {
  id: 41,
  name: 'QA Seller',
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

test('seller imports the same selected file again and safely edits stock at different widths', async ({
  page,
}) => {
  test.setTimeout(60_000);
  let quantity = 5;
  let sellerSessionAttempts = 0;
  await page.route('**/api/v1/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();
    const responses: Record<string, unknown> = {
      '/api/v1/auth/otp/request': { challenge_id: 'qa-seller', resend_after: 60, expires_in: 300 },
      '/api/v1/auth/otp/verify': {
        token: 'qa-customer-token',
        user: verifiedSeller,
        is_new_user: false,
      },
      '/api/v1/me': verifiedSeller,
      '/api/v1/store': {
        currency: 'SAR',
        price: { gross: 575, net: 500, vat: 75 },
        vat_rate_basis_points: 1500,
        terms_version: '2026-10-29',
        privacy_version: '2026-10-29',
      },
      '/api/v1/seller/memberships': [
        {
          id: 1,
          seller_id: 1,
          branch_id: null,
          role: 'owner',
          is_active: true,
          seller_status: 'approved',
          name_ar: 'متجر اختبار',
          name_en: 'QA Store',
        },
      ],
      '/api/v1/seller/session': { token: 'qa-seller-token' },
      '/api/v1/seller/branches': [
        {
          id: 1,
          seller_id: 1,
          code: 'QA',
          name_ar: 'فرع اختبار',
          name_en: 'QA Branch',
          is_active: true,
          lat: 24,
          lng: 46,
          service_zone_id: 1,
        },
      ],
      '/api/v1/seller/stock': [
        {
          id: 7,
          branch_id: 1,
          variant_id: 1,
          on_hand: quantity,
          reserved: 2,
          sku: 'QA-SKU-01',
          name_ar: 'منتج اختبار',
          name_en: 'QA Product',
        },
      ],
    };
    if (pathname.endsWith('/seller/session') && ++sellerSessionAttempts === 1) {
      await route.fulfill({ status: 503, json: { message: 'Service unavailable' } });
    } else if (pathname.endsWith('/seller/products/import')) {
      const preview = route.request().postData()?.includes('name="dry_run"') === true;
      await route.fulfill({
        json: {
          data: preview ? { valid_rows: 1, created_drafts: 0, preview: [] } : { created_drafts: 1 },
        },
      });
    } else if (pathname.endsWith('/seller/stock/7') && method === 'PATCH') {
      expect(route.request().postData()).toBe('{"on_hand":6}');
      quantity = 6;
      await route.fulfill({ json: { data: { on_hand: quantity } } });
    } else if (pathname === '/api/v1/products') {
      await route.fulfill({ json: { data: [], links: { next: null }, meta: { next_cursor: null } } });
    } else {
      await route.fulfill({ json: { data: responses[pathname] ?? [] } });
    }
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page, '/sign-in?next=%2Faccount%2Fseller-workspace%3Fsection%3Dproducts');
  await page.getByRole('button', { name: 'Use one-time code (OTP)' }).click();
  await page.getByRole('button', { name: 'Use mobile number instead' }).click();
  await page.getByLabel('Mobile number', { exact: true }).fill('0500000000');
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('6-digit code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Could not open the seller session. Please retry.')).toBeVisible();
  await expect(page.getByText('This workspace is for approved sellers only.')).toHaveCount(0);
  let documentRequests = 0;
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests += 1;
  });
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Import products using Excel or CSV' }),
  ).toBeVisible();
  expect(sellerSessionAttempts).toBe(2);
  expect(documentRequests).toBe(0);

  const file = {
    name: 'products.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('sku\nQA-SKU-01\n'),
  };
  const input = page.locator('input[type="file"]').first();
  const preview = page.getByRole('button', { name: 'Validate & preview file' });
  await input.setInputFiles(file);
  await preview.click();
  await expect(page.getByText('File validated without importing products.')).toBeVisible();
  await page.getByRole('button', { name: 'Import drafts', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Confirm product import' })
    .getByRole('button', { name: 'Import drafts' })
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'OK', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(preview).toBeDisabled();
  await input.setInputFiles(file);
  await expect(preview).toBeEnabled();

  await page.getByRole('link', { name: 'Inventory', exact: true }).click();
  await page.getByRole('button', { name: 'Adjust quantity', exact: true }).click();
  const stock = page.getByRole('dialog', { name: 'Adjust stock quantity' });
  const amount = stock.getByRole('spinbutton');
  const save = stock.getByRole('button', { name: 'Save quantity', exact: true });
  for (const invalid of ['', '-1', '1', '2.5', '100000001']) {
    await amount.fill(invalid);
    await expect(save).toBeDisabled();
  }
  await amount.fill('6');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText('Stock quantity updated successfully.')).toBeVisible();

  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await setStorefrontPreferences(page, 'fr', 'dark');
  await expect(page.getByRole('heading', { name: 'Espace vendeur' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Importer des produits par Excel ou CSV' }),
  ).toBeVisible();
  for (const width of [337, 770, 1348, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const scrollWidth: number = await page.evaluate('document.documentElement.scrollWidth');
    expect(scrollWidth, `Seller product page overflows at ${width}px`).toBeLessThanOrEqual(
      width + 1,
    );
  }
});
